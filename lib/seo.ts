import { statSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata, MetadataRoute } from 'next'
import { scamSitemapEntries } from '@/lib/scam-seo.mjs'

export { buildScamPatternJsonLd, scamSitemapEntries } from '@/lib/scam-seo.mjs'

export const SITE_URL = 'https://hireproof.tech'
export const SITE_NAME = 'HireProof'
export const SITE_AUTHOR = 'Mark Siazon'
export const AUTHOR_PROFILE_URL = 'https://marksiazon.dev'
export const DEFAULT_OG_IMAGE = '/og-image.png'
export const DEFAULT_TITLE = 'HireProof | Verify Job Posts Before Applying'
export const DEFAULT_DESCRIPTION =
  'Paste a job post, recruiter message, job URL, or screenshot. HireProof checks claims with evidence and returns a Safe, Caution, or High-Risk verdict before you apply.'

export const PORTFOLIO_CASE_STUDY_PUBLISHED_AT = '2026-05-19'
export const PORTFOLIO_CASE_STUDY_SOURCE_PATH = join(process.cwd(), 'app', 'portfolio', 'page.tsx')
export const PORTFOLIO_CASE_STUDY_MODIFIED_AT = (() => {
  try {
    return statSync(PORTFOLIO_CASE_STUDY_SOURCE_PATH).mtime.toISOString().split('T')[0]
  } catch {
    return PORTFOLIO_CASE_STUDY_PUBLISHED_AT
  }
})()
export const PORTFOLIO_CASE_STUDY_KEYWORDS =
  'Mark Siazon, HireProof portfolio case study, job post verification, employment safety, AI audit, anti-fraud tooling'

export const SEO_KEYWORDS = [
  'job scam detector',
  'job post verification',
  'recruitment scam',
  'employment fraud',
  'fake job offer',
  'remote job scam',
  'recruiter verification',
  'job fraud prevention',
  'AI job verification',
  'candidate safety',
]

type SitemapEntry = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

