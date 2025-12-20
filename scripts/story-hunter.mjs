import PocketBase from 'pocketbase';
// Dynamic import for local dev support
try {
    await import('dotenv/config');
} catch (e) {
    // Ignore in production
}
import { fetch, Agent } from 'undici';
import JSON5 from 'json5';
import Parser from 'rss-parser';

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

// Story Feeds (Focused on Journey, Success, Milestones)
const FEEDS = [
    { name: 'r/SideProject', url: 'https://www.reddit.com/r/SideProject/search.rss?q=launched+OR+revenue+OR+users+OR+first+sale&restrict_sr=on&sort=top&t=week', type: ['indie', 'story'] },
    { name: 'r/SaaS', url: 'https://www.reddit.com/r/SaaS/search.rss?q=mrr+OR+arr+OR+milestone+OR+success+OR+journey&restrict_sr=on&sort=top&t=week', type: ['saas', 'story'] },
    { name: 'r/IndieHackers', url: 'https://www.reddit.com/r/indiehackers/search.rss?q=revenue+OR+started+OR+built&restrict_sr=on&sort=top&t=week', type: ['indie', 'story'] },
    { name: 'r/Entrepreneur', url: 'https://www.reddit.com/r/Entrepreneur/search.rss?q=case+study+OR+how+i+built+OR+success&restrict_sr=on&sort=top&t=week', type: ['business', 'study'] },
    
    // NEW SOURCES
    { name: 'r/MicroSaaS', url: 'https://www.reddit.com/r/MicroSaaS/search.rss?q=mrr+OR+sold+OR+acquired+OR+profit&restrict_sr=on&sort=top&t=week', type: ['saas', 'niche'] },
    { name: 'r/solopreneur', url: 'https://www.reddit.com/r/solopreneur/search.rss?q=journey+OR+result+OR+income&restrict_sr=on&sort=top&t=week', type: ['solo', 'story'] },
    { name: 'r/marketing', url: 'https://www.reddit.com/r/marketing/search.rss?q=case+study+OR+how+i+grew+OR+strategy&restrict_sr=on&sort=top&t=week', type: ['growth', 'marketing'] }
];

const parser = new Parser();

// --- AUTH HELPER (Inlined for standalone stability) ---
function createPocketBaseClient() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.rdev.cloud');
  pb.autoCancellation(false);
  return pb;
}

async function createAdminClient() {
  const pb = createPocketBaseClient();
  const email = process.env.PB_ADMIN_EMAIL;
  const pass = process.env.PB_ADMIN_PASS;
  
  if (!email || !pass) {
    throw new Error('PB_ADMIN_EMAIL or PB_ADMIN_PASS is not set in environment variables.');
  }
  
  await pb.admins.authWithPassword(email, pass);
  return pb;
}
// --------------------------------------------------------

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
    return `https://placehold.co/398x498/1a1a1a/FFF.png?text=${encodedText}&font=montserrat&font_size=28`;
}

async function searchUnsplashPhoto(query) {
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
    const data = await response.json();
    if (data.results && data.results.length > 0) return data.results[0].urls.regular;
    return null;
  } catch (error) {
    return null;
  }
}

async function fetchStories(targetFeeds = FEEDS) {
    console.log(`📡 Hunting stories from ${targetFeeds.length} sources...`);
    let sourceGroups = {};

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
            
            // FILTER: Last 7 Days (Stories are less time-sensitive than deals)
            const CUTOFF_TIME = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentItems = items.filter(item => {
                const textToCheck = (item.title + " " + item.content).toLowerCase();
                // Keywords that suggest a story/journey
                const keywords = [
                    'mrr', 'arr', 'revenue', 'users', 'launched', 'built', 
                    'raise', 'funding', 'story', 'journey', 'case study',
                    'how i', 'lesson', 'mistake', 'success'
                ];
                const hasKeyword = keywords.some(k => textToCheck.includes(k));
                // Basic check to avoid questions "How do I..." vs "How I..."
                // Hard to perfect with regex here, relies on AI later.
                return item.pubDate >= CUTOFF_TIME && hasKeyword;
            });

            sourceGroups[feed.name] = recentItems;

        } catch (e) {
            console.error(`❌ Failed to fetch ${feed.name}:`, e.message);
        }
    }

    // Interleave
    const balancedStories = [];
    const feedNames = Object.keys(sourceGroups);
    if (feedNames.length === 0) return [];
    const maxItems = Math.max(...feedNames.map(name => sourceGroups[name].length));

    for (let i = 0; i < maxItems; i++) {
        for (const name of feedNames) {
            if (sourceGroups[name][i]) balancedStories.push(sourceGroups[name][i]);
        }
    }
    return balancedStories;
}

