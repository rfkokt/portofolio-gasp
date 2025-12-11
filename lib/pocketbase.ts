import PocketBase from 'pocketbase';
import { PostRecord, ProjectRecord } from './pb_schema';

// Helper to construct the full image URL
export const getPbImage = (collectionId: string, recordId: string, fileName: string) => {
    if (!fileName) return '';
    return `${process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'}/api/files/${collectionId}/${recordId}/${fileName}`;
};

// Singleton instance
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Disable auto-cancellations to avoid request aborts in React Strict Mode
pb.autoCancellation(false);

export async function getPosts() {
    return await pb.collection('posts').getList<PostRecord>(1, 50, {
        filter: 'published = true',
        sort: '-published_at',
    });
}

export async function getProjectList() {
    return await pb.collection('projects').getList<ProjectRecord>(1, 50, {
        sort: '-created',
    });
}

export async function getPostBySlug(slug: string) {
    return await pb.collection('posts').getFirstListItem<PostRecord>(`slug="${slug}" && published = true`);
}

export async function getProjectBySlug(slug: string) {
    return await pb.collection('projects').getFirstListItem<ProjectRecord>(`slug="${slug}"`);
}

export async function getPostSlugs() {
    return await pb.collection('posts').getFullList({
        fields: 'slug',
        filter: 'published = true',
    });
}

export async function getProjectSlugs() {
    return await pb.collection('projects').getFullList({
        fields: 'slug',
    });
}

export async function getRelatedPosts(currentSlug: string) {
    // Fetch recent posts excluding the current one
    // In a real app we might match tags, but for now simple exclusion + recent is enough
    return await pb.collection('posts').getList<PostRecord>(1, 3, {
        filter: `slug != "${currentSlug}" && published = true`,
        sort: '-published_at',
    });
}
