"use server";

// plain PocketBase import removed
import { logAdminAction } from "./admin-logs";
import { getAdminSession } from "@/lib/admin-auth";

import { createAdminClient } from '@/lib/pb-client';

// Removed global pb
// Removed global pb and authenticateAdmin helper

export interface PostData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image?: string;
  published: boolean;
  published_at?: string;
  tags?: string[];
}

export async function getPostsForCMS(
  filter: "drafts" | "published" | "all" = "all",
  page: number = 1,
  search: string = "",
  author: string = ""
) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();

    let filterParts: string[] = [];
    
    // Status filter
    if (filter === "drafts") {
      filterParts.push("published = false");
    } else if (filter === "published") {
      filterParts.push("published = true");
    }

    // Role-based filter: users can only see their own posts
    if (session && session.role !== 'admin') {
      filterParts.push(`created_by = "${session.username}"`);
    }

    // Search filter
    if (search) {
      filterParts.push(`title ~ "${search}"`);
    }

    // Author filter
    if (author && author !== "all") {
      filterParts.push(`created_by = "${author}"`);
    }

    const filterQuery = filterParts.join(" && ");

    const result = await pb.collection("posts").getList(page, 10, {
      filter: filterQuery || undefined,
      sort: '-created_at',
    });

    return { 
      success: true, 
      posts: result.items,
      pagination: {
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages
      }
    };
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    return { 
      success: false, 
      error: error.message, 
      posts: [],
      pagination: {
        page: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0
      }
    };
  }
}

export async function getPostById(id: string) {
  try {
    const pb = await createAdminClient();
    const post = await pb.collection("posts").getOne(id);
    return { success: true, post };
  } catch (error: any) {
    console.error("Error fetching post:", error);
    return { success: false, error: error.message };
  }
}

export async function createPost(data: PostData) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();

    // Generate published_at if publishing
    const postData = {
      ...data,
      published_at: data.published ? new Date().toISOString() : null,
      created_by: session?.username || 'Unknown',
      updated_by: session?.username || 'Unknown',
    };

    const record = await pb.collection("posts").create(postData);
    await logAdminAction("Create Post", `Created post: ${data.title}`);
    return { success: true, id: record.id };
  } catch (error: any) {
    console.error("Error creating post:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePost(id: string, data: Partial<PostData>) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();
    
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get the post to check ownership
    const post = await pb.collection("posts").getOne(id);
    
    // Role-based validation
    if (session.role !== 'admin') {
      // Users cannot edit AI-created content
      if (post.created_by === 'AI') {
        return { success: false, error: 'Only admins can edit AI-generated content' };
      }
      // Users can only edit their own posts
      if (post.created_by !== session.username) {
        return { success: false, error: 'You can only edit your own posts' };
      }
    }

    // If publishing for first time, set published_at
    if (data.published && !data.published_at) {
      data.published_at = new Date().toISOString();
    }

    await pb.collection("posts").update(id, {
      ...data,
      updated_by: session.username,
    });
    await logAdminAction("Update Post", `Updated post ID: ${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating post:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePost(id: string) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();
    
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get the post to check ownership
    const post = await pb.collection("posts").getOne(id);
    
    // Role-based validation
    if (session.role !== 'admin') {
      // Users cannot delete AI-created content
      if (post.created_by === 'AI') {
        return { success: false, error: 'Only admins can delete AI-generated content' };
      }
      // Users can only delete their own posts
      if (post.created_by !== session.username) {
        return { success: false, error: 'You can only delete your own posts' };
      }
    }

  await pb.collection("posts").delete(id);
    await logAdminAction("Delete Post", `Deleted post ID: ${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return { success: false, error: error.message };
  }
}

export async function togglePostStatus(id: string, published: boolean) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();
    
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get the post to check ownership
    const post = await pb.collection("posts").getOne(id);
    
    // Role-based validation
    if (session.role !== 'admin') {
      if (post.created_by === 'AI') {
        return { success: false, error: 'Only admins can modify AI-generated content' };
      }
      if (post.created_by !== session.username) {
        return { success: false, error: 'You can only modify your own posts' };
      }
    }

    const updateData: any = {
      published,
      updated_by: session.username,
    };

    // Set published_at when publishing for first time
    if (published && !post.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    await pb.collection("posts").update(id, updateData);
    await logAdminAction(
      published ? "Publish Post" : "Unpublish Post",
      `${published ? "Published" : "Unpublished"} post ID: ${id}`
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling post status:", error);
    return { success: false, error: error.message };
  }
}
