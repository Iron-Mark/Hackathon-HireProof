#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const DEFAULT_BASE_URL = 'https://hireproof.tech'
const DEFAULT_API_KEY = 'hireproof_agent_demo_key'
const CONFIG_KEYS = new Set(['baseUrl', 'apiKey'])
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g

function printHelp() {
  console.log(`HireProof CLI

Usage:
  hireproof
  hireproof tui
  hireproof audit --text "Remote job..." [options]
  hireproof audit --file ./job.txt [options]
  hireproof audit ./job.txt [options]
  hireproof health [options]
  hireproof config <set|get|list|unset> [key] [value]

Commands:
  tui        Open the interactive HireProof terminal UI
  audit      Run a HireProof job-post audit
  health     Check the HireProof API health endpoint
  config     Store local baseUrl and apiKey defaults

Audit options:
  --text <text>          Job post or recruiter message text
  --file <path>          Read job post text from a file
  --url <url>            Job post URL context
  --location <place>     Location context
  --mode <demo|live>     Audit mode
  --webhook-url <url>    Ask the API to process asynchronously
  --json                 Print raw JSON
  --plain                Print simple non-boxed text
  --no-color             Disable ANSI colors
  --verbose              Show more evidence and longer snippets

Shared options:
  --base-url <url>       Defaults to config, HIREPROOF_URL, or ${DEFAULT_BASE_URL}
  --api-key <key>        Defaults to config, HIREPROOF_API_KEY, or public demo key
  --help                 Show help
`)
}

function printError(message) {
  console.error(`HireProof CLI error: ${message}`)
}

function parseArgs(argv) {
  const flags = {}
  const positionals = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) {
      positionals.push(arg)
      continue
    }

    const [rawKey, inlineValue] = arg.slice(2).split('=', 2)
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    if (['help', 'json', 'plain', 'noColor', 'verbose'].includes(key)) {
      flags[key] = true
      continue
    }

    const next = inlineValue ?? argv[index + 1]
    if (next === undefined || String(next).startsWith('--')) {
      flags[key] = ''
      continue
    }
    flags[key] = next
    if (inlineValue === undefined) index += 1
  }

  return { flags, positionals }
}

function configFilePath() {
  const home = process.env.HIREPROOF_CONFIG_HOME || path.join(os.homedir(), '.hireproof')
  return path.join(home, 'config.json')
}

async function readConfig() {
  try {
    return JSON.parse(await readFile(configFilePath(), 'utf8'))
  } catch {
    return {}
  }
}

