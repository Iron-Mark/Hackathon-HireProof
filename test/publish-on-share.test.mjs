import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const read = (rel) => fs.readFile(new URL(rel, import.meta.url), 'utf8')

test('audit request schema accepts an optional publish flag', async () => {
  const schemas = await read('../lib/schemas.ts')
  assert.match(schemas, /publish:\s*z\.boolean\(\)\.optional\(\)/)
})

test('route persists demo reports only when publish is set; publiclyListed is unchanged', async () => {
  const route = await read('../app/api/audit/route.ts')
  assert.match(route, /if \(!demoMode \|\| validated\.publish\)/)
  // demo reports remain not-publicly-listed even when persisted for a share link
  assert.match(route, /publiclyListed:\s*!demoMode && !validated\.image/)
})

test('ResultScreen exposes a share-link callback and a copy-link control', async () => {
  const rs = await read('../components/audit/result-screen.tsx')
  assert.match(rs, /onRequestShareLink\?\:\s*\(\)\s*=>\s*Promise<string \| null>/)
  assert.match(rs, /const handleCopyLink = async/)
  assert.match(rs, /resolveShareLink/)
  // the share payload carries a url
  assert.match(rs, /text: shareText, url/)
})

test('audit client persists demo reports on share via publish:true and returns an /audit/[id] link', async () => {
  const client = await read('../app/audit/audit-client.tsx')
  assert.match(client, /const requestShareLink = async/)
  assert.match(client, /mode: 'demo', publish: true/)
  assert.match(client, /\/audit\/\$\{finalReport\.id\}/)
  assert.match(client, /onRequestShareLink=\{requestShareLink\}/)
})
