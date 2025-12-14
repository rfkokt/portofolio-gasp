
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.rdev.cloud');

async function main() {
    try {
        // Authenticate
        const email = process.env.PB_ADMIN_EMAIL;
        const pass = process.env.PB_ADMIN_PASS;

        if (!email || !pass) {
            console.error('❌ Error: PB_ADMIN_EMAIL and PB_ADMIN_PASS environment variables are required.');
            process.exit(1);
        }

        await pb.admins.authWithPassword(email, pass);
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
