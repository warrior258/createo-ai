import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getCurrentUser } from './app/utils/auth';

export async function middleware(request: NextRequest) {
    
    // Get the pathname
    const { pathname } = request.nextUrl;
    console.log(`\n--- Middleware triggered for: ${pathname} ---`);

    
    
    // // Allow access to the root path
    // if (pathname === '/') {
    //     return NextResponse.next();
    // }
    
    // // Also allow access to authentication-related routes
    // if (pathname.startsWith('/api/google-auth') || 
    //     pathname === '/login' || 
    //     pathname === '/auth/error') {
    //     return NextResponse.next();
    // }

    const currentUser = await getCurrentUser();

    const publicPaths = ['/', '/auth/error', '/api/google-auth'];
    if (publicPaths.includes(pathname) || pathname.startsWith('/api/google-auth')) {
        if(currentUser){
            // return NextResponse.redirect(new URL('/dashboard', request.url));
        }else{
            return NextResponse.next();
        }
    }
    
    // Check for auth token on all other routes
    const token = request.cookies.get('auth_token')?.value;
    console.log('Token exists:', !!token);
    
    if (!token) {
        return NextResponse.redirect(new URL('/', request.url));
    }
    
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret, {
            algorithms: ['HS256']
        });
        console.log("Token verified for:", pathname);
        console.log(payload)
        return NextResponse.next();
    } catch (error) {
        console.log("error", error);
        // Token is invalid or expired
        console.error("JWT verification failed:", error);
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('auth_token');
        return response;
    }
}


export const config = {
    matcher: [
      /*
       * Match all request paths except for the ones starting with:
       * - api/auth (API routes) 
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       * - login (auth page)
       */
      '/',
      '/((?!api/auth|_next/static|_next/image|favicon.ico|login|$).*)',
    ],
  };