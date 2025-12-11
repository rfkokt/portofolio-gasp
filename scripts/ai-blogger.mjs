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
    You are an expert technical writer. Write a highly structured, engaging, and visually clean technical blog post about the given topic.
    
    CRITICAL STRUCTURE INSTRUCTIONS:
    1. **Title & Excerpt**: Engaging, SEO-friendly title and a 2-sentence summary.
    2. **Content Body**:
       - **Introduction**: Briefly state the problem and what the reader will learn.
       - **Main Sections**: Use clear **H2 (##)** and **H3 (###)** headings to break up the text. NEVER write a "wall of text".
       - **Paragraphs**: Keep paragraphs SHORT (max 3-4 lines). Use double newlines between them.
       - **formatting**: Use **Bold** for emphasis. Use **Bullet Points** or **Numbered Lists** frequently for readability.
       - **Code**: Use \`\`\`language blocks with comments.
    3. **References Section**:
       - MUST explicitly include a '## References' section at the very end.
       - Format references as a Markdown list of links: "- [Title of Source](URL)".
       - Use ONLY valid, real URLs to official documentation (MDN, React Docs, Vercel, etc).

    The output MUST be valid JSON only. NO markdown formatting around the JSON itself.
    IMPORTANT: Provide the JSON as a SINGLE LINE (Minified), with no newlines for indentation.
    Escape all newlines within the "content" string with double backslashes (\\n).
    Just the raw JSON object.
    The JSON structure must be:
    {
        "title": "Title String",
        "slug": "kebab-case-slug",
        "excerpt": "Short summary string",
        "content": "Markdown content string (Intro -> H2 Sections -> H3 Subsections -> Conclusion -> ## References)",
        "tags": ["tag1", "tag2", "tag3"]
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

        // Cleanup potential markdown fences
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        let postData;
        try {
            // First attempt: Parse as is
            postData = JSON.parse(content);
        } catch (e) {
            console.warn("⚠️ JSON parse failed, attempting strict newline escape fix...", e.message);
            // Fallback: If AI returned unescaped newlines in strings, escape them.
            // This works best if the AI obeyed the "Minified" instruction, so newlines are only in content.
            try {
                 const escaped = content.replace(/\n/g, "\\n").replace(/\r/g, "");
                 postData = JSON.parse(escaped);
            } catch (e2) {
                console.error("❌ Failed to parse JSON even after sanitation.");
                throw e2;
            }
        }
        
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
