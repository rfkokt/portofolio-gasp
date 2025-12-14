#!/usr/bin/env node
import 'dotenv/config';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function main() {
    const args = process.argv.slice(2);
    const usernameArg = args.find(arg => arg.startsWith('--username='));
    const roleArg = args.find(arg => arg.startsWith('--role='));

    if (!usernameArg || !roleArg) {
        console.log('Usage: node scripts/set-admin-role.mjs --username=<username> --role=<admin|user>');
        console.log('\nExample:');
        console.log('  node scripts/set-admin-role.mjs --username=admin --role=admin');
        console.log('  node scripts/set-admin-role.mjs --username=rifki@example.com --role=user');
        process.exit(1);
    }

    const username = usernameArg.split('=')[1];
    const role = roleArg.split('=')[1];

    if (role !== 'admin' && role !== 'user') {
        console.error('❌ Role must be "admin" or "user"');
        process.exit(1);
    }

    try {
        await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASS);
        console.log('✅ Authenticated as Admin');

        // Find admin by username
        const admin = await pb.collection('cms_admins').getFirstListItem(`username="${username}"`);
        
        // Update role
        await pb.collection('cms_admins').update(admin.id, { role });
        
        console.log(`✅ Updated ${username} role to: ${role}`);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
}

main();
