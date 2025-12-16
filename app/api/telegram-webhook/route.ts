import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://43.134.114.243:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASS = process.env.PB_ADMIN_PASS;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: NextRequest) {
    if (!TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    try {
        const update = await req.json();

        // Only handle callback_query (button clicks)
        if (!update.callback_query) {
            return NextResponse.json({ message: 'Not a callback query, ignoring.' });
        }

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
            await pb.collection('posts').update(postId, { published: true });
            
            // Update Telegram message to show success
            await fetch(`${telegramApiUrl}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: `${callbackQuery.message.text}\n\n✅ *Status: Published via Telegram*\n🔗 [Live Link](https://rdev.cloud/blog/${postId})`,
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

    } catch (e: any) {
        console.error("Telegram Webhook Error:", e);
        
        // Attempt to notify user in Telegram about the error
        if (TELEGRAM_BOT_TOKEN && req.body) {
             try {
                // Need to re-parse body safely as it might have been consumed
                const clonedReq = await req.clone();
                const update = await clonedReq.json();
                if (update?.callback_query?.id) {
                     await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            callback_query_id: update.callback_query.id,
                            text: `❌ Error: ${e.message}`,
                            show_alert: true // Show as popup
                        })
                    });
                }
             } catch (innerError) {
                 console.error("Failed to send error feedback to Telegram", innerError);
             }
        }

        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
