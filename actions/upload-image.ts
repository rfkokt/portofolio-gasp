"use server";

// plain PocketBase import removed
import { getAdminSession } from "@/lib/admin-auth";

import { createAdminClient } from '@/lib/pb-client';

// Removed global pb
// Removed global pb and authenticateAdmin helper

// Upload image to a dedicated media collection and return the URL
export async function uploadContentImage(formData: FormData) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();
    
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Only image files are allowed" };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Image size must be less than 5MB" };
    }

    // Create FormData for PocketBase
    const pbFormData = new FormData();
    pbFormData.append("file", file);
    pbFormData.append("uploaded_by", session?.username || "Unknown");
    
    // Upload to media_uploads collection
    const record = await pb.collection("media_uploads").create(pbFormData);
    
    // Construct URL
    const url = `${process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.rdev.cloud"}/api/files/${record.collectionId}/${record.id}/${record.file}`;
    
    return { success: true, url };
  } catch (error: any) {
    console.error("Error uploading content image:", error);
    return { success: false, error: error.message };
  }
}
