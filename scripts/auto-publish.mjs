import PocketBase from 'pocketbase';
import 'dotenv/config';

// Configuration
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://43.134.114.243:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASS) {
    console.error('❌ Error: PB_ADMIN_EMAIL and PB_ADMIN_PASS environment variables are required.');
    process.exit(1);
}

const pb = new PocketBase(PB_URL);

async function main() {
    try {
        console.log(`🔌 Connecting to PocketBase for Auto-Publish Check...`);
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASS);

        // Calculate time 15 minutes ago
        // Query: published = false (Draft)
        // We filter date and tags in JS to avoid 400 errors from API
        const result = await pb.collection('posts').getList(1, 50);

        if (result.totalItems === 0) {
            console.log("✅ No posts found.");
            return;
        }

        console.log(`🔍 Found ${result.totalItems} posts. Checking criteria...`);

        for (const post of result.items) {
             // 0. Check Status (Draft only)
             if (post.published) {
                 continue;
             }

            // 1. Check if AI Post
            const tags = post.tags || [];
            const isAIPost = Array.isArray(tags) ? tags.includes('AI') : JSON.stringify(tags).includes('AI');

            if (!isAIPost) {
                // console.log(`⏭️ Skipping "${post.title}" (Not an AI post)`);
                continue;
            }

            // 2. Check Age (Older than 15 mins)
            const created = new Date(post.created);
            const cutoff = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago

            if (created > cutoff) {
                console.log(`⏳ Pending: "${post.title}" (Wait time remaining)`);
                continue;
            }

            try {
                // Update to published
                await pb.collection('posts').update(post.id, {
                    published: true
                });
                console.log(`✅ Auto-Published: "${post.title}"`);

                // Optional: Send silent notification
                if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: TELEGRAM_CHAT_ID,
                            text: `🤖 *Auto-Published:* ${post.title}\n(No action taken in 15m)\n\n🔗 [Live Link](https://rdev.cloud/blog/${post.slug})`,
                            parse_mode: 'Markdown',
                            disable_notification: true
                        })
                    });
                }

            } catch (err) {
                console.error(`❌ Failed to publish ${post.id}:`, err.message);
            }
        }

    } catch (e) {
        console.error("❌ Auto-publish script failed:", e);
        process.exit(1);
    }
}

main();
