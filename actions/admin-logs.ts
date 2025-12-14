"use server";

import PocketBase from 'pocketbase';
import { getAdminSession } from '@/lib/admin-auth';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.rdev.cloud');

async function authenticatePocketBase() {
  const email = process.env.PB_ADMIN_EMAIL;
  const pass = process.env.PB_ADMIN_PASS;
  if (email && pass) {
    await pb.admins.authWithPassword(email, pass);
  }
}

export async function logAdminAction(action: string, details?: string) {
  try {
    const session = await getAdminSession();
    if (!session) return;

    await authenticatePocketBase();

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
    await authenticatePocketBase();

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
