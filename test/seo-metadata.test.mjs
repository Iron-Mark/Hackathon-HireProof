import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'

test('SEO source of truth uses canonical HireProof domain and public sitemap coverage', async () => {
  const seo = await fs.readFile(new URL('../lib/seo.ts', import.meta.url), 'utf8')
  const sitemap = await fs.readFile(new URL('../app/sitemap.ts', import.meta.url), 'utf8')
  const robots = await fs.readFile(new URL('../app/robots.ts', import.meta.url), 'utf8')

  assert.match(seo, /SITE_URL = 'https:\/\/hireproof\.tech'/)
  assert.match(seo, /PUBLIC_SITEMAP_ENTRIES/)
  assert.match(seo, /\/docs\/api-reference/)
  assert.match(seo, /\/docs\/security/)
  assert.doesNotMatch(seo, /\/pilot\/admin/)
  assert.match(sitemap, /PUBLIC_SITEMAP_ENTRIES/)
  assert.match(sitemap, /absoluteUrl\(entry\.path\)/)
  assert.match(robots, /\/pilot\/admin/)
  assert.match(robots, /\/api\//)
  assert.match(robots, /host: SITE_URL/)
})

test('root metadata exposes rich search and social graph without page-specific breadcrumb leakage', async () => {
  const layout = await fs.readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8')
  const home = await fs.readFile(new URL('../app/page.tsx', import.meta.url), 'utf8')
  const seo = await fs.readFile(new URL('../lib/seo.ts', import.meta.url), 'utf8')

  assert.match(layout, /applicationName: SITE_NAME/)
  assert.match(layout, /authors: \[\{ name: SITE_AUTHOR, url: 'https:\/\/marksiazon\.dev' \}\]/)
  assert.match(layout, /creator: SITE_AUTHOR/)
  assert.match(layout, /formatDetection/)
  assert.match(layout, /buildSiteJsonLd/)
  assert.doesNotMatch(layout, /BreadcrumbList/)
  assert.match(seo, /SITE_AUTHOR = 'Mark Siazon'/)
  assert.match(seo, /'@type': 'Person'/)
  assert.match(seo, /Solo developer and creator of HireProof/)
  assert.match(seo, /'@type': 'Organization'/)
  assert.match(seo, /'@type': 'WebSite'/)
  assert.match(seo, /'@type': 'SoftwareApplication'/)
  assert.match(seo, /SearchAction/)
  assert.match(home, /alternates:\s*{\s*canonical: canonicalFor\('\/'\)/)
  assert.equal(home.includes("defaultOpenGraph('/',"), true)
})

test('top-level public pages use shared page metadata for canonical and social tags', async () => {
  for (const page of [
    '../app/audit/page.tsx',
    '../app/explore/page.tsx',
    '../app/trends/page.tsx',
    '../app/pricing/page.tsx',
    '../app/pilot/page.tsx',
    '../app/proof/page.tsx',
    '../app/portfolio/page.tsx',
    '../app/developer/page.tsx',
    '../app/lab/page.tsx',
  ]) {
    const source = await fs.readFile(new URL(page, import.meta.url), 'utf8')
    assert.match(source, /pageMetadata/)
    assert.match(source, /path: '\//)
  }
})

test('private and demo-only client routes expose noindex metadata through layouts', async () => {
  for (const layout of [
    '../app/settings/layout.tsx',
    '../app/history/layout.tsx',
    '../app/pilot/admin/layout.tsx',
    '../app/demo/linkedin/layout.tsx',
  ]) {
    const source = await fs.readFile(new URL(layout, import.meta.url), 'utf8')
    assert.match(source, /privatePageMetadata/)
  }

  const seo = await fs.readFile(new URL('../lib/seo.ts', import.meta.url), 'utf8')
  assert.match(seo, /index: false/)
  assert.match(seo, /follow: false/)
  assert.match(seo, /noimageindex: true/)
})

test('web manifest has install, discovery, icon, shortcut, and screenshot metadata', async () => {
  const manifest = JSON.parse(await fs.readFile(new URL('../public/manifest.json', import.meta.url), 'utf8'))

  assert.equal(manifest.id, '/')
  assert.equal(manifest.scope, '/')
  assert.equal(manifest.lang, 'en-US')
  assert.equal(manifest.orientation, 'portrait-primary')
  assert.ok(manifest.categories.includes('business'))
  assert.ok(manifest.icons.some((icon) => icon.purpose.includes('maskable')))
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === '/audit'))
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === '/explore'))
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === '/docs'))
  assert.ok(manifest.screenshots.some((screenshot) => screenshot.src === '/og-image.png'))
})
