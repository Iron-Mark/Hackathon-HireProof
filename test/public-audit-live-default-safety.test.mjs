import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('public audit default runs the zero-spend server demo path, not a client-side fixture', async () => {
  const source = await fs.readFile(new URL('../app/audit/audit-client.tsx', import.meta.url), 'utf8')

  // Default mode is the free deterministic path.
  assert.match(source, /const \[liveMode, setLiveMode\] = useState\(false\)/)
  // Every submission posts to the server; default (liveMode=false) => mode:'demo' (no paid providers).
  assert.match(source, /body: JSON\.stringify\(\{ \.\.\.request, mode: liveMode \? 'live' : 'demo' \}\)/)
  // The fabricated client-side fixture short-circuit is gone: real text is always analyzed.
  assert.doesNotMatch(source, /if \(!liveMode\) \{/)
  assert.doesNotMatch(source, /chooseDemoVerdict/)
})

test('public lab stream uses demo mode by default to avoid paid provider work', async () => {
  const source = await fs.readFile(new URL('../app/lab/lab-client.tsx', import.meta.url), 'utf8')

  assert.match(source, /Starting demo audit stream\./)
  assert.match(source, /const request: AuditRequest = \{ text: trimmed, mode: 'demo' \}/)
  assert.match(source, /titleCase\('demo'\)/)
  assert.doesNotMatch(source, /const request: AuditRequest = \{ text: trimmed, mode: 'live' \}/)
})
