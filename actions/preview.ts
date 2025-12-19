
"use server";

import PocketBase from 'pocketbase';

export async function getPreviewPost(postId: string) {
    try {
        const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://43.134.114.243:8090');
        
        // Authenticate as custom admin for this specific read operation
        // Use the same env vars as the webhook
        const email = process.env.PB_ADMIN_EMAIL;
        const pass = process.env.PB_ADMIN_PASS;

        if (!email || !pass) {
            throw new Error("Server configuration error: Missing Admin Credentials");
        }

        await pb.admins.authWithPassword(email, pass);

        // Now we can fetch the draft even if published=false
        const record = await pb.collection('posts').getOne(postId);

        // Serialize the record to plain JSON to pass to client component
        return JSON.parse(JSON.stringify(record));
    } catch (error: any) {
        console.error("Preview Fetch Error:", error);
        throw new Error(error.message || "Failed to fetch draft");
    }
}
