import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = 
    request.nextUrl.pathname.startsWith('/auth') || 
    request.nextUrl.pathname === '/verify-email' || 
    request.nextUrl.pathname === '/reset-password';
    
  // If trying to access protected page without token, redirect to login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // If trying to access auth page with token, redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    '/verify-email',
    '/reset-password',
  ],
}; 