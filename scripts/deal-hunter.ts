import { createAdminClient } from '../lib/pb-client';
import { fetch, Agent } from 'undici';
import JSON5 from 'json5';
import Parser from 'rss-parser';
import 'dotenv/config';

// Configuration
const Z_AI_API_KEY = process.env.Z_AI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

if (!Z_AI_API_KEY) {
    console.error("❌ Z_AI_API_KEY is missing in environment variables.");
    process.exit(1);
}

// Configure custom agent
const dispatcher = new Agent({
    bodyTimeout: 1200000,
    headersTimeout: 1200000
});

const ANTHROPIC_ENDPOINT = 'https://api.z.ai/api/anthropic/v1/messages';

// Deal/Promo Feeds
const FEEDS = [
    // Reddit Communities (Append .rss)
    { name: 'r/webdev Deals', url: 'https://www.reddit.com/r/webdev/search.rss?q=promo+OR+free+OR+discount+OR+code&restrict_sr=on&sort=new&t=week', type: ['frontend', 'deals'] },
    { name: 'r/SideProject', url: 'https://www.reddit.com/r/SideProject/search.rss?q=launch+OR+free+OR+beta&restrict_sr=on&sort=new&t=week', type: ['saas', 'indie'] },
    { name: 'r/IndieHackers', url: 'https://www.reddit.com/r/indiehackers/search.rss?q=marketing+OR+growth+OR+deal&restrict_sr=on&sort=new&t=week', type: ['marketing', 'indie'] },
    { name: 'r/SaaS', url: 'https://www.reddit.com/r/SaaS/search.rss?q=ltd+OR+deal+OR+offer&restrict_sr=on&sort=new&t=week', type: ['saas', 'deals'] },
    
    // Games (Epic/Steam) - Strict filtering in search query to reduce noise
    { name: 'r/GameDeals', url: 'https://www.reddit.com/r/GameDeals/search.rss?q=free+OR+100%25+OR+Epic+OR+Steam&restrict_sr=on&sort=new&t=week', type: ['game', 'deals'] },
    
    // AI & Local Models
    { name: 'r/LocalLLaMA', url: 'https://www.reddit.com/r/LocalLLaMA/search.rss?q=release+OR+model+OR+weights+OR+free&restrict_sr=on&sort=new&t=week', type: ['ai', 'tech'] },
    { name: 'r/ArtificialInteligence', url: 'https://www.reddit.com/r/ArtificialInteligence/search.rss?q=tool+OR+free+OR+launch&restrict_sr=on&sort=new&t=week', type: ['ai', 'tech'] },

    // Product Hunt (RSS)
    { name: 'Product Hunt', url: 'https://www.producthunt.com/feed', type: ['launch', 'tools'] },
];

const parser = new Parser();

// Helper to wrap text for the image
function generateCoverImageURL(title: string): string {
    const MAX_LINE_LENGTH = 18;
    const words = title.split(' ');
    let lines: string[] = [];
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
    return `https://placehold.co/398x498/1a1a1a/FFF.png?text=${encodedText}&font=montserrat&font_size=28`;
}

