import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('audit client does not import the scoring engine into the browser bundle', async () => {
  const source = await fs.readFile(new URL('../app/audit/audit-client.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /from '@\/lib\/intelligence-v2'/)
  assert.doesNotMatch(source, /from '@\/lib\/risk-scorer'/)
  assert.doesNotMatch(source, /from '@\/lib\/audit-signals'/)
})
