"use server";

import PocketBase from "pocketbase";
import { headers } from "next/headers";

const MAX_INTERACTIONS_PER_MINUTE = 20;

export async function submitInteraction(data: { post: string; type: string; visitor_id: string }) {
  const { post, type, visitor_id } = data;

  if (!post || !type || !visitor_id) {
    return { error: "Missing required fields" };
  }

  // 1. Origin Check (Security)
  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Allow if origin matches OR if referer starts with allowed origin (Server Actions specific)
  // In Server Actions, 'origin' header might be present for POSTs.
  if (origin && origin !== allowedOrigin) {
     console.warn(`Blocked interaction from unauthorized origin: ${origin}`);
     return { error: "Forbidden" };
  }
  
  
  // 2. Initialize PocketBase
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
  const pb = new PocketBase(pbUrl);

  try {
    // Authenticate as Admin to ensure we can filter/search without restriction
    // Credentials taken from scripts/init-schema.mjs as env vars were not available
    await pb.admins.authWithPassword('rifkiokta105@gmail.com', '99585767aA!');

    // 3. Rate Limiting (Simple PB-based)
    // Fetch recent interactions from this visitor
    // We sort by -created to ensure we check the LATEST interactions.
    // We fetch the full object (no 'fields' limit) to avoid 400 errors.
    const recentInteractions = await pb.collection("interactions").getList(1, MAX_INTERACTIONS_PER_MINUTE + 5, {
        filter: `visitor_id="${visitor_id}"`,
        sort: '-created',
    });

    const oneMinuteAgo = Date.now() - 60 * 1000;
    
    // Count how many are within the last minute
    const recentCount = recentInteractions.items.filter(item => {
        return new Date(item.created).getTime() > oneMinuteAgo;
    }).length;

    if (recentCount >= MAX_INTERACTIONS_PER_MINUTE) {
        return { error: "Rate limit exceeded. Please slow down." };
    }

    // 4. Create Interaction
    const record = await pb.collection("interactions").create({
      post,
      type,
      visitor_id,
    });

    return { success: true, id: record.id };
  } catch (err: any) {
    console.error("Interaction error:", err);
    // Return detailed PB error if available
    const errorMessage = err?.data?.message || err?.message || "Failed to record interaction";
    const errorDetails = err?.data?.data ? JSON.stringify(err.data.data) : "";
    return { error: `${errorMessage} ${errorDetails}` };
  }
}
