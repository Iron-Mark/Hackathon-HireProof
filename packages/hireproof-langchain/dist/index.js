const { z } = require('zod')

const DEFAULT_BASE_URL = 'https://hireproof.tech'
const MAX_AUDIT_RESPONSE_BYTES = 256 * 1024

const HireProofAuditInputSchema = z.object({
  text: z.string().min(10, 'Job post or recruiter message must be at least 10 characters.'),
  location: z.string().optional(),
  mode: z.enum(['demo', 'live']).default('demo'),
})

const TrustedWebhookUrlSchema = z.string().url()

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function isSafeEnough(report, threshold = 40) {
  return report?.verdict === 'safe' && Number(report?.riskScore ?? 100) < threshold
}

function auditResponseTooLargeError() {
  return new Error(`HireProof audit response too large (max ${MAX_AUDIT_RESPONSE_BYTES} bytes).`)
}

async function readBoundedAuditResponseJson(response) {
  const contentLength = Number(response.headers?.get?.('content-length') || '0')
  if (Number.isFinite(contentLength) && contentLength > MAX_AUDIT_RESPONSE_BYTES) {
    await response.body?.cancel().catch(() => undefined)
    throw auditResponseTooLargeError()
  }

  if (!response.body?.getReader) {
    if (typeof response.text === 'function') {
      const text = await response.text()
      if (Buffer.byteLength(text, 'utf8') > MAX_AUDIT_RESPONSE_BYTES) throw auditResponseTooLargeError()
      try {
        return text ? JSON.parse(text) : {}
      } catch {
        return {}
      }
    }
    throw new Error('HireProof audit response body is not readable.')
  }

  const reader = response.body.getReader()
  const chunks = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    totalBytes += value.byteLength
    if (totalBytes > MAX_AUDIT_RESPONSE_BYTES) {
      await reader.cancel().catch(() => undefined)
      throw auditResponseTooLargeError()
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    const text = new TextDecoder().decode(merged)
    return text ? JSON.parse(text) : {}
  } catch {
    return {}
  }
}

async function runHireProofAudit(input, options = {}) {
  const parsed = HireProofAuditInputSchema.parse(input)
  const baseUrl = normalizeBaseUrl(options.baseUrl || process.env.HIREPROOF_URL)
  const apiKey = options.apiKey || process.env.HIREPROOF_API_KEY
  if (!apiKey) {
    throw new Error('HireProof API key is required. Set HIREPROOF_API_KEY or pass apiKey to runHireProofAudit/createHireProofAuditTool.')
  }
  const body = {
    text: parsed.text,
    location: parsed.location,
    mode: parsed.mode,
  }

  if (options.webhookUrl) body.webhook_url = TrustedWebhookUrlSchema.parse(options.webhookUrl)

  const response = await fetch(`${baseUrl}/api/v1/audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })

  const payload = await readBoundedAuditResponseJson(response)
  if (!response.ok) {
    throw new Error(`HireProof audit failed with HTTP ${response.status}: ${JSON.stringify(payload)}`)
  }

  return payload
}

function loadDynamicStructuredTool(override) {
  if (override) return override
  try {
    return require('@langchain/core/tools').DynamicStructuredTool
  } catch (error) {
    throw new Error('Missing @langchain/core. Install it or pass DynamicStructuredTool to createHireProofAuditTool({ DynamicStructuredTool }).')
  }
}

function createHireProofAuditTool(options = {}) {
  const DynamicStructuredTool = loadDynamicStructuredTool(options.DynamicStructuredTool)
  const threshold = options.safeRiskThreshold ?? 40

  return new DynamicStructuredTool({
    name: options.name || 'hireproof_job_safety_audit',
    description: options.description || 'Audit a job post or recruiter message with HireProof before an agent applies or sends user data.',
    schema: HireProofAuditInputSchema,
    async func(input) {
      const report = await runHireProofAudit(input, options)
      return JSON.stringify({
        verdict: report.verdict,
        riskScore: report.riskScore,
        confidence: report.confidence,
        summary: report.summary,
        redFlags: report.redFlags,
        greenFlags: report.greenFlags,
        nextSteps: report.nextSteps,
        reportId: report.id,
        shouldContinue: isSafeEnough(report, threshold),
      })
    },
  })
}

class HireProofAuditTool {
  constructor(options = {}) {
    return createHireProofAuditTool(options)
  }
}

module.exports = {
  DEFAULT_BASE_URL,
  HireProofAuditInputSchema,
  TrustedWebhookUrlSchema,
  HireProofAuditTool,
  createHireProofAuditTool,
  isSafeEnough,
  runHireProofAudit,
}
