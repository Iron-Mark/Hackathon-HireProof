import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'

const require = createRequire(import.meta.url)

test('LangChain tool schema does not expose webhookUrl to model-generated tool args', () => {
  const {
    HireProofAuditInputSchema,
    createHireProofAuditTool,
  } = require('../packages/hireproof-langchain/dist/index.js')

  class FakeDynamicStructuredTool {
    constructor(config) {
      this.schema = config.schema
      this.func = config.func
    }
  }

  const tool = createHireProofAuditTool({
    DynamicStructuredTool: FakeDynamicStructuredTool,
    apiKey: 'victim-api-key-for-test',
  })

  assert.equal(Object.prototype.hasOwnProperty.call(HireProofAuditInputSchema.shape, 'webhookUrl'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(tool.schema.shape, 'webhookUrl'), false)
})

test('LangChain audit helper ignores untrusted input webhookUrl but allows trusted option webhookUrl', async () => {
  const { runHireProofAudit } = require('../packages/hireproof-langchain/dist/index.js')
  const calls = []
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options })
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          id: 'report_test',
          verdict: 'high-risk',
          riskScore: 92,
        })
      },
    }
  }

  try {
    await runHireProofAudit({
      text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
      mode: 'demo',
      webhookUrl: 'https://attacker.example/callback',
    }, {
      apiKey: 'victim-api-key-for-test',
      baseUrl: 'https://hireproof.test',
    })

    const untrustedBody = JSON.parse(calls[0].options.body)
    assert.equal(Object.prototype.hasOwnProperty.call(untrustedBody, 'webhook_url'), false)

    await runHireProofAudit({
      text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
      mode: 'demo',
    }, {
      apiKey: 'victim-api-key-for-test',
      baseUrl: 'https://hireproof.test',
      webhookUrl: 'https://trusted.example/callback',
    })

    const trustedBody = JSON.parse(calls[1].options.body)
    assert.equal(trustedBody.webhook_url, 'https://trusted.example/callback')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('LangChain audit helper rejects oversized API responses before parsing JSON', async () => {
  const { runHireProofAudit } = require('../packages/hireproof-langchain/dist/index.js')
  const originalFetch = globalThis.fetch
  let jsonParsed = false
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
    async json() {
      jsonParsed = true
      return { verdict: 'safe', riskScore: 1 }
    },
  })

  try {
    await assert.rejects(
      () => runHireProofAudit({
        text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
        mode: 'demo',
      }, {
        apiKey: 'victim-api-key-for-test',
        baseUrl: 'https://hireproof.test',
      }),
      /HireProof audit response too large/,
    )
    assert.equal(jsonParsed, false)
    assert.equal(cancelled, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('LangChain packaged helper has no unbounded response.json fallback', async () => {
  const source = await fs.readFile(new URL('../packages/hireproof-langchain/dist/index.js', import.meta.url), 'utf8')

  assert.match(source, /readBoundedAuditResponseJson/)
  assert.match(source, /MAX_AUDIT_RESPONSE_BYTES/)
  assert.match(source, /HireProof audit response body is not readable/)
  assert.doesNotMatch(source, /response\.json\(\)/)
})

test('LangChain audit helper does not fall back to unbounded response.json parsing', async () => {
  const { runHireProofAudit } = require('../packages/hireproof-langchain/dist/index.js')
  const originalFetch = globalThis.fetch
  let jsonParsed = false

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-length': '64' }),
    async json() {
      jsonParsed = true
      return { verdict: 'safe', riskScore: 1 }
    },
  })

  try {
    await assert.rejects(
      () => runHireProofAudit({
        text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
        mode: 'demo',
      }, {
        apiKey: 'victim-api-key-for-test',
        baseUrl: 'https://hireproof.test',
      }),
      /response body is not readable/,
    )
    assert.equal(jsonParsed, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('LangChain audit helper cancels oversized streaming audit responses', async () => {
  const { runHireProofAudit } = require('../packages/hireproof-langchain/dist/index.js')
  const originalFetch = globalThis.fetch
  const encoder = new TextEncoder()
  let cancelled = false

  globalThis.fetch = async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"summary":"'))
        controller.enqueue(new Uint8Array(256 * 1024))
        controller.enqueue(encoder.encode('"}'))
      },
      cancel() {
        cancelled = true
      },
    })

    return new Response(stream, {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    })
  }

  try {
    await assert.rejects(
      () => runHireProofAudit({
        text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
        mode: 'demo',
      }, {
        apiKey: 'victim-api-key-for-test',
        baseUrl: 'https://hireproof.test',
      }),
      /HireProof audit response too large/,
    )
    assert.equal(cancelled, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})
