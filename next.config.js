/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa'

/**
 * Next.js configuration
 *
 * Note:
 * - This file is CommonJS because Next.js traditionally evaluates next.config.js in a Node (CJS) context.
 * - The "require" of next-pwa is valid here; ESLint should treat this file as a Node/CJS config.
 *   If your ESLint config flags this, mark this file as env: { node: true } or ignore it via overrides.
 */
const nextConfig = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  // Enable static export for Capacitor
  output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : undefined,

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
})

export default nextConfig
