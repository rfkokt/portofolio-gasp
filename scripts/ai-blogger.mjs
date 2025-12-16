import PocketBase from 'pocketbase';
import 'dotenv/config';
import { fetch, Agent } from 'undici';
import JSON5 from 'json5';
import Parser from 'rss-parser';

// Configuration
const Z_AI_API_KEY = process.env.Z_AI_API_KEY;
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://43.134.114.243:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASS) {
    console.error('❌ Error: PB_ADMIN_EMAIL and PB_ADMIN_PASS environment variables are required.');
    process.exit(1);
}

if (!Z_AI_API_KEY) {
    console.error("❌ Z_AI_API_KEY is missing in environment variables.");
    process.exit(1);
}

// Configure custom agent with 20 minute timeout
const dispatcher = new Agent({
    bodyTimeout: 1200000,
    headersTimeout: 1200000
});

// Note: We use native fetch for the Anthropic-compatible endpoint
const ANTHROPIC_ENDPOINT = 'https://api.z.ai/api/anthropic/v1/messages';

const SERPER_API_KEY = process.env.SERPER_API_KEY;

// Search Utilities
let isSearchEnabled = !!process.env.SERPER_API_KEY;

async function searchWeb(query, limit = 2) {
    if (!isSearchEnabled || !process.env.SERPER_API_KEY) return [];
    try {
        const response = await fetch('https://google.serper.dev/search', {
            method: "POST",
            headers: {
                "X-API-KEY": process.env.SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ q: query, num: limit }),
            dispatcher
        });

        if (!response.ok) {
            if (response.status === 403 || response.status === 402 || response.status === 401) {
                console.warn(`🛑 Serper API Quota Exceeded (Status: ${response.status}). Disabling search for remaining items.`);
                isSearchEnabled = false; // Stop trying for future items in this run
                return [];
            }
            return [];
        }

        const data = await response.json();
        return data.organic ? data.organic.map(item => ({ title: item.title, link: item.link })) : [];
    } catch (e) {
        console.warn(`⚠️ Search failed for "${query}":`, e.message);
        return [];
    }
}

async function fetchUrlContent(url) {
    try {
        console.log(`🔗 Fetching supplementary: ${url}`);
        const response = await fetch(url, { 
            dispatcher,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)' }
        });
        if (!response.ok) return null;
        const html = await response.text();
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 4000);
    } catch (e) {
        return null;
    }
}

const pb = new PocketBase(PB_URL);
const parser = new Parser();

const FEEDS = [
    { name: 'Node.js Security', url: 'https://nodejs.org/en/feed/vulnerability.xml', type: ['security', 'node'] },
    { name: 'React Blog', url: 'https://react.dev/feed.xml', type: ['frontend', 'react'] },
    { name: 'Vercel Blog', url: 'https://vercel.com/atom', type: ['infrastructure', 'frontend', 'vercel'] },
    { name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml', type: ['ai'] },
    { name: 'GitHub Blog', url: 'https://github.blog/feed/', type: ['tech', 'devops', 'github'] },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: ['tech', 'news'] },
    { name: 'Web.dev', url: 'https://web.dev/feed.xml', type: ['frontend', 'security', 'performance'] },
    { name: 'Mozilla Hacks', url: 'https://hacks.mozilla.org/feed/', type: ['frontend', 'browser'] }
];

// Helper to wrap text for the image
function generateCoverImageURL(title) {
    const MAX_LINE_LENGTH = 18;
    const words = title.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if ((currentLine + " " + words[i]).length < MAX_LINE_LENGTH) {
            currentLine += " " + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);

    const encodedText = encodeURIComponent(lines.join('\n'));
    // Using placehold.co with dark background and fixed font size
    return `https://placehold.co/398x498/1a1a1a/FFF.png?text=${encodedText}&font=montserrat&font_size=28`;
}

