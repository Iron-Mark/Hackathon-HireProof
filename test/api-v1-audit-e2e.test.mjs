import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { BASE_URL, ensureE2eServer } from './helpers/e2e-server.mjs'

const LOCAL_TEST_AGENT_KEY = 'local-test-agent-key-32-char-minimum-value'

function isStrongEnoughLocalKey(value) {
  const key = String(value || '').trim()
  return key.length >= 32 && new Set(key).size >= 8 && !/^paste_|^replace_|^your_|^<paste/i.test(key)
}

async function readAgentApiKey() {
  if (process.env.AGENT_API_KEY?.trim()) return process.env.AGENT_API_KEY.trim()

  try {
    const env = await fs.readFile(new URL('../.env.local', import.meta.url), 'utf8')
    const line = env.split(/\r?\n/).find((item) => item.startsWith('AGENT_API_KEY='))
    const configured = line ? line.replace(/^AGENT_API_KEY=/, '').trim() : ''
    return isStrongEnoughLocalKey(configured) ? configured : LOCAL_TEST_AGENT_KEY
  } catch {
    return LOCAL_TEST_AGENT_KEY
  }
}

async function postAudit(body) {
  const apiKey = await readAgentApiKey()
  const response = await fetch(`${BASE_URL}/api/v1/audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json()
  return { response, payload }
}

test('/api/v1/audit returns an explicit demo report for mode=demo', { timeout: 180_000 }, async () => {
  const server = await ensureE2eServer('/api/health')

  try {
    const { response, payload } = await postAudit({
      text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
      mode: 'demo',
    })

    assert.equal(response.status, 200)
    assert.equal(payload.mode, 'demo')
    assert.equal(payload.credentialMode, 'demo')
    assert.equal(payload.verdict, 'high-risk')
    assert.ok(Number(payload.riskScore) >= 80)
  } finally {
    await server.release()
  }
})

test('/api/v1/audit keeps live mode credential-backed with clear missing-key errors', { timeout: 120_000 }, async () => {
  const server = await ensureE2eServer('/api/health')

  try {
    const { response, payload } = await postAudit({
      text: 'Remote frontend intern at Apex Hiring. PHP 80,000/week. No interview required. Apply by Telegram only.',
      location: 'Philippines',
      mode: 'live',
    })

    if (response.status === 503) {
      assert.match(payload.error, /Live audit credentials not configured|Platform live audit credentials are disabled/)
      assert.ok(Array.isArray(payload.missing))
      assert.ok(
        payload.missing.some((item) => /MODEL_PROVIDER_KEY|SERPAPI_API_KEY|live credential/i.test(String(item))),
        'missing list should identify model/search live credential requirements'
      )
      assert.match(payload.recovery, /mode=demo/)
      return
    }

    assert.equal(response.status, 200)
    assert.equal(payload.mode, 'live')
    assert.notEqual(payload.credentialMode, 'demo')
    assert.equal(payload.verdict, 'high-risk')
    assert.ok(Number(payload.riskScore) >= 80)
  } finally {
    await server.release()
  }
})
