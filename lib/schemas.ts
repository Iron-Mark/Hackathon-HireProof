import { z } from 'zod'

// Verdict types
export const VerdictSchema = z.enum(['safe', 'caution', 'high-risk'])
export type Verdict = z.infer<typeof VerdictSchema>

// Evidence item schema
export const EvidenceItemSchema = z.object({
  source: z.string().max(500),
  snippet: z.string().max(2000),
  url: z.string().max(2000).optional(),
  type: z.string().max(100),
})
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>

// Extracted claims schema
export const ExtractedClaimsSchema = z.object({
  company: z.string().max(200),
  role: z.string().max(200),
  salary: z.string().max(200),
  location: z.string().max(200),
  contactMethod: z.string().max(200),
  applicationPath: z.string().max(200),
})
export type ExtractedClaims = z.infer<typeof ExtractedClaimsSchema>

// Alternative job schema
export const AlternativeJobSchema = z.object({
  title: z.string().max(200),
  company: z.string().max(200),
  salary: z.string().max(200).optional(),
})
export type AlternativeJob = z.infer<typeof AlternativeJobSchema>

// Investigation step schema (for timeline)
export const InvestigationStepSchema = z.object({
  step: z.number().int().min(0).max(100),
  title: z.string().max(200),
  description: z.string().max(1000),
})
export type InvestigationStep = z.infer<typeof InvestigationStepSchema>

// Risk signal schema
export const RiskSignalSchema = z.object({
  signal: z.string().max(500),
  severity: z.enum(['low', 'medium', 'high']),
  evidence: z.string().max(1000).optional(),
})
export type RiskSignal = z.infer<typeof RiskSignalSchema>

// Main audit report schema
export const AuditReportSchema = z.object({
  id: z.string().max(100).optional(),
  verdict: VerdictSchema,
  riskScore: z.number().min(0).max(100),
  confidence: z.string().max(50),
  summary: z.string().max(5000),
  extractedClaims: ExtractedClaimsSchema,
  redFlags: z.array(z.string().max(500)).max(50),
  greenFlags: z.array(z.string().max(500)).max(50),
  evidence: z.array(EvidenceItemSchema).max(100),
  alternatives: z.array(AlternativeJobSchema).max(20),
  nextSteps: z.array(z.string().max(500)).max(20),
  timestamp: z.string().max(50).optional(),
  mode: z.enum(['demo', 'live']).optional(),
  ownerId: z.string().max(100).optional(),
  apiKeyId: z.string().max(100).optional(),
  source: z.enum(['web', 'api', 'mcp', 'demo', 'chat']).optional(),
  chatPlatform: z.enum(['slack', 'discord', 'telegram', 'whatsapp', 'local']).optional(),
  chatThreadId: z.string().max(300).optional(),
  chatChannelId: z.string().max(300).optional(),
  publiclyListed: z.boolean().optional(),
  userFeedback: z.enum(['helpful', 'incorrect']).optional(),
})
export type AuditReport = z.infer<typeof AuditReportSchema>

// Input schema for audit request (with hardened limits)
export const AuditRequestSchema = z.object({
  text: z.string()
    .min(1, 'Job post text is required')
    .max(10_000, 'Job post text must be ≤ 10,000 characters')
    .transform((v) => v.trim()),
  url: z.string().url().max(2000).optional().or(z.literal('')),
  location: z.string().max(200).optional(),
  mode: z.enum(['live', 'demo']).optional(),
  image: z.string().max(5_000_000).optional(), // ~3.75MB base64 cap
  webhook_url: z.string().url().max(2000).optional(),
})
export type AuditRequest = z.infer<typeof AuditRequestSchema>
