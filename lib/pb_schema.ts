export interface PostRecord {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    cover_image: string;
    published: boolean;
    published_at: string;
    tags: string[];
}

export interface ProjectRecord {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    image: string;
    tech_stack: string[];
    demo_url: string;
    repo_url: string;
    featured: boolean;
}
