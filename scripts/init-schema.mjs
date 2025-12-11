
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.rdev.cloud');

async function main() {
    try {
        // Authenticate as Admin
        await pb.admins.authWithPassword('rifkiokta105@gmail.com', '99585767aA!');
        console.log('✅ Authenticated as Admin');

        // Create 'posts' collection
        try {
            try {
                await pb.collections.delete('posts');
                console.log('🗑️ Deleted existing "posts" collection');
            } catch (e) { /* ignore if not exists */ }

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
            console.log('ℹ️ Failed to create "posts":', e.originalError?.message || e.message);
        }

        // Create 'projects' collection
        try {
            try {
                await pb.collections.delete('projects');
                console.log('🗑️ Deleted existing "projects" collection');
            } catch (e) { /* ignore if not exists */ }

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
            console.log('ℹ️ Failed to create "projects":', e.originalError?.message || e.message);
        }

    } catch (err) {
        console.error('❌ Failed to initialize schema:', err);
    }
}

main();
