import 'dotenv/config';
import { fetch } from 'undici';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ Error: TELEGRAM_BOT_TOKEN is missing in .env");
    process.exit(1);
}

const commands = [
    { command: "auto", description: "🤖 Auto-generate from RSS" },
    { command: "promo", description: "🕵️ Deal Hunter (Games/Tools)" },
    { command: "story", description: "📖 Inspiration/Success Hunter" },
    { command: "blog", description: "📝 /blog Topic | Custom Instruction" },
    { command: "set_webhook", description: "⚙️ Reset Webhook URL" },
    { command: "help", description: "❓ Show usage examples" }
];

async function setupCommands() {
    console.log("🔌 Connecting to Telegram API...");
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands })
        });

        const data = await response.json();

        if (data.ok) {
            console.log("✅ Custom commands registered successfully!");
            console.log("👉 You can now type '/' in your bot to see the menu.");
        } else {
            console.error("❌ Failed to register commands:", data);
        }

    } catch (e) {
        console.error("❌ Network error:", e.message);
    }
}

setupCommands();
