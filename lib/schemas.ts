import { z } from 'zod'

// Verdict types
export const VerdictSchema = z.enum(['safe', 'caution', 'high-risk'])
export type Verdict = z.infer<typeof VerdictSchema>

// Evidence item schema
export const EvidenceItemSchema = z.object({
  source: z.string(),
  snippet: z.string(),
  url: z.string().optional(),
  type: z.string(),
})
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>

// Extracted claims schema
export const ExtractedClaimsSchema = z.object({
  company: z.string(),
  role: z.string(),
  salary: z.string(),
  location: z.string(),
  contactMethod: z.string(),
  applicationPath: z.string(),
})
export type ExtractedClaims = z.infer<typeof ExtractedClaimsSchema>

// Alternative job schema
export const AlternativeJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  salary: z.string().optional(),
})
export type AlternativeJob = z.infer<typeof AlternativeJobSchema>

// Investigation step schema (for timeline)
export const InvestigationStepSchema = z.object({
  step: z.number(),
  title: z.string(),
  description: z.string(),
})
export type InvestigationStep = z.infer<typeof InvestigationStepSchema>

// Risk signal schema
export const RiskSignalSchema = z.object({
  signal: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  evidence: z.string().optional(),
})
export type RiskSignal = z.infer<typeof RiskSignalSchema>

// Main audit report schema
export const AuditReportSchema = z.object({
  id: z.string().optional(),
  verdict: VerdictSchema,
  riskScore: z.number().min(0).max(100),
  confidence: z.string(),
  summary: z.string(),
  extractedClaims: ExtractedClaimsSchema,
  redFlags: z.array(z.string()),
  greenFlags: z.array(z.string()),
  evidence: z.array(EvidenceItemSchema),
  alternatives: z.array(AlternativeJobSchema),
  nextSteps: z.array(z.string()),
  timestamp: z.string().optional(),
  mode: z.enum(['demo', 'live']).optional(),
})
export type AuditReport = z.infer<typeof AuditReportSchema>

// Input schema for audit request
export const AuditRequestSchema = z.object({
  text: z.string().min(1, 'Job post text is required'),
  url: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
})
export type AuditRequest = z.infer<typeof AuditRequestSchema>
