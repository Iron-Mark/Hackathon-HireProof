import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('SerpApi news reputation keeps negative evidence company-specific', async () => {
  const source = await fs.readFile(new URL('../lib/serpapi.ts', import.meta.url), 'utf8')

  assert.match(source, /isCompanySpecificNewsResult/)
  assert.match(source, /companyTokens/)
  assert.match(source, /news_results\.filter\(.*isCompanySpecificNewsResult/s)
})

test('live audit routes ensure direct SerpApi coverage after agent execution', async () => {
  const uiRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const apiRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')

  for (const source of [uiRoute, apiRoute]) {
    assert.match(source, /ensureSerpApiEvidenceCoverage/)
    assert.match(source, /searchCompanyPresence/)
    assert.match(source, /searchNewsReputation/)
    assert.match(source, /searchComparableJobs/)
    assert.match(source, /searchLocalPresence/)
  }
})
