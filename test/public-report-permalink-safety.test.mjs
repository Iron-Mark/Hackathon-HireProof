import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { sanitizeAuditPermalinkReport } from '../lib/public-report-view.mjs'

function chatReport() {
  return {
    id: 'chat_1777783246596',
    verdict: 'high-risk',
    riskScore: 95,
    confidence: 'High',
    summary: 'POC private chat report',
    extractedClaims: {
      company: 'Unknown / Not Verifiable',
      role: 'Remote Assistant',
      location: 'Remote',
      contactMethod: 'Telegram',
    },
    redFlags: ['Telegram-only contact'],
    greenFlags: [],
    evidence: [],
    alternatives: [],
    nextSteps: ['Do not send money.'],
    timestamp: '2026-05-19T00:00:00.000Z',
    mode: 'demo',
    source: 'chat',
    publiclyListed: false,
    chatPlatform: 'telegram',
    chatThreadId: 'telegram:private-thread-SECRET-12345',
    chatChannelId: 'telegram:channel-SECRET-67890',
  }
}

test('audit permalinks strip chat adapter metadata before client rendering', async () => {
  const page = await fs.readFile(new URL('../app/audit/[id]/page.tsx', import.meta.url), 'utf8')
  const sanitized = sanitizeAuditPermalinkReport(chatReport())
  const serialized = JSON.stringify(sanitized)

  assert.match(page, /sanitizeAuditPermalinkReport/)
  assert.equal(sanitized.id, 'chat_1777783246596')
  assert.equal(sanitized.summary, 'POC private chat report')
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, 'chatPlatform'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, 'chatThreadId'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, 'chatChannelId'), false)
  assert.doesNotMatch(serialized, /private-thread-SECRET|channel-SECRET|chatThreadId|chatChannelId|chatPlatform/)
})

test('audit permalinks reject legacy timestamp chat ids', async () => {
  const page = await fs.readFile(new URL('../app/audit/[id]/page.tsx', import.meta.url), 'utf8')
  const idHelper = await fs.readFile(new URL('../lib/public-report-id.ts', import.meta.url), 'utf8')

  assert.match(page, /isPublicReportId\(safeId\)/)
  assert.match(idHelper, /chat_\[0-9a-f\]\{8\}/)
  assert.doesNotMatch(idHelper, /chat_\[a-zA-Z0-9_-\]\+/)
  assert.doesNotMatch(idHelper, /chat_\[0-9\]\+/)
})
