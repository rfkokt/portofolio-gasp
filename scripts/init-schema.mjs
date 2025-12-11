
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        // Authenticate as Admin
        await pb.admins.authWithPassword('admin@quis.com', 'admin123456');
        console.log('✅ Authenticated as Admin');

        // Create 'posts' collection
        try {
            await pb.collections.create({
                name: 'posts',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'slug', type: 'text', required: true, unique: true },
                    { name: 'content', type: 'editor', required: true },
                    { name: 'excerpt', type: 'text' },
                    { name: 'cover_image', type: 'file', options: { mimeTypes: ['image/*'] } },
                    { name: 'published', type: 'bool' },
                    { name: 'published_at', type: 'date' },
                    { name: 'tags', type: 'json' } // Simple array of strings
                ],
                listRule: '', // Public read
                viewRule: '', // Public read
            });
            console.log('✅ Collection "posts" created');
        } catch (e) {
            console.log('ℹ️ Collection "posts" might already exist or failed:', e.originalError?.message || e.message);
        }

        // Create 'projects' collection
        try {
            await pb.collections.create({
                name: 'projects',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'slug', type: 'text', required: true, unique: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'content', type: 'editor' },
                    { name: 'image', type: 'file', options: { mimeTypes: ['image/*'] } },
                    { name: 'tech_stack', type: 'json' }, // Array of strings
                    { name: 'demo_url', type: 'url' },
                    { name: 'repo_url', type: 'url' },
                    { name: 'featured', type: 'bool' }
                ],
                listRule: '', // Public read
                viewRule: '', // Public read
            });
            console.log('✅ Collection "projects" created');
        } catch (e) {
            console.log('ℹ️ Collection "projects" might already exist or failed:', e.originalError?.message || e.message);
        }

    } catch (err) {
        console.error('❌ Failed to initialize schema:', err);
    }
}

main();
