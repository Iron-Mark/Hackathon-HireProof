import test from 'node:test'
import assert from 'node:assert/strict'
import {
  decryptSecret,
  encryptSecret,
  redactSecret,
} from '../lib/byok-crypto.mjs'

test('byok credential encryption round-trips without storing plaintext', () => {
  const encrypted = encryptSecret('sk-test-owner-secret', 'test-encryption-secret')

  assert.notEqual(encrypted.ciphertext, 'sk-test-owner-secret')
  assert.doesNotMatch(JSON.stringify(encrypted), /sk-test-owner-secret/)
  assert.equal(decryptSecret(encrypted, 'test-encryption-secret'), 'sk-test-owner-secret')
})

test('byok credential decryption fails with the wrong key', () => {
  const encrypted = encryptSecret('serpapi-owner-secret', 'correct-encryption-secret')

  assert.throws(() => decryptSecret(encrypted, 'wrong-encryption-secret'))
})

test('byok credential redaction keeps only safe metadata', () => {
  assert.deepEqual(redactSecret('sk-test-owner-secret'), {
    lastFour: 'cret',
  })
})

test('developer portal does not persist hosted provider secrets to localStorage', async () => {
  const source = await import('node:fs/promises').then((fs) =>
    fs.readFile(new URL('../app/developer/developer-client.tsx', import.meta.url), 'utf8')
  )

  assert.doesNotMatch(source, /localStorage\.setItem\('MODEL_PROVIDER_KEY'/)
  assert.doesNotMatch(source, /localStorage\.setItem\('SERPAPI_API_KEY'/)
  assert.match(source, /\/api\/developer\/provider-credentials/)
})

test('byok credential mutation routes enforce same-origin csrf headers', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../app/api/developer/provider-credentials/route.ts', import.meta.url), 'utf8')
  const requestSecurity = await fs.readFile(new URL('../lib/request-security.ts', import.meta.url), 'utf8')

  assert.match(source, /validateMutationOrigin/)
  assert.match(source, /const csrfError = validateMutationOrigin\(request\)/)
  assert.match(requestSecurity, /request\.headers\.get\('origin'\)/)
  assert.match(requestSecurity, /request\.headers\.get\('referer'\)/)
  assert.match(requestSecurity, /parseConfiguredOrigin\(process\.env\.APP_BASE_URL\)/)
  assert.match(requestSecurity, /parseConfiguredOrigin\(process\.env\.VERCEL_PROJECT_PRODUCTION_URL\)/)
  assert.match(requestSecurity, /parseConfiguredOrigin\(process\.env\.VERCEL_URL\)/)
  assert.match(requestSecurity, /NODE_ENV === 'production'[\s\S]{0,80}return null/)
  assert.doesNotMatch(requestSecurity, /new URL\(request\.url\)\.origin/)
  assert.match(requestSecurity, /CSRF validation failed/)
  assert.match(source, /export async function PATCH\(request: Request\)/)
  assert.match(source, /export async function DELETE\(request: Request\)/)
})

test('byok credential routes rate-limit save attempts and keep verification errors generic', async () => {
  const fs = await import('node:fs/promises')
  const route = await fs.readFile(new URL('../app/api/developer/provider-credentials/route.ts', import.meta.url), 'utf8')
  const verifier = await fs.readFile(new URL('../lib/provider-verification.ts', import.meta.url), 'utf8')

  assert.match(route, /checkRateLimit/)
  assert.match(route, /byok_provider_credentials/)
  assert.match(route, /Rate limit exceeded/)
  assert.match(route, /Provider key could not be verified\./)
  assert.doesNotMatch(route, /verification\.error/)
  assert.match(verifier, /Invalid provider key\./)
  assert.doesNotMatch(verifier, /json\.error\?\.message/)
})

test('credential verification and webhook sandbox responses are no-store', async () => {
  const fs = await import('node:fs/promises')
  const routePaths = [
    '../app/api/developer/provider-credentials/route.ts',
    '../app/api/developer/verify-infrastructure/route.ts',
    '../app/api/developer/webhook-test/route.ts',
  ]

  for (const routePath of routePaths) {
    const source = await fs.readFile(new URL(routePath, import.meta.url), 'utf8')
    assert.match(source, /noStoreJson/, `${routePath} should use noStoreJson for credential-adjacent responses`)
    assert.doesNotMatch(source, /NextResponse\.json/, `${routePath} should not return cacheable credential-adjacent JSON`)
  }
})

test('byok credential delete route rate-limits revocations before mutating stored credentials', async () => {
  const fs = await import('node:fs/promises')
  const route = await fs.readFile(new URL('../app/api/developer/provider-credentials/route.ts', import.meta.url), 'utf8')

  assert.match(route, /byok_provider_credentials_revoke/)
  assert.match(route, /Rate limit exceeded/)
  assert.ok(
    route.indexOf('byok_provider_credentials_revoke') < route.indexOf('revokeProviderCredential(user.id, provider)'),
    'provider credential delete should rate-limit before revoking stored credentials',
  )
})

test('developer provider verification route rate-limits external provider checks', async () => {
  const fs = await import('node:fs/promises')
  const route = await fs.readFile(new URL('../app/api/developer/verify-infrastructure/route.ts', import.meta.url), 'utf8')

  assert.match(route, /validateMutationOrigin/)
  assert.match(route, /getCurrentSessionUser/)
  assert.match(route, /checkRateLimit/)
  assert.match(route, /requestIp\(req\)/)
  assert.match(route, /developer_verify_infrastructure:\$\{user\.id\}:\$\{requestIp\(req\)\}/)
  assert.match(route, /Rate limit exceeded/)
  assert.ok(route.indexOf('checkRateLimit') < route.indexOf('readJsonRequest(req'), 'rate limit should run before reading provider key payload')
  assert.ok(route.indexOf('checkRateLimit') < route.indexOf('const result = await verifyProviderCredential'), 'rate limit should run before external provider verification')
})

test('byok credential APIs expose only redacted owner-scoped records', async () => {
  const fs = await import('node:fs/promises')
  const authStore = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')
  const route = await fs.readFile(new URL('../app/api/developer/provider-credentials/route.ts', import.meta.url), 'utf8')

  assert.match(authStore, /function redactProviderCredential/)
  assert.match(authStore, /lastFour/)
  assert.doesNotMatch(authStore.match(/function redactProviderCredential[\s\S]*?}\n}/)?.[0] || '', /encryptedSecret/)
  assert.match(authStore, /credential\.ownerId === ownerId && !credential\.revokedAt/)
  assert.match(authStore, /revokeProviderCredential\(ownerId: string/)
  assert.match(route, /credentials: await listProviderCredentials\(user\.id\)/)
  assert.match(route, /saveProviderCredential\(user\.id, provider, key\)/)
  assert.match(route, /revokeProviderCredential\(user\.id, provider\)/)
})

