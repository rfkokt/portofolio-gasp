import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET || 'super-secret-admin-key-change-in-production'
);

export async function middleware(request: NextRequest) {
  // Only protect /cms routes
  if (request.nextUrl.pathname.startsWith('/cms')) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      await jwtVerify(token, ADMIN_SECRET);
      return NextResponse.next();
    } catch {
      // Invalid token, redirect to home
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/cms/:path*',
};
