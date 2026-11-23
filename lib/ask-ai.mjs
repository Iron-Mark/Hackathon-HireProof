// @ts-check

/** Public origin already published as HireProof metadataBase. */
export const PUBLIC_ORIGIN = 'https://hireproof.tech'

export const ASK_AI_LABEL = 'Ask your AI'

/** @typedef {'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'grok'} AskAiProviderId */

/**
 * @typedef {object} AskAiProvider
 * @property {AskAiProviderId} id
 * @property {string} name
 * @property {string} href
 * @property {string} lightSrc
 * @property {string} darkSrc
 */

/** @type {readonly AskAiProvider[]} */
export const ASK_AI_PROVIDERS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    href: 'https://chatgpt.com/',
    lightSrc: '/images/platforms/ask-chatgpt.png',
    darkSrc: '/images/platforms/ask-chatgpt-dark.png',
  },
  {
    id: 'claude',
    name: 'Claude',
    href: 'https://claude.ai/new',
    lightSrc: '/images/platforms/ask-claude.png',
    darkSrc: '/images/platforms/ask-claude-dark.png',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    href: 'https://gemini.google.com/app',
    lightSrc: '/images/platforms/ask-google.png',
    darkSrc: '/images/platforms/ask-google-dark.png',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    href: 'https://www.perplexity.ai/search',
    lightSrc: '/images/platforms/ask-perplexity.png',
    darkSrc: '/images/platforms/ask-perplexity-dark.png',
  },
  {
    id: 'grok',
    name: 'Grok',
    href: 'https://grok.com/',
    lightSrc: '/images/platforms/ask-grok.png',
    darkSrc: '/images/platforms/ask-grok-dark.png',
  },
]

const EXACT_PATHS = new Set(['/', '/portfolio', '/pricing', '/pilot'])

/** @param {string | null | undefined} pathname */
export function normalizePath(pathname) {
  if (typeof pathname !== 'string' || pathname.length === 0) return '/'
  const withoutSuffix = pathname.split('?')[0].split('#')[0] || '/'
  const withSlash = withoutSuffix.startsWith('/') ? withoutSuffix : `/${withoutSuffix}`
  if (withSlash.length > 1 && withSlash.endsWith('/')) return withSlash.slice(0, -1)
  return withSlash
}

/** @param {string | null | undefined} pathname */
export function showAskAiRow(pathname) {
  if (typeof pathname !== 'string' || pathname.length === 0) return false
  const path = normalizePath(pathname)
  if (path === '/docs' || path.startsWith('/docs/')) return true
  return EXACT_PATHS.has(path)
}

/** @param {string} path */
function publicPageUrl(path) {
  const url = new URL(path, PUBLIC_ORIGIN)
  url.search = ''
  url.hash = ''
  return url.toString()
}

/**
 * Use the canonical href this page already published when its path matches.
 * Otherwise cite the public origin plus the current path. Search and hash are removed.
 * @param {string | null | undefined} canonicalAttribute
 * @param {string | null | undefined} pathname
 */
export function citePublishedCanonical(canonicalAttribute, pathname) {
  const path = normalizePath(pathname)
  const fallback = publicPageUrl(path)
  const raw = typeof canonicalAttribute === 'string' ? canonicalAttribute.trim() : ''
  if (!raw) return fallback
  try {
    const absolute = new URL(raw, PUBLIC_ORIGIN)
    if (absolute.protocol !== 'https:' && absolute.protocol !== 'http:') return fallback
    absolute.search = ''
    absolute.hash = ''
    if (normalizePath(absolute.pathname) !== path) return fallback
    return absolute.toString()
  } catch {
    return fallback
  }
}

/**
 * Fixed prompt plus the page title and clean canonical URL.
 * @param {string} title
 * @param {string} canonicalUrl
 */
export function buildAskAiPrompt(title, canonicalUrl) {
  const pageTitle = String(title || 'HireProof').replace(/\s+/g, ' ').trim() || 'HireProof'
  return `As a job seeker, I want to understand how HireProof can help me check a suspicious job post before I apply or share any personal details, so I know whether to go further. I want to know what I can look for, and I am asking about the public page rather than handing you a job to judge. Summarize the highlights from "${pageTitle}": ${canonicalUrl} Don't give me HireProof's verdict, and don't include a job post I paste in.`
}

/**
 * @param {string} providerHref
 * @param {string} prompt
 */
export function buildAskAiHref(providerHref, prompt) {
  const url = new URL(providerHref)
  url.searchParams.set('q', prompt)
  return url.toString()
}