test('authenticated audit and mcp routes load owner byok credentials', async () => {
  const fs = await import('node:fs/promises')
  const v1AuditRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const mcpRoute = await fs.readFile(new URL('../app/api/mcp/route.ts', import.meta.url), 'utf8')
  const mcpTools = await fs.readFile(new URL('../lib/mcp-tools.ts', import.meta.url), 'utf8')
  const serpapi = await fs.readFile(new URL('../lib/serpapi.ts', import.meta.url), 'utf8')
  const aiModel = await fs.readFile(new URL('../lib/ai-model.ts', import.meta.url), 'utf8')

  assert.match(v1AuditRoute, /getOwnerProviderCredentials/)
  assert.match(v1AuditRoute, /credentialMode/)
  assert.match(mcpRoute, /getOwnerProviderCredentials/)
  assert.match(mcpTools, /serpapiKey/)
  assert.match(serpapi, /serpapiKey\?: string/)
  assert.match(aiModel, /modelProviderKey\?: string/)
})

test('live api audits require at least one live credential source', async () => {
  const fs = await import('node:fs/promises')
  const v1AuditRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')

  assert.match(v1AuditRoute, /let liveCredentialsAvailable = serpapiAvailable \|\| modelAvailable/)
  assert.match(v1AuditRoute, /if \(\(validated\.mode === 'live' \|\| \(serpapiAvailable && validated\.mode !== 'demo'\)\) && liveCredentialsAvailable\)/)
  assert.match(v1AuditRoute, /Live audit credentials not configured/)
})

