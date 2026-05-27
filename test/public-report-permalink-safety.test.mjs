import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { sanitizeAuditPermalinkReport } from '../lib/public-report-view.mjs'

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dir)
    if (entry.isDirectory()) return listFiles(fullPath)
    return [fullPath]
  }))
  return files.flat()
}

function chatReport() {
  return {
    id: 'chat_6f97f79a-92f0-4b54-8b1a-bc2ec9d5e7d1',
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
  assert.equal(sanitized.id, 'chat_6f97f79a-92f0-4b54-8b1a-bc2ec9d5e7d1')
  assert.equal(sanitized.summary, 'POC private chat report')
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, 'chatPlatform'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, 'chatThreadId'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(sanitized, 'chatChannelId'), false)
  assert.doesNotMatch(serialized, /private-thread-SECRET|channel-SECRET|chatThreadId|chatChannelId|chatPlatform/)
})

test('audit permalinks reject legacy timestamp report and chat ids', async () => {
  const page = await fs.readFile(new URL('../app/audit/[id]/page.tsx', import.meta.url), 'utf8')
  const idHelper = await fs.readFile(new URL('../lib/public-report-id.ts', import.meta.url), 'utf8')

  assert.match(page, /isPublicReportId\(safeId\)/)
  assert.match(idHelper, /\^\(report\|chat\)_\[0-9a-f\]\{8\}/)
  assert.doesNotMatch(idHelper, /chat_\[a-zA-Z0-9_-\]\+/)
  assert.doesNotMatch(idHelper, /chat_\[0-9\]\+/)
  assert.doesNotMatch(idHelper, /report_\[a-zA-Z0-9_-\]\+/)
  assert.doesNotMatch(idHelper, /report_\[0-9\]\+/)
})

test('public docs and proof artifacts do not publish timestamp-style report permalinks', async () => {
  const roots = [
    new URL('../README.md', import.meta.url),
    new URL('../docs/', import.meta.url),
    new URL('../app/docs/', import.meta.url),
  ]
  const files = []
  for (const root of roots) {
    if (root.pathname.endsWith('/')) files.push(...await listFiles(root))
    else files.push(root)
  }

  for (const file of files) {
    if (!/\.(md|mdx|tsx|json)$/i.test(file.pathname)) continue
    const source = await fs.readFile(file, 'utf8')
    assert.doesNotMatch(source, /\b(?:report|chat)_\d{10,}\b/, file.pathname)
  }
})
