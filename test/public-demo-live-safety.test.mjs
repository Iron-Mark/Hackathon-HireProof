import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('LinkedIn public demo does not auto-start live paid audits', async () => {
  const source = await fs.readFile(new URL('../app/demo/linkedin/page.tsx', import.meta.url), 'utf8')

  assert.match(source, /LINKEDIN_DEMO_REPORT/)
  assert.match(source, /DEMO_FIXTURES\.highRisk/)
  assert.match(source, /mode:\s*'demo'/)
  assert.match(source, /publiclyListed:\s*false/)
  assert.doesNotMatch(source, /fetch\(['"]\/api\/audit['"]/)
  assert.doesNotMatch(source, /mode:\s*['"]live['"]/)
})

test('public audit route keeps demo mode out of live providers and public storage', async () => {
  const route = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const reportBuilder = await fs.readFile(new URL('../lib/intelligence-v2.ts', import.meta.url), 'utf8')

  assert.match(route, /const demoMode = validated\.mode === 'demo'/)
  assert.match(route, /publicLiveEnabled && !demoMode && hasHireProofModelProvider\(\)/)
  assert.match(route, /Demo mode selected; skipping provider budget checks and live evidence\./)
  assert.match(route, /liveSearchAllowed: liveSearchAllowed && !demoMode/)
  assert.match(route, /externalEvidenceAllowed: !demoMode/)
  assert.match(route, /mode: demoMode \? 'demo' : 'live'/)
  assert.match(route, /source: demoMode \? 'demo' : 'web'/)
  assert.match(route, /publiclyListed: !demoMode && !validated\.image/)
  // Demo reports persist only on an explicit share (publish); they stay publiclyListed:false above,
  // so they remain out of the public (Explore/Trends) listing even when a share link is minted.
  assert.match(route, /if \(!demoMode \|\| validated\.publish\) {\s*await persistReportSafely\(report\)\s*}/)
  assert.doesNotMatch(route, /if \(true\)/)
  assert.match(reportBuilder, /mode\?: AuditReport\['mode'\]/)
  assert.match(reportBuilder, /mode: input\.mode \|\| 'live'/)
})
