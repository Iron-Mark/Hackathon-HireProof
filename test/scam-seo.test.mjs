import test from 'node:test'
import assert from 'node:assert/strict'
import { SCAM_PATTERNS } from '../lib/scam-patterns.mjs'
import { buildScamPatternJsonLd, scamSitemapEntries } from '../lib/scam-seo.mjs'

test('JSON-LD has Article + FAQPage with matching FAQ count and absolute urls', () => {
  const p = SCAM_PATTERNS[0]
  const ld = buildScamPatternJsonLd(p)
  const graph = ld['@graph']
  const article = graph.find((n) => n['@type'] === 'Article')
  const faq = graph.find((n) => n['@type'] === 'FAQPage')
  assert.ok(article, 'Article node present')
  assert.ok(faq, 'FAQPage node present')
  assert.equal(faq.mainEntity.length, p.faq.length)
  assert.match(article.mainEntityOfPage, /^https:\/\/hireproof\.tech\/scams\//)
  assert.equal(article.headline, p.searchTitle)
})

test('sitemap entries include /scams and every pattern url', () => {
  const entries = scamSitemapEntries()
  const paths = entries.map((e) => e.path)
  assert.ok(paths.includes('/scams'))
  for (const p of SCAM_PATTERNS) assert.ok(paths.includes(`/scams/${p.slug}`), p.slug)
  for (const e of entries) {
    assert.ok(typeof e.priority === 'number' && e.priority > 0)
    assert.ok(typeof e.changeFrequency === 'string')
  }
})
