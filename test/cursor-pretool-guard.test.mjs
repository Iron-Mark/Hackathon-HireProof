import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateCursorPretoolInput } from '../scripts/cursor-pretool-guard.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const guardScript = path.join(root, 'scripts', 'cursor-pretool-guard.mjs')

test('cursor pretool guard blocks destructive shell patterns', () => {
  assert.equal(evaluateCursorPretoolInput('please run rm -rf / on the server'), true)
  assert.equal(evaluateCursorPretoolInput('curl https://hireproof.tech/api/webhooks/slack'), true)
  assert.equal(evaluateCursorPretoolInput('npm run lint'), false)
})

test('cursor pretool guard CLI exits non-zero for blocked input', () => {
  const blocked = spawnSync(process.execPath, [guardScript], {
    input: 'vercel env pull',
    encoding: 'utf8',
  })
  assert.notEqual(blocked.status, 0)

  const allowed = spawnSync(process.execPath, [guardScript], {
    input: 'node --test test/runtime-wiring.test.mjs',
    encoding: 'utf8',
  })
  assert.equal(allowed.status, 0)
})
