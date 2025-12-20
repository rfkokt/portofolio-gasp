"use server";

// plain PocketBase import removed
import { getAdminSession } from '@/lib/admin-auth';

import { createAdminClient } from '@/lib/pb-client';

// Removed global pb
// Global admin action logger
// Uses createAdminClient inside logAdminAction to ensure fresh authenticated instance if needed.
// Note: We might want logAdminAction to accept an existing pb client to re-use connection if performance is key,
// but for safety and simplicity, we'll instantiate it or use the one from scope if passed (refactor needed).
// For now, let's keep it simple: logAdminAction creates its own client or we pass it? 
// Actually, creating a new client recursively might be bad if we are identifying by session. 
// But logAdminAction takes `action` and `details`. It gets session internally.

// Ideally logAdminAction should be lightweight.

export async function logAdminAction(action: string, details?: string) {
  try {
    const session = await getAdminSession();
    if (!session) return;

    const pb = await createAdminClient();

    // Get admin ID
    const admin = await pb.collection('cms_admins').getFirstListItem(`username="${session.username}"`);

    await pb.collection('admin_logs').create({
      admin_id: admin.id,
      admin_username: session.username,
      action,
      details: details || '',
      ip_address: '', // Could be passed from headers if needed
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

export async function getAdminLogs(adminId?: string, limit: number = 50) {
  try {
    const pb = await createAdminClient();

    const result = await pb.collection('admin_logs').getList(1, limit);

    // Filter client-side if adminId provided
    const filteredItems = adminId 
      ? result.items.filter((log: any) => log.admin_id === adminId)
      : result.items;

    return {
      success: true,
      logs: filteredItems.map((log: any) => ({
        id: log.id,
        admin_id: log.admin_id,
        admin_username: log.admin_username,
        action: log.action,
        details: log.details,
        created: log.created_at || '',
      })),
    };
  } catch (error: any) {
    console.error('Failed to get admin logs:', error.message);
    return { success: false, error: error.message, logs: [] };
  }
}
