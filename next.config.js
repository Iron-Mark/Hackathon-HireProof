const { withWorkflow } = require('workflow/next')

const optionalZlibSyncStub = './lib/optional-zlib-sync-stub.js'
const optionalZlibSyncWebpackStub = require.resolve('./lib/optional-zlib-sync-stub.js')
const swcInteropRequireDefaultCjs = require.resolve(
  '@swc/helpers/cjs/_interop_require_default.cjs',
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent information disclosure about the tech stack
  poweredByHeader: false,
  // Security headers for all responses
  async redirects() {
    return [
      { source: '/about', destination: '/portfolio', permanent: true },
      { source: '/about-us', destination: '/portfolio', permanent: true },
      { source: '/team', destination: '/portfolio', permanent: true },
      { source: '/help', destination: '/docs', permanent: true },
      { source: '/support', destination: '/docs', permanent: true },
      { source: '/reach-us', destination: '/pilot', permanent: true },
      { source: '/get-in-touch', destination: '/pilot', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Force HTTPS (HSTS)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // XSS protection for older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Cross-Origin Opener Policy (COOP)
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // Permissions policy
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          // Content Security Policy
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com; frame-src 'none'; frame-ancestors 'none'; object-src 'none';" },
        ],
      },
      {
        // API-specific CORS and cache headers
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
  // Don't expose server-side errors in production
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['@cursor/sdk'],
  // Standalone is for Docker self-hosting; on Vercel it can omit proxy deps from the bundle.
  output: process.env.VERCEL ? undefined : 'standalone',
  // Proxy/middleware is compiled to ESM @swc/helpers imports; NFT only traced CJS by default.
  outputFileTracingIncludes: {
    '/*': ['./node_modules/@swc/helpers/esm/**/*'],
  },
  turbopack: {
    resolveAlias: {
      'zlib-sync': optionalZlibSyncStub,
      '@swc/helpers/esm/_interop_require_default.js': swcInteropRequireDefaultCjs,
    },
    // @cursor/sdk bundles ship index.js.LICENSE.txt sidecars; treat as raw text.
    rules: {
      '*.LICENSE.txt': {
        type: 'raw',
      },
    },
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      'zlib-sync': optionalZlibSyncWebpackStub,
      '@swc/helpers/esm/_interop_require_default.js': swcInteropRequireDefaultCjs,
    }
    return config
  },
}

module.exports = withWorkflow(nextConfig, {
  workflows: {
    lazyDiscovery: true,
  },
})
