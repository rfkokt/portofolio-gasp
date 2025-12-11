// import OpenAI from 'openai'; // Removed, using fetch
import PocketBase from 'pocketbase';
import 'dotenv/config';
import { fetch, Agent } from 'undici';
import JSON5 from 'json5';

// Configuration
const Z_AI_API_KEY = process.env.Z_AI_API_KEY;
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://43.134.114.243:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'rifkiokta105@gmail.com';
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS || '99585767aA!';

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

const YEAR = new Date().getFullYear();

// Topics to rotate or randomize (Security, FE AI, & Modern Tech Focus)
const TOPICS = [
    `Web Security Best Practices ${YEAR}`,
    "AI Agents in Frontend Development", 
    "Zero Trust Architecture for Web Apps",
    "Next.js Security Headers & Middleware",
    "The Future of React and AI Integration",
    "Supply Chain Attacks in npm",
    `Browser Security Features ${YEAR}`,
    "Large Language Models for Coding",
    "Frontend Performance & Security Trade-offs",
    `New CSS Features ${YEAR} & Beyond`,
    "Deepfake Detection on the Web",
    "State Management in the Era of AI",
    `Understanding OWASP Top 10 for ${YEAR}`
];

// Curated Unsplash images for each topic category (stable direct URLs)
const TOPIC_IMAGES = {
    "Web Security": [
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=800&fit=crop", // Cybersecurity
        "https://images.unsplash.com/photo-1563206767-5b1d972d93e7?w=1200&h=800&fit=crop", // Matrix code
        "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=1200&h=800&fit=crop" // Shield
    ],
    "AI Agents": [
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop", // AI/Robot
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=800&fit=crop", // Brain
        "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=1200&h=800&fit=crop" // Face
    ],
    "Zero Trust": [
        "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=800&fit=crop", // Lock
        "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&h=800&fit=crop", // Access
        "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&h=800&fit=crop", // Server
    ],
    "Next.js": [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=800&fit=crop", // Code
        "https://images.unsplash.com/photo-1618477247222-ac59124c6282?w=1200&h=800&fit=crop", // Developer
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=800&fit=crop" // Laptop
    ],
    "React": [
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=800&fit=crop", // React logo
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=800&fit=crop", // Technology
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=800&fit=crop" // Coding
    ],
    "Supply Chain": [
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=800&fit=crop", // Matrix
        "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=1200&h=800&fit=crop", // Network
        "https://images.unsplash.com/photo-1558494949-efc52728101c?w=1200&h=800&fit=crop" // Server
    ],
    "Browser Security": [
        "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&h=800&fit=crop", // Browser
        "https://images.unsplash.com/photo-1481487484168-9b930d5b7d93?w=1200&h=800&fit=crop", // Internet
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=800&fit=crop" // Security
    ],
    "Large Language": [
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=800&fit=crop", // Brain
        "https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=1200&h=800&fit=crop", // AI Abstract
        "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1200&h=800&fit=crop" // AI Head
    ],
    "Frontend Performance": [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop", // Dashboard
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop", // Analytics
        "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=800&fit=crop" // Network
    ],
    "CSS Features": [
        "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1200&h=800&fit=crop", // Design
        "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=1200&h=800&fit=crop", // Colors
        "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=800&fit=crop" // Art
    ],
    "Deepfake": [
        "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=1200&h=800&fit=crop", // AI Face
        "https://images.unsplash.com/photo-1531297461136-82lwDe8j4e0?w=1200&h=800&fit=crop", // Robot
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=800&fit=crop" // Cyborg
    ],
    "State Management": [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop", // Data
        "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1200&h=800&fit=crop", // Flow
        "https://images.unsplash.com/photo-1556155092-490a1ba16284?w=1200&h=800&fit=crop" // Connection
    ],
    "OWASP": [
        "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=1200&h=800&fit=crop", // Shield
        "https://images.unsplash.com/photo-1614064548237-096f7aa5f5a9?w=1200&h=800&fit=crop", // Lock
        "https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?w=1200&h=800&fit=crop" // Cyber
    ]
};

