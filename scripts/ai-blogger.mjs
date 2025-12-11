// import OpenAI from 'openai'; // Removed, using fetch
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

// Note: We use native fetch for the Anthropic-compatible endpoint
const ANTHROPIC_ENDPOINT = 'https://api.z.ai/api/anthropic/v1/messages';

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
    The output MUST be valid JSON only. NO markdown formatting. NO \`\`\`json fences.
    Just the raw JSON object.
    
    The JSON structure must be:
    {
        "title": "Catchy Title",
        "slug": "kebab-case-slug-unique",
        "excerpt": "Short engaging summary (max 2 sentences)",
        "content": "Markdown formatted content (use #, ##, -, *, \`\`\` for code blocks). Make it detailed and educational.",
        "tags": ["tag1", "tag2"]
    }
    `;

    try {
        const response = await fetch(ANTHROPIC_ENDPOINT, {
            method: 'POST',
            headers: {
                'x-api-key': Z_AI_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: "glm-4.6",
                max_tokens: 3000,
                messages: [
                    { 
                        role: "user", 
                        content: `${systemPrompt}\n\nTopic: "${topic}"` 
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

        // Cleanup potential markdown fences if the model ignores instruction
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');

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