test('require-byok live api audits do not use platform providers for partial byok owners', async () => {
  const fs = await import('node:fs/promises')
  const v1AuditRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')

  assert.match(v1AuditRoute, /const requireOwnerByok = requireByokForLiveApi\(\) && validated\.mode !== 'demo'/)
  assert.match(v1AuditRoute, /const ownerModelAvailable = Boolean\(ownerCredentials\.modelProviderKey\)/)
  assert.match(v1AuditRoute, /const ownerSerpapiAvailable = Boolean\(ownerCredentials\.serpapiKey\)/)
  assert.match(v1AuditRoute, /extractClaims\(validated, ownerCredentials\.modelProviderKey, !requireOwnerByok\)/)
  assert.match(v1AuditRoute, /requireOwnerSerpApi: requireOwnerByok/)
  assert.doesNotMatch(v1AuditRoute, /if \(requireByokForLiveApi\(\) && validated\.mode !== 'demo' && !ownerHasByok\)/)
})

test('public demo api key is not accepted as an API fallback', async () => {
  const fs = await import('node:fs/promises')
  const v1AuditRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const authStore = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')

  assert.match(authStore, /configuredKey && configuredKey !== PUBLIC_DEMO_API_KEY/)
  assert.doesNotMatch(authStore, /return PUBLIC_DEMO_API_KEY/)
  assert.doesNotMatch(v1AuditRoute, /publicDemoFallback/)
  assert.doesNotMatch(v1AuditRoute, /public demo API key can only run demo audits/)
})

test('production sessions fail closed without SESSION_SECRET', async () => {
  const fs = await import('node:fs/promises')
  const authStore = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')

  assert.match(authStore, /function sessionSecret\(\)/)
  assert.match(authStore, /process\.env\.SESSION_SECRET\?\.trim\(\)/)
  assert.match(authStore, /NODE_ENV === 'production'[\s\S]{0,120}SESSION_SECRET is required/)
  assert.doesNotMatch(authStore, /return process\.env\.SESSION_SECRET \|\| process\.env\.AGENT_API_KEY \|\| 'hireproof_dev_session_secret'/)
})

test('configured auth and byok control secrets reject placeholders and weak values', async () => {
  const fs = await import('node:fs/promises')
  const authStore = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')

  assert.match(authStore, /SECRET_MIN_LENGTH = 32/)
  assert.match(authStore, /SECRET_MIN_DISTINCT_CHARS = 8/)
  assert.match(authStore, /PUBLIC_PLACEHOLDER_SECRETS/)
  assert.match(authStore, /paste_generated_session_secret_here/)
  assert.match(authStore, /paste_generated_byok_encryption_key_here/)
  assert.match(authStore, /paste_private_agent_api_key_here/)
  assert.match(authStore, /function isWeakSharedSecret/)
  assert.match(authStore, /requireStrongSharedSecret\(configured, 'SESSION_SECRET'\)/)
  assert.match(authStore, /requireStrongSharedSecret\(configured, 'BYOK_ENCRYPTION_KEY'\)/)
  assert.match(authStore, /configuredKey && configuredKey !== PUBLIC_DEMO_API_KEY && !isWeakSharedSecret\(configuredKey\)/)
  assert.doesNotMatch(authStore, /if \(configured\) return configured/)
})

test('environment API key fallback uses timing-safe comparison', async () => {
  const fs = await import('node:fs/promises')
  const authStore = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')

  assert.match(authStore, /function timingSafeStringEqual/)
  assert.match(authStore, /crypto\.timingSafeEqual/)
  assert.match(authStore, /fallbackKey && timingSafeStringEqual\(rawKey, fallbackKey\)/)
  assert.doesNotMatch(authStore, /fallbackKey && rawKey === fallbackKey/)
})

