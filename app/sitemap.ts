import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hireproof.tech'
  const lastModified = new Date()

  const routes = [
    '',
    '/audit',
    '/explore',
    '/lab',
    '/developer',
    '/trends',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
