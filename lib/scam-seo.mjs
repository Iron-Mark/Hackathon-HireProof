import { SCAM_PATTERNS } from './scam-patterns.mjs'

const SITE_URL = 'https://hireproof.tech'
const abs = (path) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

/**
 * Article + FAQPage JSON-LD for a scam-pattern hub page.
 * @param {import('./scam-patterns').ScamPattern} pattern
 */
export function buildScamPatternJsonLd(pattern) {
  const url = abs(`/scams/${pattern.slug}`)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: pattern.searchTitle,
        description: pattern.metaDescription,
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'HireProof', url: SITE_URL },
        publisher: { '@type': 'Organization', name: 'HireProof', url: SITE_URL },
        inLanguage: 'en-US',
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: pattern.faq.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  }
}

/**
 * Sitemap entries for the /scams index and every pattern page, derived from the registry.
 * Returned shape matches SitemapEntry in lib/seo.ts.
 * @returns {Array<{ path: string, changeFrequency: import('next').MetadataRoute.Sitemap[number]['changeFrequency'], priority: number }>}
 */
export function scamSitemapEntries() {
  return [
    { path: '/scams', changeFrequency: /** @type {const} */ ('monthly'), priority: 0.8 },
    ...SCAM_PATTERNS.map((p) => ({
      path: `/scams/${p.slug}`,
      changeFrequency: /** @type {const} */ ('monthly'),
      priority: 0.75,
    })),
  ]
}
