import { NextResponse } from 'next/server';

// In-memory rate limiting (shifts to Redis when needed)
const IP_THROTTLE_MAP = new Map();
const EMAIL_THROTTLE_MAP = new Map();

export function middleware(request) {
    // Get real IP address
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1';

    // For auth endpoints
    if (request.nextUrl.pathname.includes('/api/auth')) {
        const now = Date.now();
        const ipData = IP_THROTTLE_MAP.get(ip) || { count: 0, timestamp: now };

        // Reset after 1 hour
        if (now - ipData.timestamp > 3600000) {
            ipData.count = 0;
            ipData.timestamp = now;
        }

        // Allow 10 auth requests per hour per IP
        if (ipData.count > 10) {
            return new NextResponse(
                JSON.stringify({ error: 'Too many requests, please try again later' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '3600'
                    }
                }
            );
        }

        ipData.count++;
        IP_THROTTLE_MAP.set(ip, ipData);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/auth/:path*']
};