export const PUBLIC_SITEMAP_ENTRIES: SitemapEntry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/audit', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/explore', changeFrequency: 'daily', priority: 0.86 },
  { path: '/trends', changeFrequency: 'daily', priority: 0.84 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.78 },
  { path: '/pilot', changeFrequency: 'monthly', priority: 0.76 },
  { path: '/proof', changeFrequency: 'monthly', priority: 0.72 },
  { path: '/portfolio', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/lab', changeFrequency: 'monthly', priority: 0.64 },
  { path: '/developer', changeFrequency: 'monthly', priority: 0.62 },
  { path: '/docs', changeFrequency: 'weekly', priority: 0.82 },
  { path: '/docs/how-it-works', changeFrequency: 'monthly', priority: 0.76 },
  { path: '/docs/use-cases', changeFrequency: 'monthly', priority: 0.74 },
  { path: '/docs/quickstart', changeFrequency: 'monthly', priority: 0.72 },
  { path: '/docs/self-hosting', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/docs/pilot', changeFrequency: 'monthly', priority: 0.68 },
  { path: '/docs/verified-badge', changeFrequency: 'monthly', priority: 0.66 },
  { path: '/docs/investigation-engine', changeFrequency: 'monthly', priority: 0.74 },
  { path: '/docs/omni-modal', changeFrequency: 'monthly', priority: 0.64 },
  { path: '/docs/risk-scoring', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/docs/streaming', changeFrequency: 'monthly', priority: 0.62 },
  { path: '/docs/api-reference', changeFrequency: 'monthly', priority: 0.72 },
  { path: '/docs/authentication', changeFrequency: 'monthly', priority: 0.64 },
  { path: '/docs/rate-limiting', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/docs/security', changeFrequency: 'monthly', priority: 0.66 },
  { path: '/docs/headless-api', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/docs/mcp', changeFrequency: 'monthly', priority: 0.68 },
  { path: '/docs/webhooks', changeFrequency: 'monthly', priority: 0.66 },
  { path: '/docs/sdk', changeFrequency: 'monthly', priority: 0.66 },
  { path: '/docs/sdk-quickstart', changeFrequency: 'monthly', priority: 0.64 },
  { path: '/docs/cli', changeFrequency: 'monthly', priority: 0.66 },
  { path: '/docs/automations', changeFrequency: 'monthly', priority: 0.64 },
  { path: '/docs/langchain', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/docs/chrome-extension', changeFrequency: 'monthly', priority: 0.62 },
  { path: '/docs/email-forwarding', changeFrequency: 'monthly', priority: 0.58 },
  { path: '/docs/slack-bot', changeFrequency: 'monthly', priority: 0.58 },
  { path: '/docs/discord-bot', changeFrequency: 'monthly', priority: 0.58 },
  { path: '/docs/telegram-bot', changeFrequency: 'monthly', priority: 0.58 },
  { path: '/docs/architecture', changeFrequency: 'monthly', priority: 0.62 },
  { path: '/docs/triple-track-coverage', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/docs/competitive-roadmap', changeFrequency: 'monthly', priority: 0.58 },
  { path: '/docs/dead-internet', changeFrequency: 'monthly', priority: 0.56 },
  { path: '/docs/legal', changeFrequency: 'yearly', priority: 0.48 },
  ...scamSitemapEntries(),
]

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function canonicalFor(path = '/') {
  return path === '/' ? '/' : path
}

export function defaultOpenGraph(path = '/', title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION) {
  return {
    title,
    description,
    url: absoluteUrl(path),
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'HireProof job post verification report preview',
      },
    ],
    locale: 'en_US',
    type: 'website' as const,
  }
}

export function pageMetadata({
  path,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  keywords,
  index = true,
}: {
  path: string
  title: string
  description: string
  image?: string
  keywords?: string | string[]
  index?: boolean
}): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalFor(path),
    },
    openGraph: {
      ...defaultOpenGraph(path, title, description),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - ${title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@hireproof',
    },
    robots: index
      ? {
          index: true,
          follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        }
      : {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        },
  }
}

export function privatePageMetadata(title: string, description: string): Metadata {
  return pageMetadata({
    path: '/',
    title,
    description,
    index: false,
  })
}

export function buildSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl('/apple-touch-icon.png'),
        founder: { '@id': `${SITE_URL}/#mark-siazon` },
        sameAs: ['https://github.com/Iron-Mark/Hackathon-HireProof'],
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#mark-siazon`,
        name: SITE_AUTHOR,
        url: AUTHOR_PROFILE_URL,
        jobTitle: 'Solo developer and creator of HireProof',
        sameAs: [
          'https://github.com/Iron-Mark/hackathon-v0-zero_to_agent',
          'https://www.linkedin.com/in/mark-siazon/',
          AUTHOR_PROFILE_URL,
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en-US',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/explore?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/#software`,
        name: SITE_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, Chrome',
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  }
}

export function buildPortfolioCaseStudyJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${SITE_URL}/portfolio#case-study`,
    headline: 'HireProof Portfolio Case Study',
    name: 'HireProof Portfolio Case Study by Mark Siazon',
    url: `${SITE_URL}/portfolio`,
    inLanguage: 'en-US',
    datePublished: PORTFOLIO_CASE_STUDY_PUBLISHED_AT,
    dateModified: PORTFOLIO_CASE_STUDY_MODIFIED_AT,
    keywords: PORTFOLIO_CASE_STUDY_KEYWORDS,
    description: 'A solo-developed HireProof portfolio case study by Mark Siazon.',
    image: {
      '@type': 'ImageObject',
      url: absoluteUrl('/social/github-social-preview-1280x640.png'),
      width: 1280,
      height: 640,
      caption: 'HireProof case study visual and product evidence',
    },
    mainEntityOfPage: `${SITE_URL}/portfolio`,
    author: {
      '@type': 'Person',
      '@id': `${SITE_URL}/#mark-siazon`,
      name: SITE_AUTHOR,
      url: AUTHOR_PROFILE_URL,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
    },
    about: {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
    },
  }
}
