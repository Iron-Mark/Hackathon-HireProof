import test from 'node:test'
import assert from 'node:assert/strict'
import { selectPublicReports } from '../lib/public-intelligence-reports.mjs'

const mk = (over) => ({
  id: over.id,
  version: '2',
  intelligence: { coverage: {}, companyIdentity: { status: 'unknown', evidenceIds: [] } },
  verdict: over.verdict,
  summary: over.summary || '',
  riskScore: over.riskScore ?? 50,
  confidence: over.confidence || 'Medium',
  mode: over.mode || 'live',
  source: over.source || 'web',
  publiclyListed: over.publiclyListed ?? true,
  image: over.image,
  extractedClaims: {
    company: over.company || '',
    role: over.role || '',
    location: over.location || '',
    contactMethod: over.contactMethod || '',
  },
  redFlags: over.redFlags || [],
  greenFlags: [],
  evidence: [],
  alternatives: [],
  nextSteps: [],
  timestamp: over.timestamp || '2026-07-01T00:00:00.000Z',
})

test('selectPublicReports filters public, applies query+verdict, returns total and sliced sanitized reports', () => {
  const raw = [
    mk({ id: 'a', verdict: 'high-risk', company: 'Acme Freight', role: 'Courier', redFlags: ['Off-platform contact'] }),
    mk({ id: 'b', verdict: 'safe', company: 'Globex', role: 'Engineer' }),
    mk({ id: 'c', verdict: 'high-risk', company: 'Acme Labs', role: 'Analyst' }),
    mk({ id: 'd', verdict: 'high-risk', company: 'Hidden Co', role: 'Mule', mode: 'demo' }),
  ]

  const all = selectPublicReports(raw, {})
  assert.ok(all.total >= 3, 'public reports counted')
  assert.ok(!all.reports.some((r) => r.id === 'd'), 'demo report excluded by public filter')

  const acme = selectPublicReports(raw, { query: 'acme' })
  assert.equal(acme.total, 2, 'query matches company haystack')

  const acmeHighRisk = selectPublicReports(raw, { query: 'acme', verdict: 'high-risk' })
  assert.equal(acmeHighRisk.total, 2)

  const acmeSafe = selectPublicReports(raw, { query: 'acme', verdict: 'safe' })
  assert.equal(acmeSafe.total, 0, 'verdict filter applied')

  const limited = selectPublicReports(raw, { limit: 1 })
  assert.equal(limited.reports.length, 1, 'limit slices reports')
  assert.ok(limited.total >= limited.reports.length, 'total is the full filtered count, not the sliced length')

  const shape = all.reports[0]
  assert.ok('verdict' in shape && 'extractedClaims' in shape && 'redFlags' in shape, 'reports are sanitized report shape')
})
