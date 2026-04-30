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
  const source = await import('node:fs/promises').then((fs) =>
    fs.readFile(new URL('../app/api/developer/provider-credentials/route.ts', import.meta.url), 'utf8')
  )

  assert.match(source, /validateMutationOrigin/)
  assert.match(source, /request\.headers\.get\('origin'\)/)
  assert.match(source, /request\.headers\.get\('referer'\)/)
  assert.match(source, /new URL\(request\.url\)\.origin/)
  assert.match(source, /CSRF validation failed/)
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
