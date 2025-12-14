"use server";

import PocketBase from 'pocketbase';
import bcrypt from 'bcryptjs';
import { getAdminSession } from '@/lib/admin-auth';
import { logAdminAction } from './admin-logs';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.rdev.cloud');

async function authenticatePocketBase() {
  const email = process.env.PB_ADMIN_EMAIL;
  const pass = process.env.PB_ADMIN_PASS;
  if (email && pass) {
    await pb.admins.authWithPassword(email, pass);
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    await authenticatePocketBase();

    // Get current admin
    const admin = await pb.collection('cms_admins').getFirstListItem(`username="${session.username}"`);
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pb.collection('cms_admins').update(admin.id, { password_hash });
    await logAdminAction('Change Password', 'Changed own password');

    return { success: true };
  } catch (error: any) {
    console.error('Change password error:', error.message);
    return { success: false, error: 'Failed to change password' };
  }
}

// Admin CRUD
export async function getAdmins() {
  try {
    await authenticatePocketBase();
    const result = await pb.collection('cms_admins').getList(1, 100);
    return { 
      success: true, 
      admins: result.items.map((a: any) => ({ id: a.id, username: a.username, role: a.role || 'user' })) 
    };
  } catch (error: any) {
    console.error('Get admins error:', error.message);
    return { success: false, error: error.message, admins: [] };
  }
}

export async function createAdmin(username: string, password: string, role: 'admin' | 'user' = 'user') {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    await authenticatePocketBase();

    // Check if username exists
    try {
      await pb.collection('cms_admins').getFirstListItem(`username="${username}"`);
      return { success: false, error: 'Username already exists' };
    } catch {
      // Username doesn't exist, proceed
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    await pb.collection('cms_admins').create({ username, password_hash, role });
    await logAdminAction('Create Admin', `Created admin: ${username} with role: ${role}`);
    return { success: true };
  } catch (error: any) {
    console.error('Create admin error:', error.message);
    return { success: false, error: 'Failed to create admin' };
  }
}

export async function deleteAdmin(id: string) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    await authenticatePocketBase();

    // Get admin to check if it's the current user
    const admin = await pb.collection('cms_admins').getOne(id);
    if (admin.username === session.username) {
      return { success: false, error: 'Cannot delete your own account' };
    }

    await pb.collection('cms_admins').delete(id);
    await logAdminAction('Delete Admin', `Deleted admin: ${admin.username}`);
    return { success: true };
  } catch (error: any) {
    console.error('Delete admin error:', error.message);
    return { success: false, error: 'Failed to delete admin' };
  }
}

export async function getAdminById(id: string) {
  try {
    await authenticatePocketBase();
    const admin = await pb.collection('cms_admins').getOne(id);
    return { 
      success: true, 
      admin: { id: admin.id, username: admin.username, role: admin.role || 'user', created: admin.created_at, updated: admin.updated_at } 
    };
  } catch (error: any) {
    console.error('Get admin error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateAdminRole(id: string, role: 'admin' | 'user') {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'Admin access required' };
    }

    await authenticatePocketBase();
    
    // Get admin to update
    const targetAdmin = await pb.collection('cms_admins').getOne(id);
    
    await pb.collection('cms_admins').update(id, { role });
    await logAdminAction('Update Admin Role', `Changed ${targetAdmin.username} role to: ${role}`);
    return { success: true };
  } catch (error: any) {
    console.error('Update admin role error:', error.message);
    return { success: false, error: 'Failed to update role' };
  }
}

export async function updateAdminPassword(id: string, newPassword: string) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    await authenticatePocketBase();

    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await pb.collection('cms_admins').update(id, { password_hash });
    await logAdminAction('Update Admin Password', `Updated password for admin ID: ${id}`);
    return { success: true };
  } catch (error: any) {
    console.error('Update admin password error:', error.message);
    return { success: false, error: 'Failed to update password' };
  }
}

export async function updateAdminUsername(id: string, newUsername: string) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    await authenticatePocketBase();

    // Check if username exists
    try {
      const existing = await pb.collection('cms_admins').getFirstListItem(`username="${newUsername}"`);
      if (existing.id !== id) {
        return { success: false, error: 'Username already exists' };
      }
    } catch {
      // Username doesn't exist, proceed
    }

    await pb.collection('cms_admins').update(id, { username: newUsername });
    await logAdminAction('Update Admin Username', `Updated username for admin ID: ${id} to ${newUsername}`);
    return { success: true };
  } catch (error: any) {
    console.error('Update admin username error:', error.message);
    return { success: false, error: 'Failed to update username' };
  }
}

