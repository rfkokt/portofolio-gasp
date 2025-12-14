#!/usr/bin/env node
import 'dotenv/config';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function addDateFields(collectionName) {
    console.log(`Updating ${collectionName} collection...`);
    const collection = await pb.collections.getOne(collectionName);
    
    const needsCreatedAt = !collection.fields?.some(f => f.name === 'created_at');
    const needsUpdatedAt = !collection.fields?.some(f => f.name === 'updated_at');
    const needsCreatedBy = !collection.fields?.some(f => f.name === 'created_by');
    const needsUpdatedBy = !collection.fields?.some(f => f.name === 'updated_by');
    const needsRole = collectionName === 'cms_admins' && !collection.fields?.some(f => f.name === 'role');
    
    let updatedFields = [...collection.fields];
    let changed = false;

    if (needsCreatedAt) {
        updatedFields.push({ name: 'created_at', type: 'autodate', onCreate: true, onUpdate: false });
        changed = true;
    }
    if (needsUpdatedAt) {
        updatedFields.push({ name: 'updated_at', type: 'autodate', onCreate: true, onUpdate: true });
        changed = true;
    }
    if (needsCreatedBy) {
        updatedFields.push({ name: 'created_by', type: 'text', required: false });
        changed = true;
    }
    if (needsUpdatedBy) {
        updatedFields.push({ name: 'updated_by', type: 'text', required: false });
        changed = true;
    }
    if (needsRole) {
        updatedFields.push({ name: 'role', type: 'text', required: false });
        changed = true;
    }

    if (changed) {
        await pb.collections.update(collectionName, { fields: updatedFields });
        console.log(`✅ Updated fields in ${collectionName}`);
    } else {
        console.log(`⚠️ All fields already exist in ${collectionName}`);
    }
}

async function main() {
    try {
        await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASS);
        console.log('✅ Authenticated as Admin');

        // Add date fields to all collections
        await addDateFields('posts');
        await addDateFields('projects');
        await addDateFields('cms_admins');
        await addDateFields('admin_logs');

        console.log('✅ Schema update complete');
    } catch (err) {
        console.error('❌ Failed to update schema:', err);
        if (err.data) {
            console.error('Details:', JSON.stringify(err.data, null, 2));
        }
    }
}

main();
