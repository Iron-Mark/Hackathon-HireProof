import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export const RESEARCH_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: { type: 'string' },
    },
    evidence: {
      type: 'array',
      items: { type: 'string' },
    },
    commands: {
      type: 'array',
      items: { type: 'string' },
    },
    nextSteps: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['summary', 'findings', 'evidence', 'commands', 'nextSteps'],
  additionalProperties: false,
}

const VALID_PROVIDERS = new Set(['cursor', 'codex', 'none'])
const DEFAULT_TIMEOUT_MS = 120_000
const MAX_BUFFER_BYTES = 2_000_000

function isEnabled(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim())
}

function normalizeProvider(value, fallback) {
  const normalized = String(value || '').trim().toLowerCase()
  return VALID_PROVIDERS.has(normalized) ? normalized : fallback
}

function truncate(value, limit = 4_000) {
  const text = String(value || '').trim()
  return text.length > limit ? `${text.slice(0, limit)}...` : text
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function extractJsonObject(value) {
  const text = String(value || '').trim()
  if (!text) return null

  const direct = safeJsonParse(text)
  if (direct && typeof direct === 'object') return direct

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenced) {
    const parsedFence = safeJsonParse(fenced[1])
    if (parsedFence && typeof parsedFence === 'object') return parsedFence
  }

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const parsedSlice = safeJsonParse(text.slice(firstBrace, lastBrace + 1))
    if (parsedSlice && typeof parsedSlice === 'object') return parsedSlice
  }

  return null
}

function coerceStringList(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

function normalizeResult(provider, status, result = {}) {
  return {
    provider,
    status,
    summary: truncate(result.summary || ''),
    findings: coerceStringList(result.findings),
    evidence: coerceStringList(result.evidence),
    commands: coerceStringList(result.commands),
    nextSteps: coerceStringList(result.nextSteps),
    raw: result.raw,
    error: result.error ? truncate(result.error, 2_000) : undefined,
  }
}

function unavailable(provider, reason) {
  return normalizeResult(provider, 'unavailable', {
    summary: reason,
    findings: [reason],
    evidence: [],
    commands: [],
    nextSteps: [],
    error: reason,
  })
}

function failed(provider, reason, raw) {
  return normalizeResult(provider, 'failed', {
    summary: reason,
    findings: [reason],
    evidence: [],
    commands: [],
    nextSteps: ['Review the local agent credentials and retry the research command.'],
    raw,
    error: reason,
  })
}

export function buildResearchPrompt(prompt) {
  return [
    'You are the HireProof research assistant for employment-fraud and job-scam investigation work.',
    'Keep the work scoped to suspicious job posts, recruiter messages, job URLs, evidence collection, provider wiring, MCP tools, and safety verdicts.',
    'Do not broaden the product into a generic fraud or security platform.',
    'Do not edit files. Inspect and summarize only.',
    'Return only JSON matching this exact shape: {"summary":"...","findings":["..."],"evidence":["..."],"commands":["..."],"nextSteps":["..."]}.',
    '',
    'Research task:',
    String(prompt || '').trim(),
  ].join('\n')
}

export function formatResearchMarkdown(result) {
  const lines = [
    '# HireProof Research Agent Report',
    '',
    `Provider: ${result.provider || 'unknown'}`,
    `Status: ${result.status || 'unknown'}`,
    '',
    '## Summary',
    '',
    result.summary || 'No summary returned.',
  ]

  for (const [title, items] of [
    ['Findings', result.findings],
    ['Evidence', result.evidence],
    ['Commands', result.commands],
    ['Next Steps', result.nextSteps],
  ]) {
    if (!items?.length) continue
    lines.push('', `## ${title}`, '')
    for (const item of items) lines.push(`- ${item}`)
  }

  if (result.attempts?.length) {
    lines.push('', '## Provider Attempts', '')
    for (const attempt of result.attempts) {
      lines.push(`- ${attempt.provider}: ${attempt.status}`)
    }
  }

  return `${lines.join('\n')}\n`
}

function resultFromText(provider, text, raw) {
  const parsed = extractJsonObject(text)
  if (parsed) {
    return normalizeResult(provider, 'ok', { ...parsed, raw })
  }

  return normalizeResult(provider, 'ok', {
    summary: truncate(text, 1_200) || `${provider} completed without a text response.`,
    findings: truncate(text, 2_000) ? [truncate(text, 2_000)] : [],
    evidence: [],
    commands: [],
    nextSteps: [],
    raw,
  })
}

export function parseCursorOutput(stdout) {
  const trimmed = String(stdout || '').trim()
  if (!trimmed) return null

  const wrapper = safeJsonParse(trimmed)
  if (wrapper && typeof wrapper === 'object') {
    const possibleText = wrapper.result || wrapper.text || wrapper.response || wrapper.message || wrapper.finalResponse
    if (possibleText && typeof possibleText === 'object') {
      return normalizeResult('cursor', 'ok', { ...possibleText, raw: wrapper })
    }
    if (typeof possibleText === 'string') {
      return resultFromText('cursor', possibleText, wrapper)
    }
    return normalizeResult('cursor', 'ok', {
      summary: 'Cursor completed the research task.',
      findings: [],
      evidence: [],
      commands: [],
      nextSteps: [],
      raw: wrapper,
    })
  }

  return resultFromText('cursor', trimmed, trimmed)
}

async function runProcess(command, args, options = {}) {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })

    let stdout = ''
    let stderr = ''
    let settled = false
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, timeoutMs)

    child.stdout?.on('data', (chunk) => {
      if (stdout.length < MAX_BUFFER_BYTES) stdout += chunk.toString()
    })

    child.stderr?.on('data', (chunk) => {
      if (stderr.length < MAX_BUFFER_BYTES) stderr += chunk.toString()
    })

    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ code: null, stdout, stderr, error })
    })

    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ code, stdout, stderr, timedOut })
    })
  })
}

