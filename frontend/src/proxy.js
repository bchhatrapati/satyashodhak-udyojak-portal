import { NextResponse } from 'next/server';

export function proxy(request) {
  // 1. Retrieve the secure access token from browser cookies
  const token = request.cookies.get('access_token')?.value;

  // 2. Validate token: must exist and meet a minimum length (robustness check)
  const hasToken = Boolean(token && token.length > 10);

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith("/login");

  // 3. Unauthorized Access: If no token, force redirect to Login
  if (!hasToken && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // 4. Redundant Access: If already logged in, skip Login and go to Dashboard
  if (hasToken && isLoginPage) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    return NextResponse.redirect(dashboardUrl);
  }

  // 5. Allow authorized request to proceed
  return NextResponse.next();
}

/** 
 * MATCHER CONFIGURATION:
 * Protects all routes except internal Next.js files, API routes, and static assets.
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};