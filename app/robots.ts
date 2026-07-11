import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

const PUBLIC_DISALLOW = [
  '/api/',
  '/admin/',
  '/audit/report_',
  '/audit/chat_',
  '/history/',
  '/settings',
  '/pilot/admin',
]

// Retrieval / citation crawlers: allowed on public pages. These fetch a page to answer a live user
// query and cite it with a link back, so they drive referral traffic. Still excluded from sensitive paths.
const AI_RETRIEVAL_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-User',
  'Claude-SearchBot',
]

// Training / scraping crawlers: fully disallowed (they ingest content without driving traffic back).
const AI_TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Bytespider',
  'Google-Extended',
  'Applebot-Extended',
  'Meta-ExternalAgent',
  'FacebookBot',
  'Amazonbot',
  'YouBot',
  'Diffbot',
  'cohere-ai',
  'omgili',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PUBLIC_DISALLOW,
      },
      {
        userAgent: AI_RETRIEVAL_CRAWLERS,
        allow: '/',
        disallow: PUBLIC_DISALLOW,
      },
      ...AI_TRAINING_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
