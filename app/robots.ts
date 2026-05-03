import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/audit/report_', '/history/'],
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
    sitemap: 'https://hireproof-sigma.vercel.app/sitemap.xml',
  }
}
