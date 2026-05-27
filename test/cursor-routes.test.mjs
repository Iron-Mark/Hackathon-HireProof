import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function readRepoFile(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8')
}

test('buildHireProofQaPrompt covers audit developer and docs surfaces', async () => {
  const promptSource = await readRepoFile('lib/cursor/qa-prompt.ts')
  assert.match(promptSource, /buildHireProofQaPrompt/)
  assert.match(promptSource, /\$\{origin\}\/audit/)
  assert.match(promptSource, /\$\{origin\}\/developer/)
  assert.match(promptSource, /\$\{origin\}\/docs/)
  assert.doesNotMatch(promptSource, /\/api\/audit/)
})

test('developer cursor presets resolve custom and qa prompts', async () => {
  const presetsSource = await readRepoFile('lib/cursor/presets.ts')
  const promptSource = await readRepoFile('lib/cursor/qa-prompt.ts')
  assert.match(presetsSource, /resolveDeveloperPresetPrompt/)
  assert.match(presetsSource, /buildHireProofQaPrompt/)
  assert.match(presetsSource, /qa-walkthrough/)
  assert.match(promptSource, /\$\{origin\}\/audit/)
})

test('cursor integration is disabled without feature flag and key', async () => {
  const config = await readRepoFile('lib/cursor/config.ts')
  assert.match(config, /CURSOR_INTEGRATION_ENABLED/)
  assert.match(config, /trimEnv\(process\.env\.CURSOR_INTEGRATION_ENABLED\) === 'true'/)
  assert.match(config, /return config\.enabled && Boolean\(config\.apiKey\)/)
})

