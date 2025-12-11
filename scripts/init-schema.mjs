
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.rdev.cloud');

async function main() {
    try {
        // Authenticate as Admin
        await pb.admins.authWithPassword('rifkiokta105@gmail.com', '99585767aA!');
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

    } catch (err) {
        console.error('❌ Failed to initialize schema:', err);
    }
}

main();
