import fs from 'node:fs/promises'
import path from 'node:path'

const base = (process.env.HIREPROOF_PROOF_BASE_URL || 'https://hireproof.tech').replace(/\/$/, '')
const requireLive = process.argv.includes('--require-live')
const defaultOutputFile = requireLive
  ? 'live-chat-proof-check-strict-latest.json'
  : 'live-chat-proof-check-latest.json'
const outputPath = process.env.HIREPROOF_PROOF_OUTPUT_PATH
  ? path.resolve(process.env.HIREPROOF_PROOF_OUTPUT_PATH)
  : path.join(process.cwd(), 'docs', 'demo', defaultOutputFile)
const REQUEST_TIMEOUT_MS = 15_000

const platforms = [
  { key: 'discord', endpoint: '/api/webhooks/discord' },
  { key: 'telegram', endpoint: '/api/webhooks/telegram' },
  { key: 'whatsapp', endpoint: '/api/webhooks/zernio' },
]

function assertPublicHttpBaseUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error(`HIREPROOF_PROOF_BASE_URL must be a valid http(s) URL. Received: ${value}`)
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`HIREPROOF_PROOF_BASE_URL must use http or https. Received protocol: ${url.protocol}`)
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error('HIREPROOF_PROOF_BASE_URL must not include credentials, query strings, or fragments.')
  }
}

async function withTimeout(label, request) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await request(controller.signal)
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`${label} timed out after ${REQUEST_TIMEOUT_MS}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function readJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return { parseError: true, bodyPreview: text.slice(0, 160) }
  }
}

async function getJson(url) {
  const response = await withTimeout(`GET ${url}`, (signal) => fetch(url, { signal }))
  return {
    ok: response.ok,
    status: response.status,
    body: await readJson(response),
  }
}

async function postJson(url, body) {
  const response = await withTimeout(`POST ${url}`, (signal) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  }))

  return {
    ok: response.ok,
    status: response.status,
    body: await readJson(response),
  }
}

function summarizeSurface(surface) {
  if (!surface) return { state: 'missing', missing: [] }

  const required = surface.required || {}
  const missing = Object.entries(required)
    .filter(([, present]) => present === false)
    .map(([name]) => name)

  return {
    state: surface.state,
    endpoint: surface.endpoint,
    missing,
  }
}

function collectValidationErrors(report) {
  const errors = []

  if (report.health.httpStatus !== 200 || report.health.status !== 'ok') {
    errors.push(`health check expected HTTP 200 ok, got HTTP ${report.health.httpStatus} ${report.health.status || 'unknown'}`)
  }

  if (!['ready', 'credential-gated'].includes(report.status)) {
    errors.push(`readiness status expected ready or credential-gated, got ${report.status}`)
  }

  if (!['ready', 'credential-gated'].includes(report.coreStatus)) {
    errors.push(`core readiness status expected ready or credential-gated, got ${report.coreStatus}`)
  }

  if (!['ready', 'credential-gated'].includes(report.optionalStatus)) {
    errors.push(`optional readiness status expected ready or credential-gated, got ${report.optionalStatus}`)
  }

  if (report.platforms.slack.state !== 'ready') {
    errors.push(`Slack should remain ready for existing ChatSDK proof, got ${report.platforms.slack.state}`)
  }

  const shared = report.sharedChatReplyPath
  if (shared.httpStatus !== 200 || shared.verdict !== 'high-risk' || Number(shared.riskScore) < 80 || !shared.reportUrl?.startsWith(`${report.base}/audit/chat_`)) {
    errors.push('shared ChatSDK reply path did not return the expected high-risk production report')
  }

  for (const key of ['discord', 'telegram', 'whatsapp']) {
    const webhook = report.webhookGetChecks[key]
    if (webhook.httpStatus !== 200) {
      errors.push(`${key} webhook metadata check expected HTTP 200, got HTTP ${webhook.httpStatus}`)
    }
  }

  if (requireLive) {
    const notLive = ['discord', 'telegram', 'whatsapp'].filter((key) => report.platforms[key].state !== 'ready')
    if (notLive.length > 0) {
      errors.push(`live platform proof is still pending for: ${notLive.join(', ')}`)
    }
  }

  return errors
}

assertPublicHttpBaseUrl(base)

const checkedAt = new Date().toISOString()
const readiness = await getJson(`${base}/api/integrations/proof`)
const health = await getJson(`${base}/api/health`)
const chatSmoke = await postJson(`${base}/api/chat/hireproof`, {
  text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
  platform: 'discord',
  channel: 'proof-script',
})

const webhookChecks = {}
for (const platform of platforms) {
  webhookChecks[platform.key] = await getJson(`${base}${platform.endpoint}`)
}

const surfaces = readiness.body?.surfaces || {}
const report = {
  checkedAt,
  base,
  status: readiness.body?.status || 'unknown',
  coreStatus: readiness.body?.coreStatus || readiness.body?.status || 'unknown',
  optionalStatus: readiness.body?.optionalStatus || 'unknown',
  health: {
    httpStatus: health.status,
    status: health.body?.status,
    storage: health.body?.storage,
    model: health.body?.model,
    liveSearch: health.body?.liveSearch,
  },
  platforms: {
    slack: summarizeSurface(surfaces.slack),
    discord: summarizeSurface(surfaces.discord),
    telegram: summarizeSurface(surfaces.telegram),
    whatsapp: summarizeSurface(surfaces.whatsapp),
  },
  sharedChatReplyPath: {
    httpStatus: chatSmoke.status,
    status: chatSmoke.body?.status,
    platform: chatSmoke.body?.platform,
    reportUrl: chatSmoke.body?.reportUrl || null,
    verdict: chatSmoke.body?.report?.verdict || null,
    riskScore: chatSmoke.body?.report?.riskScore || null,
  },
  webhookGetChecks: Object.fromEntries(Object.entries(webhookChecks).map(([key, value]) => [
    key,
    {
      httpStatus: value.status,
      ready: value.body?.credentialStatus?.ready,
      credentialStatus: value.body?.credentialStatus,
    },
  ])),
}
const validationErrors = collectValidationErrors(report)
report.validation = {
  mode: requireLive ? 'strict-live' : 'controlled',
  passed: validationErrors.length === 0,
  errors: validationErrors,
}

await fs.mkdir(path.dirname(outputPath), { recursive: true })
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)

console.log(`Live chat proof check written to ${outputPath}`)
console.log(`Production status: ${report.status}`)
console.log(`core status: ${report.coreStatus}`)
console.log(`optional platform status: ${report.optionalStatus}`)

for (const key of ['slack', 'discord', 'telegram', 'whatsapp']) {
  const platform = report.platforms[key]
  const missing = platform.missing.length > 0 ? ` missing ${platform.missing.join(', ')}` : ''
  console.log(`${key}: ${platform.state}${missing}`)
}

console.log(`shared reply path: ${report.sharedChatReplyPath.httpStatus} ${report.sharedChatReplyPath.verdict || 'no verdict'} ${report.sharedChatReplyPath.reportUrl || ''}`)
console.log(`validation: ${report.validation.passed ? 'passed' : 'failed'} (${report.validation.mode})`)

if (validationErrors.length > 0) {
  throw new Error(validationErrors.join('; '))
}
