import { NextResponse } from 'next/server';

export default async function middleware(req) {
    // Get the pathname
    const path = req.nextUrl.pathname;

    // Get the token from cookies
    const token = req.cookies.get('token')?.value;
    const accountType = req.cookies.get('accountType')?.value;

    // Company routes protection
    if (path.startsWith('/company/') && path !== '/company/login') {
        // If no token, redirect to company login
        if (!token || accountType !== 'company') {
            return NextResponse.redirect(new URL('/company/login', req.url));
        }
    }

    // Admin routes protection
    if (path.startsWith('/adm/')) {
        // Check for admin login
        if (!token || accountType !== 'admin') {
            return NextResponse.redirect(new URL('/adm', req.url));
        }
    }

    // Continue with the request
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Add routes that need protection
        '/company/:path*',
        '/adm/:path*'
    ],
};