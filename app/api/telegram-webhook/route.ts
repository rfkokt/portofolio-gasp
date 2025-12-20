import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import path from 'path';
import { spawn } from 'child_process';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://43.134.114.243:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN;

// Helper to escape shell args (basic)
function escapeShellArg(arg: string) {
    return `'${arg.replace(/'/g, "'\\''")}'`;
}

// Execute script asynchronously safely using spawn
async function runBloggerScript(args: string[] = [], chatId?: string | number) {
    const scriptName = "ai-blogger.mjs";
    // Bypass Next.js tracing by not using path.join/resolve with literal strings
    const scriptPath = [process.cwd(), 'scripts', scriptName].join('/');
    
    console.log(`🚀 Spawning blogger: node ${scriptPath} ${args.join(' ')}`);

    const child = spawn('node', [scriptPath, ...args], {
        env: { ...process.env, MAX_BLOGS: '1' },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    child.on('close', async (code) => {
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
        
        if (code !== 0) {
            console.error(`❌ Script exited with code ${code}`);
            console.error(`Stderr:`, stderr);
            
            if (chatId) {
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `❌ *Generation Failed*\n\nExit Code: ${code}\nStderr: \`${stderr?.substring(0, 500) || 'Unknown error'}\``,
                        parse_mode: 'Markdown'
                    })
                });
            }
        } else {
            console.log(`✅ Script finished. Stdout:`, stdout);
            
            // Check if "No new articles" message is in stdout
            if (stdout.includes("No new articles") || stdout.includes("skipped")) {
                 if (chatId) {
                    await fetch(`${telegramApiUrl}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: `ℹ️ *Generation Finished*\n\nNo new relevant articles found matching criteria (or all were skipped).`,
                            parse_mode: 'Markdown'
                        })
                    });
                }
            }
        }
    });

    child.on('error', async (err) => {
        console.error('Failed to start subprocess:', err);
         const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
         if (chatId) {
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `❌ *Spawn Failed*\n\nError: \`${err.message}\``,
                        parse_mode: 'Markdown'
                    })
                });
            }
    });
}

// Execute Deal Hunter script asynchronously
async function runDealHunterScript(chatId?: string | number) {
    const scriptName = "deal-hunter.mjs";
     // Bypass Next.js tracing by not using path.join/resolve with literal strings
    const scriptPath = [process.cwd(), 'scripts', scriptName].join('/');
    
    console.log(`🚀 Spawning Deal Hunter: node ${scriptPath}`);

    const child = spawn('node', [scriptPath], {
        env: { ...process.env }, // Inherit env vars including auth
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    child.on('close', async (code) => {
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
        
        if (code !== 0) {
            console.error(`❌ Deal Hunter exited with code ${code}`);
            console.error(`Stderr:`, stderr);
            
            if (chatId) {
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `❌ *Promo Hunt Failed*\n\nExit Code: ${code}\nStderr: \`${stderr?.substring(0, 500) || 'Unknown error'}\``,
                        parse_mode: 'Markdown'
                    })
                });
            }
        } else {
            console.log(`✅ Deal Hunter finished. Stdout:`, stdout);
            
            if (chatId) {
                // Parse stdout to count deals found
                const match = stdout.match(/Generated Deal: (.*)/g);
                const count = match ? match.length : 0;
                
                let msg = `✅ *Promo Hunt Finished*`;
                if (count > 0) {
                    msg += `\n\nFound ${count} new deal(s)! Check the channel/chat for alerts.`;
                } else {
                    msg += `\n\nNo new deals found right now. Try again later!`;
                }

                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: msg,
                        parse_mode: 'Markdown'
                    })
                });
            }
        }
    });

    child.on('error', async (err) => {
         const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
         if (chatId) {
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `❌ *Spawn Failed*\n\nError: \`${err.message}\``,
                        parse_mode: 'Markdown'
                    })
                });
            }
    });
}

// Execute Story Hunter script asynchronously
async function runStoryHunterScript(chatId?: string | number) {
    const scriptName = "story-hunter.mjs";
    const scriptPath = [process.cwd(), 'scripts', scriptName].join('/');
    
    console.log(`🚀 Spawning Story Hunter: node ${scriptPath}`);

    const child = spawn('node', [scriptPath], {
        env: { ...process.env }, 
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    child.on('close', async (code) => {
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
        
        if (code !== 0) {
            console.error(`❌ Story Hunter exited with code ${code}`);
            if (chatId) {
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `❌ *Story Hunt Failed*\n\nExit Code: ${code}\nStderr: \`${stderr?.substring(0, 500) || 'Unknown error'}\``,
                        parse_mode: 'Markdown'
                    })
                });
            }
        } else {
            console.log(`✅ Story Hunter finished.`);
            
            if (chatId) {
                const match = stdout.match(/Generated Story: (.*)/g);
                const count = match ? match.length : 0;
                
                let msg = `✅ *Inspiration Hunt Finished*`;
                if (count > 0) {
                    msg += `\n\nFound ${count} new inspiring stories!`;
                } else {
                    msg += `\n\nNo new stories found right now.`;
                }

                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: msg,
                        parse_mode: 'Markdown'
                    })
                });
            }
        }
    });


    child.on('error', async (err) => {
        console.error('Failed to start Story Hunter:', err);
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
        if (chatId) {
            await fetch(`${telegramApiUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: `❌ *Spawn Failed*\n\nError: \`${err.message}\``,
                    parse_mode: 'Markdown'
                })
            });
        }
    });
}

