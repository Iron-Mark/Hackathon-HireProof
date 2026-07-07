import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import zlib from 'node:zlib'

const archives = [
  'public/downloads/hireproof-extension.zip',
  'public/downloads/hireproof-native-integrations.zip',
]

const forbiddenPatterns = [
  /hireproof_agent_demo_key/i,
  /public demo key/i,
  /demo api key/i,
  /bundled demo api key/i,
  /DEFAULT_API_KEY/,
]

// Pure-Node ZIP reader (no external tar/unzip, so the scan is portable across CI where
// GNU tar cannot read ZIP). Handles stored (method 0) and deflated (method 8) entries;
// the artifacts are STORE-only with accurate local-header sizes and no data descriptor
// (see scripts/package-extension.mjs makeZip).
const LOCAL_FILE_HEADER = 0x04034b50

function readZipEntries(archivePath) {
  const buf = fs.readFileSync(archivePath)
  const entries = []
  let pos = 0
  while (pos + 30 <= buf.length && buf.readUInt32LE(pos) === LOCAL_FILE_HEADER) {
    const method = buf.readUInt16LE(pos + 8)
    const compSize = buf.readUInt32LE(pos + 18)
    const nameLen = buf.readUInt16LE(pos + 26)
    const extraLen = buf.readUInt16LE(pos + 28)
    const nameStart = pos + 30
    const name = buf.toString('utf8', nameStart, nameStart + nameLen)
    const dataStart = nameStart + nameLen + extraLen
    const raw = buf.subarray(dataStart, dataStart + compSize)
    let content
    if (method === 0) content = raw
    else if (method === 8) { try { content = zlib.inflateRawSync(raw) } catch { content = Buffer.alloc(0) } }
    else content = Buffer.alloc(0)
    entries.push({ name, text: content.toString('utf8') })
    pos = dataStart + compSize
  }
  return entries
}

test('downloadable integration artifacts do not ship public API key residue', () => {
  for (const archive of archives) {
    assert.equal(fs.existsSync(archive), true, `${archive} should exist before artifact scanning`)

    const entries = readZipEntries(archive)
    assert.ok(entries.length > 0, `${archive} should contain packaged files`)

    for (const { name, text } of entries) {
      for (const pattern of forbiddenPatterns) {
        assert.doesNotMatch(text, pattern, `${archive}:${name} should not match ${pattern}`)
      }
    }
  }
})

test('downloadable LangChain tool caps audit API response parsing', () => {
  const source = fs.readFileSync('public/downloads/hireproof-langchain-tool.ts', 'utf8')

  assert.match(source, /MAX_AUDIT_RESPONSE_BYTES\s*=\s*256\s*\*\s*1024/)
  assert.match(source, /content-length/)
  assert.match(source, /getReader/)
  assert.match(source, /response\.body\?\.cancel\(\)\.catch\(\(\) => undefined\)/)
  assert.match(source, /reader\.cancel\(\)\.catch\(\(\) => undefined\)/)
  assert.doesNotMatch(source, /await response\.json\(\)/)
})
