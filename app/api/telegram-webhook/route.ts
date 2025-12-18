import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import path from 'path';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://43.134.114.243:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Helper to escape shell args (basic)
function escapeShellArg(arg: string) {
    return `'${arg.replace(/'/g, "'\\''")}'`;
}

// Execute script asynchronously
async function runBloggerScript(args: string[] = []) {
    const { exec } = await import('child_process'); // Dynamic import to avoid edge runtime issues if any (though this is node runtime)
    const scriptPath = path.join(process.cwd(), "scripts", "ai-blogger.mjs");
    
    console.log(`🚀 Spawning blogger: node ${scriptPath} ${args.join(' ')}`);

    exec(`node "${scriptPath}" ${args.join(' ')}`, {
        env: { ...process.env, MAX_BLOGS: '1' } // Force 1 blog for manual trigger
    }, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Script error:`, error);
        } else {
            console.log(`✅ Script finished. Stdout:`, stdout);
        }
    });
}

export async function POST(req: NextRequest) {
    if (!TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    try {
        const update = await req.json();

        // 1. Handle Callback Query (Buttons)
        if (update.callback_query) { 
            const callbackQuery = update.callback_query;
            const data = callbackQuery.data; // e.g., "publish:RECORD_ID"
            const chatId = callbackQuery.message.chat.id;
            const messageId = callbackQuery.message.message_id;

            const [action, postId] = data.split(':');

            if (!postId) {
                return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
            }

            // Connect to PocketBase
            const pb = new PocketBase(PB_URL);
            await pb.admins.authWithPassword(PB_ADMIN_EMAIL!, PB_ADMIN_PASS!);

            const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

            if (action === 'publish') {
                const updatedPost = await pb.collection('posts').update(postId, { published: true });
                const liveLink = `https://rdev.cloud/blog/${updatedPost.slug}`;
                
                // Update Telegram message to show success
                await fetch(`${telegramApiUrl}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        message_id: messageId,
                        text: `${callbackQuery.message.text}\n\n✅ *Status: Published via Telegram*\n🔗 [Live Link](${liveLink})`,
                        parse_mode: 'Markdown'
                    })
                });

                // Answer callback to stop loading animation
                await fetch(`${telegramApiUrl}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        callback_query_id: callbackQuery.id,
                        text: 'Post published successfully!'
                    })
                });

            } else if (action === 'delete') {
                await pb.collection('posts').delete(postId);

                // Update Telegram message
                await fetch(`${telegramApiUrl}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        message_id: messageId,
                        text: `${callbackQuery.message.text}\n\n❌ *Status: Deleted via Telegram*`,
                        parse_mode: 'Markdown'
                    })
                });

                // Answer callback
                await fetch(`${telegramApiUrl}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        callback_query_id: callbackQuery.id,
                        text: 'Post deleted.'
                    })
                });
            }

            return NextResponse.json({ success: true });
        }

        // 2. Handle Message (Commands)
        if (update.message && update.message.text) {
            const message = update.message;
            const text = message.text;
            const chatId = message.chat.id;

            // Security Check
            if (chatId.toString() !== process.env.TELEGRAM_CHAT_ID) {
                console.warn(`🛑 Unauthorized access attempt from Chat ID: ${chatId}`);
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

            if (text.startsWith('/auto')) {
                // Trigger auto generation
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: "🤖 *Auto-Generation Started...*\nChecking RSS feeds for new content.",
                        parse_mode: 'Markdown'
                    })
                });

                // Run script in background
                runBloggerScript([]); // No args = auto mode

            } else if (text.startsWith('/blog')) {
                // Parse command: /blog Topic | Prompt
                const rawContent = text.replace('/blog', '').trim();
                
                if (!rawContent) {
                    await fetch(`${telegramApiUrl}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: "⚠️ *Usage:*\n`/blog <Topic>`\n`/blog <Topic> | <Prompt>`\n`/blog <Link>`",
                            parse_mode: 'Markdown'
                        })
                    });
                    return NextResponse.json({ success: true });
                }

                // Split by first pipe |
                const parts = rawContent.split('|');
                const topicOrLink = parts[0].trim();
                const customPrompt = parts.slice(1).join('|').trim();

                const isLink = topicOrLink.startsWith('http');
                const scriptArgs = [];

                if (isLink) {
                   scriptArgs.push(`--link=${encodeURIComponent(topicOrLink)}`);
                } else {
                   scriptArgs.push(`--topic=${encodeURIComponent(topicOrLink)}`);
                }

                if (customPrompt) {
                    scriptArgs.push(`--prompt=${encodeURIComponent(customPrompt)}`);
                }

                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `📝 *Custom Generation Started...*\n\n**Subject**: ${topicOrLink}\n${customPrompt ? `**Instruction**: ${customPrompt}` : ""}`,
                        parse_mode: 'Markdown'
                    })
                });

                 // Run script
                 runBloggerScript(scriptArgs);

            } else if (text.startsWith('/help') || text.startsWith('/start')) {
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: "🤖 *Quis AI Blogger Bot Commands:*\n\n" +
                              "🔹 `/auto`\n" +
                              "Trigger automatic blog generation based on RSS feeds.\n\n" +
                              "🔹 `/blog <Topic>`\n" +
                              "Generate a blog post about a specific topic.\n" +
                              "Example: `/blog Next.js 15 Features`\n\n" +
                              "🔹 `/blog <Link>`\n" +
                              "Summarize or rewrite a specific article from a URL.\n" +
                              "Example: `/blog https://example.com/article`\n\n" +
                              "🔹 `/blog <Topic|Link> | <Instruction>`\n" +
                              "Generate with specific custom instructions.\n" +
                              "Example: `/blog React Hooks | Make it funny and beginner friendly`",
                        parse_mode: 'Markdown'
                    })
                });
            } else {
                // Handle unknown commands or plain text
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                         text: "❓ *Unknown Command*\n\nI didn't recognize that command. Type `/help` to see what I can do.",
                        parse_mode: 'Markdown'
                    })
                });
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ message: 'Ignored update type' });

    } catch (e: any) {
        console.error("Telegram Webhook Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
