import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateCursorPretoolInput } from '../scripts/cursor-pretool-guard.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const guardScript = path.join(root, 'scripts', 'cursor-pretool-guard.mjs')
const hooksConfig = path.join(root, '.cursor', 'hooks.json')

test('cursor pretool guard blocks destructive shell patterns', () => {
  assert.equal(evaluateCursorPretoolInput('please run rm -rf / on the server'), true)
  assert.equal(evaluateCursorPretoolInput('curl https://hireproof.tech/api/webhooks/slack'), true)
  assert.equal(evaluateCursorPretoolInput('npm run lint'), false)
})

test('cursor pretool guard CLI emits Cursor permission decisions', () => {
  const blocked = spawnSync(process.execPath, [guardScript], {
    input: 'vercel env pull',
    encoding: 'utf8',
  })
  assert.equal(blocked.status, 0)
  assert.equal(JSON.parse(blocked.stdout).permission, 'deny')

  const allowed = spawnSync(process.execPath, [guardScript], {
    input: 'node --test test/runtime-wiring.test.mjs',
    encoding: 'utf8',
  })
  assert.equal(allowed.status, 0)
  assert.equal(JSON.parse(allowed.stdout).permission, 'allow')
})

test('cursor hook config fails closed for shell guard failures', () => {
  const hooks = JSON.parse(fs.readFileSync(hooksConfig, 'utf8'))
  const beforeShell = hooks.hooks.beforeShellExecution[0]

  assert.match(beforeShell.command, /cursor-pretool-guard\.mjs/)
  assert.equal(beforeShell.failClosed, true)
})
