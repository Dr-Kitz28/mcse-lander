/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    // Prevent browsers from incorrectly detecting non-scripts as scripts
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    // Block pages from being embedded in iframes (clickjacking)
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    // Block XSS attacks
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    // Enforce HTTPS
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    // Control browser features
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    // Prevent MIME type sniffing
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
        ];
    },
}

export default nextConfig;
