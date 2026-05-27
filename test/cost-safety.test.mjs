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
  const providerCostGuard = await read('../lib/provider-cost-guard.ts')

  assert.match(auditRoute, /PUBLIC_LIVE_AUDIT_ENABLED/)
  assert.match(auditRoute, /checkProviderCostGuard\('model'\)/)
  assert.match(auditRoute, /public live audits are disabled/i)
  assert.match(trendsRoute, /PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED/)
  assert.match(trendsRoute, /process\.env\.PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED === 'true'/)
  assert.match(trendsRoute, /checkRateLimit\(`public_trends:\$\{requestIp\(request\)\}`/)
  assert.match(trendsRoute, /checkProviderCostGuard\('serpapi'\)/)
  assert.match(providerCostGuard, /publicTrendsExternalSignalsEnabled:\s*process\.env\.PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED === 'true'/)
})

test('API live audits can require BYOK and platform SerpApi calls are cost guarded', async () => {
  const apiRoute = await read('../app/api/v1/audit/route.ts')
  const broker = await read('../lib/evidence-broker.ts')

  assert.match(apiRoute, /REQUIRE_BYOK_FOR_LIVE_API/)
  assert.match(apiRoute, /Platform live audit credentials are disabled/)
  assert.match(broker, /checkProviderCostGuard\('serpapi'\)/)
  assert.match(broker, /checkProviderCostGuard\('safeBrowsing'\)/)
})

