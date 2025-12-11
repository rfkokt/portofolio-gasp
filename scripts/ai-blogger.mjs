import OpenAI from 'openai';
import PocketBase from 'pocketbase';
import 'dotenv/config';

// Configuration
const Z_AI_API_KEY = process.env.Z_AI_API_KEY;
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://43.134.114.243:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'rifkiokta105@gmail.com';
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS || '99585767aA!';

if (!Z_AI_API_KEY) {
    console.error("❌ Z_AI_API_KEY is missing in environment variables.");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: Z_AI_API_KEY,
    baseURL: 'https://api.z.ai/api/paas/v4'
});

const pb = new PocketBase(PB_URL);

// Topics to rotate or randomize
const TOPICS = [
    "Next.js App Router Best Practices",
    "Tailwind CSS Tricks for Modern UI",
    "React Server Components Explained",
    "Optimizing Web Performance",
    "TypeScript Advanced Types",
    "State Management in 2025",
    "AI Agents in Web Development",
    "Deploying Next.js to VPS",
    "Understanding PocketBase",
    "UI/UX Trends in 2025"
];

async function generatePost() {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    console.log(`🤖 Generating post about: "${topic}"...`);

    const systemPrompt = `
    You are an expert technical writer. Write a technical blog post about the given topic.
    The output MUST be valid JSON only (no markdown, no backticks).
    The JSON structure must be:
    {
        "title": "Catchy Title",
        "slug": "kebab-case-slug-unique",
        "excerpt": "Short engaging summary (max 2 sentences)",
        "content": "HTML formatted content (use <h2>, <p>, <ul>, <li>, <pre><code> for code blocks). Make it detailed and educational.",
        "tags": ["tag1", "tag2"]
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "glm-4-flash", 
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Write a blog post about: "${topic}"` }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content generated");

        const postData = JSON.parse(content);
        
        // Add meta
        postData.published = true;
        postData.published_at = new Date().toISOString();

        return postData;
    } catch (e) {
        console.error("Failed to generate content:", e);
        return null;
    }
}

async function main() {
    try {
        console.log("🔌 Connecting to PocketBase...");
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASS);
        
        const post = await generatePost();
        if (!post) {
            console.error("❌ Failed to generate post. Exiting.");
            process.exit(1);
        }

        console.log(`📝 Saving post: "${post.title}"`);

        // Check for duplicate slug
        try {
            await pb.collection('posts').getFirstListItem(`slug="${post.slug}"`);
            console.log("⚠️ Post with this slug already exists. Skipping.");
            const newSlug = `${post.slug}-${Date.now()}`;
             post.slug = newSlug;
             console.log(`⚠️ Renamed slug to ${newSlug}`);
        } catch (e) {
            // New slug, good to go
        }

        await pb.collection('posts').create(post);
        console.log("✅ Post published successfully!");

    } catch (e) {
        console.error("❌ Error:", e);
    }
}

main();
