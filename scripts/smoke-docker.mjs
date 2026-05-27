import { readBoundedJson, readBoundedText } from './lib/bounded-response.mjs'

const base = process.env.HIREPROOF_DOCKER_BASE_URL || 'http://127.0.0.1:3002'
const agentApiKey = process.env.AGENT_API_KEY || 'local-dev-agent-key-32-char-minimum-value'

async function assertOk(name, request) {
  const response = await request()
  if (!response.ok) {
    const body = await readBoundedText(response, { label: `${name} error response body` }).catch(() => '')
    throw new Error(`${name} failed with HTTP ${response.status}: ${body.slice(0, 500)}`)
  }
  return response
}

await assertOk('health check', () => fetch(`${base}/api/health`))

const auditResponse = await assertOk('demo audit', () => fetch(`${base}/api/v1/audit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': agentApiKey,
  },
  body: JSON.stringify({
    text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
    mode: 'demo',
  }),
}))

const report = await readBoundedJson(auditResponse, { label: 'demo audit response body' })
if (report.verdict !== 'high-risk' || Number(report.riskScore) < 80) {
  throw new Error(`demo audit returned unexpected verdict: ${JSON.stringify({ verdict: report.verdict, riskScore: report.riskScore })}`)
}

console.log(`Docker smoke passed at ${base}: health ok, demo audit ${report.verdict} (${report.riskScore}).`)
