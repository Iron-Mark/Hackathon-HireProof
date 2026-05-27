import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { NextRequest } from 'next/server.js'

async function loadProxyModule() {
  const dir = await mkdtemp(path.join(tmpdir(), 'hireproof-proxy-'))
  const outfile = path.join(dir, 'proxy.cjs')
  await build({
    entryPoints: [path.resolve('proxy.ts')],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    logLevel: 'silent',
  })
  const mod = await import(pathToFileURL(outfile).href)
  return {
    proxy: mod.proxy,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  }
}

test('canonical redirects keep network-path-looking paths on the canonical host', async () => {
  const { proxy, cleanup } = await loadProxyModule()
  try {
    const cases = [
      [
        'https://www.hireproof.tech//evil.example/login?token=abc',
        'https://hireproof.tech//evil.example/login?token=abc',
      ],
      [
        'https://www.hireproof.tech/\\\\evil.example\\login?token=abc',
        'https://hireproof.tech///evil.example/login?token=abc',
      ],
    ]

    for (const [url, expectedLocation] of cases) {
      const req = new NextRequest(url, {
        headers: { host: 'www.hireproof.tech' },
      })
      const response = proxy(req)

      assert.equal(response.status, 308)
      assert.equal(response.headers.get('location'), expectedLocation)
    }
  } finally {
    await cleanup()
  }
})

test('canonical redirects preserve normal paths and search params', async () => {
  const { proxy, cleanup } = await loadProxyModule()
  try {
    const req = new NextRequest('https://hireproof-sigma.vercel.app/audit?ok=1', {
      headers: { host: 'hireproof-sigma.vercel.app' },
    })
    const response = proxy(req)

    assert.equal(response.status, 308)
    assert.equal(response.headers.get('location'), 'https://hireproof.tech/audit?ok=1')
  } finally {
    await cleanup()
  }
})
