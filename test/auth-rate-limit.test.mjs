import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
import net from 'node:net'

async function loadRequestSecurityModule(env = {}) {
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
    process: { env },
    URL,
    Request,
    Headers,
    Response,
    require: (id) => {
      if (id === 'next/server') {
        return { NextResponse: { json: (body, init) => new Response(JSON.stringify(body), init) } }
      }
      if (id === 'node:net') {
        return { default: net, ...net }
      }
      throw new Error(`Unexpected require: ${id}`)
    },
  }
  context.module = { exports: context.exports }

  vm.runInNewContext(compiled, context)
  return context.module.exports
}

async function loadAuthRouteModule(routePath, { checkRateLimit }) {
  const source = await fs.readFile(new URL(routePath, import.meta.url), 'utf8')
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
    require: (id) => {
      if (id === 'next/server') {
        return { NextResponse: { json: (body, init) => new Response(JSON.stringify(body), init) } }
      }
      if (id === 'next/headers') {
        return { cookies: async () => ({ set: () => undefined }) }
      }
      if (id === '@/lib/rate-limit') {
        return { checkRateLimit }
      }
      if (id === '@/lib/request-security') {
        return {
          validateMutationOrigin: () => null,
          rejectOversizedRequest: () => null,
          readJsonRequest: async (request) => ({ ok: true, value: await request.json() }),
          requestIp: (request) => request.headers.get('x-real-ip') || 'direct-client',
        }
      }
      if (id === '@/lib/auth-store') {
        return {
          authenticateUser: async () => null,
          createUser: async () => {
            throw new Error('Password must be at least 8 characters.')
          },
          makeSessionToken: () => 'session-token',
        }
      }
      if (id === '@/lib/response-security') {
        return { noStoreJson: (body, init) => new Response(JSON.stringify(body), init) }
      }
      if (id === '@/lib/demo-account') {
        return { isDemoAccountEmail: () => false }
      }
      throw new Error(`Unexpected require: ${id}`)
    },
  }
  context.module = { exports: context.exports }

  vm.runInNewContext(compiled, context)
  return context.module.exports
}

function authRequest(email) {
  return new Request('http://localhost:3002/api/auth/login', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3002',
      'content-type': 'application/json',
      'x-real-ip': '203.0.113.10',
      'x-forwarded-for': '198.51.100.20',
    },
    body: JSON.stringify({ email, password: 'wrong-password' }),
  })
}

test('requestIp ignores spoofable forwarding headers unless trusted proxy mode is enabled', async () => {
  const untrusted = await loadRequestSecurityModule()
  const request = authRequest('target@example.com')

  assert.equal(untrusted.requestIp(request), 'direct-client')

  const trusted = await loadRequestSecurityModule({ TRUST_PROXY_CLIENT_IP_HEADERS: 'true' })
  assert.equal(trusted.requestIp(request), '203.0.113.10')
})

test('trusted proxy client IP parsing rejects malformed forwarding header identities', async () => {
  const trusted = await loadRequestSecurityModule({ TRUST_PROXY_CLIENT_IP_HEADERS: 'true' })
  const markdownSecurity = await fs.readFile(new URL('../docs/security.md', import.meta.url), 'utf8')
  const appSecurity = await fs.readFile(new URL('../app/docs/security/page.tsx', import.meta.url), 'utf8')

  assert.equal(trusted.requestIp(new Request('http://localhost:3002/api/auth/login', {
    headers: {
      'x-real-ip': 'deadbeef',
      'x-forwarded-for': '198.51.100.20',
    },
  })), '198.51.100.20')

  assert.equal(trusted.requestIp(new Request('http://localhost:3002/api/auth/login', {
    headers: {
      'x-real-ip': '999.999.999.999',
      'x-forwarded-for': 'also-not-an-ip',
    },
  })), 'direct-client')

  assert.match(markdownSecurity, /malformed forwarding values are rejected unless they parse as real IP literals/)
  assert.match(appSecurity, /trusted-proxy mode only accepts syntactically valid IP literals/)
})

