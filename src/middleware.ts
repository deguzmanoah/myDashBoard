import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login'];
const publicRoutes = ['/set-password', '/privacy-policy', '/terms-conditions', '/']; // Routes that don't require authentication

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies (more secure than localStorage)
  const token = request.cookies.get('authToken')?.value;
  const isAuthenticated = !!token;
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current route is an auth route (login)
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the current route is public (doesn't require auth)
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect logic
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login if trying to access protected route without auth
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (isAuthRoute && isAuthenticated) {
    // Redirect to dashboard if trying to access login while authenticated
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow public routes to pass through regardless of auth status
  if (isPublicRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except static files and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|icons).*)',
  ],
};