async function sendTelegramNotification(post) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    try {
        const message = `
💡 *INSPIRATION FEED*

**${post.title}**

${post.excerpt}

👉 [Read Full Story](https://rdev.cloud/preview/posts?id=${post.id})
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
                            { text: "🚀 Publish Story", callback_data: `publish:${post.id}` },
                            { text: "❌ Ignore", callback_data: `delete:${post.id}` }
                        ]
                    ]
                }
            })
        });
        console.log("📱 Telegram Story Alert sent!");
    } catch (e) {
        console.error("❌ Failed to send Telegram:", e.message);
    }
}

async function isPostExists(pb, link, title) {
    try {
        const url = new URL(link);
        const pathPart = url.pathname.split('/').filter(Boolean).slice(-2).join('/');
        const titleWords = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 4).slice(0, 5).join(' ');

        const checks = [
            `content ~ "${link}"`,
            pathPart.length > 5 ? `content ~ "${pathPart}"` : null,
            titleWords.length > 10 ? `title ~ "${titleWords}"` : null,
        ].filter(Boolean);

        for (const check of checks) {
            const result = await pb.collection('posts').getList(1, 1, { filter: check });
            if (result.totalItems > 0) return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

async function generateStoryPost(newsItem) {
    console.log(`🤖 Analyzing story: "${newsItem.title}"`);

    const systemPrompt = `
    You are a "Startup Journalist" AI. Your job is to find inspiring stories from indie hackers and developers to motivate the community.

    SOURCE:
    - Title: "${newsItem.title}"
    - Link: ${newsItem.link}
    - Content: "${newsItem.content.substring(0, 3000)}..."

    TASK:
    1. **VERIFY**: Is this a **Substantive Story**?
       - ✅ VALID: 
         - **Milestones**: "Hit $1k MRR", "First 1000 Users", "Launched MVP".
         - **Case Studies**: "How I built X", "Why Y failed".
         - **Transparent Numbers**: Revenue, traffic, or funding stats shared.
       - ❌ INVALID (REJECT): 
         - **Simple Questions**: "How do I start?", "What tech stack?".
         - **Promotional Spam**: Just a link without a story/lesson.
         - **Rants**: Complaining without constructive value.

    2. **REWRITE**: Retell the story in **Bahasa Indonesia** with a motivating, educational tone ("Bedah Bisnis" style).
       - Structure:
         - **The Hook**: What was achieved? (e.g. "Software Engineer ini resign demi bangun SaaS, sekarang $5k/mo").
         - **The Struggle/Process**: How did they do it?
         - **Key Takeaways**: Bullet points of lessons learnt.
       - Keep it engaging and actionable.

    JSON OUTPUT FORMAT:
    {
        "valid": boolean,
        "post": {
            "title": "Catchy Title (Max 60 chars) - e.g. Dari Nol ke $10k MRR: Kisah Dev Indie",
            "thumbnail_title": "Story Title",
            "slug": "kebab-case-slug",
            "excerpt": "Inspiring summary (Max 150 chars).",
            "content": "Markdown content. MUST have headings (## Latar Belakang, ## Strategi, ## Pelajaran). \\n\\n> [!QUOTE]\\n> _'Quote from author if available'_\\n\\n[Original discussion](${newsItem.link})",
            "tags": ["Indie Hacker", "Story", "SaaS", "Motivation"]
        }
    }
    `;

    try {
        const response = await fetch(ANTHROPIC_ENDPOINT, {
            dispatcher, method: 'POST',
            headers: { 'x-api-key': Z_AI_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
            body: JSON.stringify({
                model: "glm-4.6v", max_tokens: 4000,
                messages: [{ role: "user", content: `Analyze this story. Output JSON only. \n\n ${systemPrompt}` }]
            })
        });

        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        const content = data.content?.[0]?.text;
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        
        const result = JSON5.parse(jsonMatch[0]);

        if (!result.valid || !result.post) {
            console.log("   ⚠️ AI decided this is not a valid story/lesson. Skipping.");
            return null;
        }

        const postData = result.post;
        postData.published = false;
        postData.published_at = new Date().toISOString();
        
        // Image keywords based on title for variety
        const imageKeywords = (postData.thumbnail_title || "Success") + " startup business office";
        let unsplashImage = await searchUnsplashPhoto(imageKeywords);
        postData.cover_image = unsplashImage || generateCoverImageURL("🚀 " + postData.thumbnail_title);

        return postData;

    } catch (e) {
        console.error("Failed to generate story:", e.message);
        return null;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const countArg = args.find(arg => arg.startsWith('--count='));
    const maxCount = countArg ? parseInt(countArg.split('=')[1]) : 1;
    const dryRun = args.includes('--dry-run');

    try {
        console.log(`🔌 Connecting to PocketBase for Stories...`);
        const pb = await createAdminClient();

        const items = await fetchStories();
        console.log(`🎯 Found ${items.length} potential stories.`);

        let processed = 0;
        for (const item of items) {
            if (processed >= maxCount) break;

            if (await isPostExists(pb, item.link, item.title)) {
                console.log(`   ⏭️ Exists: ${item.title}`);
                continue;
            }

            const postData = await generateStoryPost(item);
            if (postData) {
                console.log(`✅ Generated Story: ${postData.title}`);
                
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