test('public audit and demo login rate limits use the shared request IP helper', async () => {
  const auditRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const demoLoginRoute = await fs.readFile(new URL('../app/api/auth/demo-login/route.ts', import.meta.url), 'utf8')

  assert.match(demoLoginRoute, /from '@\/lib\/rate-limit'/)
  assert.match(auditRoute, /const clientIdentifier = requestIp\(request\)/)
  assert.match(auditRoute, /audit_ui:\$\{clientIdentifier\}/)
  assert.match(demoLoginRoute, /requestIp\(request\)/)
  assert.match(demoLoginRoute, /demo_login:\$\{ip\}/)
  assert.doesNotMatch(demoLoginRoute, /if \(!redis\) return \{ allowed: true/)
  assert.doesNotMatch(auditRoute, /headers\.get\('x-real-ip'\)|headers\.get\('x-forwarded-for'\)/)
  assert.doesNotMatch(demoLoginRoute, /reqHeaders\.get\('x-real-ip'\)|reqHeaders\.get\('x-forwarded-for'\)/)
})

test('demo login uses the shared origin validator instead of trusting request URL origin', async () => {
  const demoLoginRoute = await fs.readFile(new URL('../app/api/auth/demo-login/route.ts', import.meta.url), 'utf8')

  assert.match(demoLoginRoute, /validateMutationOrigin/)
  assert.match(demoLoginRoute, /const csrfError = validateMutationOrigin\(request\)/)
  assert.match(demoLoginRoute, /if \(csrfError\) return csrfError/)
  assert.doesNotMatch(demoLoginRoute, /function assertSameOrigin/)
  assert.doesNotMatch(demoLoginRoute, /new URL\(request\.url\)\.origin/)
})

test('logout explicitly expires the root-path session cookie', async () => {
  const logoutRoute = await fs.readFile(new URL('../app/api/auth/logout/route.ts', import.meta.url), 'utf8')

  assert.match(logoutRoute, /validateMutationOrigin/)
  assert.match(logoutRoute, /cookieStore\.set\('hireproof_session',\s*''/)
  assert.match(logoutRoute, /httpOnly:\s*true/)
  assert.match(logoutRoute, /sameSite:\s*'lax'/)
  assert.match(logoutRoute, /secure:\s*process\.env\.NODE_ENV === 'production'/)
  assert.match(logoutRoute, /path:\s*'\/'/)
  assert.match(logoutRoute, /maxAge:\s*0/)
  assert.doesNotMatch(logoutRoute, /cookieStore\.delete\('hireproof_session'\)/)
})

test('session mutation routes return no-store responses for cookie-bearing auth flows', async () => {
  for (const routePath of [
    '../app/api/auth/login/route.ts',
    '../app/api/auth/register/route.ts',
    '../app/api/auth/demo-login/route.ts',
    '../app/api/auth/logout/route.ts',
  ]) {
    const source = await fs.readFile(new URL(routePath, import.meta.url), 'utf8')
    assert.match(source, /noStoreJson/, `${routePath} should use noStoreJson for session responses`)
  }
})

test('public audit route uses exact same-origin validation instead of substring allowlists', async () => {
  const auditRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const requestSecurity = await fs.readFile(new URL('../lib/request-security.ts', import.meta.url), 'utf8')

  assert.match(auditRoute, /validateMutationOrigin/)
  assert.match(auditRoute, /const csrfError = validateMutationOrigin\(request\)/)
  assert.match(auditRoute, /if \(csrfError\) return csrfError/)
  assert.match(requestSecurity, /allowedMutationOrigins/)
  assert.doesNotMatch(auditRoute, /\['localhost', 'vercel\.app', 'hireproof'\]/)
  assert.doesNotMatch(auditRoute, /source\.includes/)
})

test('same-origin validation does not trust spoofed request URL origins in production', async () => {
  const requestSecurity = await loadRequestSecurityModule({
    APP_BASE_URL: 'https://hireproof.tech',
    NODE_ENV: 'production',
  })

  const spoofedHostRequest = new Request('https://evil.example/api/audit', {
    method: 'POST',
    headers: { origin: 'https://evil.example' },
  })
  const canonicalRequest = new Request('https://evil.example/api/audit', {
    method: 'POST',
    headers: { origin: 'https://hireproof.tech' },
  })

  assert.equal(requestSecurity.validateMutationOrigin(canonicalRequest), null)
  assert.equal(requestSecurity.validateMutationOrigin(spoofedHostRequest).status, 403)
})

test('login and registration rate limits include a per-email bucket independent of client IP headers', async () => {
  const captured = []
  const checkRateLimit = async (identifier) => {
    captured.push(identifier)
    return { success: true, remaining: 1 }
  }

  const loginRoute = await loadAuthRouteModule('../app/api/auth/login/route.ts', { checkRateLimit })
  const registerRoute = await loadAuthRouteModule('../app/api/auth/register/route.ts', { checkRateLimit })

  await loginRoute.POST(authRequest('Target@Example.com'))
  await registerRoute.POST(authRequest('Target@Example.com'))

  assert.ok(captured.includes('auth_login:email:target@example.com'))
  assert.ok(captured.includes('auth_register:email:target@example.com'))
  assert.ok(captured.some((key) => /^auth_login:client:/.test(key)))
  assert.ok(captured.some((key) => /^auth_register:client:/.test(key)))
})

test('agent API rate-limit and guardrail buckets do not include raw API keys', async () => {
  const auditRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const mcpRoute = await fs.readFile(new URL('../app/api/mcp/route.ts', import.meta.url), 'utf8')

  assert.match(auditRoute, /apiAuth\.apiKeyId/)
  assert.match(mcpRoute, /apiAuth\.apiKeyId/)
  assert.doesNotMatch(auditRoute, /checkRateLimit\(apiKey/)
  assert.doesNotMatch(auditRoute, /identifier:\s*apiKey/)
  assert.doesNotMatch(mcpRoute, /mcp_\$\{apiKey\}/)
})
