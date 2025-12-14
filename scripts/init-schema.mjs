
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.rdev.cloud');

async function main() {
    try {
        // Authenticate as Admin
        const email = process.env.PB_ADMIN_EMAIL;
        const pass = process.env.PB_ADMIN_PASS;

        if (!email || !pass) {
            console.error('❌ Error: PB_ADMIN_EMAIL and PB_ADMIN_PASS environment variables are required.');
            process.exit(1);
        }

        await pb.admins.authWithPassword(email, pass);
        console.log('✅ Authenticated as Admin');

        // Create 'posts' collection
        try {
            await pb.collections.getOne('posts');
            console.log('⚠️ Collection "posts" already exists. Skipping to prevent data loss.');
        } catch (e) {
            await pb.collections.create({
                name: 'posts',
                type: 'base',
                fields: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'slug', type: 'text', required: true, unique: true },
                    { name: 'content', type: 'editor', required: true },
                    { name: 'excerpt', type: 'text' },
                    { name: 'cover_image', type: 'url' },
                    { name: 'published', type: 'bool' },
                    { name: 'published_at', type: 'date' },
                    { name: 'tags', type: 'json' }
                ],
                listRule: '',
                viewRule: '',
            });
            console.log('✅ Collection "posts" created');
        }

        // Create 'projects' collection
        try {
            await pb.collections.getOne('projects');
            console.log('⚠️ Collection "projects" already exists. Skipping.');
        } catch (e) {
            await pb.collections.create({
                name: 'projects',
                type: 'base',
                fields: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'slug', type: 'text', required: true, unique: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'content', type: 'editor' },
                    { name: 'image', type: 'file', options: { mimeTypes: ['image/*'] } },
                    { name: 'tech_stack', type: 'json' },
                    { name: 'demo_url', type: 'url' },
                    { name: 'repo_url', type: 'url' },
                    { name: 'featured', type: 'bool' }
                ],
                listRule: '',
                viewRule: '',
            });
            console.log('✅ Collection "projects" created');
        }

        // Create 'interactions' collection
        try {
            await pb.collections.getOne('interactions');
            console.log('⚠️ Collection "interactions" already exists. Skipping.');
        } catch (e) {
            // Get posts collection ID for the relation
            const postsCollection = await pb.collections.getOne('posts');
            
            await pb.collections.create({
                name: 'interactions',
                type: 'base',
                fields: [
                    { name: 'post', type: 'relation', collectionId: postsCollection.id, cascadeDelete: true, required: true, maxSelect: 1 },
                    { name: 'type', type: 'select', values: ['clap', 'love', 'care', 'view', 'share'], required: true, maxSelect: 1 },
                    { name: 'visitor_id', type: 'text', required: true },
                    { name: 'ip_hash', type: 'text' }
                ],
                listRule: '', // Public create/read
                viewRule: '',
                createRule: '',
            });
            console.log('✅ Collection "interactions" created');
        }

    } catch (err) {
        console.error('❌ Failed to initialize schema:', err);
        if (err.data) {
            console.error('Validation errors:', JSON.stringify(err.data, null, 2));
        }
    }
}

main();
