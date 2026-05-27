const base = (
  process.env.HIREPROOF_CURSOR_SMOKE_BASE_URL
  || process.env.APP_BASE_URL
  || 'http://127.0.0.1:3002'
).replace(/\/$/, '')

const enabled = process.env.CURSOR_INTEGRATION_ENABLED === 'true'
const apiKey = process.env.CURSOR_API_KEY?.trim()
const secret = process.env.CURSOR_WEBHOOK_SECRET?.trim()

function skip(message) {
  console.log(`Cursor smoke skipped: ${message}`)
  process.exit(0)
}

if (!enabled) skip('CURSOR_INTEGRATION_ENABLED is not true.')
if (!apiKey) skip('CURSOR_API_KEY is not set.')
if (!secret) skip('CURSOR_WEBHOOK_SECRET is not set.')

const headers = {
  'x-cursor-job-secret': secret,
  'Content-Type': 'application/json',
}

async function assertAccepted(name, response) {
  const body = await response.text()
  let json
  try {
    json = JSON.parse(body)
  } catch {
    json = { raw: body.slice(0, 500) }
  }

  if (response.status === 503 && json?.status === 'credential-required') {
    throw new Error(`${name}: integration not operational on ${base} (credential-required).`)
  }

  if (response.status !== 202) {
    throw new Error(`${name} failed with HTTP ${response.status}: ${body.slice(0, 500)}`)
  }

  if (!json?.ok && !json?.runId) {
    throw new Error(`${name} returned 202 but unexpected body: ${body.slice(0, 500)}`)
  }

  return json
}

try {
  const nightly = await assertAccepted(
    'nightly-repo-health',
    await fetch(`${base}/api/internal/cursor/nightly-repo-health`, { method: 'POST', headers }),
  )

  const uiQa = await assertAccepted(
    'ui-qa',
    await fetch(`${base}/api/internal/cursor/ui-qa`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ baseUrl: base }),
    }),
  )

  console.log(
    `Cursor smoke passed at ${base}: nightly runId=${nightly.runId ?? nightly.recordId ?? 'ok'}, `
    + `ui-qa runId=${uiQa.runId ?? uiQa.recordId ?? 'ok'} (baseUrl=${uiQa.baseUrl ?? base}).`,
  )
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
}
