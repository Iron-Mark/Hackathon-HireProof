import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

const HireProofInput = z.object({
  text: z.string().min(10),
  location: z.string().optional(),
  mode: z.enum(['demo', 'live']).default('demo'),
})

const MAX_AUDIT_RESPONSE_BYTES = 256 * 1024

function auditResponseTooLargeError() {
  return new Error(`HireProof audit response too large (max ${MAX_AUDIT_RESPONSE_BYTES} bytes).`)
}

async function readBoundedAuditResponseJson(response: Response) {
  const contentLength = Number(response.headers.get('content-length') || '0')
  if (Number.isFinite(contentLength) && contentLength > MAX_AUDIT_RESPONSE_BYTES) {
    await response.body?.cancel().catch(() => undefined)
    throw auditResponseTooLargeError()
  }

  if (!response.body?.getReader) {
    const text = await response.text()
    if (new TextEncoder().encode(text).byteLength > MAX_AUDIT_RESPONSE_BYTES) {
      throw auditResponseTooLargeError()
    }
    try {
      return text ? JSON.parse(text) : {}
    } catch {
      return {}
    }
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
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

export const hireProofAuditTool = new DynamicStructuredTool({
  name: 'hireproof_job_safety_audit',
  description: 'Audit a job post or recruiter message with HireProof before an agent applies or sends user data.',
  schema: HireProofInput,
  async func(input) {
    const baseUrl = process.env.HIREPROOF_URL || 'https://hireproof.tech'
    const apiKey = process.env.HIREPROOF_API_KEY
    if (!apiKey) throw new Error('HIREPROOF_API_KEY is required.')

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(input),
    })

    const payload = await readBoundedAuditResponseJson(response)

    if (!response.ok) {
      throw new Error(`HireProof audit failed: ${JSON.stringify(payload)}`)
    }

    return JSON.stringify({
      verdict: payload.verdict,
      riskScore: payload.riskScore,
      summary: payload.summary,
      redFlags: payload.redFlags,
      nextSteps: payload.nextSteps,
      reportId: payload.id,
      shouldContinue: payload.verdict === 'safe' && Number(payload.riskScore) < 40,
    })
  },
})