test('developer cursor runs route enforces session auth origin and rate limits', async () => {
  const route = await readRepoFile('app/api/developer/cursor/runs/route.ts')
  const authStore = await readRepoFile('lib/auth-store.ts')
  const envExample = await readRepoFile('.env.example')
  const securityDoc = await readRepoFile('docs/security.md')

  assert.match(route, /getUserFromSessionToken/)
  assert.match(route, /isOperatorUser/)
  assert.match(route, /Operator access required/)
  assert.match(route, /validateMutationOrigin/)
  assert.match(route, /checkRateLimit/)
  assert.match(route, /cursor_runs:/)
  assert.match(route, /readJsonRequest/)
  assert.match(route, /resolveCursorQaBaseUrl/)
  assert.match(route, /CURSOR_RUN_PAYLOAD_LIMIT_BYTES = 32 \* 1024/)
  assert.match(authStore, /HIREPROOF_CURSOR_OPERATOR_EMAILS/)
  assert.match(envExample, /HIREPROOF_CURSOR_OPERATOR_EMAILS=/)
  assert.match(securityDoc, /Cursor runs/)
  assert.match(route, /Authentication required/)
  assert.doesNotMatch(route, /console\.log\(.*CURSOR_API_KEY/)
})

test('internal cursor routes require x-cursor-job-secret', async () => {
  const nightly = await readRepoFile('app/api/internal/cursor/nightly-repo-health/route.ts')
  const uiQa = await readRepoFile('app/api/internal/cursor/ui-qa/route.ts')
  const auth = await readRepoFile('lib/cursor/internal-auth.ts')
  const automationDoc = await readRepoFile('docs/cursor/automation.md')

  for (const route of [nightly, uiQa]) {
    assert.match(route, /checkRateLimit/)
    assert.match(route, /requestIp/)
    assert.match(route, /cursor_internal_job:\$\{jobName\}:\$\{requestIp\(request\)\}/)
    assert.match(route, /status:\s*429/)
  }
  assert.match(auth, /x-cursor-job-secret/)
  assert.match(auth, /CURSOR_WEBHOOK_SECRET/)
  assert.match(auth, /timingSafeEqual/)
  assert.match(automationDoc, /10 requests\/minute route limit/)
  assert.match(automationDoc, /Rate limited: `429`/)
  assert.match(nightly, /export async function POST\(request: Request\)/)
  assert.doesNotMatch(nightly, /export async function GET\(request: Request\)/)
  assert.match(nightly, /validateCursorJobSecret/)
  assert.match(uiQa, /validateCursorJobSecret/)
  assert.match(uiQa, /readJsonRequest/)
  assert.match(uiQa, /resolveCursorQaBaseUrl/)
  assert.match(uiQa, /CURSOR_JOB_PAYLOAD_LIMIT_BYTES = 32 \* 1024/)
  assert.match(nightly, /nightly-repo-health/)
  assert.match(uiQa, /buildHireProofQaPrompt/)
})

test('cursor docs do not teach direct webhook secret comparisons', async () => {
  const docs = [
    'docs/cursor/automation.md',
    'docs/cursor/deploy.md',
    'docs/cursor/deep-research-report-HPROOF.md',
  ]

  for (const doc of docs) {
    const source = await readRepoFile(doc)
    assert.doesNotMatch(source, /secret\s*!==\s*process\.env\.CURSOR_WEBHOOK_SECRET/)
    assert.doesNotMatch(source, /request\.headers\.get\(['"]x-cursor-job-secret['"]\)[\s\S]{0,120}!==/)
  }
})

test('cursor QA target resolution does not trust inbound request origin in production', async () => {
  const previousEnv = {
    NODE_ENV: process.env.NODE_ENV,
    APP_BASE_URL: process.env.APP_BASE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    HIREPROOF_CURSOR_QA_ALLOWED_ORIGINS: process.env.HIREPROOF_CURSOR_QA_ALLOWED_ORIGINS,
    CURSOR_QA_ALLOWED_ORIGINS: process.env.CURSOR_QA_ALLOWED_ORIGINS,
  }

  try {
    process.env.NODE_ENV = 'production'
    delete process.env.APP_BASE_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    delete process.env.VERCEL_URL
    delete process.env.HIREPROOF_CURSOR_QA_ALLOWED_ORIGINS
    delete process.env.CURSOR_QA_ALLOWED_ORIGINS

    const { resolveCursorQaBaseUrl } = await import(`../lib/cursor/qa-target.mjs?case=${Date.now()}`)
    assert.equal(
      resolveCursorQaBaseUrl(undefined, 'https://evil.example/api/internal/cursor/ui-qa'),
      'https://hireproof.tech',
    )
    assert.throws(
      () => resolveCursorQaBaseUrl('https://evil.example', 'https://evil.example/api/internal/cursor/ui-qa'),
      /Cursor QA target origin is not allowed/,
    )
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
})

test('cursor smoke tooling does not trigger state-changing runs with GET', async () => {
  const smoke = await readRepoFile('scripts/cursor-smoke.mjs')
  const orchestrator = await readRepoFile('scripts/orchestrate-cursor-phases.mjs')

  assert.match(smoke, /nightly-repo-health[\s\S]*method:\s*'POST'/)
  assert.doesNotMatch(smoke, /nightly-repo-health[\s\S]*method:\s*'GET'/)
  assert.match(orchestrator, /POST\s+\/api\/internal\/cursor\/nightly-repo-health/)
  assert.doesNotMatch(orchestrator, /GET\s+\/api\/internal\/cursor\/nightly-repo-health/)
})

test('cursor secret setup avoids putting secrets in process arguments', async () => {
  const script = await readRepoFile('scripts/setup-cursor-secrets.ps1')
  const example = await readRepoFile('scripts/vercel-cursor-env-setup.ps1.example')
  const deployDoc = await readRepoFile('docs/cursor/deploy.md')

  assert.doesNotMatch(script, /CursorApiKeyPlain/)
  assert.doesNotMatch(script, /"--value"\s*,\s*\$trimmedValue/)
  assert.match(script, /\$trimmedValue\s*\|\s*&\s*vercel\s+@vercelArgs/)
  assert.match(script, /Read-Host "Paste CURSOR_API_KEY \(Cloud Agents API key\)" -AsSecureString/)
  assert.match(deployDoc, /Do not pass Cursor secrets as PowerShell parameters or Vercel `--value` arguments/)
  assert.doesNotMatch(example, /echo '<CURSOR_(?:API_KEY|WEBHOOK_SECRET)>'/)
})

test('non-interactive cursor env setup marks Cursor secrets sensitive without argv values', async () => {
  const deployDoc = await readRepoFile('docs/cursor/deploy.md')
  assert.match(deployDoc, /Cursor API and webhook secrets are added with Vercel's `--sensitive` flag/)

  for (const scriptPath of [
    'scripts/vercel-cursor-env-setup.ps1',
    'scripts/vercel-cursor-env-setup.ps1.example',
  ]) {
    const script = await readRepoFile(scriptPath)

    assert.match(script, /\$SensitiveEnvNames/)
    assert.match(script, /"CURSOR_API_KEY"/)
    assert.match(script, /"CURSOR_WEBHOOK_SECRET"/)
    assert.match(script, /\$vercelArgs\s*=\s*@\(/)
    assert.match(script, /\$vercelArgs\s*\+=\s*"--sensitive"/)
    assert.match(script, /\$Value\s*\|\s*&\s*vercel\s+@vercelArgs/)
    assert.doesNotMatch(script, /"--value"\s*,\s*\$Value/)
    assert.doesNotMatch(script, /\$Value\s+.*--value/)
  }
})

test('cursor client pins cloud repo when allowed url is configured', async () => {
  const client = await readRepoFile('lib/cursor/client.ts')
  const config = await readRepoFile('lib/cursor/config.ts')

  assert.match(client, /resolveAllowedRepoUrl/)
  assert.match(client, /Repository URL is not allowed/)
  assert.match(config, /CURSOR_ALLOWED_REPO_URL/)
  assert.doesNotMatch(client, /console\.log\(/)
})

test('developer portal references cursor runs API', async () => {
  const portal = await readRepoFile('app/developer/developer-client.tsx')
  assert.match(portal, /\/api\/developer\/cursor\/runs/)
  assert.match(portal, /Cursor Agents/)
})
