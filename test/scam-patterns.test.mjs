import test from 'node:test'
import assert from 'node:assert/strict'
import { SCAM_PATTERNS, getScamPattern, scamPatternSlugs } from '../lib/scam-patterns.mjs'

test('registry has >= 8 patterns with unique kebab-case slugs', () => {
  assert.ok(SCAM_PATTERNS.length >= 8)
  const slugs = SCAM_PATTERNS.map((p) => p.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/)
})

test('every pattern has complete, non-empty content', () => {
  for (const p of SCAM_PATTERNS) {
    for (const f of ['name', 'searchTitle', 'metaDescription', 'summary']) {
      assert.ok(typeof p[f] === 'string' && p[f].trim().length > 0, `${p.slug}.${f}`)
    }
    assert.ok(p.metaDescription.length <= 160, `${p.slug} metaDescription too long (${p.metaDescription.length})`)
    for (const f of ['aka', 'howItWorks', 'redFlags', 'whatToDo']) {
      assert.ok(Array.isArray(p[f]) && p[f].length > 0, `${p.slug}.${f}`)
      for (const item of p[f]) assert.ok(typeof item === 'string' && item.trim().length > 0, `${p.slug}.${f} item`)
    }
    assert.ok(Array.isArray(p.faq) && p.faq.length >= 3, `${p.slug}.faq`)
    for (const qa of p.faq) {
      assert.ok(qa.question?.trim() && qa.answer?.trim(), `${p.slug} faq entry`)
    }
  }
})

test('relatedSlugs resolve and helpers behave', () => {
  const known = new Set(scamPatternSlugs())
  for (const p of SCAM_PATTERNS) {
    for (const r of p.relatedSlugs) assert.ok(known.has(r), `${p.slug} -> ${r}`)
    assert.notEqual(getScamPattern(p.slug), undefined)
  }
  assert.equal(getScamPattern('does-not-exist'), undefined)
  assert.deepEqual([...known].sort(), SCAM_PATTERNS.map((p) => p.slug).sort())
})
