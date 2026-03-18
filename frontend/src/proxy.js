// src/proxy.js
import { NextResponse } from 'next/server';

// Extract JWT logic into a safe helper function to keep the proxy clean
function parseJwt(token) {
  try {
    // A valid JWT strictly has 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decodedJson = atob(payloadBase64);
    return JSON.parse(decodedJson);
  } catch (error) {
    // If decoding fails (malformed token), fail closed by returning null
    return null;
  }
}

export function proxy(request) {
  // 1. Retrieve the token
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith("/login");

  // 2. Parse payload and check expiration
  const payload = token ? parseJwt(token) : null;
  
  // JWT exp claim is in seconds, Date.now() is in milliseconds
  const isTokenValid = payload && payload.exp && (payload.exp * 1000 > Date.now());

  // 3. Unauthorized Access: No token, malformed token, or expired token
  if (!isTokenValid) {
    if (!isLoginPage) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      
      // Optional Enterprise Touch: Append the intended destination so they 
      // can be redirected back there after a successful login
      loginUrl.searchParams.set("redirect", pathname);
      
      return NextResponse.redirect(loginUrl);
    }
    // Allow them to stay on the login page
    return NextResponse.next(); 
  }

  // 4. Redundant Access: Valid, unexpired token trying to access Login
  if (isTokenValid && isLoginPage) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

/** * MATCHER CONFIGURATION:
 * Protects all routes except internal Next.js files, API routes, and static assets.
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};