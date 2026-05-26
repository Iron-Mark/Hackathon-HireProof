import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

const DEMO_EMAIL = 'judge@hackathon.com'

async function loadLoginRoute({ authenticateUser, makeSessionToken = () => 'session-token' }) {
  const source = await fs.readFile(new URL('../app/api/auth/login/route.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText

  const cookiesSet = []
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
        return { cookies: async () => ({ set: (...args) => cookiesSet.push(args) }) }
      }
      if (id === '@/lib/auth-store') {
        return { authenticateUser, makeSessionToken }
      }
      if (id === '@/lib/rate-limit') {
        return { checkRateLimit: async () => ({ success: true, remaining: 9 }) }
      }
      if (id === '@/lib/request-security') {
        return {
          validateMutationOrigin: () => null,
          requestIp: () => 'direct-client',
        }
      }
      if (id === '@/lib/demo-account') {
        return { isDemoAccountEmail: (email) => String(email || '').trim().toLowerCase() === DEMO_EMAIL }
      }
      throw new Error(`Unexpected require: ${id}`)
    },
  }
  context.module = { exports: context.exports }

  vm.runInNewContext(compiled, context)
  return { route: context.module.exports, cookiesSet }
}

function loginRequest(email = DEMO_EMAIL) {
  return new Request('http://localhost:3002/api/auth/login', {
    method: 'POST',
    headers: { origin: 'http://localhost:3002', 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'hireproof2026' }),
  })
}

test('normal login refuses the shared demo account instead of issuing a standard session', async () => {
  const { route, cookiesSet } = await loadLoginRoute({
    authenticateUser: async () => ({
      id: 'user_demo',
      email: DEMO_EMAIL,
      name: 'Demo Judge',
      createdAt: '2026-05-19T00:00:00.000Z',
    }),
  })

  const response = await route.POST(loginRequest())
  const body = await response.json()

  assert.equal(response.status, 403)
  assert.match(body.error, /demo login flow/i)
  assert.equal(cookiesSet.length, 0)
})

test('demo login creates a short server-valid session token for the shared account', async () => {
  const route = await fs.readFile(new URL('../app/api/auth/demo-login/route.ts', import.meta.url), 'utf8')
  const authStore = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')

  assert.match(route, /makeSessionToken\(user\.id,\s*DEMO_SESSION_TTL/)
  assert.match(route, /authenticateUser\(DEMO_EMAIL,\s*DEMO_PASSWORD,\s*\{\s*allowDemoAccount:\s*true\s*\}/)
  assert.match(route, /createUser\(DEMO_EMAIL,\s*DEMO_PASSWORD,\s*DEMO_NAME,\s*\{\s*allowDemoAccount:\s*true\s*\}/)
  assert.match(authStore, /allowDemoAccount/)
  assert.match(authStore, /isDemoAccountEmail\(normalizedEmail\)/)
})

test('demo account sessions are sandboxed away from developer resource mutations', async () => {
  const routes = [
    '../app/api/developer/keys/route.ts',
    '../app/api/developer/domains/route.ts',
    '../app/api/developer/domains/verify/route.ts',
    '../app/api/developer/provider-credentials/route.ts',
    '../app/api/developer/cursor/runs/route.ts',
    '../app/api/developer/repair-reports/route.ts',
  ]

  for (const routePath of routes) {
    const source = await fs.readFile(new URL(routePath, import.meta.url), 'utf8')
    assert.match(source, /isDemoAccountEmail/)
    assert.match(source, /status:\s*403/)
  }
})
