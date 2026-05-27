import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

async function loadRequestSecurityModule() {
  const source = await fs.readFile(new URL('../lib/request-security.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText

  const context = {
    exports: {},
    process: { env: {} },
    URL,
    Request,
    Headers,
    Response,
    TextDecoder,
    TextEncoder,
    require: (id) => {
      if (id === 'next/server') {
        return { NextResponse: { json: (body, init) => new Response(JSON.stringify(body), init) } }
      }
      throw new Error(`Unexpected require: ${id}`)
    },
  }
  context.module = { exports: context.exports }

  vm.runInNewContext(compiled, context)
  return context.module.exports
}

const cappedJsonRoutes = [
  ['../app/api/audit/route.ts', /UI_AUDIT_PAYLOAD_LIMIT_BYTES = 5 \* 1024 \* 1024/],
  ['../app/api/analytics/events/route.ts', /ANALYTICS_EVENT_PAYLOAD_LIMIT_BYTES = 16_384/],
  ['../app/api/chat/hireproof/route.ts', /CHAT_PAYLOAD_LIMIT_BYTES = 5 \* 1024 \* 1024/],
  ['../app/api/auth/login/route.ts', /AUTH_PAYLOAD_LIMIT_BYTES = 16 \* 1024/],
  ['../app/api/auth/register/route.ts', /AUTH_PAYLOAD_LIMIT_BYTES = 16 \* 1024/],
  ['../app/api/developer/cursor/runs/route.ts', /CURSOR_RUN_PAYLOAD_LIMIT_BYTES = 32 \* 1024/],
  ['../app/api/developer/domains/route.ts', /DEVELOPER_PAYLOAD_LIMIT_BYTES = 16 \* 1024/],
  ['../app/api/developer/domains/verify/route.ts', /DEVELOPER_PAYLOAD_LIMIT_BYTES = 16 \* 1024/],
  ['../app/api/developer/keys/route.ts', /DEVELOPER_PAYLOAD_LIMIT_BYTES = 16 \* 1024/],
  ['../app/api/developer/provider-credentials/route.ts', /PROVIDER_CREDENTIAL_PAYLOAD_LIMIT_BYTES = 32 \* 1024/],
  ['../app/api/developer/repair-reports/route.ts', /REPAIR_REPORTS_PAYLOAD_LIMIT_BYTES = 32 \* 1024/],
  ['../app/api/developer/verify-infrastructure/route.ts', /VERIFY_INFRASTRUCTURE_PAYLOAD_LIMIT_BYTES = 32 \* 1024/],
  ['../app/api/developer/webhook-test/route.ts', /WEBHOOK_TEST_PAYLOAD_LIMIT_BYTES = 32 \* 1024/],
  ['../app/api/internal/cursor/ui-qa/route.ts', /CURSOR_JOB_PAYLOAD_LIMIT_BYTES = 32 \* 1024/],
  ['../app/api/intelligence/feedback/route.ts', /FEEDBACK_PAYLOAD_LIMIT_BYTES = 8 \* 1024/],
  ['../app/api/mcp/route.ts', /MCP_PAYLOAD_LIMIT_BYTES = 100_000/],
  ['../app/api/verified-badge/route.ts', /VERIFIED_BADGE_PAYLOAD_LIMIT_BYTES = 8 \* 1024/],
  ['../app/api/workflows/audit/route.ts', /WORKFLOW_PAYLOAD_LIMIT_BYTES = 64 \* 1024/],
  ['../app/api/v1/audit/route.ts', /HEADLESS_AUDIT_PAYLOAD_LIMIT_BYTES = 5 \* 1024 \* 1024/],
  ['../app/api/pilot/requests/route.ts', /PILOT_REQUEST_PAYLOAD_LIMIT_BYTES = 65_536/],
]

const cappedWebhookRoutes = [
  '../app/api/webhooks/discord/route.ts',
  '../app/api/webhooks/slack/route.ts',
  '../app/api/webhooks/telegram/route.ts',
  '../app/api/webhooks/zernio/route.ts',
]

test('json mutation routes reject oversized bodies before parsing', async () => {
  for (const [routePath, limitPattern] of cappedJsonRoutes) {
    const source = await fs.readFile(new URL(routePath, import.meta.url), 'utf8')
    const firstBoundedJsonRead = source.indexOf('readJsonRequest(')
    const firstJsonParse = source.indexOf('request.json(')

    assert.match(source, /readJsonRequest/)
    assert.match(source, limitPattern)
    assert.ok(firstBoundedJsonRead !== -1, `${routePath} should call readJsonRequest`)
    assert.ok(firstJsonParse === -1 || firstBoundedJsonRead < firstJsonParse, `${routePath} should bounded-read before JSON parsing`)
  }
})

test('public request body readers count bytes before parsing or adapter dispatch', async () => {
  const requestSecurity = await fs.readFile(new URL('../lib/request-security.ts', import.meta.url), 'utf8')
  const hireProofBot = await fs.readFile(new URL('../lib/hireproof-bot.ts', import.meta.url), 'utf8')
  const publicRoutes = [
    '../app/api/audit/route.ts',
    '../app/api/analytics/events/route.ts',
    '../app/api/chat/hireproof/route.ts',
    '../app/api/intelligence/feedback/route.ts',
    '../app/api/mcp/route.ts',
    '../app/api/pilot/requests/route.ts',
    '../app/api/verified-badge/route.ts',
    '../app/api/workflows/audit/route.ts',
  ]

  assert.match(requestSecurity, /export async function readJsonRequest/)
  assert.match(requestSecurity, /export async function readTextRequest/)
  assert.match(requestSecurity, /request\.body\.getReader\(\)/)
  assert.match(requestSecurity, /totalBytes > maxBytes/)
  assert.match(requestSecurity, /JSON\.parse/)
  assert.match(hireProofBot, /readTextRequest\(request,\s*WEBHOOK_PAYLOAD_LIMIT_BYTES,\s*'Webhook payload'\)/)
  assert.doesNotMatch(hireProofBot, /await request\.text\(\)/)

  for (const routePath of publicRoutes) {
    const source = await fs.readFile(new URL(routePath, import.meta.url), 'utf8')
    const firstBoundedParse = source.indexOf('readJsonRequest(')
    const firstJsonParse = source.indexOf('request.json(')

    assert.match(source, /readJsonRequest/)
    assert.ok(firstBoundedParse !== -1, `${routePath} should call readJsonRequest`)
    assert.ok(firstJsonParse === -1 || firstBoundedParse < firstJsonParse, `${routePath} should bounded-parse before request.json`)
  }

  for (const routePath of cappedWebhookRoutes) {
    const source = await fs.readFile(new URL(routePath, import.meta.url), 'utf8')
    const firstBoundedRead = source.indexOf('readTextRequest(')
    const firstWebhookDispatch = source.indexOf('return handle')

    assert.match(source, /WEBHOOK_PAYLOAD_LIMIT_BYTES = 1024 \* 1024/)
    assert.match(source, /readTextRequest/)
    assert.match(source, /cloneRequestWithTextBody/)
    assert.ok(firstBoundedRead !== -1, `${routePath} should call readTextRequest`)
    assert.ok(firstWebhookDispatch === -1 || firstBoundedRead < firstWebhookDispatch, `${routePath} should read bounded body before adapter dispatch`)
  }
})

test('shared body readers enforce byte caps when a request has no readable stream', async () => {
  const { readJsonRequest, readTextRequest } = await loadRequestSecurityModule()
  const oversizedJson = JSON.stringify({ text: 'x'.repeat(4096) })
  const headers = new Headers({ 'content-type': 'application/json' })

  const parsedJson = await readJsonRequest({
    headers,
    body: null,
    text: async () => oversizedJson,
    json: async () => JSON.parse(oversizedJson),
  }, 1024, 'Fallback payload')

  assert.equal(parsedJson.ok, false)
  assert.equal(parsedJson.response.status, 413)
  assert.equal(parsedJson.response.headers.get('cache-control'), 'no-store')

  const parsedText = await readTextRequest({
    headers: new Headers(),
    body: null,
    text: async () => 'x'.repeat(4096),
  }, 1024, 'Fallback text')

  assert.equal(parsedText.ok, false)
  assert.equal(parsedText.response.status, 413)
  assert.equal(parsedText.response.headers.get('cache-control'), 'no-store')
})

test('shared body reader parse errors are no-store responses', async () => {
  const { readJsonRequest } = await loadRequestSecurityModule()

  const parsedJson = await readJsonRequest({
    headers: new Headers(),
    body: null,
    text: async () => '{"text":',
  }, 1024, 'Fallback payload')

  assert.equal(parsedJson.ok, false)
  assert.equal(parsedJson.response.status, 400)
  assert.equal(parsedJson.response.headers.get('cache-control'), 'no-store')
})