function getTopicImage(topic) {
    // Find matching image set from curated set
    for (const [key, urls] of Object.entries(TOPIC_IMAGES)) {
        if (topic.toLowerCase().includes(key.toLowerCase())) {
            // Pick random image from the set
            return urls[Math.floor(Math.random() * urls.length)];
        }
    }
    // Default fallback - tech abstract
    const FALLBACKS = [
       "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=800&fit=crop",
       "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop",
       "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=800&fit=crop"
    ];
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

async function generatePost(excludeTopics = new Set()) {
    // Filter available topics
    const availableTopics = TOPICS.filter(t => !excludeTopics.has(t));
    
    if (availableTopics.length === 0) {
        console.warn("⚠️ All topics have been used! improvements needed for infinite content.");
        return null;
    }

    const topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    console.log(`🤖 Generating post about: "${topic}"...`);

    const systemPrompt = `
    You are an expert technical writer and security researcher.
    
    TASK: Write a highly structured, engaging, and visually clean technical blog post about the given topic.
    LANGUAGE: **Bahasa Indonesia** (Indonesian). The content MUST be in Indonesian.
    DATE: Today is ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}.

    CRITICAL STRUCTURE INSTRUCTIONS:
    1. **Title & Excerpt**: Engaging, SEO-friendly title (Indonesian) and a 2-sentence summary.
    2. **Content Body** (In Indonesian):
       - **Introduction**: Briefly state the problem and what the reader will learn.
       - **Main Sections**: Use clear **H2 (##)** and **H3 (###)** headings to break up the text. NEVER write a "wall of text".
       - **Paragraphs**: Keep paragraphs SHORT (max 3-4 lines). Use double newlines between them.
       - **Formatting**: Use **Bold** for emphasis. Use **Bullet Points** or **Numbered Lists** frequently for readability.
       - **Code**: Use \`\`\`language blocks with comments.
    3. **References Section**:
       - MUST explicitly include a '## Referensi' section at the very end.
       - Format references as a Markdown list of links: "- [Title of Source](URL)".
       - Use authoritative international sources (English or Indonesian) like MDN, OWASP, Vercel, React Docs, ArXiv, etc.
       - Do NOT force references to be in Indonesian if the best source is English.

    The JSON structure must be:
    {
        "title": "Title String",
        "slug": "kebab-case-slug",
        "excerpt": "Short summary string",
        "content": "Markdown content string (Intro -> H2 Sections -> H3 Subsections -> Conclusion -> ## References)",
        "tags": ["tag1", "tag2", "tag3"]
    }

    JSON FORMATTING RULES (STRICT):
    - Output MUST be valid JSON only. NO markdown blocks (no \`\`\`json).
    - **MINIFIED JSON ONLY**: Do NOT use pretty-print. Do NOT add newlines for indentation.
    - **ESCAPE ALL NEWLINES**: Any newlines inside the "content" string MUST be escaped as \\n.
    - Example: {"title": "X", "content": "Line 1\\n\\nLine 2"}
    - DO NOT output real newlines (Enter key) anywhere in the response.
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
                max_tokens: 3000,
                messages: [
                    { 
                        role: "user", 
                        content: `${systemPrompt}\n\nTopic: "${topic}"\n\nREMINDER: Output RAW MINIFIED JSON ONLY.` 
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
            console.log("🧹 Parsing JSON with JSON5...");
            postData = JSON5.parse(jsonString);
        } catch (e) {
            console.warn("⚠️ JSON5 Parse Failed, checking for unescaped newlines...");
            // Fallback: State-Machine Repair
            try {
                console.log("🧹 JSON5 Parse Failed. Running custom state-machine repair...");
                
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
                
                console.log("🧹 Parsing state-machine repaired JSON...");
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
                     console.error("Partial Content:", jsonString.substring(0, 200) + "...");
                     throw e2; // Throw original parsing error
                 }
            }
        }
        
        // Add meta
        postData.published = true;
        postData.published_at = new Date().toISOString();

        return { ...postData, originalTopic: topic, cover_image: getTopicImage(topic) };
    } catch (e) {
        console.error("Failed to generate content:", e);
        return null;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const countArg = args.find(arg => arg.startsWith('--count='));
    const count = countArg ? parseInt(countArg.split('=')[1]) : 1;

    try {
        console.log(`🔌 Connecting to PocketBase... v${count}`);
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASS);
        
        // 1. Fetch existing titles to avoid duplicates globaly
        let usedTopics = new Set();
        try {
            const records = await pb.collection('posts').getFullList({ fields: 'title' });
            records.forEach(r => usedTopics.add(r.title));
            console.log(`📚 Found ${usedTopics.size} existing articles.`);
        } catch (e) { 
            console.warn("⚠️ Could not fetch existing posts:", e.message); 
        }

        console.log(`🚀 Starting generation for ${count} posts...`);

        for (let i = 0; i < count; i++) {
            console.log(`\n⏳ [${i+1}/${count}] Generating post...`);
            
            // Pass Set to filter out used topics
            const post = await generatePost(usedTopics);
            
            if (!post) {
                console.error(`❌ [${i+1}/${count}] Failed to generate. Skipping.`);
                continue;
            }

            console.log(`📝 Saving post: "${post.title}"`);

            // Check for duplicate slug just in case
            try {
                await pb.collection('posts').getFirstListItem(`slug="${post.slug}"`);
                console.log("⚠️ Post with this slug already exists. Renaming.");
                post.slug = `${post.slug}-${Date.now()}`;
            } catch (e) { /* slug is unique */ }

            try {
                await pb.collection('posts').create(post);
                console.log(`✅ [${i+1}/${count}] Post published!`);
                
                // Add the new title/topic to the Set to prevent repetition in this batch
                usedTopics.add(post.title);
                usedTopics.add(post.originalTopic); 
            } catch (e) {
                console.error(`❌ Failed to save to PB:`, e.message);
            }

            // Slight delay to be nice to the API
            if (i < count - 1) {
                console.log("💤 Resting for 2s...");
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        console.log(`\n✨ Batch job processing complete.`);

    } catch (err) {
        console.error('❌ Script failed:', err);
        process.exit(1);
    }
}

main();
