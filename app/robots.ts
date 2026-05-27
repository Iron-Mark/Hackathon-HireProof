import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/audit/report_',
          '/audit/chat_',
          '/history/',
          '/settings',
          '/pilot/admin',
        ],
      },
      ...[
        'GPTBot',
        'ChatGPT-User',
        'OAI-SearchBot',
        'ClaudeBot',
        'anthropic-ai',
        'PerplexityBot',
        'Perplexity-User',
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
      ].map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
