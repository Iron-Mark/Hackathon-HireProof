#!/usr/bin/env node
/**
 * HireProof Cursor phase orchestrator.
 * Phase definitions: docs/cursor/README.md (cursor-orchestration-phases block)
 * Codex defaults: gpt-5.5 + model_reasoning_effort=high (read-only sandbox).
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readmePath = path.join(root, 'docs', 'cursor', 'README.md')

/** Machine defaults for Codex CLI on this repo (override via env). */
const CODEX_MODEL = process.env.CODEX_ORCHESTRATE_MODEL?.trim() || 'gpt-5.5'
const CODEX_REASONING_EFFORT = process.env.CODEX_ORCHESTRATE_REASONING_EFFORT?.trim() || 'high'
const CODEX_SANDBOX = process.env.CODEX_ORCHESTRATE_SANDBOX?.trim() || 'read-only'

const args = process.argv.slice(2)
const phaseFilter = (() => {
  const idx = args.indexOf('--phase')
  if (idx === -1) return null
  const value = Number.parseInt(args[idx + 1], 10)
  if (!Number.isInteger(value)) {
    console.error('Expected --phase <integer>')
    process.exit(1)
  }
  return value
})()
const skipCodex = args.includes('--no-codex')

function log(section, message) {
  console.log(`\n[${section}] ${message}`)
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    ...options,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(' ')} exited with code ${result.status ?? 1}`)
  }
}

function npmRun(script) {
  const result = spawnSync('npm', ['run', script], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`npm run ${script} exited with code ${result.status ?? 1}`)
  }
}

async function listCursorTests() {
  const testDir = path.join(root, 'test')
  const entries = await readdir(testDir)
  return entries
    .filter((name) => name.startsWith('cursor') && name.endsWith('.test.mjs'))
    .map((name) => path.join('test', name))
}

async function runCursorTests() {
  const files = await listCursorTests()
  if (files.length === 0) {
    throw new Error('No test/cursor*.test.mjs files found')
  }
  run(process.execPath, ['--experimental-strip-types', '--test', ...files])
}

async function loadPhases() {
  const readme = await readFile(readmePath, 'utf8')
  const match = readme.match(/<!-- cursor-orchestration-phases\s*([\s\S]*?)\s*-->/)
  if (!match) {
    throw new Error('Missing cursor-orchestration-phases block in docs/cursor/README.md')
  }
  return JSON.parse(match[1])
}

function codexOnPath() {
  const probe =
    process.platform === 'win32'
      ? spawnSync('where.exe', ['codex'], { encoding: 'utf8' })
      : spawnSync('command', ['-v', 'codex'], { encoding: 'utf8', shell: true })
  return probe.status === 0 && Boolean(probe.stdout?.trim())
}

/** Node spawn cannot run npm's codex.ps1 directly on Windows; use cmd.exe /c. */
function spawnCodex(commandArgs) {
  const options = {
    cwd: root,
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: false,
  }
  if (process.platform === 'win32') {
    return spawnSync('cmd.exe', ['/d', '/s', '/c', 'codex', ...commandArgs], options)
  }
  return spawnSync('codex', commandArgs, options)
}

function printCodexDiscoveryHelp() {
  console.log(`
