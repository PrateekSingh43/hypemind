import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('hypemind_refresh')?.value;
  const isLoggedInSignal = request.cookies.get('hm_logged_in')?.value;

  const hasAuth = !!refreshToken || !!isLoggedInSignal;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/verify-email') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password');

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

  // If user is trying to access dashboard but has no auth indicator, send to login
  if (!hasAuth && isDashboardRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Only redirect to dashboard if they are on the LOGIN page specifically and have auth
  // This prevents the loop where an expired session keeps bouncing back
  if (hasAuth && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/verify-email',
    '/forgot-password',
    '/reset-password'
  ],
};
