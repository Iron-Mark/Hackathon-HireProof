import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

const HireProofInput = z.object({
  text: z.string().min(10),
  location: z.string().optional(),
  mode: z.enum(['demo', 'live']).default('demo'),
})

export const hireProofAuditTool = new DynamicStructuredTool({
  name: 'hireproof_job_safety_audit',
  description: 'Audit a job post or recruiter message with HireProof before an agent applies or sends user data.',
  schema: HireProofInput,
  async func(input) {
    const baseUrl = process.env.HIREPROOF_URL || 'https://hireproof.tech'
    const apiKey = process.env.HIREPROOF_API_KEY || 'hireproof_agent_demo_key'

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(input),
    })

    const payload = await response.json()

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
