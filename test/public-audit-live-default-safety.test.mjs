import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('public audit UI defaults to demo fixtures instead of live provider work', async () => {
  const source = await fs.readFile(new URL('../app/audit/audit-client.tsx', import.meta.url), 'utf8')

  assert.match(source, /const \[liveMode, setLiveMode\] = useState\(false\)/)
  assert.match(source, /if \(!liveMode\) \{/)
  assert.match(source, /buildDemoReport\(chooseDemoVerdict\(request\.text\)\)/)
  assert.match(source, /body: JSON\.stringify\(\{ \.\.\.request, mode: liveMode \? 'live' : 'demo' \}\)/)
})

test('public lab stream uses demo mode by default to avoid paid provider work', async () => {
  const source = await fs.readFile(new URL('../app/lab/lab-client.tsx', import.meta.url), 'utf8')

  assert.match(source, /Starting demo audit stream\./)
  assert.match(source, /const request: AuditRequest = \{ text: trimmed, mode: 'demo' \}/)
  assert.match(source, /titleCase\('demo'\)/)
  assert.doesNotMatch(source, /const request: AuditRequest = \{ text: trimmed, mode: 'live' \}/)
})
