import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hireproof.vercel.app'
  
  // Define main pages
  const routes = [
    '',
    '/audit',
    '/history',
    '/docs',
    '/docs/quickstart',
    '/docs/architecture',
    '/docs/api-reference',
    '/docs/chrome-extension',
    '/docs/headless-api',
    '/docs/investigation-engine',
    '/docs/mcp',
    '/docs/omni-modal',
    '/docs/rate-limiting',
    '/docs/risk-scoring',
    '/docs/sdk',
    '/docs/sdk-quickstart',
    '/docs/streaming',
    '/docs/webhooks',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
