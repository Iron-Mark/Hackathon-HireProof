import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'

test('icon-only audit header link keeps an accessible name on small screens', async () => {
  const header = await fs.readFile(new URL('../components/layout/site-header.tsx', import.meta.url), 'utf8')
  const auditLinkMatch = header.match(/<Link\s+[^>]*href="\/audit"[\s\S]*?<\/Link>/)

  assert.ok(auditLinkMatch, 'expected to find the /audit header link')

  const auditLink = auditLinkMatch[0]

  assert.match(auditLink, /aria-label="Audit"/)
  assert.match(auditLink, /<SearchCheck[^>]*aria-hidden="true"/)
  assert.match(auditLink, /<span[^>]*className="hidden sm:inline"[^>]*>Audit<\/span>/)
})
