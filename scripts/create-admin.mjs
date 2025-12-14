import PocketBase from 'pocketbase';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.rdev.cloud');

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Usage: node scripts/create-admin.mjs <username> <password>');
        console.log('Example: node scripts/create-admin.mjs admin mypassword123');
        process.exit(1);
    }

    const [username, password] = args;

    const email = process.env.PB_ADMIN_EMAIL;
    const pass = process.env.PB_ADMIN_PASS;

    if (!email || !pass) {
        console.error('❌ Error: PB_ADMIN_EMAIL and PB_ADMIN_PASS environment variables are required.');
        process.exit(1);
    }

    try {
        console.log('🔌 Connecting to PocketBase...');
        await pb.admins.authWithPassword(email, pass);

        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Check if admin exists
        try {
            const existing = await pb.collection('cms_admins').getFirstListItem(`username="${username}"`);
            
            // Update existing admin
            await pb.collection('cms_admins').update(existing.id, { password_hash });
            console.log(`✅ Updated password for admin "${username}"`);
        } catch (e) {
            // Create new admin
            await pb.collection('cms_admins').create({ username, password_hash });
            console.log(`✅ Created new admin "${username}"`);
        }

    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
}

main();