async function searchUnsplashPhoto(query: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const url = new URL(UNSPLASH_API_URL);
    url.searchParams.append('query', query);
    url.searchParams.append('page', '1');
    url.searchParams.append('per_page', '1');
    url.searchParams.append('orientation', 'landscape');
    url.searchParams.append('client_id', UNSPLASH_ACCESS_KEY);

    const response = await fetch(url.toString(), {
      dispatcher,
      headers: { 'Accept-Version': 'v1' }
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    if (data.results && data.results.length > 0) return data.results[0].urls.regular;
    return null;
  } catch (error) {
    return null;
  }
}

interface NewsItem {
    source: string;
    title: string;
    link: string;
    pubDate: Date;
    content: string;
    guid: string;
}

async function fetchNews(targetFeeds = FEEDS): Promise<NewsItem[]> {
    console.log(`📡 Hunting deals from ${targetFeeds.length} sources...`);
    let sourceGroups: Record<string, NewsItem[]> = {};

    for (const feed of targetFeeds) {
        try {
            const feedData = await parser.parseURL(feed.url);
            console.log(`✅ Scanned ${feed.name}: ${feedData.items.length} items`);
            
            const items = feedData.items.map(item => ({
                source: feed.name,
                title: item.title || "Untitled",
                link: item.link || "",
                pubDate: new Date(item.pubDate || item.isoDate || new Date()),
                content: item.contentSnippet || item.content || "",
                guid: item.guid || item.link || ""
            }));
            
            items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
            
            // FILTER: Last 48 hours for deals (sometimes they last longer, but we want fresh)
            const CUTOFF_TIME = new Date(Date.now() - 48 * 60 * 60 * 1000);
            const recentItems = items.filter(item => {
                // Basic Keyword Filter to reduce noise before AI
                const textToCheck = (item.title + " " + item.content).toLowerCase();
                const keywords = [
                    'free', 'promo', 'code', 'discount', 'deal', 'offer', 'lifetime', 'credits', 'trial', // General
                    '100%', 'off', 'steam', 'epic', 'gog', 'giveaway', // Games
                    'release', 'model', 'weights', 'open source', 'hugging face', 'ollama' // AI
                ];
                const hasKeyword = keywords.some(k => textToCheck.includes(k));
                
                return item.pubDate >= CUTOFF_TIME && hasKeyword;
            });

            sourceGroups[feed.name] = recentItems;

        } catch (e: any) {
            console.error(`❌ Failed to fetch ${feed.name}:`, e.message);
        }
    }

    // Interleave
    const balancedNews: NewsItem[] = [];
    const feedNames = Object.keys(sourceGroups);
    if (feedNames.length === 0) return [];
    const maxItems = Math.max(...feedNames.map(name => sourceGroups[name].length));

    for (let i = 0; i < maxItems; i++) {
        for (const name of feedNames) {
            if (sourceGroups[name][i]) balancedNews.push(sourceGroups[name][i]);
        }
    }
    return balancedNews;
}

async function sendTelegramNotification(post: any) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    try {
        const message = `
🔥 *DEAL ALERT!*

**${post.title}**

${post.excerpt}

🔗 [Claim Deal Now](https://rdev.cloud/preview/posts?id=${post.id})

_Verify validity before posting!_
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
                            { text: "⚡ Publish Deal", callback_data: `publish:${post.id}` },
                            { text: "❌ Ignore", callback_data: `delete:${post.id}` }
                        ]
                    ]
                }
            })
        });
        console.log("📱 Telegram Deal Alert sent!");
    } catch (e: any) {
        console.error("❌ Failed to send Telegram:", e.message);
    }
}

async function isPostExists(pb: any, link: string, title: string): Promise<boolean> {
    try {
        const url = new URL(link);
        const pathPart = url.pathname.split('/').filter(Boolean).slice(-2).join('/');
        const titleWords = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 4).slice(0, 5).join(' ');

        const checks = [
            `content ~ "${link}"`,
            pathPart.length > 5 ? `content ~ "${pathPart}"` : null,
            titleWords.length > 10 ? `title ~ "${titleWords}"` : null,
        ].filter(Boolean) as string[];

        for (const check of checks) {
            const result = await pb.collection('posts').getList(1, 1, { filter: check });
            if (result.totalItems > 0) return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

async function generateDealPost(newsItem: NewsItem) {
    console.log(`🤖 Analyzing deal: "${newsItem.title}"`);

    const systemPrompt = `
    You are a "Deal Hunter" bot for Indonesian Developers & Gamers. Your job is to find and summarize tech deals, game giveaways, and AI model releases.
    
    SOURCE:
    - Title: "${newsItem.title}"
    - Link: ${newsItem.link}
    - Content: "${newsItem.content.substring(0, 2000)}..."

    TASK:
    1. **VERIFY (STRICT)**: Is this a **WORKING** and **VERIFIED** deal?
       - ✅ VALID: 
         - **Explicit Confirmation**: Text contains "Confirmed", "Works", "Just redeemed", "Got it".
         - **Official Sources**: Official store links (Epic, Steam page), Reputable maintainers (e.g. Meta releasing Llama).
         - **Positive Sentiment**: Users discussing *how* to use it, not *if* it works.
       - ❌ INVALID: 
         - **Unverified**: "Does this work?", "Is this legit?", "Anyone tried this?".
         - **Expired/Broken**: "Expired", "Not working", "OOS" (Out of Stock).
         - **Sketchy**: Random referral links without context.

    2. **EXTRACT**: What is the deal? (e.g. "Free Game", "New Open Model", "2 Months Free", "$100 Credits").

    3. **WRITE**: A short, punchy blog post in **Bahasa Indonesia** (Casual, "Info orang dalem" vibe).
       - For GAMES: Focus on "GRATIS KLAIM PERMANEN" or "DISKON GILA".
       - For AI: Focus on "MODEL BARU RILIS" or "BISA DIJALANKAN LOKAL".
       - **Testimonial Injection**: If the source text has user comments like "Works for me", mention in the content: "🔥 Sudah dikonfirmasi works oleh komunitas!".

    JSON OUTPUT FORMAT:
    {
        "valid": boolean (true ONLY if verified/working),
        "post": {
            "title": "Deal Title (Max 60 chars) - e.g. [FREE] GTA V di Epic Games Store!",
            "thumbnail_title": "Short Title",
            "slug": "kebab-case-slug",
            "excerpt": "Short summary of the deal (Max 150 chars).",
            "content": "Markdown content. MUST have headings. \\nFor Games: Link to store, deadline.\\nFor AI: Specs, where to download.\\nFor SaaS: Coupon code & steps.\\n\\n> [!TIP]\\n> **Status**: Verified Works ✅ (Based on sauce)",
            "tags": ["Deal", "Game", "AI", "Epic", "Steam"]
        }
    }
    
    If invalid or unsure, set "valid": false.
    `;

    try {
        const response = await fetch(ANTHROPIC_ENDPOINT, {
            dispatcher, method: 'POST',
            headers: { 'x-api-key': Z_AI_API_KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
            body: JSON.stringify({
                model: "glm-4.6v", max_tokens: 3000,
                messages: [{ role: "user", content: `Analyze and extract deal. Output JSON only. \n\n ${systemPrompt}` }]
            })
        });

        if (!response.ok) throw new Error("API Error");
        const data = await response.json() as any;
        const content = data.content?.[0]?.text;
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        
        const result = JSON5.parse(jsonMatch[0]);

        if (!result.valid || !result.post) {
            console.log("   ⚠️ AI decided this is not a valid deal. Skipping.");
            return null;
        }

        const postData = result.post;
        postData.published = false;
        postData.published_at = new Date().toISOString();
        
        // Image
        let unsplashImage = await searchUnsplashPhoto(postData.tags[0] + " tech");
        postData.cover_image = unsplashImage || generateCoverImageURL("🔥 " + postData.thumbnail_title);

        // Append Link
        if (!postData.content.includes(newsItem.link)) {
            postData.content += `\n\n[👉 Source Link / Claim Here](${newsItem.link})`;
        }

        return postData;

    } catch (e: any) {
        console.error("Failed to generate deal:", e.message);
        return null;
    }
}

async function main() {
    // Parsing args
    const args = process.argv.slice(2);
    const countArg = args.find(arg => arg.startsWith('--count='));
    const maxCount = countArg ? parseInt(countArg.split('=')[1]) : 1;
    const dryRun = args.includes('--dry-run');

    try {
        console.log(`🔌 Connecting to PocketBase using Admin Client from lib...`);
        
        // Use the CENTRALIZED admin client logic
        const pb = await createAdminClient();

        const dealItems = await fetchNews();
        console.log(`🎯 Found ${dealItems.length} potential deals.`);

        let processed = 0;
        for (const item of dealItems) {
            if (processed >= maxCount) break;

            if (await isPostExists(pb, item.link, item.title)) {
                console.log(`   ⏭️ Exists: ${item.title}`);
                continue;
            }

            const postData = await generateDealPost(item);
            if (postData) {
                console.log(`✅ Generated Deal: ${postData.title}`);
                
                if (!dryRun) {
                    const record = await pb.collection('posts').create(postData);
                    console.log(`   💾 Saved to DB: ${record.id}`);
                    await sendTelegramNotification({ ...postData, id: record.id });
                } else {
                    console.log(`   [DRY RUN] Would save:`, postData.title);
                }
                processed++;
            }
        }

    } catch (e) {
        console.error("Main Loop Error:", e);
    }
}

main();
