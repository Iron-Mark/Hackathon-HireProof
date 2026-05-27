import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { default: HireProof, HireProofError } = require('../sdk/dist/index.js')

test('SDK rejects oversized API responses before parsing JSON', async () => {
  const originalFetch = globalThis.fetch
  let parsed = false
  let cancelled = false

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-length': String((256 * 1024) + 1) }),
    body: {
      async cancel() {
        cancelled = true
      },
    },
    async text() {
      parsed = true
      return JSON.stringify({ verdict: 'safe', riskScore: 1 })
    },
  })

  try {
    const client = new HireProof({
      apiKey: 'test_key',
      baseUrl: 'https://hireproof.test',
      maxRetries: 0,
    })

    await assert.rejects(
      () => client.audit.investigate({
        text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
        mode: 'demo',
      }),
      (error) => error instanceof HireProofError &&
        /HireProof API response too large/.test(error.message),
    )
    assert.equal(parsed, false)
    assert.equal(cancelled, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('SDK cancels oversized streaming API responses', async () => {
  const originalFetch = globalThis.fetch
  let cancelled = false

  globalThis.fetch = async () => {
    const chunks = [
      new Uint8Array(200 * 1024),
      new Uint8Array(100 * 1024),
    ]

    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      body: {
        getReader() {
          return {
            async read() {
              const value = chunks.shift()
              return value ? { done: false, value } : { done: true }
            },
            async cancel() {
              cancelled = true
            },
            releaseLock() {},
          }
        },
      },
    }
  }

  try {
    const client = new HireProof({
      apiKey: 'test_key',
      baseUrl: 'https://hireproof.test',
      maxRetries: 0,
    })

    await assert.rejects(
      () => client.audit.investigate({
        text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
        mode: 'demo',
      }),
      (error) => error instanceof HireProofError &&
        /HireProof API response too large/.test(error.message),
    )
    assert.equal(cancelled, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})
