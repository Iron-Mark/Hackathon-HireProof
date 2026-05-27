import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('provider credential verification cancels successful response bodies', async () => {
  const originalFetch = globalThis.fetch
  const cancelledUrls = []

  globalThis.fetch = async (url) => ({
    ok: true,
    body: {
      cancel: async () => {
        cancelledUrls.push(String(url))
      },
    },
  })

  try {
    const { verifyProviderCredential } = await import(`../lib/provider-verification.ts?case=${Date.now()}`)

    assert.deepEqual(await verifyProviderCredential('openai', 'sk-test-openai-key'), { valid: true })
    assert.deepEqual(await verifyProviderCredential('serpapi', 'serpapi-test-key'), { valid: true })
    assert.equal(cancelledUrls.length, 2)
    assert.ok(cancelledUrls.some((url) => url.includes('api.openai.com/v1/models')))
    assert.ok(cancelledUrls.some((url) => url.includes('serpapi.com/search.json')))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('provider credential verification does not follow redirects with submitted secrets', async () => {
  const originalFetch = globalThis.fetch
  const redirects = []

  globalThis.fetch = async (_url, options = {}) => {
    redirects.push(options.redirect)
    return {
      ok: false,
      status: 302,
      body: {
        cancel: async () => undefined,
      },
    }
  }

  try {
    const { verifyProviderCredential } = await import(`../lib/provider-verification.ts?redirect=${Date.now()}`)

    assert.deepEqual(await verifyProviderCredential('openai', 'sk-test-openai-key'), {
      valid: false,
      error: 'Invalid provider key.',
    })
    assert.deepEqual(await verifyProviderCredential('serpapi', 'serpapi-test-key'), {
      valid: false,
      error: 'Invalid provider key.',
    })
    assert.deepEqual(redirects, ['manual', 'manual'])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('SerpApi network responses are size bounded before parsing', async () => {
  const source = await fs.readFile(new URL('../lib/serpapi.ts', import.meta.url), 'utf8')

  assert.match(source, /SERPAPI_MAX_RESPONSE_BYTES/)
  assert.match(source, /readSerpApiResponseJson/)
  assert.match(source, /content-length/)
  assert.match(source, /response\.body\?\.getReader/)
  assert.doesNotMatch(source, /await response\.json\(\)/)
})

test('audit agent internal MCP tool responses are size bounded before parsing', async () => {
  const responseSecurity = await fs.readFile(new URL('../lib/response-security.ts', import.meta.url), 'utf8')
  const publicAuditRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const v1AuditRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')

  assert.match(responseSecurity, /INTERNAL_TOOL_RESPONSE_LIMIT_BYTES/)
  assert.match(responseSecurity, /readBoundedInternalToolJson/)
  assert.match(responseSecurity, /response\.body\?\.getReader/)
  assert.match(responseSecurity, /reader\.cancel/)
  assert.match(responseSecurity, /JSON\.parse/)

  for (const routeSource of [publicAuditRoute, v1AuditRoute]) {
    assert.match(routeSource, /readBoundedInternalToolJson/)
    assert.match(routeSource, /\/api\/mcp/)
    assert.doesNotMatch(routeSource, /return res\.json\(\)/)
  }
})

test('provider credential verification does not buffer invalid response bodies', async () => {
  const source = await fs.readFile(new URL('../lib/provider-verification.ts', import.meta.url), 'utf8')

  assert.match(source, /discardProviderVerificationResponse/)
  assert.match(source, /response\.body\?\.cancel/)
  assert.doesNotMatch(source, /arrayBuffer\(\)/)
})

test('operator smoke and proof scripts bound response bodies before parsing', async () => {
  const helper = await fs.readFile(new URL('../scripts/lib/bounded-response.mjs', import.meta.url), 'utf8').catch(() => '')
  const securityDocs = await fs.readFile(new URL('../app/docs/security/page.tsx', import.meta.url), 'utf8')
  assert.match(helper, /SCRIPT_RESPONSE_LIMIT_BYTES/)
  assert.match(helper, /Number\.isFinite/)
  assert.match(helper, /readBoundedText/)
  assert.match(helper, /response\.body\?\.getReader/)
  assert.match(helper, /reader\.cancel/)
  assert.match(securityDocs, /Operator smoke and proof scripts use bounded response readers/)

  for (const scriptPath of [
    '../scripts/check-live-chat-proof.mjs',
    '../scripts/cursor-smoke.mjs',
    '../scripts/smoke-docker.mjs',
    '../scripts/register-discord-commands.mjs',
  ]) {
    const source = await fs.readFile(new URL(scriptPath, import.meta.url), 'utf8')
    assert.match(source, /from '\.\/lib\/bounded-response\.mjs'/, `${scriptPath} should import the bounded response helper`)
    assert.doesNotMatch(source, /await response\.text\(\)/, `${scriptPath} should not read unbounded response text`)
    assert.doesNotMatch(source, /await \w+Response\.json\(\)/, `${scriptPath} should not parse unbounded JSON responses`)
  }
})

test('script bounded response helper cancels streams that exceed the byte cap', async () => {
  const { readBoundedText } = await import(`../scripts/lib/bounded-response.mjs?case=${Date.now()}`)
  let cancelled = false
  const response = {
    headers: { get: () => null },
    body: {
      getReader() {
        let reads = 0
        return {
          async read() {
            reads += 1
            return reads === 1
              ? { done: false, value: new Uint8Array(12) }
              : { done: false, value: new Uint8Array(12) }
          },
          async cancel() {
            cancelled = true
          },
          releaseLock() {},
        }
      },
    },
  }

  await assert.rejects(
    () => readBoundedText(response, { label: 'test script response', maxBytes: 16 }),
    /test script response exceeded 16 bytes/,
  )
  assert.equal(cancelled, true)
})
