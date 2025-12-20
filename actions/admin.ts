"use server";

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signAdminToken, getAdminCookieName, getAdminSession, AdminRole } from '@/lib/admin-auth';
// plain PocketBase import removed
import bcrypt from 'bcryptjs';
import { logAdminAction } from './admin-logs';

// Augment global type for throttling
declare global {
  var loginAttempts: Map<string, { count: number, firstAttempt: number }> | undefined;
}

import { createAdminClient } from '@/lib/pb-client';

// Removed global pb
// Removed global pb autoCancellation


// Removed authenticatePocketBase helper

export async function loginAdmin(username: string, password: string) {
  try {
    // Rate Limit Check
    const ip = (await headers()).get("x-forwarded-for") || "unknown";
    const rateLimitKey = `${ip}:${username}`;
    
    // Simple in-memory rate limit (resets on server restart/redeploy)
    // In production (serverless), use Redis/Upstash. For Docker/VPS, this works per-instance.
    if (!global.loginAttempts) global.loginAttempts = new Map();
    
    const attempts = global.loginAttempts.get(rateLimitKey) || { count: 0, firstAttempt: Date.now() };
    
    // Reset if window passed (15 minutes)
    if (Date.now() - attempts.firstAttempt > 15 * 60 * 1000) {
      attempts.count = 0;
      attempts.firstAttempt = Date.now();
    }
    
    if (attempts.count >= 5) {
      // Log failed attempt due to rate limit
      console.warn(`[Security] Rate limit exceeded for ${username} from ${ip}`);
      return { success: false, error: 'Too many login attempts. Please try again later.' };
    }

    const pb = await createAdminClient();

    // Find admin by username
    const admin = await pb.collection('cms_admins').getFirstListItem(`username="${username}"`);
    
    if (!admin) {
        // Increment rate limit on failure
        attempts.count++;
        global.loginAttempts.set(rateLimitKey, attempts);
        return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValid) {
      // Increment rate limit on failure
      attempts.count++;
      global.loginAttempts.set(rateLimitKey, attempts);
      return { success: false, error: 'Invalid credentials' };
    }

    // On success, clear rate limit
    global.loginAttempts.delete(rateLimitKey);

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