async function fetchNews(targetFeeds = FEEDS) {
    console.log(`📡 Fetching RSS feeds from ${targetFeeds.length} sources...`);
    let sourceGroups = {};

    for (const feed of targetFeeds) {
        try {
            const feedData = await parser.parseURL(feed.url);
            console.log(`✅ Fetched ${feedData.items.length} items from ${feed.name}`);
            
            // Map items to a standard format
            const items = feedData.items.map(item => ({
                source: feed.name,
                title: item.title,
                link: item.link,
                pubDate: new Date(item.pubDate || item.isoDate || new Date()),
                content: item.contentSnippet || item.content || "",
                guid: item.guid || item.link
            }));
            
            // Sort each source by date desc immediately
            items.sort((a, b) => b.pubDate - a.pubDate);
            sourceGroups[feed.name] = items;

        } catch (e) {
            console.error(`❌ Failed to fetch ${feed.name}:`, e.message);
        }
    }

    // Interleave (Round Robin) to ensure diversity
    const balancedNews = [];
    const feedNames = Object.keys(sourceGroups);
    if (feedNames.length === 0) return [];

    const maxItems = Math.max(...feedNames.map(name => sourceGroups[name].length));

    for (let i = 0; i < maxItems; i++) {
        for (const name of feedNames) {
            if (sourceGroups[name][i]) {
                balancedNews.push(sourceGroups[name][i]);
            }
        }
    }

    return balancedNews;
}

async function sendTelegramNotification(post) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

    try {
        const message = `
🚀 *New Post Generated (DRAFT)*

**${post.title}**

${post.excerpt}

🔗 [Preview Link](https://rdev.cloud/preview/posts?id=${post.id})

_Select an action below or wait 15m for auto-publish._
        `.trim();

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "✅ Publish Now", callback_data: `publish:${post.id}` },
                            { text: "❌ Delete", callback_data: `delete:${post.id}` }
                        ]
                    ]
                }
            })
        });
        console.log("📱 Telegram notification (with buttons) sent!");
    } catch (e) {
        console.error("❌ Failed to send Telegram notification:", e.message);
    }
}

async function isPostExists(link, title) {
    try {
        // Extract key parts of the URL for matching
        const url = new URL(link);
        const pathPart = url.pathname.split('/').filter(Boolean).slice(-2).join('/'); // Last 2 path segments
        
        // Extract key words from title (remove common words, keep important ones)
        const titleWords = title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 4) // Keep words longer than 4 chars
            .slice(0, 5) // Only check first 5 meaningful words
            .join(' ');

        // Check multiple conditions for duplicates
        const checks = [
            // Check if link appears in content
            `content ~ "${link}"`,
            // Check if URL path appears in content (in case of slightly different URL)
            pathPart.length > 5 ? `content ~ "${pathPart}"` : null,
            // Check for similar title keywords
            titleWords.length > 10 ? `title ~ "${titleWords}"` : null,
        ].filter(Boolean);

        for (const check of checks) {
            try {
                const result = await pb.collection('posts').getList(1, 1, {
                    filter: check
                });
                if (result.totalItems > 0) {
                    console.log(`   ↳ Duplicate check: matched on "${check.substring(0, 50)}..."`);
                    return true;
                }
            } catch (e) {
                // Filter might be invalid, continue to next check
            }
        }

        return false;
    } catch (e) {
        console.log(`   ↳ Duplicate check error: ${e.message}`);
        return false;
    }
}

