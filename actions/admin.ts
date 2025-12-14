"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signAdminToken, getAdminCookieName, getAdminSession, AdminRole } from '@/lib/admin-auth';
import PocketBase from 'pocketbase';
import bcrypt from 'bcryptjs';
import { logAdminAction } from './admin-logs';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.rdev.cloud');

async function authenticatePocketBase() {
  const email = process.env.PB_ADMIN_EMAIL;
  const pass = process.env.PB_ADMIN_PASS;
  if (email && pass) {
    await pb.admins.authWithPassword(email, pass);
  }
}

export async function loginAdmin(username: string, password: string) {
  try {
    await authenticatePocketBase();

    // Find admin by username
    const admin = await pb.collection('cms_admins').getFirstListItem(`username="${username}"`);
    
    if (!admin) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Get role from database (default to 'user' if not set)
    const role: AdminRole = admin.role === 'admin' ? 'admin' : 'user';

    // Create JWT token with role
    const token = await signAdminToken(username, role);
    const cookieStore = await cookies();
    
    cookieStore.set(getAdminCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Log the login (need to do this after setting cookie so session is available)
    // We'll log it inline since logAdminAction requires session
    try {
      const adminRecord = await pb.collection('cms_admins').getFirstListItem(`username="${username}"`);
      await pb.collection('admin_logs').create({
        admin_id: adminRecord.id,
        admin_username: username,
        action: 'Login',
        details: 'Admin logged in',
        ip_address: '',
      });
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error.message);
    return { success: false, error: 'Invalid credentials' };
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(getAdminCookieName());
  redirect('/');
}

export async function checkAdminAuth() {
  const session = await getAdminSession();
  return { authenticated: !!session, username: session?.username };
}

