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

const pb = new PocketBase(PB_URL);
const parser = new Parser();

const FEEDS = [
    { name: 'Node.js Security', url: 'https://nodejs.org/en/feed/vulnerability.xml', type: 'security' },
    { name: 'React Blog', url: 'https://react.dev/feed.xml', type: 'frontend' },
    { name: 'Vercel Blog', url: 'https://vercel.com/atom', type: 'infrastructure' },
    { name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml', type: 'ai' },
    { name: 'GitHub Blog', url: 'https://github.blog/feed/', type: 'tech' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'tech' },
    { name: 'Web.dev', url: 'https://web.dev/feed.xml', type: 'frontend-security' },
    { name: 'Chrome Developers', url: 'https://developer.chrome.com/feeds/all.xml', type: 'frontend-security' }
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

async function isPostExists(link, title) {
    try {
        // Check if there is a post with this specific source link in the content or similar title
        // We compare RSS title (English) with DB Title (Indonesian) which often fails,
        // so checking 'content' for the original link is much more robust.
        const result = await pb.collection('posts').getList(1, 1, {
            filter: `(title="${title}" || content ~ "${link}")`
        });
        if (result.totalItems > 0) return true;

        return false;
    } catch (e) {
        return false;
    }
}

async function generatePost(newsItem) {
    console.log(`🤖 Generating post for: "${newsItem.title}" (${newsItem.source})`);

    const systemPrompt = `
    You are an expert Senior Security Engineer and Tech Writer.
    
    TASK: Write a comprehensive, solution-oriented technical blog post based on the following security news/update.
    TARGET AUDIENCE: Developers, specialized in Web Security, React, and Node.js.
    LANGUAGE: **Bahasa Indonesia** (Indonesian).
    DATE: Today is ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}.

    SOURCE NEWS:
    - Title: "${newsItem.title}"
    - Source: ${newsItem.source}
    - Link: ${newsItem.link}
    - Summary/Snippet: "${newsItem.content.substring(0, 1000)}..."

    CRITICAL STRUCTURE & CONTENT INSTRUCTIONS:
    1.  **Title**: Catchy, urgent, and clear title in Indonesian.
    2.  **Introduction**: What happened? Briefly explain the vulnerability or update.
    3.  **Impact / The Problem**: (H2) Why does this matter? What is the risk? (Exploit potential, performance hit, etc.)
    4.  **Solution / Mitigation / How to Use**: (H2) THIS IS THE MOST IMPORTANT PART.
        - **CRITICAL: NEVER HALLUCINATE code or solutions.**
        - Provide concrete code examples ONLY if they exist in the source text or are standard, verifiable patterns.
        - If no specific code is provided in the source, describe the general mitigation strategy clearly and refer to official documentation.
        - Include inline citations (e.g., "Menurut dokumentasi resmi...") to ground your validation.
    5.  **Conclusion**: Brief wrap up.
    6.  **References**:
        - MUST include the original source link: ${newsItem.link}
        - Add other relevant official documentation links.

    FORMATTING RULES:
    - Use Markdown (H2, H3, Bold, Code Blocks).
    - Paragraphs: Short and punchy.
    - Style: Professional, authoritative, but easy to read.

    OUTPUT JSON FORMAT (Strict Minified JSON, no markdown fencing):
    {
        "title": "Indonesian Title",
        "slug": "kebab-case-slug-based-on-title",
        "excerpt": "Urgent summary (2 sentences).",
        "content": "Full markdown content with escaped newlines (\\n). Include the References section at the end.",
        "tags": ["Security", "Node.js", "${newsItem.source}", "Patch"]
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
            } catch (e2) {
                 console.warn("⚠️ State-machine repair failed. Attempting Emergency Regex Extraction...");
                 try {
                     // Regex to extract fields ignoring strict JSON structure
                     const titleMatch = jsonString.match(/"title"\s*:\s*"(.*?)"/);
                     const slugMatch = jsonString.match(/"slug"\s*:\s*"(.*?)"/);
                     const excerptMatch = jsonString.match(/"excerpt"\s*:\s*"(.*?)"/);
                     
                     // Extract content: Match from "content": " until the next field or end
                     // Matches: "content": " [captured group] " followed by comma or }
                     const contentMatch = jsonString.match(/"content"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|\s*})/);
                     
                     if (!titleMatch && !contentMatch) throw new Error("Could not extract minimal fields");

                     // Unescape standard JSON escapes in the extracted content
                     let rawContent = contentMatch ? contentMatch[1] : "";
                     // Fix escaped quotes
                     rawContent = rawContent.replace(/\\"/g, '"');
                     // Fix escaped newlines if any
                     rawContent = rawContent.replace(/\\n/g, '\n');

                     postData = {
                         title: titleMatch ? titleMatch[1] : "Untitled Post",
                         slug: slugMatch ? slugMatch[1] : `post-${Date.now()}`,
                         excerpt: excerptMatch ? excerptMatch[1] : "",
                         content: rawContent,
                         tags: []
                     };
                     console.log("✅ Emergency Extraction Successful!");
                 } catch (e3) {
                     console.error("❌ All parsing attempts failed.");
                     // console.error("Partial Content:", jsonString.substring(0, 200) + "...");
                     throw e2; // Throw original parsing error
                 }
            }
        }

        // Add meta
        postData.published = true;
        postData.published_at = new Date().toISOString();
        postData.cover_image = generateCoverImageURL(postData.title);

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
    const maxCount = countArg ? parseInt(countArg.split('=')[1]) : 1;
    
    const typeArg = args.find(arg => arg.startsWith('--type='));
    const filterType = typeArg ? typeArg.split('=')[1] : null;

    const urgentOnly = args.includes('--urgent-only');

    try {
        console.log(`🔌 Connecting to PocketBase...`);
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASS);

        // Determine feeds
        const targetFeeds = filterType 
            ? FEEDS.filter(f => f.type === filterType)
            : FEEDS;

        if (filterType) console.log(`🎯 Filtering by type: ${filterType}`);
        if (urgentOnly) console.log(`🚨 URGENCE MODE: Only posting critical updates.`);

        // 1. Fetch News
        const newsItems = await fetchNews(targetFeeds);
        console.log(`📰 Found ${newsItems.length} total news items.`);

        let processedCount = 0;
        
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
            const post = await generatePost(item);
            
            if (!post) continue;

            // 4. Save
            try {
                // Check slug uniqueness again before save
                try {
                    await pb.collection('posts').getFirstListItem(`slug="${post.slug}"`);
                    post.slug = `${post.slug}-${Date.now()}`;
                } catch (e) { /* unique */ }

                await pb.collection('posts').create({
                    ...post,
                    created_by: 'AI',
                    updated_by: 'AI',
                });
                console.log(`✅ Published: "${post.title}"`);
                processedCount++;
                
                // Wait a bit between generations
                if (processedCount < maxCount) {
                    await new Promise(r => setTimeout(r, 5000));
                }

            } catch (e) {
                console.error(`❌ Failed to save post:`, e.message);
            }
        }

        if (processedCount === 0) {
            console.log("No new articles to publish.");
        } else {
            console.log(`\n✨ Successfully published ${processedCount} news articles.`);
        }

    } catch (err) {
        console.error('❌ Script failed:', err);
        process.exit(1);
    }
}

main();