async function generatePost(newsItem) {
    console.log(`🤖 Generating post for: "${newsItem.title}" (${newsItem.source})`);

    let supplementaryContext = "";

    // Research Phase
    if (isSearchEnabled) {
        console.log("🕵️ Doing extra research...");
        try {
            // A. Generate Queries
            const queryResponse = await fetch(ANTHROPIC_ENDPOINT, {
                dispatcher, method: 'POST',
                headers: { 'x-api-key': Z_AI_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
                body: JSON.stringify({
                    model: "glm-4.6v", max_tokens: 200,
                    messages: [{ role: "user", content: `Generate 2 search queries to find MORE DETAILS about: "${newsItem.title}"\nOUTPUT JSON: ["q1", "q2"]` }]
                })
            });
            const qData = await queryResponse.json();
            const qText = qData.content?.[0]?.text || "[]";
            const queries = JSON5.parse(qText.match(/\[[\s\S]*\]/)?.[0] || "[]");

            // B. Search & Fetch
            let found = 0;
            for (const q of queries) {
                if (found >= 2) break;
                const results = await searchWeb(q, 2);
                for (const res of results) {
                    if (res.link === newsItem.link || supplementaryContext.includes(res.link)) continue;
                    const content = await fetchUrlContent(res.link);
                    if (content) {
                        supplementaryContext += `\nSOURCE: ${res.link}\nCONTENT: ${content}\n`;
                        found++;
                        if (found >= 2) break;
                    }
                }
            }
        } catch (e) { console.warn("Research failed:", e.message); }
    }

    const systemPrompt = `
    You are a senior Indonesian developer who writes tech blogs with PERSONALITY. Your job is to SYNTHESIZE the sources into a comprehensive article.
    
    LANGUAGE: **Bahasa Indonesia** (Indonesian) - NATURAL, not translated.
    DATE: Today is ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}.

    SOURCE NEWS (Primary):
    - Title: "${newsItem.title}"
    - Link: ${newsItem.link}
    - Summary: "${newsItem.content.substring(0, 1500)}..."

    ${supplementaryContext ? `SUPPLEMENTARY INFO:\n${supplementaryContext}` : ""}

    🎨 WRITING STYLE (WAJIB):
    - Tulis seperti developer Indonesia ngobrol sama developer lain
    - Gabungkan informasi dari berbagai sumber menjadi satu kesatuan
    - Jangan hanya translate, tapi berikan Analisis dan Konteks
    - Validasi klaim menggunakan sumber tambahan
    
    📝 KLARIFIKASI TEKNIS (PENTING!):
    - JANGAN tulis kalimat ambigu seperti "tidak menggunakan server" - jelaskan konteksnya!
    - Contoh SALAH: "Jika aplikasi React kamu tidak menggunakan server, kamu tidak terpengaruh."
    - Contoh BENAR: "Jika kamu pakai React client-side biasa (tanpa Server Components), kamu aman."
    - Selalu jelaskan istilah teknis dalam konteks yang jelas bagi developer Indonesia

    ⚠️ CRITICAL RULES - FAKTA HARUS AKURAT:
    
    1. **ONLY REPORT WHAT'S IN THE SOURCE**:
       - Version numbers: COPY EXACTLY from source (jangan ubah!)
       - CVE IDs, dates, affected products: COPY EXACTLY
       - JANGAN interpretasi sendiri versi mana yang kena
    
    2. **NO CODE EXAMPLES UNLESS FROM SOURCE**:
       - Kalau source ada code, boleh include
       - Kalau TIDAK ada code di source, JANGAN BIKIN CODE
       - Tulis: "Untuk detail teknis, cek langsung di ${newsItem.link}"
    
    3. **NO MADE-UP SOLUTIONS**:
       - Kalau source kasih solusi, laporin solusi itu
       - Kalau TIDAK ada solusi, tulis jujur: "Sampai artikel ini ditulis, belum ada patch resmi. Stay tuned!"
       - JANGAN bikin solusi sendiri (rate limiting, CORS, validation, dll)

    📝 STRUKTUR MARKDOWN (WAJIB PAKAI HEADING H2/H3 untuk TOC!):
    
    [Opening paragraph - Hook menarik]
    
    ## [Dynamic Header 1: Deep Dive / Apa yang Terjadi]
    [Jelaskan inti topik dengan detail dari Primary Source]
    
    ## [Dynamic Header 2: Konteks / Analisis / Dampak]
    [Kenapa ini penting? Apa dampaknya? Gunakan info tambahan disini]
    
    ## [Dynamic Header 3: Relevan Section]
    - JIKA News/Funding: "Market Context" atau "Masa Depan [Company]"
    - JIKA Security/Bug: "Solusi & Mitigasi" atau "Cara Fix"
    - JIKA Tutorial: "Langkah Implementasi"
    - Pilih header yang PALING COCOK dengan kontennya!
    
    ## Kesimpulan
    [Wrap up]
    
    ## Referensi
    - [${newsItem.source}](${newsItem.link})
    ${supplementaryContext ? "- [Sumber Tambahan] (Link sources included above)" : ""}
    
    ⚠️ ATURAN SECTION:
    1. JANGAN PAKAI "Solusi / Cara Pakai" jika itu berita umum/funding/akuisisi (Tidak Relevan!).
    2. Sesuaikan header dengan topik. Kalau bahas duit, bahas "Market". Kalau bahas kode, bahas "Teknis".
    3. H2 (##) Wajib untuk TOC.

    OUTPUT JSON FORMAT (Strict Minified JSON, no markdown fencing):
    {
        "title": "Judul Catchy Bahasa Indonesia",
        "thumbnail_title": "Judul Singkat Max 5 Kata",
        "slug": "kebab-case-slug-based-on-title",
        "excerpt": "2 kalimat rangkuman yang bikin penasaran.",
        "content": "Markdown dengan H2 headings (## Heading). Fakta dari source, gaya natural. Use \\n for newlines.",
        "tags": ["React", "Security", "CVE-2025-XXXXX", "${newsItem.source}"]
    }
    
    ⚠️ TAGS HARUS SPESIFIK! Contoh tags yang bagus:
    - Nama teknologi: "React", "Next.js", "Node.js", "JavaScript"
    - Tipe masalah: "Security", "Bug Fix", "Performance", "Breaking Change"  
    - CVE ID jika ada dari source
    - Nama library yang kena
    - Source name: "${newsItem.source}"
    JANGAN pakai placeholder seperti "Tag1", "Tag2"!
    `;

    try {
        const response = await fetch(ANTHROPIC_ENDPOINT, {
            dispatcher,
            method: 'POST',
            headers: {
                'x-api-key': Z_AI_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: "glm-4.6v",
                max_tokens: 3500,
                messages: [
                    { 
                        role: "user", 
                        content: `Generate the blog post JSON for this news item. REMINDER: Output RAW MINIFIED JSON ONLY. \n\n ${systemPrompt}` 
                    }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error ${response.status}: ${err}`);
        }

        const data = await response.json();
        let content = data.content?.[0]?.text;
        
        if (!content) throw new Error("No content generated");

        // Robust JSON extraction: Find the first '{' and the last '}'
        const firstOpen = content.indexOf('{');
        const lastClose = content.lastIndexOf('}');
        
        if (firstOpen === -1 || lastClose === -1 || lastClose < firstOpen) {
             throw new Error("No valid JSON object found in response");
        }
        
        const jsonString = content.substring(firstOpen, lastClose + 1);

        let postData;
        try {
            // console.log("🧹 Parsing JSON with JSON5...");
            postData = JSON5.parse(jsonString);
        } catch (e) {
            console.warn("⚠️ JSON5 Parse Failed, checking for unescaped newlines...");
            // Fallback: State-Machine Repair
            try {
                // console.log("🧹 JSON5 Parse Failed. Running custom state-machine repair...");
                
                let inString = false;
                let isEscaped = false;
                let result = '';
                
                for (let i = 0; i < jsonString.length; i++) {
                    const char = jsonString[i];
                    
                    if (inString) {
                        if (char === '\\') {
                            isEscaped = !isEscaped;
                            result += char;
                        } else if (char === '"' && !isEscaped) {
                            inString = false;
                            result += char;
                        } else {
                            // If newline inside string, escape it
                            if (char === '\n' || char === '\r') {
                                // Only add \n if it's not a carriage return followed by newline (avoid double)
                                // Simplified: Just convert any newline/CR to literal \n
                                if (char === '\n') result += '\\n';
                                // Skip \r
                            } else {
                                result += char;
                            }
                            isEscaped = false;
                        }
                    } else {
                        // Not in string
                        if (char === '"') {
                            inString = true;
                            result += char;
                        } else if (/\s/.test(char)) {
                            // Skip whitespace outside strings (Minify)
                            continue;
                        } else {
                            result += char;
                        }
                    }
                }
                
                postData = JSON5.parse(result);
                console.log("✅ State-machine repair successful!");
            } catch (e2) {
                 console.log("⚠️ State-machine repair failed. Trying Emergency Regex...");
                 try {
                     // More robust regex extraction
                     // Extract title - handle escaped quotes
                     const titleMatch = jsonString.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                     
                     // Extract thumbnail_title
                     const thumbTitleMatch = jsonString.match(/"thumbnail_title"\s*:\s*"((?:[^"\\]|\\.)*)"/);

                     // Extract slug
                     const slugMatch = jsonString.match(/"slug"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                     
                     // Extract excerpt
                     const excerptMatch = jsonString.match(/"excerpt"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                     
                     // Extract content - this is the tricky one, use a greedy match
                     // Find "content": " and capture everything until we hit ", followed by another field or }
                     let rawContent = "";
                     const contentStartMatch = jsonString.match(/"content"\s*:\s*"/);
                     if (contentStartMatch) {
                         const startIdx = jsonString.indexOf(contentStartMatch[0]) + contentStartMatch[0].length;
                         // Find the end by looking for ", followed by a key or closing brace
                         let endIdx = -1;
                         let depth = 1; // track nested quotes
                         let inEscape = false;
                         
                         for (let i = startIdx; i < jsonString.length; i++) {
                             const c = jsonString[i];
                             if (inEscape) {
                                 inEscape = false;
                                 continue;
                             }
                             if (c === '\\') {
                                 inEscape = true;
                                 continue;
                             }
                             if (c === '"') {
                                 // Check if followed by , or }
                                 const after = jsonString.substring(i + 1, i + 20).trim();
                                 if (after.startsWith(',') || after.startsWith('}')) {
                                     endIdx = i;
                                     break;
                                 }
                             }
                         }
                         
                         if (endIdx > startIdx) {
                             rawContent = jsonString.substring(startIdx, endIdx);
                         }
                     }
                     
                     if (!titleMatch && !rawContent) {
                         throw new Error("Could not extract minimal fields");
                     }

                     // Unescape standard JSON escapes
                     rawContent = rawContent
                         .replace(/\\"/g, '"')
                         .replace(/\\n/g, '\n')
                         .replace(/\\r/g, '')
                         .replace(/\\t/g, '\t')
                         .replace(/\\\\/g, '\\');

                     const extractedTitle = titleMatch ? titleMatch[1].replace(/\\"/g, '"') : "Untitled Post";
                     
                     postData = {
                         title: extractedTitle,
                         thumbnail_title: thumbTitleMatch ? thumbTitleMatch[1].replace(/\\"/g, '"') : extractedTitle,
                         slug: slugMatch ? slugMatch[1] : `post-${Date.now()}`,
                         excerpt: excerptMatch ? excerptMatch[1].replace(/\\"/g, '"') : "",
                         content: rawContent || "Content extraction failed. Please check original source.",
                         tags: ["AI"]
                     };
                     console.log("✅ Emergency Extraction Successful!");
                 } catch (e3) {
                     console.error("❌ All parsing attempts failed. Skipping this article.");
                     return null; // Return null instead of throwing to continue with next article
                 }
            }
        }

        // Add meta - DEFAULT TO DRAFT
        postData.published = false;
        postData.published_at = new Date().toISOString();
        
        // Use shorter thumbnail title if available, otherwise truncate aggressively
        const coverText = postData.thumbnail_title || postData.title;
        postData.cover_image = generateCoverImageURL(coverText);

        // Append original link to content if missing (safety net)
        if (!postData.content.includes(newsItem.link)) {
            postData.content += `\n\n## Referensi\n- [Sumber Asli (${newsItem.source})](${newsItem.link})`;
        }

        return postData;

    } catch (e) {
        console.error("Failed to generate content:", e);
        return null;
    }
}

async function checkUrgency(newsItem) {
    console.log(`🔍 Checking urgency for: "${newsItem.title}"...`);
    
    const prompt = `
    Analyze this news item for URGENCY.
    
    CRITERIA FOR URGENT:
    - Critical Security Vulnerability (CVE High/Critical).
    - Zero-day exploit.
    - Major breaking change in a widely used framework (React, Next.js, Node.js).
    - Immediate action required by developers to prevent data loss or hacks.
    
    CRITERIA FOR NOT URGENT:
    - Minor patch / bug fix.
    - Feature release (unless revolutionary).
    - General advice / tutorials.
    - Beta / Alpha releases.
    
    NEWS ITEM:
    Title: "${newsItem.title}"
    Snippet: "${newsItem.content.substring(0, 500)}..."
    
    OUTPUT JSON ONLY:
    {
        "urgent": boolean,
        "reason": "Short explanation"
    }
    `;

    try {
        const response = await fetch(ANTHROPIC_ENDPOINT, {
            dispatcher,
            method: 'POST',
            headers: {
                'x-api-key': Z_AI_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: "glm-4.6v",
                max_tokens: 300,
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        const content = data.content?.[0]?.text;
        
        // Simple JSON extraction
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return { urgent: false, reason: "Parse Error" };
        
        return JSON5.parse(jsonMatch[0]);
    } catch (e) {
        console.error("⚠️ Urgency check failed, assuming NOT urgent:", e.message);
        return { urgent: false, reason: "Error" };
    }
}

async function main() {
    const args = process.argv.slice(2);
    const countArg = args.find(arg => arg.startsWith('--count='));
    // Support both --count argument and MAX_BLOGS environment variable
    const maxCount = countArg 
        ? parseInt(countArg.split('=')[1]) 
        : (process.env.MAX_BLOGS ? parseInt(process.env.MAX_BLOGS) : 1);
    
    const typeArg = args.find(arg => arg.startsWith('--type='));
    const filterType = typeArg ? typeArg.split('=')[1] : null;

    const urgentOnly = args.includes('--urgent-only');

    try {
        console.log(`🔌 Connecting to PocketBase...`);
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASS);

        // Determine feeds
        const targetFeeds = filterType 
            ? FEEDS.filter(f => f.type.includes(filterType))
            : FEEDS;

        if (filterType) console.log(`🎯 Filtering by type: ${filterType}`);
        if (urgentOnly) console.log(`🚨 URGENCE MODE: Only posting critical updates.`);

        // 1. Fetch News
        const newsItems = await fetchNews(targetFeeds);
        console.log(`📰 Found ${newsItems.length} total news items.`);

        let processedCount = 0;
        let failedCount = 0;
        
        for (const item of newsItems) {
            if (processedCount >= maxCount) break;

            // 2. Check duplicates
            const exists = await isPostExists(item.link, item.title);
            if (exists) {
                console.log(`⏭️ Skipping "${item.title}" (Already exists)`);
                continue;
            }

            // 2.5 Urgency Check
            if (urgentOnly) {
                const analysis = await checkUrgency(item);
                if (!analysis.urgent) {
                    console.log(`✋ Skipping (Not Urgent): ${analysis.reason}`);
                    continue;
                }
                console.log(`🚨 URGENT ITEM DETECTED: ${analysis.reason}`);
            }

            // 3. Generate
            console.log(`\n⏳ Processing [${processedCount + 1}/${maxCount}]: ${item.title}`);
            
            let post;
            try {
                post = await generatePost(item);
            } catch (genError) {
                console.log(`⚠️ Generation failed, skipping to next article...`);
                failedCount++;
                continue;
            }
            
            if (!post) {
                console.log(`⚠️ Post generation returned null, skipping to next article...`);
                failedCount++;
                continue;
            }

            // 4. Save
            try {
                // Check slug uniqueness again before save
                try {
                    await pb.collection('posts').getFirstListItem(`slug="${post.slug}"`);
                    post.slug = `${post.slug}-${Date.now()}`;
                } catch (e) { /* unique */ }

                const savedRecord = await pb.collection('posts').create({
                    ...post,
                    created_by: 'AI',
                    updated_by: 'AI',
                });
                console.log(`✅ Draft Saved: "${post.title}" (ID: ${savedRecord.id})`);
                
                // Inject ID for buttons
                post.id = savedRecord.id;

                // Send Notification
                await sendTelegramNotification(post);

                processedCount++;
                
                // Wait a bit between generations
                if (processedCount < maxCount) {
                    await new Promise(r => setTimeout(r, 5000));
                }

            } catch (e) {
                console.error(`❌ Failed to save post:`, e.message);
                failedCount++;
            }
        }

        // Summary
        console.log(`\n📊 Generation Summary:`);
        console.log(`   ✅ Successfully published: ${processedCount}`);
        if (failedCount > 0) {
            console.log(`   ❌ Failed: ${failedCount}`);
        }
        if (processedCount === 0 && failedCount === 0) {
            console.log(`   ℹ️ No new articles to publish (all existing or skipped).`);
        }

    } catch (err) {
        console.error('❌ Script failed:', err);
        process.exit(1);
    }
}

main();