async function writeConfig(config) {
  const file = configFilePath()
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(config, null, 2)}\n`)
}

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

async function getRuntimeOptions(flags) {
  const config = await readConfig()
  return {
    baseUrl: normalizeBaseUrl(flags.baseUrl || process.env.HIREPROOF_URL || config.baseUrl || DEFAULT_BASE_URL),
    apiKey: String(flags.apiKey || process.env.HIREPROOF_API_KEY || config.apiKey || DEFAULT_API_KEY),
  }
}

async function readAuditText(flags, positionals) {
  if (flags.text) return String(flags.text)
  if (flags.file) return (await readFile(flags.file, 'utf8')).trim()

  if (positionals.length === 1 && existsSync(positionals[0])) {
    return (await readFile(positionals[0], 'utf8')).trim()
  }

  const inline = positionals.join(' ').trim()
  if (inline) return inline
  throw new Error('Provide job text with --text, --file, or a positional file/text argument.')
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { error: text || `HTTP ${response.status}` }
  }

  if (!response.ok) {
    const message = body?.error || body?.message || `HTTP ${response.status}`
    throw new Error(message)
  }

  return body
}

function titleCase(value) {
  return String(value || '')
    .split('-')
    .map(part => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join('-')
}

function terminalWidth() {
  const width = Number(process.stdout.columns || 80)
  return Math.max(64, Math.min(width || 80, 110))
}

function shouldUseColor(flags) {
  return Boolean(process.stdout.isTTY && !process.env.NO_COLOR && !flags.noColor)
}

function palette(enabled) {
  const wrap = code => value => enabled ? `\u001b[${code}m${value}\u001b[0m` : value
  return {
    bold: wrap('1'),
    accent: wrap('38;2;18;134;79'),
    lime: wrap('38;2;85;240;111'),
    green: wrap('38;2;22;124;92'),
    yellow: wrap('38;2;161;98;7'),
    red: wrap('38;2;180;35;24'),
    evidence: wrap('38;2;29;78;216'),
    muted: wrap('90'),
  }
}

function verdictTheme(verdict, color) {
  const normalized = String(verdict || '').toLowerCase()
  if (normalized === 'safe') return { label: 'Safe', paint: color.green }
  if (normalized === 'caution') return { label: 'Caution', paint: color.yellow }
  if (normalized === 'high-risk') return { label: 'High-Risk', paint: color.red }
  return { label: titleCase(normalized || 'unknown'), paint: color.muted }
}

function truncate(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

function visibleLength(value) {
  return String(value || '').replace(ANSI_PATTERN, '').length
}

function padVisible(value, length) {
  const text = String(value || '')
  if (visibleLength(text) >= length) return text
  return `${text}${' '.repeat(length - visibleLength(text))}`
}

function padRight(value, length) {
  const text = String(value)
  if (text.length >= length) return text
  return `${text}${' '.repeat(length - text.length)}`
}

function row(label, value, labelWidth = 18) {
  return `${padRight(label, labelWidth)} ${value || 'Not specified'}`
}

function wrapLine(value, width) {
  if (!value) return ['']
  const words = String(value).split(' ')
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (visibleLength(next) > width) {
      if (current) lines.push(current)
      current = visibleLength(word) > width ? word.replace(ANSI_PATTERN, '').slice(0, width) : word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines
}

function section(title, bodyLines, width = terminalWidth()) {
  const innerWidth = width - 4
  const lines = Array.isArray(bodyLines) ? bodyLines : [bodyLines]
  const top = `+${'-'.repeat(width - 2)}+`
  const heading = `| ${padVisible(title, innerWidth)} |`
  const divider = `|${'-'.repeat(width - 2)}|`
  const body = lines
    .flatMap(line => wrapLine(String(line || ''), innerWidth))
    .map(line => `| ${padVisible(line, innerWidth)} |`)

  return [top, heading, divider, ...body, top].join('\n')
}

function riskBar(score) {
  const safeScore = Math.max(0, Math.min(100, Number(score || 0)))
  const blocks = 24
  const filled = Math.round((safeScore / 100) * blocks)
  return `[${'#'.repeat(filled)}${'-'.repeat(blocks - filled)}]`
}

function list(label, values) {
  if (!Array.isArray(values) || values.length === 0) return ''
  return [`${label}:`, ...values.slice(0, 5).map(value => `  - ${value}`)].join('\n')
}

function formatPlainAuditReport(report) {
  const lines = [
    `Verdict: ${titleCase(report.verdict || 'unknown')}`,
    `Score: ${Number(report.riskScore ?? 0)}/100`,
    report.confidence ? `Confidence: ${report.confidence}` : '',
    report.mode ? `Mode: ${report.mode}` : '',
    report.summary ? `Summary: ${report.summary}` : '',
    '',
    list('Red flags', report.redFlags),
    list('Green flags', report.greenFlags),
    list('Next steps', report.nextSteps),
  ].filter(Boolean)

  if (Array.isArray(report.evidence) && report.evidence.length > 0) {
    lines.push('Evidence:')
    for (const item of report.evidence.slice(0, 5)) {
      lines.push(`  - ${item.type || 'Evidence'}: ${item.snippet || item.source || 'No snippet'}`)
      if (item.url) lines.push(`    ${item.url}`)
    }
  }

  if (report.id) lines.push(`Report ID: ${report.id}`)
  return `${lines.join('\n')}\n`
}

function formatRichAuditReport(report, flags = {}) {
  const width = terminalWidth()
  const color = palette(shouldUseColor(flags))
  const theme = verdictTheme(report.verdict, color)
  const score = Number(report.riskScore ?? 0)
  const evidenceLimit = flags.verbose ? 8 : 3
  const snippetLimit = flags.verbose ? 180 : 96
  const reportUrl = report.reportUrl || report.url
  const lines = [
    section(`${color.accent('HIREPROOF')} TERMINAL REPORT`, [
      `${color.muted('Verdict')} ${theme.paint(theme.label)}    ${color.muted('Score:')} ${score}/100 ${riskBar(score)}`,
      `${color.muted('Confidence:')} ${report.confidence || 'unknown'}    ${color.muted('Mode:')} ${report.mode || 'unknown'}${report.id ? `    ${color.muted('Report ID:')} ${report.id}` : ''}`,
    ], width),
    section('Summary', [report.summary || 'No summary returned.'], width),
    section('Claims', [
      row('Company', report.extractedClaims?.company),
      row('Role', report.extractedClaims?.role),
      row('Salary', report.extractedClaims?.salary),
      row('Location', report.extractedClaims?.location),
      row('Contact', report.extractedClaims?.contactMethod),
      row('Application path', report.extractedClaims?.applicationPath),
    ], width),
  ]

  if (Array.isArray(report.redFlags) && report.redFlags.length) {
    lines.push(section('Red Flags', report.redFlags.slice(0, flags.verbose ? 8 : 5).map(item => `- ${item}`), width))
  }

  if (Array.isArray(report.greenFlags) && report.greenFlags.length) {
    lines.push(section('Green Flags', report.greenFlags.slice(0, flags.verbose ? 8 : 5).map(item => `- ${item}`), width))
  }

  if (Array.isArray(report.nextSteps) && report.nextSteps.length) {
    lines.push(section('Next Steps', report.nextSteps.slice(0, flags.verbose ? 8 : 5).map(item => `- ${item}`), width))
  }

  if (Array.isArray(report.evidence) && report.evidence.length) {
    const evidenceLines = report.evidence.slice(0, evidenceLimit).flatMap((item, index) => [
      `${index + 1}. ${item.type || 'Evidence'} - ${truncate(item.snippet || item.source || 'No snippet', snippetLimit)}`,
      item.url ? `   ${truncate(item.url, snippetLimit)}` : '',
    ]).filter(Boolean)

    if (report.evidence.length > evidenceLimit) {
      evidenceLines.push(`Showing ${evidenceLimit} of ${report.evidence.length}. Use --verbose to show more.`)
    }
    lines.push(section('Evidence', evidenceLines, width))
  }

  if (reportUrl) {
    lines.push(section('Report Link', [reportUrl], width))
  }

  return `${lines.join('\n\n')}\n`
}

function formatPlainHealth(health) {
  const lines = [
    `HireProof API: ${health?.status || 'unknown'}`,
    `Live search: ${health?.liveSearch ? 'ready' : 'not ready'}`,
    `Model: ${health?.model ? 'ready' : 'not ready'}`,
  ]

  if (health?.storage) lines.push(`Storage: ${health.storage}`)
  if (health?.modelProvider?.model) lines.push(`Model provider: ${health.modelProvider.model}`)
  return `${lines.join('\n')}\n`
}

function readyLabel(value) {
  return value ? 'ready' : 'not ready'
}

function formatRichHealth(health, flags = {}) {
  const width = terminalWidth()
  const color = palette(shouldUseColor(flags))
  const status = health?.status || 'unknown'
  const statusColor = status === 'ok' ? color.green : color.red
  return `${section(`${color.accent('HIREPROOF')} HEALTH CHECK`, [
    `${color.accent('HireProof')} API: ${status}`,
    row('API', statusColor(status), 16),
    row('Storage', health?.storage || 'unknown', 16),
    row('Live search', readyLabel(health?.liveSearch), 16),
    row('Model', readyLabel(health?.model), 16),
    row('AI Gateway', readyLabel(health?.modelProvider?.aiGateway), 16),
    row('OpenAI fallback', readyLabel(health?.modelProvider?.openaiCompatible), 16),
    row('Model provider', health?.modelProvider?.model || 'unknown', 16),
  ], width)}\n`
}

async function commandHealth(argv) {
  const { flags } = parseArgs(argv)
  if (flags.help) {
    console.log('Usage: hireproof health [--base-url <url>] [--json] [--plain] [--no-color]')
    return 0
  }

  const { baseUrl } = await getRuntimeOptions(flags)
  const health = await requestJson(`${baseUrl}/api/health`)
  process.stdout.write(flags.json ? `${JSON.stringify(health, null, 2)}\n` : flags.plain ? formatPlainHealth(health) : formatRichHealth(health, flags))
  return 0
}

async function commandAudit(argv) {
  const { flags, positionals } = parseArgs(argv)
  if (flags.help) {
    console.log('Usage: hireproof audit --text "..." [--mode demo|live] [--json] [--plain] [--no-color] [--verbose]')
    return 0
  }

  const { baseUrl, apiKey } = await getRuntimeOptions(flags)
  const text = await readAuditText(flags, positionals)
  const payload = {
    text,
    ...(flags.url ? { url: flags.url } : {}),
    ...(flags.location ? { location: flags.location } : {}),
    ...(flags.mode ? { mode: flags.mode } : {}),
    ...(flags.webhookUrl ? { webhook_url: flags.webhookUrl } : {}),
  }

  const report = await requestJson(`${baseUrl}/api/v1/audit`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  })

  process.stdout.write(flags.json ? `${JSON.stringify(report, null, 2)}\n` : flags.plain ? formatPlainAuditReport(report) : formatRichAuditReport(report, flags))
  return 0
}

async function commandConfig(argv) {
  const [action, key, ...rest] = argv
  const value = rest.join(' ')

  if (!action || action === '--help') {
    console.log(`Usage:
  hireproof config set baseUrl https://hireproof.tech
  hireproof config set apiKey <key>
  hireproof config get <key>
  hireproof config list
  hireproof config unset <key>`)
    return 0
  }

  const config = await readConfig()

  if (action === 'list') {
    const keys = Object.keys(config)
    if (keys.length === 0) {
      console.log('No HireProof CLI config set.')
    } else {
      for (const item of keys) console.log(`${item}: ${config[item]}`)
    }
    return 0
  }

  if (!CONFIG_KEYS.has(key)) throw new Error(`Unsupported config key: ${key || '(missing)'}`)

  if (action === 'set') {
    if (!value) throw new Error(`Missing value for ${key}`)
    config[key] = value
    await writeConfig(config)
    console.log(`Saved ${key}.`)
    return 0
  }

  if (action === 'get') {
    console.log(config[key] || '')
    return 0
  }

  if (action === 'unset') {
    delete config[key]
    if (Object.keys(config).length === 0) {
      await rm(configFilePath(), { force: true })
    } else {
      await writeConfig(config)
    }
    console.log(`Removed ${key}.`)
    return 0
  }

  throw new Error(`Unknown config action: ${action}`)
}

async function commandTui(argv) {
  const { flags } = parseArgs(argv)
  if (flags.help) {
    console.log('Usage: hireproof tui [--base-url <url>] [--api-key <key>] [--mode demo|live] [--no-color]')
    return 0
  }

  const [{ default: React }, { render }, { HireProofTuiApp }] = await Promise.all([
    import('react'),
    import('ink'),
    import('../lib/tui-app.mjs'),
  ])
  const { baseUrl, apiKey } = await getRuntimeOptions(flags)
  render(React.createElement(HireProofTuiApp, {
    baseUrl,
    apiKey,
    mode: flags.mode || 'demo',
    color: shouldUseColor(flags),
  }))
  return 0
}

async function main() {
  const [command, ...argv] = process.argv.slice(2)

  if (!command) {
    if (process.stdout.isTTY && !process.env.CI) return commandTui([])
    printHelp()
    return 0
  }

  if (command === '--help' || command === '-h') {
    printHelp()
    return 0
  }

  if (command === 'tui' || command === '--tui') return commandTui(argv)
  if (command === 'health') return commandHealth(argv)
  if (command === 'audit') return commandAudit(argv)
  if (command === 'config') return commandConfig(argv)

  throw new Error(`Unknown command: ${command}`)
}

main()
  .then(code => {
    process.exitCode = code
  })
  .catch(error => {
    printError(error instanceof Error ? error.message : 'Unknown error')
    process.exitCode = 1
  })
