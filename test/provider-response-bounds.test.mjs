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
