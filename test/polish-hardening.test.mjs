import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { buildLegalAbuseReportMailto, buildTrendsJsonExport } from '../lib/report-actions.mjs'
import { pruneRecordsByTimestamp } from '../lib/local-data-retention.mjs'

test('legal abuse mailto uses lowercase extracted claim keys', () => {
  const href = buildLegalAbuseReportMailto({
    extractedClaims: {
      company: 'Apex Careers',
      role: 'Remote Frontend Intern',
      Company: 'WRONG COMPANY',
      Role: 'WRONG ROLE',
    },
    redFlags: ['Telegram-only contact'],
  })
  const decoded = decodeURIComponent(href)

  assert.match(decoded, /Apex Careers/)
  assert.match(decoded, /Remote Frontend Intern/)
  assert.doesNotMatch(decoded, /WRONG COMPANY/)
  assert.doesNotMatch(decoded, /WRONG ROLE/)
})

test('trends export is explicitly JSON and returns serializable content', async () => {
  const source = await fs.readFile(new URL('../app/trends/trends-client.tsx', import.meta.url), 'utf8')
  const exportPayload = buildTrendsJsonExport({
    totalReports: 1,
    verdicts: { safe: 0, caution: 0, 'high-risk': 1 },
  })

  assert.match(source, /Export trends JSON/)
  assert.equal(exportPayload.mimeType, 'application/json')
  assert.match(exportPayload.filename, /^hireproof-trends-\d{4}-\d{2}-\d{2}\.json$/)
  assert.equal(JSON.parse(exportPayload.content).totalReports, 1)
})

test('chrome extension docs only claim local install until store listing exists', async () => {
  const source = await fs.readFile(new URL('../app/docs/chrome-extension/page.tsx', import.meta.url), 'utf8')

  assert.match(source, /load it locally/i)
  assert.doesNotMatch(source, /Chrome Web Store/)
})

test('public README keeps export and extension claims honest', async () => {
  const source = await fs.readFile(new URL('../README.md', import.meta.url), 'utf8')
  const pricing = await fs.readFile(new URL('../app/pricing/page.tsx', import.meta.url), 'utf8')

  assert.match(source, /PNG Screenshot Export/)
  assert.match(source, /local install/i)
  assert.doesNotMatch(source, /PDF Dossier Export/)
  assert.doesNotMatch(source, /Chrome Extension.*scan any webpage from the browser toolbar/)
  assert.match(pricing, /local extension/)
  assert.match(pricing, /PDF\/CSV planned/)
  assert.doesNotMatch(pricing, /PDF\/CSV\/JSON/)
})

test('verified badge docs require DNS TXT ownership and public tokens', async () => {
  const source = await fs.readFile(new URL('../app/docs/verified-badge/page.tsx', import.meta.url), 'utf8')

  assert.match(source, /DNS TXT/i)
  assert.match(source, /public token/i)
  assert.match(source, /does not expose API keys/i)
  assert.doesNotMatch(source, /https:\/\/hireproof\.com\/js\/badge\.js/)
})

test('research 03 action plan exists as active execution roadmap', async () => {
  const source = await fs.readFile(new URL('../docs/hireproof-action-plan.md', import.meta.url), 'utf8')
  const index = await fs.readFile(new URL('../docs/README.md', import.meta.url), 'utf8')

  assert.match(source, /P0 - Demo Credibility Cleanup/)
  assert.match(source, /implemented and credential-gated/)
  assert.match(index, /hireproof-action-plan\.md/)
})

test('local JSON retention prunes old and excess records deterministically', () => {
  const now = new Date('2026-04-30T00:00:00.000Z')
  const records = [
    { id: 'fresh', createdAt: '2026-04-29T00:00:00.000Z' },
    { id: 'middle', createdAt: '2026-04-20T00:00:00.000Z' },
    { id: 'old', createdAt: '2026-03-01T00:00:00.000Z' },
  ]

  assert.deepEqual(
    pruneRecordsByTimestamp(records, { now, maxAgeDays: 30, maxRecords: 1, timestampKey: 'createdAt' }),
    [{ id: 'fresh', createdAt: '2026-04-29T00:00:00.000Z' }],
  )
})
