import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

async function read(relativePath) {
  return fs.readFile(new URL(relativePath, import.meta.url), 'utf8')
}

async function loadCostGuardModule(env = {}) {
  const source = await read('../lib/provider-cost-guard.ts')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText

  const context = {
    exports: {},
    module: { exports: {} },
    console,
    process: { env },
    Date,
    setTimeout,
    clearTimeout,
    require: (id) => {
      if (id === '@upstash/redis') return { Redis: class {} }
      return {}
    },
  }
  context.exports = context.module.exports
  vm.runInNewContext(compiled, context)
  return context.module.exports
}

test('provider cost guard enforces daily provider limits from env defaults', async () => {
  const {
    checkProviderCostGuard,
    clearProviderCostGuardsForTests,
  } = await loadCostGuardModule({ HIREPROOF_COST_GUARD_MODEL_DAILY_LIMIT: '2' })

  clearProviderCostGuardsForTests()

  const first = await checkProviderCostGuard('model')
  const second = await checkProviderCostGuard('model')
  const third = await checkProviderCostGuard('model')

  assert.equal(first.allowed, true)
  assert.equal(second.allowed, true)
  assert.equal(third.allowed, false)
  assert.equal(third.status.status, 'throttled')
  assert.match(third.status.message, /model/i)
  assert.ok(third.retryAfterSec > 0)
})

test('Google Vision OCR is disabled by public env flag before calling provider', async () => {
  const source = await read('../lib/ocr.mjs')

  assert.match(source, /PUBLIC_GOOGLE_VISION_OCR_ENABLED/)
  assert.match(source, /checkProviderCostGuard\('googleVision'\)/)
  assert.match(source, /Google Vision OCR is disabled/)
})

test('public audit and trends routes gate platform-paid live providers after hackathon', async () => {
  const auditRoute = await read('../app/api/audit/route.ts')
  const trendsRoute = await read('../app/api/intelligence/trends/route.ts')

  assert.match(auditRoute, /PUBLIC_LIVE_AUDIT_ENABLED/)
  assert.match(auditRoute, /checkProviderCostGuard\('model'\)/)
  assert.match(auditRoute, /public live audits are disabled/i)
  assert.match(trendsRoute, /PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED/)
  assert.match(trendsRoute, /checkProviderCostGuard\('serpapi'\)/)
})

test('API live audits can require BYOK and platform SerpApi calls are cost guarded', async () => {
  const apiRoute = await read('../app/api/v1/audit/route.ts')
  const broker = await read('../lib/evidence-broker.ts')

  assert.match(apiRoute, /REQUIRE_BYOK_FOR_LIVE_API/)
  assert.match(apiRoute, /Platform live audit credentials are disabled/)
  assert.match(broker, /checkProviderCostGuard\('serpapi'\)/)
  assert.match(broker, /checkProviderCostGuard\('safeBrowsing'\)/)
})

test('after-hackathon cost safety runbook documents provider controls', async () => {
  const doc = await read('../docs/after-hackathon-cost-safety.md')

  assert.match(doc, /GOOGLE_CLOUD_VISION_API_KEY/)
  assert.match(doc, /PUBLIC_LIVE_AUDIT_ENABLED=false/)
  assert.match(doc, /PUBLIC_GOOGLE_VISION_OCR_ENABLED=false/)
  assert.match(doc, /PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED=false/)
  assert.match(doc, /REQUIRE_BYOK_FOR_LIVE_API=true/)
  assert.match(doc, /SerpApi/i)
  assert.match(doc, /Google Cloud/i)
})

test('public audit UI explains capped live evidence mode after judging', async () => {
  const source = await read('../app/audit/audit-client.tsx')

  assert.match(source, /\/api\/health/)
  assert.match(source, /costPosture/)
  assert.match(source, /Live evidence is capped/)
  assert.match(source, /BYOK/)
})

test('health and developer usage expose provider guard state', async () => {
  const health = await read('../app/api/health/route.ts')
  const usage = await read('../app/api/developer/usage/route.ts')
  const developer = await read('../app/developer/developer-client.tsx')

  assert.match(health, /getProviderCostGuardSnapshot/)
  assert.match(health, /costPosture/)
  assert.match(usage, /providerCostGuards/)
  assert.match(developer, /Provider Guard/)
  assert.match(developer, /providerCostGuards/)
})

test('portfolio case study preserves solo global hackathon positioning', async () => {
  const doc = await read('../docs/portfolio-case-study.md')

  assert.match(doc, /Mark Siazon/)
  assert.match(doc, /solo global hackathon/i)
  assert.match(doc, /one week/i)
  assert.match(doc, /job scam/i)
  assert.match(doc, /https:\/\/hireproof-sigma\.vercel\.app/)
  assert.match(doc, /v1\.0 release/)
})
