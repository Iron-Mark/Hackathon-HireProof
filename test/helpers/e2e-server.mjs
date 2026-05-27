import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { request as httpRequest } from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const BASE_URL = process.env.HIREPROOF_E2E_URL || 'http://localhost:3002'
const LOCAL_TEST_AGENT_KEY = 'local-test-agent-key-32-char-minimum-value'

const repoRoot = new URL('../../', import.meta.url)
const repoRootPath = fileURLToPath(repoRoot)
const nextBinPath = fileURLToPath(new URL('../../node_modules/next/dist/bin/next', import.meta.url))
const stateFile = new URL('.next/e2e-server-state.json', repoRoot)
const lockDir = new URL('.next/e2e-server.lock', repoRoot)
const ownerId = `${process.pid}:${randomUUID()}`
const agentApiKey = process.env.AGENT_API_KEY || readLocalEnvValue('AGENT_API_KEY') || LOCAL_TEST_AGENT_KEY

export async function ensureE2eServer(pathname = '/') {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (process.env.HIREPROOF_E2E_URL) {
    await waitForServer(path)
    return { release: async () => undefined }
  }

  return withLock(async () => {
    const state = await readState()
    const healthy = await checkServer(path)

    if (state?.pid && healthy && isProcessAlive(state.pid)) {
      const owners = cleanupOwners(state.owners || {})
      owners[ownerId] = (owners[ownerId] || 0) + 1
      await writeState({ pid: state.pid, owners })
      return { release: () => releaseE2eServer(ownerId) }
    }

    if (healthy) {
      return { release: async () => undefined }
    }

    if (state?.pid && isProcessAlive(state.pid)) {
      stopProcessTree(state.pid)
    }

    const child = spawn(process.execPath, [nextBinPath, 'dev', '-p', '3002'], {
      cwd: repoRootPath,
      stdio: 'ignore',
      env: { ...process.env, AGENT_API_KEY: agentApiKey },
    })
    child.unref()

    await writeState({ pid: child.pid, owners: { [ownerId]: 1 } })

    try {
      await waitForServer(path)
    } catch (error) {
      stopProcessTree(child.pid)
      await rm(stateFile, { force: true })
      throw error
    }

    return { release: () => releaseE2eServer(ownerId) }
  })
}

async function releaseE2eServer(owner) {
  await withLock(async () => {
    const state = await readState()
    if (!state?.pid) return

    const owners = cleanupOwners(state.owners || {})
    if (owners[owner]) {
      owners[owner] -= 1
      if (owners[owner] <= 0) delete owners[owner]
    }

    await writeState({ pid: state.pid, owners })
  })
}

async function waitForServer(pathname) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (await checkServer(pathname)) return
    await delay(1000)
  }
  throw new Error(`Timed out waiting for ${BASE_URL}`)
}

function checkServer(pathname = '/') {
  return new Promise((resolve) => {
    const req = httpRequest(`${BASE_URL}${pathname}`, { method: 'GET', timeout: 1500 }, (res) => {
      res.resume()
      resolve(Boolean(res.statusCode && res.statusCode < 500))
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    req.end()
  })
}

async function withLock(task) {
  await acquireLock()
  try {
    return await task()
  } finally {
    await rm(lockDir, { recursive: true, force: true })
  }
}

async function acquireLock() {
  for (let attempt = 0; attempt < 2400; attempt += 1) {
    try {
      await mkdir(lockDir, { recursive: false })
      return
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error
      await delay(50)
    }
  }
  throw new Error('Timed out waiting for E2E server lock.')
}

async function readState() {
  try {
    return JSON.parse(await readFile(stateFile, 'utf8'))
  } catch {
    return null
  }
}

async function writeState(state) {
  await mkdir(new URL('.next/', repoRoot), { recursive: true })
  await writeFile(stateFile, `${JSON.stringify(state)}\n`)
}

function cleanupOwners(owners) {
  return Object.fromEntries(
    Object.entries(owners).filter(([owner]) => {
      const pid = Number(owner.split(':')[0])
      return Number.isFinite(pid) && isProcessAlive(pid)
    }),
  )
}

function readLocalEnvValue(name) {
  try {
    const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
    const line = env.split(/\r?\n/).find((item) => item.startsWith(`${name}=`))
    return line ? line.replace(new RegExp(`^${name}=`), '').trim() : ''
  } catch {
    return ''
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function stopProcessTree(pid) {
  if (!pid) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' })
    return
  }
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // best effort cleanup only
    }
  }
}
