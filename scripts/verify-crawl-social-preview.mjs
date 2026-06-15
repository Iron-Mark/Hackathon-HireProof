import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index]
  if (!arg.startsWith('--')) continue
  const key = arg.slice(2)
  const next = process.argv[index + 1]
  if (next && !next.startsWith('--')) {
    args.set(key, next)
    index += 1
  } else {
    args.set(key, 'true')
  }
}

const baseUrl = (
  args.get('url') ||
  process.env.HIREPROOF_CRAWL_BASE_URL ||
  process.env.HIREPROOF_PROOF_BASE_URL ||
  'https://hireproof.tech'
).replace(/\/$/, '')
const outputDir = args.get('out') || process.env.HIREPROOF_CRAWL_OUTPUT_DIR || path.join('artifacts', 'seo-crawl-preview')
const canonicalOrigin = 'https://hireproof.tech'

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function fetchText(route) {
  const url = `${baseUrl}${route}`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'HireProof-CrawlSocialProof/1.0',
    },
  })
  const body = await response.text()
  return {
    route,
    url,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type') || '',
    body,
  }
}

function findMeta(content, attribute, key) {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${key}["'][^>]*>`, 'i')
  const match = content.match(pattern)?.[0]
  if (!match) return ''
  return match.match(/content=["']([^"']+)["']/i)?.[1] || ''
}

function hasAll(value, patterns) {
  return patterns.every((pattern) => pattern.test(value))
}

function pass(name, ok, evidence) {
  return { name, pass: Boolean(ok), evidence }
}

const robots = await fetchText('/robots.txt')
const sitemap = await fetchText('/sitemap.xml')
const home = await fetchText('/')

const robotsChecks = [
  pass('robots status 200', robots.ok, `${robots.status} ${robots.contentType}`),
  pass('robots exposes sitemap', /Sitemap:\s*https:\/\/hireproof\.tech\/sitemap\.xml/i.test(robots.body), 'Sitemap: https://hireproof.tech/sitemap.xml'),
  pass('robots blocks API crawl', /Disallow:\s*\/api\//i.test(robots.body), 'Disallow: /api/'),
  pass('robots blocks private history', /Disallow:\s*\/history\//i.test(robots.body), 'Disallow: /history/'),
]

const sitemapLocs = [...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
const sitemapChecks = [
  pass('sitemap status 200', sitemap.ok, `${sitemap.status} ${sitemap.contentType}`),
  pass('sitemap urlset present', /<urlset[\s>]/i.test(sitemap.body), '<urlset>'),
  pass('sitemap uses canonical origin only', sitemapLocs.length > 0 && sitemapLocs.every((loc) => loc.startsWith(`${canonicalOrigin}/`) || loc === canonicalOrigin), sitemapLocs.slice(0, 8)),
  pass('sitemap includes public routes', ['/', '/audit', '/proof', '/docs'].every((route) => sitemapLocs.includes(route === '/' ? `${canonicalOrigin}/` : `${canonicalOrigin}${route}`)), sitemapLocs.filter((loc) => /\/(audit|proof|docs)?$/.test(loc))),
  pass('sitemap excludes private routes', !sitemap.body.includes('/pilot/admin') && !sitemap.body.includes('/settings') && !sitemap.body.includes('/history/'), 'private routes absent'),
]

const socialTags = {
  ogTitle: findMeta(home.body, 'property', 'og:title'),
  ogDescription: findMeta(home.body, 'property', 'og:description'),
  ogImage: findMeta(home.body, 'property', 'og:image'),
  ogUrl: findMeta(home.body, 'property', 'og:url'),
  ogType: findMeta(home.body, 'property', 'og:type'),
  twitterCard: findMeta(home.body, 'name', 'twitter:card'),
  twitterTitle: findMeta(home.body, 'name', 'twitter:title'),
  twitterDescription: findMeta(home.body, 'name', 'twitter:description'),
  twitterImage: findMeta(home.body, 'name', 'twitter:image'),
}

const socialChecks = [
  pass('home status 200', home.ok, `${home.status} ${home.contentType}`),
  pass('open graph tags present', hasAll(JSON.stringify(socialTags), [/ogTitle.+HireProof/i, /ogDescription.+Paste a job post/i, /ogImage.+og-image/i, /ogUrl.+hireproof\.tech/i, /ogType.+website/i]), socialTags),
  pass('twitter tags present', hasAll(JSON.stringify(socialTags), [/twitterCard.+summary_large_image/i, /twitterTitle.+HireProof/i, /twitterDescription.+Paste a job post/i, /twitterImage.+og-image/i]), socialTags),
]

const checks = [...robotsChecks, ...sitemapChecks, ...socialChecks]
const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  canonicalOrigin,
  routes: {
    robots: robots.url,
    sitemap: sitemap.url,
    home: home.url,
  },
  socialTags,
  checks,
  pass: checks.every((check) => check.pass),
}

await mkdir(outputDir, { recursive: true })
const outputPath = path.join(outputDir, `hireproof-crawl-social-${stamp()}.json`)
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(path.join(outputDir, 'hireproof-crawl-social-latest.json'), `${JSON.stringify(summary, null, 2)}\n`)

for (const check of checks) {
  console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}`)
}
console.log(`Report: ${outputPath}`)

if (!summary.pass) {
  process.exitCode = 1
}
