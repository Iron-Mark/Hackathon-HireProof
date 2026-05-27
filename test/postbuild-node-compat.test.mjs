import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'

test('postbuild middleware trace patch stays compatible with older Node 20 minors', async () => {
  const packageJson = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const script = await fs.readFile(new URL('../scripts/patch-middleware-swc-trace.mjs', import.meta.url), 'utf8')

  assert.equal(packageJson.scripts.postbuild, 'node scripts/patch-middleware-swc-trace.mjs')
  assert.match(script, /import\s+\{\s*fileURLToPath\s*\}\s+from 'node:url'/)
  assert.match(script, /path\.dirname\(fileURLToPath\(import\.meta\.url\)\)/)
  assert.doesNotMatch(script, /import\.meta\.dirname/)
})