test('public demo API key is not accepted for protected provider-backed surfaces', async () => {
  const authStore = await read('../lib/auth-store.ts')
  const apiRoute = await read('../app/api/v1/audit/route.ts')
  const mcpRoute = await read('../app/api/mcp/route.ts')
  const skill = await read('../.agents/skills/hireproof/SKILL.md')
  const skillsDocs = await read('../app/docs/skills/skills-client.tsx')
  const mcpDocs = await read('../app/docs/mcp/page.tsx')
  const appAutomationDocs = await read('../app/docs/automations/page.tsx')
  const apiReferenceDocs = await read('../app/docs/api-reference/page.tsx')
  const headlessDocs = await read('../app/docs/headless-api/page.tsx')
  const docsOverview = await read('../app/docs/page.tsx')
  const quickstartDocs = await read('../app/docs/quickstart/page.tsx')
  const selfHostingDocs = await read('../app/docs/self-hosting/page.tsx')
  const authDocs = await read('../app/docs/authentication/page.tsx')
  const cliDocs = await read('../app/docs/cli/page.tsx')
  const automationDocs = await read('../docs/automation-integrations.md')
  const marketplaceRunbook = await read('../docs/automation-marketplace-submission.md')
  const releaseRunbook = await read('../docs/external-release-runbook.md')
  const proofArchive = await read('../docs/demo/proof-archive.md')
  const apiPlayground = await read('../components/docs/api-playground.tsx')
  const commandMenu = await read('../components/layout/command-menu.tsx')
  const rootSkills = await read('../SKILLS.md')
  const curlDownload = await read('../public/downloads/hireproof-automation-curl.sh')
  const langchainDownload = await read('../public/downloads/hireproof-langchain-tool.ts')
  const langchainPackage = await read('../packages/hireproof-langchain/dist/index.js')
  const langchainPackageTypes = await read('../packages/hireproof-langchain/dist/index.d.ts')
  const cliPackage = await read('../packages/hireproof-cli/bin/hireproof.mjs')
  const makeDownload = await read('../public/downloads/hireproof-make-http-config.json')
  const n8nDownload = await read('../public/downloads/hireproof-n8n-workflow.json')
  const dockerSmoke = await read('../scripts/smoke-docker.mjs')
  const integrationValidator = await read('../scripts/validate-integrations.mjs')
  const chromeStoreAssets = await read('../scripts/generate-chrome-store-assets.mjs')
  const envExample = await read('../.env.example')
  const extensionPopup = await read('../extension/popup.html')
  const readme = await read('../README.md')

  assert.doesNotMatch(authStore, /return PUBLIC_DEMO_API_KEY/)
  assert.match(authStore, /configuredKey !== PUBLIC_DEMO_API_KEY/)
  assert.doesNotMatch(apiRoute, /publicDemoFallback/)
  assert.doesNotMatch(mcpRoute, /publicDemoFallback/)
  assert.match(mcpRoute, /checkRateLimit\(`mcp:api_key:\$\{apiAuth\.apiKeyId\}`/)
  assert.doesNotMatch(mcpRoute, /checkRateLimit\(`mcp_\$\{apiKey\}`/)

  for (const source of [skill, skillsDocs, mcpDocs]) {
    assert.doesNotMatch(source, /hireproof-sigma\.vercel\.app/)
    assert.doesNotMatch(source, /"url":\s*"https:\/\/hireproof\.tech\/api\/mcp"[\s\S]{0,180}"x-api-key":\s*"hireproof_agent_demo_key"/)
    assert.doesNotMatch(source, /hireproof_agent_demo_key/)
  }
  assert.match(skill, /account-issued API key/i)
  assert.doesNotMatch(apiReferenceDocs, /hireproof_agent_demo_key/)
  assert.doesNotMatch(apiReferenceDocs, /api\/mcp[\s\S]{0,260}hireproof_agent_demo_key/)
  assert.doesNotMatch(headlessDocs, /hireproof_agent_demo_key/)
  assert.doesNotMatch(headlessDocs, /webhook_url[\s\S]{0,260}hireproof_agent_demo_key|hireproof_agent_demo_key[\s\S]{0,260}webhook_url/)
  assert.doesNotMatch(mcpDocs, /public demo key|demo key/i)
  assert.doesNotMatch(appAutomationDocs, /public demo key|demo key/i)
  assert.doesNotMatch(docsOverview, /hireproof_agent_demo_key/)
  assert.doesNotMatch(quickstartDocs, /hireproof_agent_demo_key/)
  assert.doesNotMatch(selfHostingDocs, /bundled demo API key|public demo key|hireproof_agent_demo_key/i)
  assert.match(authDocs, /public shared keys are not accepted/i)
  assert.match(cliDocs, /<your-account-api-key>/)
  assert.match(automationDocs, /account-issued or self-hosted API key/)
  assert.doesNotMatch(marketplaceRunbook, /demo API key|public demo key|hireproof_agent_demo_key/i)
  assert.doesNotMatch(releaseRunbook, /demo API key|public demo key|hireproof_agent_demo_key/i)
  assert.doesNotMatch(proofArchive, /public demo key|hireproof_agent_demo_key/i)
  assert.doesNotMatch(apiPlayground, /hireproof_agent_demo_key/)
  assert.match(apiPlayground, /useState\(''\)/)
  assert.doesNotMatch(commandMenu, /public demo key|demo key/i)
  for (const source of [
    rootSkills,
    curlDownload,
    langchainDownload,
    makeDownload,
    n8nDownload,
    dockerSmoke,
    integrationValidator,
    chromeStoreAssets,
  ]) {
    assert.doesNotMatch(source, /hireproof_agent_demo_key/)
  }
  assert.match(curlDownload, /Set HIREPROOF_API_KEY/)
  assert.match(langchainDownload, /HIREPROOF_API_KEY is required/)
  assert.doesNotMatch(langchainPackage, /DEFAULT_API_KEY/)
  assert.doesNotMatch(langchainPackageTypes, /DEFAULT_API_KEY/)
  assert.doesNotMatch(cliPackage, /DEFAULT_API_KEY/)
  assert.match(dockerSmoke, /local-dev-agent-key-32-char-minimum-value/)
  assert.doesNotMatch(envExample, /AGENT_API_KEY=hireproof_agent_demo_key/)
  assert.doesNotMatch(extensionPopup, /value="hireproof_agent_demo_key"/)
  assert.doesNotMatch(readme, /x-api-key:\s*hireproof_agent_demo_key/)
})

test('after-hackathon cost safety runbook documents provider controls', async () => {
  const doc = await read('../docs/after-hackathon-cost-safety.md')

  assert.match(doc, /GOOGLE_CLOUD_VISION_API_KEY/)
  assert.match(doc, /PUBLIC_LIVE_AUDIT_ENABLED=false/)
  assert.match(doc, /PUBLIC_GOOGLE_VISION_OCR_ENABLED=false/)
  assert.match(doc, /PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED=false/)
  assert.match(doc, /REQUIRE_BYOK_FOR_LIVE_API=true/)
  assert.match(doc, /Partial BYOK does not authorize platform fallback/i)
  assert.match(doc, /SerpApi/i)
  assert.match(doc, /Google Cloud/i)
})

test('public audit UI explains capped live evidence mode after judging', async () => {
  const source = await read('../app/audit/audit-client.tsx')

  assert.match(source, /\/api\/health/)
  assert.match(source, /costPosture/)
  assert.match(source, /Live evidence is capped/)
  assert.match(source, /BYOK/)
  assert.match(source, /DemoCostSnackbar/)
  assert.match(source, /demo-cost-snackbar/)
  assert.match(source, /showDemoCostSnackbar/)
})

test('public health keeps provider internals out of unauthenticated responses', async () => {
  const health = await read('../app/api/health/route.ts')
  const usage = await read('../app/api/developer/usage/route.ts')
  const developer = await read('../app/developer/developer-client.tsx')
  const auditStatus = await read('../app/api/audit/route.ts')

  assert.match(health, /getProviderCostGuardSnapshot/)
  assert.match(health, /costPosture/)
  assert.match(health, /readiness/)
  assert.doesNotMatch(health, /providerCostGuards[,}]/)
  assert.doesNotMatch(health, /getSerpApiResponseCacheStats/)
  assert.doesNotMatch(health, /getModelProviderStatus/)
  assert.doesNotMatch(health, /liveSearch:\s*isSerpApiConfigured|model:\s*hasHireProofModelProvider/)
  assert.doesNotMatch(auditStatus, /serpapiCache/)
  assert.doesNotMatch(auditStatus, /apiKeys/)
  assert.doesNotMatch(auditStatus, /modelProvider/)
  assert.match(usage, /providerCostGuards/)
  assert.match(usage, /serpapiCache/)
  assert.match(developer, /Provider Guard/)
  assert.match(developer, /providerCostGuards/)
})

test('portfolio case study preserves solo global hackathon positioning', async () => {
  const doc = await read('../docs/portfolio-case-study.md')

  assert.match(doc, /Mark Siazon/)
  assert.match(doc, /solo global hackathon/i)
  assert.match(doc, /one week/i)
  assert.match(doc, /job scam/i)
  assert.match(doc, /https:\/\/hireproof\.tech/)
  assert.match(doc, /v1\.0 release/)
})
