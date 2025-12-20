import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = process.env.ADMIN_SECRET;

if (!secret) {
  console.error('ADMIN_SECRET is missing in middleware');
  // Just warn in middleware to avoid crashing the whole edge runtime instantly on start/build if env is weird, 
  // but keeping it secure (undefined secret won't verify valid tokens signed with a real secret).
  // However, `jose` might throw if secret is empty.
}

const ADMIN_SECRET = new TextEncoder().encode(secret || '');

// Routes that require admin role
const ADMIN_ONLY_ROUTES = ['/cms/admins'];

export async function middleware(request: NextRequest) {
  // Only protect /cms routes
  if (request.nextUrl.pathname.startsWith('/cms')) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    try {
      const { payload } = await jwtVerify(token, ADMIN_SECRET);
      
      // Check admin-only routes
      const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some(route => 
        request.nextUrl.pathname.startsWith(route)
      );
      
      if (isAdminOnlyRoute && payload.role !== 'admin') {
        // Non-admin trying to access admin-only route
        return NextResponse.redirect(new URL('/cms', request.url));
      }
      
      return NextResponse.next();
    } catch {
      // Invalid token, redirect to 404
      const response = NextResponse.redirect(new URL('/404', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/cms/:path*',
};

