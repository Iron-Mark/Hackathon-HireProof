import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('verified badge HTML escapes rendered labels and domains', async () => {
  const source = await fs.readFile(new URL('../app/api/verified-badge/route.ts', import.meta.url), 'utf8')

  assert.match(source, /function escapeHtml/)
  assert.match(source, /MAX_BADGE_QUERY_DOMAIN_LENGTH = 253/)
  assert.match(source, /MAX_BADGE_QUERY_TOKEN_LENGTH = 128/)
  assert.match(source, /rawDomain\.length <= MAX_BADGE_QUERY_DOMAIN_LENGTH/)
  assert.match(source, /rawToken\.length <= MAX_BADGE_QUERY_TOKEN_LENGTH/)
  assert.match(source, /checkRateLimit\(`verified_badge_embed:\$\{requestIp\(request\)\}:/)
  assert.match(source, /Rate limit exceeded/)
  assert.match(source, /safeLabel = escapeHtml\(label\)/)
  assert.match(source, /safeSublabel = escapeHtml/)
  assert.match(source, /aria-label="\$\{safeLabel\}"/)
  assert.match(source, /X-Content-Type-Options': 'nosniff'/)
  assert.doesNotMatch(source, /<div class="sub">\$\{sublabel\}/)
  assert.doesNotMatch(source, /aria-label="\$\{label\}"/)
})

test('verified badge script caps reflected query parameters', async () => {
  const source = await fs.readFile(new URL('../app/api/verified-badge/script/route.ts', import.meta.url), 'utf8')

  assert.match(source, /rawDomain\.length <= 253/)
  assert.match(source, /rawToken\.length <= 128/)
  assert.match(source, /JSON\.stringify/)
  assert.match(source, /X-Content-Type-Options': 'nosniff'/)
})

test('verified badge status caps public lookup inputs and rate limits token checks', async () => {
  const source = await fs.readFile(new URL('../app/api/verified-badge/status/route.ts', import.meta.url), 'utf8')

  assert.match(source, /MAX_BADGE_DOMAIN_LENGTH = 253/)
  assert.match(source, /MAX_BADGE_TOKEN_LENGTH = 128/)
  assert.match(source, /rawDomain\.length <= MAX_BADGE_DOMAIN_LENGTH/)
  assert.match(source, /rawToken\.length <= MAX_BADGE_TOKEN_LENGTH/)
  assert.match(source, /checkRateLimit\(`verified_badge_status:\$\{requestIp\(request\)\}:/)
  assert.match(source, /Rate limit exceeded/)
  assert.match(source, /X-Content-Type-Options': 'nosniff'/)
})

test('verified badge public token lookup uses timing-safe comparison', async () => {
  const authStore = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')

  assert.match(authStore, /function timingSafeStringEqual/)
  assert.match(authStore, /record\.domain === domain && timingSafeStringEqual\(record\.publicToken, publicToken\)/)
  assert.doesNotMatch(authStore, /record\.domain === domain && record\.publicToken === publicToken/)
})
