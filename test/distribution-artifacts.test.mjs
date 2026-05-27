import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

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

function listArchiveEntries(archive) {
  return execFileSync('tar', ['-tf', archive], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function readArchiveEntry(archive, entry) {
  try {
    return execFileSync('tar', ['-xOf', archive, entry], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    })
  } catch {
    return ''
  }
}

test('downloadable integration artifacts do not ship public API key residue', () => {
  for (const archive of archives) {
    assert.equal(fs.existsSync(archive), true, `${archive} should exist before artifact scanning`)

    const entries = listArchiveEntries(archive)
    assert.ok(entries.length > 0, `${archive} should contain packaged files`)

    for (const entry of entries) {
      const content = readArchiveEntry(archive, entry)
      for (const pattern of forbiddenPatterns) {
        assert.doesNotMatch(content, pattern, `${archive}:${entry} should not match ${pattern}`)
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
