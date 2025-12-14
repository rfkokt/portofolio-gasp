"use server";

import { getPosts } from "@/lib/pocketbase";

export async function fetchMorePosts(page: number, search: string = "") {
  try {
    const result = await getPosts(page, 10, search);
    return {
      success: true,
      items: result.items,
      page: result.page,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error: any) {
    console.error("Error fetching more posts:", error);
    return { success: false, error: error.message };
  }
}
