import 'dotenv/config'; // Load env vars
import { pb } from './lib/pocketbase';

async function checkData() {
    try {
        console.log('Connecting to:', pb.baseUrl);
        const projects = await pb.collection('projects').getList(1, 10);
        console.log('Projects found:', projects.totalItems);
        console.log('Items:', JSON.stringify(projects.items, null, 2));
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

checkData();
