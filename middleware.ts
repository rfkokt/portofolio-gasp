import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET || 'super-secret-admin-key-change-in-production'
);

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

