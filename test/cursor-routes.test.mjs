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
  const { buildHireProofQaPrompt } = await import('../lib/cursor/qa-prompt.ts')
  const prompt = buildHireProofQaPrompt('https://preview.hireproof.example')
  assert.match(prompt, /\/audit/)
  assert.match(prompt, /\/developer/)
  assert.match(prompt, /\/docs/)
  assert.doesNotMatch(prompt, /\/api\/audit/)
})

test('developer cursor presets resolve custom and qa prompts', async () => {
  const presetsSource = await readRepoFile('lib/cursor/presets.ts')
  assert.match(presetsSource, /resolveDeveloperPresetPrompt/)
  assert.match(presetsSource, /buildHireProofQaPrompt/)

  const { buildHireProofQaPrompt } = await import('../lib/cursor/qa-prompt.ts')
  const qa = buildHireProofQaPrompt('http://localhost:3002')
  assert.match(qa, /localhost:3002\/audit/)
})

test('cursor integration is disabled without feature flag and key', async () => {
  const previousEnabled = process.env.CURSOR_INTEGRATION_ENABLED
  const previousKey = process.env.CURSOR_API_KEY
  process.env.CURSOR_INTEGRATION_ENABLED = 'false'
  delete process.env.CURSOR_API_KEY

  try {
    const { isCursorIntegrationEnabled, isCursorOperational } = await import('../lib/cursor/config.ts')
    assert.equal(isCursorIntegrationEnabled(), false)
    assert.equal(isCursorOperational(), false)
  } finally {
    if (previousEnabled === undefined) delete process.env.CURSOR_INTEGRATION_ENABLED
    else process.env.CURSOR_INTEGRATION_ENABLED = previousEnabled
    if (previousKey === undefined) delete process.env.CURSOR_API_KEY
    else process.env.CURSOR_API_KEY = previousKey
  }
})

test('developer cursor runs route enforces session auth origin and rate limits', async () => {
  const route = await readRepoFile('app/api/developer/cursor/runs/route.ts')
  assert.match(route, /getUserFromSessionToken/)
  assert.match(route, /validateMutationOrigin/)
  assert.match(route, /checkRateLimit/)
  assert.match(route, /cursor_runs:/)
  assert.match(route, /Authentication required/)
  assert.doesNotMatch(route, /console\.log\(.*CURSOR_API_KEY/)
})

test('internal cursor routes require x-cursor-job-secret', async () => {
  const nightly = await readRepoFile('app/api/internal/cursor/nightly-repo-health/route.ts')
  const uiQa = await readRepoFile('app/api/internal/cursor/ui-qa/route.ts')
  const auth = await readRepoFile('lib/cursor/internal-auth.ts')

  assert.match(auth, /x-cursor-job-secret/)
  assert.match(auth, /CURSOR_WEBHOOK_SECRET/)
  assert.match(nightly, /validateCursorJobSecret/)
  assert.match(uiQa, /validateCursorJobSecret/)
  assert.match(nightly, /nightly-repo-health/)
  assert.match(uiQa, /buildHireProofQaPrompt/)
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
