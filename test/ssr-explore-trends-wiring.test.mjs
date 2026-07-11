import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const read = (rel) => fs.readFile(new URL(rel, import.meta.url), 'utf8')

test('/explore is server-rendered from selectPublicReports and passes initial props', async () => {
  const page = await read('../app/explore/page.tsx')
  assert.match(page, /selectPublicReports\(await listReports\(200\)/)
  assert.match(page, /initialReports=\{reports\}/)
  assert.match(page, /initialTotal=\{total\}/)
  assert.match(page, /export const dynamic = 'force-dynamic'/)
})

test('ExploreClient seeds from initial props and skips the mount fetch', async () => {
  const client = await read('../app/explore/explore-client.tsx')
  assert.match(client, /initialReports\s*=\s*\[\]/)
  assert.match(client, /initialTotal\s*=\s*0/)
  assert.match(client, /useState<AuditReport\[\]>\(initialReports\)/)
  assert.match(client, /useState\(initialTotal\)/)
  // first-run guard prevents an immediate refetch of the SSR-provided default list
  assert.match(client, /isFirstRun/)
})

test('/trends is server-rendered from getReportTrends and passes initialStats (stored-audits only)', async () => {
  const page = await read('../app/trends/page.tsx')
  assert.match(page, /await getReportTrends\(\)/)
  assert.match(page, /initialStats=\{initialStats\}/)
  assert.match(page, /mode: 'stored-audits'/)
  assert.match(page, /export const dynamic = 'force-dynamic'/)
})

test('TrendsClient renders from initialStats with no client-side trends fetch', async () => {
  const client = await read('../app/trends/trends-client.tsx')
  assert.match(client, /initialStats/)
  assert.doesNotMatch(client, /fetch\('\/api\/intelligence\/trends'\)/)
})
