
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.rdev.cloud');

async function main() {
    try {
        // Authenticate
        await pb.admins.authWithPassword('rifkiokta105@gmail.com', '99585767aA!');
        console.log('✅ Authenticated');

        // Get interactions collection
        const collection = await pb.collections.getOne('interactions');

        // Update schema
        await pb.collections.update(collection.id, {
            fields: [
                // We must provide ALL fields to update the schema safely, or at least the ones we want to preserve + change?
                // PocketBase update logic requires re-specifying fields if we are changing the schema array?
                // Actually, we can just find the field by name and update it, but SDK usually takes the full new schema.
                // Let's copy existing fields and modify the 'type' field.
                ...collection.fields.map(f => {
                    if (f.name === 'type') {
                        return {
                            ...f,
                            values: ['clap', 'love', 'care', 'view', 'share']
                        };
                    }
                    return f;
                })
            ]
        });

        console.log('✅ Collection "interactions" updated with new types.');

    } catch (err) {
        console.error('❌ Failed to update schema:', err);
    }
}

main();