Codex CLI was not found on PATH. Discover it with:
  Windows:  where.exe codex   |   Get-Command codex
  Unix:     command -v codex  |   which codex
  npm global: npm install -g @openai/codex   (or your org's Codex package)
See docs/cursor/orchestration.md for install notes and defaults (gpt-5.5, reasoning effort high).
`)
}

function buildCodexExecArgs(prompt) {
  return [
    'exec',
    '-m',
    CODEX_MODEL,
    '-c',
    `model_reasoning_effort="${CODEX_REASONING_EFFORT}"`,
    '-C',
    root,
    '-s',
    CODEX_SANDBOX,
    prompt,
  ]
}

function printManualCodexSteps(phase) {
  const prompt = phase.codexHandoff || phase.summary
  console.log('Manual Codex steps (non-destructive; respect scripts/cursor-pretool-guard.mjs):')
  console.log(`  cd "${root}"`)
  console.log(
    `  codex exec -m ${CODEX_MODEL} -c 'model_reasoning_effort="${CODEX_REASONING_EFFORT}"' -C "${root}" -s ${CODEX_SANDBOX} "<prompt>"`,
  )
  console.log('\nPrompt:')
  console.log(prompt)
}

function invokeCodexHandoff(phase) {
  if (!phase.runCodex) return
  if (skipCodex) {
    log('codex', 'Skipped (--no-codex)')
    return
  }

  const prompt = phase.codexHandoff || phase.summary
  if (!prompt?.trim()) {
    log('codex', 'No codexHandoff on this phase')
    return
  }

  if (!codexOnPath()) {
    log('codex', 'Not on PATH')
    printCodexDiscoveryHelp()
    printManualCodexSteps(phase)
    return
  }

  const handoffArgs = buildCodexExecArgs(prompt)
  log(
    'codex',
    `exec model=${CODEX_MODEL} effort=${CODEX_REASONING_EFFORT} sandbox=${CODEX_SANDBOX} cwd=${root}`,
  )
  const result = spawnCodex(handoffArgs)
  if (result.error) {
    log('codex', result.error.message)
    printManualCodexSteps(phase)
    return
  }
  if (result.status !== 0) {
    log('codex', `Handoff exited ${result.status ?? 1}; see manual steps below`)
    printManualCodexSteps(phase)
  }
}

function reportCursorConfigFiles(step) {
  for (const relative of step.paths) {
    const absolute = path.join(root, relative)
    if (!existsSync(absolute)) {
      throw new Error(`Missing required file: ${relative}`)
    }
    log('files', `ok ${relative}`)
  }
  log('phase-1', 'Cursor hooks, BUGBOT.md, hireproof-architecture skill, and pretool guard present.')
}

function reportInternalRoutes() {
  log('phase-4', 'Internal Cursor routes (documentation only — orchestrator does not call production).')
  console.log(`
Routes (require header x-cursor-job-secret = CURSOR_WEBHOOK_SECRET; never commit secrets):

  GET  /api/internal/cursor/nightly-repo-health
  POST /api/internal/cursor/ui-qa   body: { "baseUrl": "https://your-preview.example" }

PowerShell (local dev on port 3002; set secret in env first):

  $env:CURSOR_WEBHOOK_SECRET = '<from Vercel or .env.local>'
  Invoke-RestMethod -Method Get \`
    -Uri "http://127.0.0.1:3002/api/internal/cursor/nightly-repo-health" \`
    -Headers @{ "x-cursor-job-secret" = $env:CURSOR_WEBHOOK_SECRET }

  $body = @{ baseUrl = "http://127.0.0.1:3002" } | ConvertTo-Json
  Invoke-RestMethod -Method Post \`
    -Uri "http://127.0.0.1:3002/api/internal/cursor/ui-qa" \`
    -ContentType "application/json" \`
    -Headers @{ "x-cursor-job-secret" = $env:CURSOR_WEBHOOK_SECRET } \`
    -Body $body

Requires CURSOR_INTEGRATION_ENABLED=true and CURSOR_API_KEY on the server.
Do not curl hireproof.tech production without explicit ops approval.
Full detail: docs/cursor/automation.md and docs/cursor/deploy.md
`)
}

async function runSdkSmoke(step) {
  const envName = step.requiresEnv || 'CURSOR_API_KEY'
  const apiKey = process.env[envName]?.trim()
  if (!apiKey) {
    log('sdk-smoke', `Skipped (${envName} not set)`)
    return
  }

  const enabled = process.env.CURSOR_INTEGRATION_ENABLED === 'true'
  if (!enabled) {
    log(
      'sdk-smoke',
      `${envName} is set but CURSOR_INTEGRATION_ENABLED is not true — optional smoke note only (no live agent run)`,
    )
    return
  }

  log('sdk-smoke', `${envName} present and integration enabled — importing @cursor/sdk`)
  const { Agent } = await import('@cursor/sdk')
  if (typeof Agent?.create !== 'function' && typeof Agent?.prompt !== 'function') {
    throw new Error('@cursor/sdk Agent surface missing')
  }
  log('sdk-smoke', 'import ok (no live agent run from orchestrator)')
  log('sdk-smoke', 'Optional: node scripts/cursor-smoke.mjs with dev server on :3002')
}

async function runStep(step) {
  switch (step.type) {
    case 'npm':
      npmRun(step.script)
      break
    case 'cursor-tests':
      await runCursorTests()
      break
    case 'files':
      reportCursorConfigFiles(step)
      break
    case 'sdk-smoke':
      await runSdkSmoke(step)
      break
    case 'internal-routes-doc':
      reportInternalRoutes()
      break
    default:
      throw new Error(`Unknown step type: ${step.type}`)
  }
}

async function runPhase(phase) {
  log(`phase ${phase.id}`, `${phase.name}: ${phase.summary}`)
  for (const step of phase.steps) {
    await runStep(step)
  }
  invokeCodexHandoff(phase)
}

async function main() {
  const phases = await loadPhases()
  const selected =
    phaseFilter === null ? phases : phases.filter((phase) => phase.id === phaseFilter)

  if (selected.length === 0) {
    console.error(`No phase with id ${phaseFilter}`)
    process.exit(1)
  }

  log(
    'orchestrate',
    `HireProof Cursor phases: ${selected.map((p) => p.id).join(', ')} | codex=${CODEX_MODEL} effort=${CODEX_REASONING_EFFORT}`,
  )

  for (const phase of selected) {
    await runPhase(phase)
  }

  log('orchestrate', 'Done')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
