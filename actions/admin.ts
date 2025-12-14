"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signAdminToken, getAdminCookieName, getAdminSession } from '@/lib/admin-auth';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function loginAdmin(username: string, password: string) {
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return { success: false, error: 'Invalid credentials' };
  }

  const token = await signAdminToken(username);
  const cookieStore = await cookies();
  
  cookieStore.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return { success: true };
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
