const { z } = require('zod')

const DEFAULT_BASE_URL = 'https://hireproof.tech'
const DEFAULT_API_KEY = 'hireproof_agent_demo_key'

const HireProofAuditInputSchema = z.object({
  text: z.string().min(10, 'Job post or recruiter message must be at least 10 characters.'),
  location: z.string().optional(),
  mode: z.enum(['demo', 'live']).default('demo'),
  webhookUrl: z.string().url().optional(),
})

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function isSafeEnough(report, threshold = 40) {
  return report?.verdict === 'safe' && Number(report?.riskScore ?? 100) < threshold
}

async function runHireProofAudit(input, options = {}) {
  const parsed = HireProofAuditInputSchema.parse(input)
  const baseUrl = normalizeBaseUrl(options.baseUrl || process.env.HIREPROOF_URL)
  const apiKey = options.apiKey || process.env.HIREPROOF_API_KEY || DEFAULT_API_KEY
  const body = {
    text: parsed.text,
    location: parsed.location,
    mode: parsed.mode,
  }

  if (parsed.webhookUrl) body.webhook_url = parsed.webhookUrl

  const response = await fetch(`${baseUrl}/api/v1/audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => ({}))
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
  DEFAULT_API_KEY,
  HireProofAuditInputSchema,
  HireProofAuditTool,
  createHireProofAuditTool,
  isSafeEnough,
  runHireProofAudit,
}
