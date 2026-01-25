import PocketBase from 'pocketbase';
try { await import('dotenv/config'); } catch (e) {}
import { fetch, Agent } from 'undici';
import JSON5 from 'json5';
import Parser from 'rss-parser';

// --- CONFIG ---
const Z_AI_API_KEY = process.env.Z_AI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_ENDPOINT = 'https://api.z.ai/api/anthropic/v1/messages';

// Agent & Parser
const dispatcher = new Agent({ bodyTimeout: 1200000, headersTimeout: 1200000 });
const parser = new Parser();

// --- SUMBER PAIN POINT (Gold Mine) ---
const FEEDS = [
    // Orang bingung cari solusi teknis (SaaS Opportunity)
    // Query: "how to" OR "tool for" OR "manual"
    { name: 'r/SmallBusiness', url: 'https://www.reddit.com/r/smallbusiness/search.rss?q=how+to+OR+tool+for+OR+manual+OR+spreadsheet&restrict_sr=on&sort=new&t=week', type: 'biz' },

    // Orang komplain soal marketing (Opportunity Micro-SaaS)
    { name: 'r/Marketing', url: 'https://www.reddit.com/r/marketing/search.rss?q=hate+OR+time+consuming+OR+alternative+to&restrict_sr=on&sort=new&t=week', type: 'marketing' },

    // Ladang basah: Orang yang melakukan hal manual di Excel
    { name: 'r/Excel', url: 'https://www.reddit.com/r/excel/search.rss?q=help+template+automate&restrict_sr=on&sort=new&t=day', type: 'efficiency' },
    
    // Orang cari software spesifik
    { name: 'r/SoftwareSaaS', url: 'https://www.reddit.com/r/software/search.rss?q=looking+for+software+OR+alternative&restrict_sr=on&sort=new&t=week', type: 'software' },
    
     // Entrepreneur problems
    { name: 'r/Entrepreneur', url: 'https://www.reddit.com/r/Entrepreneur/search.rss?q=problem+OR+struggle+OR+hardest+part&restrict_sr=on&sort=new&t=week', type: 'biz' }
];

// --- FUNGSI UTAMA ---
async function analyzePainPoint(item) {
    if (!item.content || item.content.length < 50) return null; // Skip empty content

    console.log(`🧠 Analyzing: "${item.title}"`);

    const systemPrompt = `
    You are a "Startup Validator" AI. Your goal is to find BUSINESS OPPORTUNITIES from user complaints.
    
    SOURCE POST:
    - Title: "${item.title}"
    - Content: "${item.content.substring(0, 1500)}..."
    - Subreddit: ${item.source}

    TASK:
    1. **FILTER**: Is this a real problem worth solving?
       - ✅ YES: Process inefficiencies, "I spend 5 hours on X", "Software Y is too expensive", "I need a tool for Z".
       - ❌ NO: General news, beginners asking basic questions, spam, job posts.

    2. **IDEATE**: If YES, propose a SaaS solution.
    
    JSON OUTPUT FORMAT:
    {
        "valid": boolean,
        "analysis": {
            "pain_level": "High/Medium/Low",
            "problem_summary": "1 sentence explaining the user's struggle (Bahasa Indonesia).",
            "saas_idea": "Name & 1 sentence pitch for a tool to solve this (Bahasa Indonesia).",
            "target_user": "Who would buy this?",
            "monetization": "Subscription/One-time/Freemium",
            "why_it_works": "Why is this a good opportunity?"
        }
    }
    `;

    try {
        const response = await fetch(ANTHROPIC_ENDPOINT, {
            dispatcher, method: 'POST',
            headers: { 'x-api-key': Z_AI_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
            body: JSON.stringify({
                // Using haiku or similar fast model if possible, defaulting to configured model
                model: "glm-4.6v", 
                max_tokens: 1500,
                messages: [{ role: "user", content: `Analyze this market signal. JSON only. \n\n ${systemPrompt}` }]
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        const text = data.content?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) return null;
        return JSON5.parse(jsonMatch[0]);

    } catch (e) {
        console.error("AI Error:", e.message);
        return null;
    }
}

async function sendTelegram(idea, originalPost) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    
    const msg = `
💡 *NEW SAAS IDEA DETECTED*

😖 *Pain Point:* ${idea.problem_summary}
(${idea.pain_level} Pain Level)

🛠 *Solusi SaaS:*
**${idea.saas_idea}**

🎯 *Target:* ${idea.target_user}
💰 *Model:* ${idea.monetization}
🚀 *Why:* ${idea.why_it_works}

🔗 [Original Thread](${originalPost.link})
    `.trim();

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: msg,
            parse_mode: 'Markdown'
        })
    });
}

// --- MAIN LOOP ---
async function main() {
    console.log("🕵️ Starting Pain Point Hunter...");
    
    // 1. Fetch Feeds
    let allItems = [];
    for (const feed of FEEDS) {
        try {
            console.log(`Scanning ${feed.name}...`);
            const data = await parser.parseURL(feed.url);
            // Ambil 5 teratas saja per feed biar ga overload
            const items = data.items.slice(0, 5).map(i => ({
                source: feed.name,
                title: i.title || "Untitled",
                link: i.link || "",
                content: i.contentSnippet || i.content || "",
                pubDate: i.pubDate
            }));
            allItems = [...allItems, ...items];
        } catch (e) { console.error(`Feed Error ${feed.name}:`, e.message); }
    }

    console.log(`Found ${allItems.length} posts. Filtering with AI...`);

    // 2. Analyze
    let found = 0;
    // Shuffle items to get variety
    allItems.sort(() => Math.random() - 0.5);

    for (const item of allItems) {
        if (found >= 3) break; // Limit 3 ide per run
        
        const result = await analyzePainPoint(item);
        if (result && result.valid && (result.analysis.pain_level === 'High' || result.analysis.pain_level === 'Medium')) {
            console.log(`✅ FOUND GEM: ${result.analysis.saas_idea}`);
            await sendTelegram(result.analysis, item);
            found++;
        }
    }
    console.log("Done.");
}

main();
