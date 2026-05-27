import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { isHireProofHealthResponse } from './helpers/e2e-server.mjs'

test('E2E server helper rejects unrelated app health responses', () => {
  assert.equal(isHireProofHealthResponse(JSON.stringify({
    ok: true,
    status: 'ok',
    service: 'gawainyah-miniapp',
    checks: { appUrlConfigured: false },
  })), false)
})

test('E2E server helper accepts HireProof health responses', () => {
  assert.equal(isHireProofHealthResponse(JSON.stringify({
    status: 'ok',
    readiness: { state: 'ready', scope: 'public' },
    costPosture: {
      publicLiveEvidence: false,
      publicOcr: false,
      publicTrendSignals: false,
      byokRequiredForApiLive: true,
    },
  })), true)
})

test('API audit E2E uses fingerprinted HireProof health readiness', async () => {
  const source = await fs.readFile(new URL('./api-v1-audit-e2e.test.mjs', import.meta.url), 'utf8')

  assert.match(source, /ensureE2eServer\('\/api\/health'\)/)
  assert.doesNotMatch(source, /ensureE2eServer\('\/api\/v1\/audit'\)/)
})
