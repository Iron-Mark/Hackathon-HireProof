import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
import net from 'node:net'

const webhookRoutes = [
  '../app/api/webhooks/slack/route.ts',
  '../app/api/webhooks/discord/route.ts',
  '../app/api/webhooks/telegram/route.ts',
  '../app/api/webhooks/zernio/route.ts',
]

test('chat platform webhook routes cap request bodies before adapter dispatch', async () => {
  for (const routePath of webhookRoutes) {
    const source = await fs.readFile(new URL(routePath, import.meta.url), 'utf8')

    assert.match(source, /checkRateLimit/)
    assert.match(source, /requestIp/)
    assert.match(source, /webhook:\$\{webhookName\}:\$\{requestIp\(request\)\}/)
    assert.match(source, /status:\s*429/)
    assert.match(source, /WEBHOOK_PAYLOAD_LIMIT_BYTES = 1024 \* 1024/)
    assert.match(source, /readTextRequest\(request,\s*WEBHOOK_PAYLOAD_LIMIT_BYTES,\s*'Webhook payload'\)/)
    assert.match(source, /if \(!parsedBody\.ok\) return parsedBody\.response/)
    assert.match(source, /handle[A-Za-z]+Webhook\(cloneRequestWithTextBody\(request,\s*parsedBody\.value\), \{ waitUntil \}\)/)
  }
})

test('discord interaction verification rejects stale signed requests', async () => {
  const source = await fs.readFile(new URL('../lib/hireproof-bot.ts', import.meta.url), 'utf8')

  assert.match(source, /DISCORD_SIGNATURE_MAX_SKEW_MS = 5 \* 60 \* 1000/)
  assert.match(source, /Number\(timestamp\) \* 1000/)
  assert.match(source, /Math\.abs\(Date\.now\(\) - timestampMs\) > DISCORD_SIGNATURE_MAX_SKEW_MS/)
  assert.match(source, /return false/)
})

test('chat platform bot sends discard outbound provider response bodies', async () => {
  const source = await fs.readFile(new URL('../lib/hireproof-bot.ts', import.meta.url), 'utf8')

  assert.match(source, /discardChatProviderResponse/)
  assert.match(source, /const response = await fetch\(`https:\/\/discord\.com\/api\/v10\/webhooks/)
  assert.match(source, /await discardChatProviderResponse\(response\)/)
  assert.match(source, /const response = await fetch\(`https:\/\/api\.telegram\.org\/bot\$\{botToken\}\/sendMessage`/)
})

async function loadWebhookSecurityModule(resolveRecords = []) {
  const source = await fs.readFile(new URL('../lib/webhook-url-security.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText

  const context = {
    exports: {},
    module: { exports: {} },
    require: (id) => {
      if (id === 'node:dns/promises') {
        return { default: { lookup: async () => resolveRecords }, lookup: async () => resolveRecords }
      }
      if (id === 'node:net') return { default: net, ...net }
      return {}
    },
    URL,
  }
  context.module.exports = context.exports
  vm.runInNewContext(compiled, context)
  return context.module.exports
}

test('webhook URL validation rejects reserved documentation and transition network targets', async () => {
  const { validateWebhookUrl } = await loadWebhookSecurityModule([
    { address: '203.0.113.10', family: 4 },
  ])

  await assert.rejects(
    () => validateWebhookUrl('https://webhook.example/audit'),
    (error) => error?.name === 'WebhookUrlValidationError',
  )

  const { validateWebhookUrl: validateDirectIp } = await loadWebhookSecurityModule()
  for (const url of [
    'https://192.0.2.10/audit',
    'https://198.51.100.10/audit',
    'https://203.0.113.10/audit',
    'https://[64:ff9b:1::203.0.113.10]/audit',
    'https://[2001:db8::1]/audit',
  ]) {
    await assert.rejects(
      () => validateDirectIp(url),
      (error) => error?.name === 'WebhookUrlValidationError',
      `${url} should be rejected as non-public webhook target`,
    )
  }
})