export async function GET() {
    return NextResponse.json({
        status: 'online',
        message: 'Telegram Webhook is active',
        env_check: {
            has_token: !!process.env.TELEGRAM_BOT_TOKEN,
            server_time: new Date().toISOString()
        }
    });
}

export async function POST(req: NextRequest) {
    if (!TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    // Verify Secret Token if configured
    if (TELEGRAM_SECRET_TOKEN) {
        const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
        if (secretToken !== TELEGRAM_SECRET_TOKEN) {
            console.warn('🛑 Unauthorized webhook attempt (invalid secret token)');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        let update;
        try {
            update = await req.json();
            console.log("📨 Webhook received:", JSON.stringify(update, null, 2));
        } catch (jsonError) {
            console.error("Invalid JSON body:", jsonError);
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

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

            try {
                // Connect to PocketBase
                const pb = new PocketBase(PB_URL);
                
                // Explicitly check env vars for clearer error message
                if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASS) {
                    throw new Error("Missing PB_ADMIN_EMAIL or PB_ADMIN_PASS in server environment.");
                }

                await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASS);

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

                    // Answer callback
                    await fetch(`${telegramApiUrl}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            callback_query_id: callbackQuery.id,
                            text: '✅ Post published successfully!'
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
                            text: '🗑️ Post deleted.'
                        })
                    });
                }
            } catch (actionError: any) {
                console.error("Callback Action Error:", actionError);
                


                // Send alert to user
                await fetch(`${telegramApiUrl}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        callback_query_id: callbackQuery.id,
                        text: `❌ Error: ${actionError.message}`,
                        show_alert: true
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
                runBloggerScript([], chatId); // No args = auto mode

            } else if (text.startsWith('/blog')) {
                // Parse command: /blog Topic | Prompt
                const rawContent = text.replace('/blog', '').trim();
            } else if (text.startsWith('/blog')) {
                const rawText = text.replace('/blog', '').trim();
                
                if (!rawText) {
                    await fetch(`${telegramApiUrl}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: "⚠️ *Usage:*\n`/blog <Topic>`\n`/blog <Link> [Instruction]`",
                            parse_mode: 'Markdown'
                        })
                    });
                    return NextResponse.json({ success: true });
                }

                let topic = "";
                let prompt = "";
                let isUrl = false;

                if (rawText.includes('|')) {
                    // Explicit separator
                    const parts = rawText.split('|');
                    topic = parts[0].trim();
                    prompt = parts.slice(1).join('|').trim();
                    isUrl = topic.startsWith('http');
                } else {
                     // Smart parsing
                     if (rawText.startsWith('http')) {
                        const firstSpace = rawText.indexOf(' ');
                        if (firstSpace !== -1) {
                            topic = rawText.substring(0, firstSpace).trim();
                            prompt = rawText.substring(firstSpace + 1).trim();
                        } else {
                            topic = rawText;
                        }
                        isUrl = true;
                    } else {
                        topic = rawText;
                    }
                }

                const scriptArgs = isUrl ? [`--link=${topic}`] : [`--topic=${topic}`];
                if (prompt) scriptArgs.push(`--prompt=${prompt}`);

                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `📝 *Generating...*\n\n**Source**: ${topic}\n${prompt ? `**Instruction**: ${prompt}` : ""}`,
                        parse_mode: 'Markdown'
                    })
                });

                 // Run script
                 runBloggerScript(scriptArgs, chatId);

            } else if (text.startsWith('/promo')) {
                // Trigger deal hunter
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: "🕵️‍♂️ *Hunting for Deals...*\nScanning Reddit & Product Hunt for dev promos. This may take a minute.",
                        parse_mode: 'Markdown'
                    })
                });

                // Run script in background
                runDealHunterScript(chatId);

            } else if (text.startsWith('/story')) {
                // Trigger story hunter
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: "📖 *Hunting for Stories...*\nScanning Reddit for success stories & milestones...",
                        parse_mode: 'Markdown'
                    })
                });

                // Run script in background
                runStoryHunterScript(chatId);

            } else if (text.startsWith('/set-webhook')) {
                // Set Webhook
                 const webhookUrl = "https://rdev.cloud/api/telegram-webhook";
                 const setUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=[]`;
                 
                 try {
                     const response = await fetch(setUrl);
                     const result = await response.json();
                     
                     await fetch(`${telegramApiUrl}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: `⚙️ *Webhook Update*\n\nResult: \`${JSON.stringify(result)}\``,
                            parse_mode: 'Markdown'
                        })
                    });
                 } catch (e: any) {
                     await fetch(`${telegramApiUrl}/sendMessage`, {
                        headers: { 'Content-Type': 'application/json' },
                        method: 'POST',
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: `❌ Error setting webhook: ${e.message}`,
                        })
                    });
                 }

            } else if (text.startsWith('/help') || text.startsWith('/start')) {
                await fetch(`${telegramApiUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: "🤖 *Quis AI Bot Commands:*\n\n" +
                              "🔹 `/auto`\n" +
                              "Trigger automatic blog generation based on RSS feeds.\n\n" +
                              "🔹 `/promo`\n" +
                              "Hunt for new Developer Deals, Games, & AI Models (Deal Hunter).\n\n" +
                              "🔹 `/story`\n" +
                              "Find inspirational Indie Hacker stories & revenue milestones.\n\n" +
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