function resolveCursorProcess(command, args, env = process.env) {
  if (process.platform !== 'win32') return { command, args }

  const cursorCommand = String(command || '').trim()
  if (/\.ps1$/i.test(cursorCommand)) {
    return {
      command: 'powershell.exe',
      args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', cursorCommand, ...args],
    }
  }

  const cursorBinName = cursorCommand.toLowerCase()
  const isDefaultCursorBin = ['cursor-agent', 'cursor-agent.cmd', 'cursor-agent.ps1'].includes(cursorBinName)
  const localAppData = env.LOCALAPPDATA || env.LocalAppData || env.localappdata
  const localCursorScript = localAppData ? path.join(localAppData, 'cursor-agent', 'cursor-agent.ps1') : ''
  if (isDefaultCursorBin && localCursorScript && fs.existsSync(localCursorScript)) {
    return {
      command: 'powershell.exe',
      args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', localCursorScript, ...args],
    }
  }

  return { command, args }
}

async function loadCodexSdk() {
  return import('@openai/codex-sdk')
}

async function withTimeout(promise, timeoutMs, message) {
  let timer
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function runCursorResearch(options = {}, deps = {}) {
  const env = options.env || process.env
  const prompt = buildResearchPrompt(options.prompt)
  const cursorBin = options.cursorBin || env.CURSOR_AGENT_BIN || 'cursor-agent'
  const args = ['-p', prompt, '--output-format', 'json']
  const cursorModel = options.cursorModel || env.CURSOR_AGENT_MODEL
  if (cursorModel) args.push('--model', cursorModel)
  const cursorProcess = resolveCursorProcess(cursorBin, args, env)

  const processResult = await (deps.runProcess || runProcess)(cursorProcess.command, cursorProcess.args, {
    cwd: options.cwd || process.cwd(),
    env,
    timeoutMs: options.timeoutMs || Number(env.CODEX_AGENT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  })

  if (processResult.error?.code === 'ENOENT') {
    return unavailable('cursor', `Cursor agent binary was not found: ${cursorBin}`)
  }

  if (processResult.timedOut) {
    return failed('cursor', `Cursor agent timed out after ${options.timeoutMs || env.CODEX_AGENT_TIMEOUT_MS || DEFAULT_TIMEOUT_MS}ms.`, processResult)
  }

  if (processResult.code !== 0) {
    return failed('cursor', truncate(processResult.stderr || `Cursor agent exited with code ${processResult.code}.`), processResult)
  }

  return parseCursorOutput(processResult.stdout) || failed('cursor', 'Cursor agent returned an empty response.', processResult)
}

export async function runCodexResearch(options = {}, deps = {}) {
  const env = options.env || process.env
  const codexEnabled = options.enableCodex === true || isEnabled(env.CODEX_SDK_ENABLED)
  if (!codexEnabled) {
    return unavailable('codex', 'Codex SDK fallback is disabled. Set CODEX_SDK_ENABLED=true or pass --enable-codex.')
  }

  try {
    const { Codex } = await (deps.loadCodexSdk || loadCodexSdk)()
    const codexModel = options.codexModel || env.CODEX_MODEL
    const codex = new Codex({
      env,
      config: codexModel ? { model: codexModel } : undefined,
    })
    const thread = codex.startThread({
      workingDirectory: options.cwd || process.cwd(),
      skipGitRepoCheck: true,
      sandboxMode: 'read-only',
      approvalPolicy: 'never',
      networkAccessEnabled: false,
    })
    const timeoutMs = options.timeoutMs || Number(env.CODEX_AGENT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS
    const turn = await withTimeout(
      thread.run(buildResearchPrompt(options.prompt), {
        outputSchema: RESEARCH_RESULT_SCHEMA,
      }),
      timeoutMs,
      `Codex SDK fallback timed out after ${timeoutMs}ms.`,
    )
    return resultFromText('codex', turn.finalResponse || '', turn)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Codex SDK fallback failed.'
    if (/Cannot find package|module not found|ERR_MODULE_NOT_FOUND/i.test(message)) {
      return unavailable('codex', 'Codex SDK package is not installed. Run npm install before using fallback research.')
    }
    return failed('codex', message, { message })
  }
}

export async function runResearchAgent(options = {}, deps = {}) {
  const env = options.env || process.env
  const primary = normalizeProvider(options.primary || env.RESEARCH_AGENT_PRIMARY, 'cursor')
  const fallback = normalizeProvider(options.fallback || env.RESEARCH_AGENT_FALLBACK, 'codex')
  const attempts = []

  async function runProvider(provider) {
    if (provider === 'cursor') return runCursorResearch(options, deps)
    if (provider === 'codex') return runCodexResearch(options, deps)
    return unavailable('none', 'No research agent provider is configured.')
  }

  const primaryResult = await runProvider(primary)
  attempts.push(primaryResult)
  if (primaryResult.status === 'ok') return { ...primaryResult, attempts }

  if (fallback && fallback !== primary && fallback !== 'none') {
    const fallbackResult = await runProvider(fallback)
    attempts.push(fallbackResult)
    return { ...fallbackResult, attempts }
  }

  return { ...primaryResult, attempts }
}
