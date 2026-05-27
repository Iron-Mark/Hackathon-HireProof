import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('public download CTAs use the rate-limited API download route', async () => {
  const files = [
    '../app/home-client.tsx',
    '../app/audit/audit-client.tsx',
    '../app/docs/automations/page.tsx',
    '../app/docs/chrome-extension/page.tsx',
  ]

  for (const file of files) {
    const source = await fs.readFile(new URL(file, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /href="\/downloads\/[^"]+"\s+download/)
  }

  const automations = await fs.readFile(new URL('../app/docs/automations/page.tsx', import.meta.url), 'utf8')
  assert.match(automations, /href: '\/api\/downloads\/hireproof-native-integrations\.zip'/)
  assert.match(automations, /href: '\/api\/downloads\/hireproof-n8n-workflow\.json'/)
})

test('download route allowlists files and rate-limits repeated downloads', async () => {
  const source = await fs.readFile(new URL('../app/api/downloads/[file]/route.ts', import.meta.url), 'utf8')
  const proxy = await fs.readFile(new URL('../proxy.ts', import.meta.url), 'utf8')

  assert.match(source, /ALLOWED_DOWNLOADS/)
  assert.match(source, /hireproof-native-integrations\.zip/)
  assert.match(source, /hireproof-extension\.zip/)
  assert.match(source, /checkRateLimit/)
  assert.match(source, /import \{ requestIp \} from '@\/lib\/request-security'/)
  assert.match(source, /download:/)
  assert.match(source, /limit:\s*20/)
  assert.match(source, /status:\s*429/)
  assert.match(source, /Content-Disposition/)
  assert.match(source, /attachment/)
  assert.doesNotMatch(source, /params\.file/)
  assert.doesNotMatch(source, /x-forwarded-for/)
  assert.doesNotMatch(source, /x-real-ip/)
  assert.match(proxy, /DOWNLOAD_ROUTE_FILES/)
  assert.match(proxy, /\/api\/downloads\//)
  assert.match(proxy, /NextResponse\.rewrite/)
  assert.doesNotMatch(proxy, /hireproof-hp-shield-bot-icon/)
})

test('download artifacts are present and extension packaging is reproducible', async () => {
  const downloads = [
    '../public/downloads/hireproof-automation-curl.sh',
    '../public/downloads/hireproof-extension.zip',
    '../public/downloads/hireproof-langchain-tool.ts',
    '../public/downloads/hireproof-make-http-config.json',
    '../public/downloads/hireproof-n8n-workflow.json',
    '../public/downloads/hireproof-native-integrations.zip',
  ]

  for (const file of downloads) {
    const stats = await fs.stat(new URL(file, import.meta.url))
    assert.ok(stats.size > 0, `${file} should be non-empty`)
  }

  const iconScript = await fs.readFile(new URL('../scripts/generate-extension-icons.mjs', import.meta.url), 'utf8')
  const packageScript = await fs.readFile(new URL('../scripts/package-extension.mjs', import.meta.url), 'utf8')
  const manifest = await fs.readFile(new URL('../extension/manifest.json', import.meta.url), 'utf8')

  assert.match(iconScript, /512/)
  assert.match(packageScript, /'512'/)
  assert.match(manifest, /"512": "icons\/icon512\.png"/)
})
