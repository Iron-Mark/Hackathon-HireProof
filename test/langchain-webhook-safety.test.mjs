import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

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
      async json() {
        return {
          id: 'report_test',
          verdict: 'high-risk',
          riskScore: 92,
        }
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
