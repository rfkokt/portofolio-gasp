import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = process.env.ADMIN_SECRET;

if (!secret) {
  throw new Error('ADMIN_SECRET environment variable is not set');
}

const ADMIN_SECRET = new TextEncoder().encode(secret);

const COOKIE_NAME = 'admin_session';

export type AdminRole = 'admin' | 'user';

export interface AdminSession {
  username: string;
  role: AdminRole;
}

export async function signAdminToken(username: string, role: AdminRole = 'user'): Promise<string> {
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(ADMIN_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET);
    return { 
      username: payload.username as string,
      role: (payload.role as AdminRole) || 'user'
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

export function isAdmin(session: AdminSession | null): boolean {
  return session?.role === 'admin';
}

