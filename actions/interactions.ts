"use server";

import PocketBase from "pocketbase";

const MAX_INTERACTIONS_PER_MINUTE = 20;

export async function submitInteraction(data: { post: string; type: string; visitor_id: string }) {
  try {
    const { post, type, visitor_id } = data;

    if (!post || !type || !visitor_id) {
      return { error: "Missing required fields" };
    }
    
    // 2. Initialize PocketBase
    // HARDCODED REMOTE URL TO PREVENT ENV VAR ISSUES
    // We expect PB_URL to be set, but if not, fallback to the known Domain.
    const pbUrl = process.env.PB_URL || "https://pocketbase.rdev.cloud";
    const pb = new PocketBase(pbUrl);
    pb.autoCancellation(false); // Disable auto-cancellation

    // Authenticate as Admin
    const email = process.env.PB_ADMIN_EMAIL!;
    const pass = process.env.PB_ADMIN_PASS!;
    
    if (!email || !pass) {
        console.error("Missing PB_ADMIN_EMAIL or PB_ADMIN_PASS env vars");
        return { error: "Server Configuration Error" };
    }
    
    await pb.admins.authWithPassword(email, pass);

    // 3. Rate Limiting (Simple PB-based)
    // Fetch recent interactions from this visitor
    const recentInteractions = await pb.collection("interactions").getList(1, MAX_INTERACTIONS_PER_MINUTE + 5, {
        filter: `visitor_id="${visitor_id}"`,
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
    console.error("CRITICAL ACTION ERROR:", err);
    // Return safe error to client
    
    const errorMessage = err?.data?.message || err?.message || "Internal Server Error";
    return { error: `Server Error: ${errorMessage}` };
  }
}

export async function submitProjectInteraction(data: { project: string; type: string; visitor_id: string }) {
  try {
    const { project, type, visitor_id } = data;

    if (!project || !type || !visitor_id) {
      return { error: "Missing required fields" };
    }
    
    const pbUrl = process.env.PB_URL || "https://pocketbase.rdev.cloud";
    const pb = new PocketBase(pbUrl);
    pb.autoCancellation(false);

    // Authenticate as Admin
    const email = process.env.PB_ADMIN_EMAIL!;
    const pass = process.env.PB_ADMIN_PASS!;
    
    if (!email || !pass) {
        console.error("Missing PB_ADMIN_EMAIL or PB_ADMIN_PASS env vars");
        return { error: "Server Configuration Error" };
    }
    
    await pb.admins.authWithPassword(email, pass);

    // Rate Limiting
    const recentInteractions = await pb.collection("project_interactions").getList(1, MAX_INTERACTIONS_PER_MINUTE + 5, {
        filter: `visitor_id="${visitor_id}"`,
    });

    const oneMinuteAgo = Date.now() - 60 * 1000;
    
    const recentCount = recentInteractions.items.filter(item => {
        return new Date(item.created).getTime() > oneMinuteAgo;
    }).length;

    if (recentCount >= MAX_INTERACTIONS_PER_MINUTE) {
        return { error: "Rate limit exceeded. Please slow down." };
    }

    // Create Interaction
    const record = await pb.collection("project_interactions").create({
      project,
      type,
      visitor_id,
    });

    return { success: true, id: record.id };
  } catch (err: any) {
    console.error("CRITICAL PROJECT ACTION ERROR:", err);
    
    const errorMessage = err?.data?.message || err?.message || "Internal Server Error";
    return { error: `Server Error: ${errorMessage}` };
  }
}