test('stored account API key hashes use timing-safe comparison', async () => {
  const fs = await import('node:fs/promises')
  const authStore = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')

  assert.match(authStore, /key\.keyHash\.length === keyHash\.length/)
  assert.match(authStore, /timingSafeStringEqual\(key\.keyHash, keyHash\)/)
  assert.match(authStore, /key\.keyHash\.length === keyHash\.length && timingSafeStringEqual\(key\.keyHash, keyHash\)/)
  assert.doesNotMatch(authStore, /key\.keyHash === keyHash/)
})

test('v1 audit supports explicit demo mode and clear missing live credential errors', async () => {
  const fs = await import('node:fs/promises')
  const v1AuditRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')

  assert.match(v1AuditRoute, /DEMO_FIXTURES/)
  assert.match(v1AuditRoute, /if \(validated\.mode === 'demo'\)/)
  assert.match(v1AuditRoute, /credentialMode: 'demo'/)
  assert.match(v1AuditRoute, /LiveAuditCredentialsError/)
  assert.match(v1AuditRoute, /err instanceof LiveAuditCredentialsError/)
  assert.match(v1AuditRoute, /status: 503/)
  assert.match(v1AuditRoute, /missing: error\.missing/)
})

test('v1 audit webhook delivery rejects private targets and blocks redirects', async () => {
  const fs = await import('node:fs/promises')
  const v1AuditRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const webhookSecurity = await fs.readFile(new URL('../lib/webhook-url-security.ts', import.meta.url), 'utf8')

  assert.match(v1AuditRoute, /from '@\/lib\/webhook-url-security'/)
  assert.match(webhookSecurity, /class WebhookUrlValidationError/)
  assert.match(webhookSecurity, /function validateWebhookUrl/)
  assert.match(webhookSecurity, /url\.protocol !== 'https:'/)
  assert.match(webhookSecurity, /url\.username \|\| url\.password/)
  assert.match(webhookSecurity, /dns\.lookup\(hostname, \{ all: true, verbatim: true \}\)/)
  assert.match(webhookSecurity, /resolved\.some\(\(record\) => isPrivateOrReservedIpAddress\(record\.address\)\)/)
  assert.match(v1AuditRoute, /validatedWebhookUrl = await validateWebhookUrl\(validated\.webhook_url\)/)
  assert.match(v1AuditRoute, /redirect: 'manual'/)
  assert.match(v1AuditRoute, /Redirect \$\{res\.status\} blocked/)
  assert.match(v1AuditRoute, /discardWebhookReceiverResponse\(res\)/)
  assert.doesNotMatch(v1AuditRoute, /fetch\(validated\.webhook_url/)
  assert.doesNotMatch(v1AuditRoute, /promisify\(dns\.lookup\)/)
})

test('developer webhook sandbox uses shared SSRF validation and blocks redirects', async () => {
  const fs = await import('node:fs/promises')
  const route = await fs.readFile(new URL('../app/api/developer/webhook-test/route.ts', import.meta.url), 'utf8')

  assert.match(route, /validateMutationOrigin/)
  assert.match(route, /getCurrentSessionUser/)
  assert.match(route, /checkRateLimit\(`developer_webhook_test:\$\{user\.id\}:\$\{requestIp\(request\)\}`/)
  assert.match(route, /from '@\/lib\/webhook-url-security'/)
  assert.match(route, /url = await validateWebhookUrl\(url\)/)
  assert.match(route, /redirect: 'manual'/)
  assert.match(route, /Webhook redirects are not followed for safety/)
  assert.match(route, /discardWebhookReceiverResponse\(response\)/)
  assert.doesNotMatch(route, /blockedIPRanges/)
  assert.doesNotMatch(route, /fetch\(url,[\s\S]{0,160}redirect: 'follow'/)
})
