import type { z } from 'zod'

export declare const DEFAULT_BASE_URL = "https://hireproof.tech"
export declare const DEFAULT_API_KEY = ""

export declare const HireProofAuditInputSchema: z.ZodObject<{
  text: z.ZodString
  location: z.ZodOptional<z.ZodString>
  mode: z.ZodDefault<z.ZodEnum<["demo", "live"]>>
}>

export declare const TrustedWebhookUrlSchema: z.ZodString

export type HireProofAuditInput = z.infer<typeof HireProofAuditInputSchema>

export interface HireProofAuditReport {
  id?: string
  verdict: 'safe' | 'caution' | 'high-risk'
  riskScore: number
  confidence?: string
  summary?: string
  redFlags?: string[]
  greenFlags?: string[]
  nextSteps?: string[]
}

export interface HireProofToolOptions {
  apiKey?: string
  baseUrl?: string
  webhookUrl?: string
  safeRiskThreshold?: number
  name?: string
  description?: string
  DynamicStructuredTool?: new (config: unknown) => unknown
}

export declare function runHireProofAudit(input: HireProofAuditInput, options?: HireProofToolOptions): Promise<HireProofAuditReport>
export declare function isSafeEnough(report: HireProofAuditReport, threshold?: number): boolean
export declare function createHireProofAuditTool(options?: HireProofToolOptions): unknown
export declare class HireProofAuditTool {
  constructor(options?: HireProofToolOptions)
}
