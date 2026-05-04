import { z } from 'zod'

// Verdict types
export const VerdictSchema = z.enum(['safe', 'caution', 'high-risk'])
export type Verdict = z.infer<typeof VerdictSchema>

// Evidence item schema
export const EvidenceItemSchema = z.object({
  id: z.string().max(100).optional(),
  source: z.string().max(500),
  snippet: z.string().max(2000),
  url: z.string().max(2000).optional(),
  type: z.string().max(100),
  sourceType: z.enum([
    'search',
    'news',
    'jobs',
    'maps',
    'place',
    'enrichment',
    'manual',
    'domain',
    'dns',
    'certificate',
    'threat-intel',
    'company-registry',
  ]).optional(),
  trustLevel: z.enum(['high', 'medium', 'low', 'risk']).optional(),
  matchConfidence: z.number().min(0).max(1).optional(),
  sourceQuality: z.enum(['official', 'reputable', 'public', 'weak', 'risky']).optional(),
  freshness: z.enum(['fresh', 'recent', 'stale', 'unknown']).optional(),
  freshnessDays: z.number().min(0).optional(),
})
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>

export const IntelligenceSignalSchema = z.object({
  id: z.string().max(100),
  label: z.string().max(200),
  direction: z.enum(['risk', 'trust', 'neutral']),
  severity: z.enum(['low', 'medium', 'high']),
  weight: z.number().min(-100).max(100),
  evidenceIds: z.array(z.string().max(100)).max(20),
  rationale: z.string().max(1000),
})
export type IntelligenceSignal = z.infer<typeof IntelligenceSignalSchema>

export const ScoreTraceItemSchema = z.object({
  step: z.string().max(200),
  delta: z.number().min(-100).max(100),
  scoreAfter: z.number().min(0).max(100),
  reason: z.string().max(1000),
})
export type ScoreTraceItem = z.infer<typeof ScoreTraceItemSchema>

export const OperationalStatusSchema = z.object({
  status: z.enum(['ok', 'not-live', 'throttled', 'circuit-open', 'cache-only', 'degraded']).optional(),
  message: z.string().max(1000).optional(),
  retryAfterSec: z.number().min(0).optional(),
  provider: z.string().max(100).optional(),
  fetchedAt: z.string().max(50).optional(),
  expiresAt: z.string().max(50).optional(),
  rateLimitedUntil: z.string().max(50).optional(),
})
export type OperationalStatus = z.infer<typeof OperationalStatusSchema>

export const SalaryBenchmarkSourceSchema = z.enum(['serpapi-live-comparables', 'seeded-country-band', 'insufficient-data'])
export type SalaryBenchmarkSource = z.infer<typeof SalaryBenchmarkSourceSchema>

export const IntelligenceSummarySchema = z.object({
  coverage: z.object({
    company: z.enum(['verified', 'partial', 'missing']),
    local: z.enum(['verified', 'partial', 'missing']),
    recruiter: z.enum(['verified', 'partial', 'risk', 'missing']).optional(),
    reputation: z.enum(['clear', 'risk', 'missing']),
    market: z.enum(['normal', 'anomalous', 'missing']),
    applyPath: z.enum(['official', 'trusted-board', 'mismatch', 'unknown']),
  }),
  companyProfileMode: z.enum(['local_business', 'established_remote', 'startup_remote', 'unknown']).optional(),
  companyIdentity: z.object({
    status: z.enum(['matched', 'partial', 'unverified']),
    officialDomain: z.string().max(300).optional(),
    evidenceIds: z.array(z.string().max(100)).max(20),
  }),
  recruiterIdentity: z.object({
    status: z.enum(['verified', 'domain-match', 'platform-match', 'unverified', 'risky', 'unknown']),
    recruiterName: z.string().max(200).optional(),
    recruiterEmailDomain: z.string().max(300).optional(),
    evidenceIds: z.array(z.string().max(100)).max(20),
  }).optional(),
  localPresence: z.object({
    status: z.enum(['verified', 'partial', 'missing']),
    evidenceIds: z.array(z.string().max(100)).max(20),
  }),
  marketBenchmark: z.object({
    status: z.enum(['normal', 'anomalous', 'missing']),
    seniority: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'unknown']).optional(),
    claimedMonthlyAmount: z.number().optional(),
    comparableMonthlyAmount: z.number().optional(),
    currency: z.string().max(20).optional(),
    ratio: z.number().optional(),
    country: z.string().max(30).optional(),
    source: SalaryBenchmarkSourceSchema.optional(),
    evidenceIds: z.array(z.string().max(100)).max(20),
  }),
  applyPath: z.object({
    status: z.enum(['official', 'trusted-board', 'mismatch', 'unknown']),
    submittedHost: z.string().max(300).optional(),
    officialHost: z.string().max(300).optional(),
    evidenceIds: z.array(z.string().max(100)).max(20),
  }),
  signals: z.array(IntelligenceSignalSchema).max(50),
  scoreTrace: z.array(ScoreTraceItemSchema).max(50),
})
export type IntelligenceSummary = z.infer<typeof IntelligenceSummarySchema>

export const AuditOperationsSchema = z.object({
  liveSearch: OperationalStatusSchema.optional(),
  coverageBackfill: OperationalStatusSchema.optional(),
  evidenceProviders: z.object({
    serpapi: OperationalStatusSchema.optional(),
    rdap: OperationalStatusSchema.optional(),
    dns: OperationalStatusSchema.optional(),
    safeBrowsing: OperationalStatusSchema.optional(),
    certificateTransparency: OperationalStatusSchema.optional(),
    threatIntel: OperationalStatusSchema.optional(),
    companyRegistry: OperationalStatusSchema.optional(),
    urlscan: OperationalStatusSchema.optional(),
  }).optional(),
  salaryBenchmark: z.object({
    source: SalaryBenchmarkSourceSchema,
    country: z.string().max(30).optional(),
    currency: z.string().max(20).optional(),
    message: z.string().max(1000).optional(),
  }).optional(),
  falsePositiveControl: z.object({
    profileModeExplanation: z.string().max(1000).optional(),
  }).optional(),
}).optional()
export type AuditOperations = z.infer<typeof AuditOperationsSchema>

// Extracted claims schema
export const ExtractedClaimsSchema = z.object({
  company: z.string().max(200),
  role: z.string().max(200),
  salary: z.string().max(200),
  location: z.string().max(500),
  contactMethod: z.string().max(200),
  applicationPath: z.string().max(500),
  recruiterName: z.string().max(300).optional(),
  recruiterEmail: z.string().max(300).optional(),
  recruiterProfile: z.string().max(500).optional(),
  recruiterPhone: z.string().max(100).optional(),
})
export type ExtractedClaims = z.infer<typeof ExtractedClaimsSchema>

// Alternative job schema
export const AlternativeJobSchema = z.object({
  title: z.string().max(200),
  company: z.string().max(200),
  salary: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  url: z.string().url().optional(),
  source: z.string().max(200).optional(),
  verifiedSource: z.string().max(200).optional(),
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
  version: z.enum(['1', '2']).optional(),
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
  credentialMode: z.enum(['owner-byok', 'platform-env', 'demo']).optional(),
  ownerId: z.string().max(100).optional(),
  apiKeyId: z.string().max(100).optional(),
  source: z.enum(['web', 'api', 'mcp', 'demo', 'chat']).optional(),
  chatPlatform: z.enum(['slack', 'discord', 'telegram', 'whatsapp', 'local']).optional(),
  chatThreadId: z.string().max(300).optional(),
  chatChannelId: z.string().max(300).optional(),
  publiclyListed: z.boolean().optional(),
  userFeedback: z.enum(['helpful', 'incorrect']).optional(),
  userFeedbackReason: z.enum([
    'false_positive',
    'missed_risk',
    'stale_evidence',
    'salary_wrong',
    'company_match_wrong',
    'recruiter_match_wrong',
    'other',
  ]).optional(),
  userFeedbackNote: z.string().max(500).optional(),
  intelligence: IntelligenceSummarySchema.optional(),
  operations: AuditOperationsSchema,
})
export type AuditReport = z.infer<typeof AuditReportSchema>
export type AuditReportV2 = AuditReport & {
  version: '2'
  intelligence: IntelligenceSummary
}

// Input schema for audit request (with hardened limits)
export const AuditRequestSchema = z.object({
  text: z.string()
    .max(10_000, 'Job post text must be ≤ 10,000 characters')
    .transform((v) => v.trim())
    .optional()
    .default(''),
  url: z.string().url().max(2000).optional().or(z.literal('')),
  location: z.string().max(200).optional(),
  mode: z.enum(['live', 'demo']).optional(),
  image: z.string().max(5_000_000).optional(), // ~3.75MB base64 cap
  webhook_url: z.string().url().max(2000).optional(),
}).superRefine((value, context) => {
  if (!value.text && !value.url && !value.image) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['text'],
      message: 'Job post text, job URL, or screenshot is required',
    })
  }
})
export type AuditRequest = z.infer<typeof AuditRequestSchema>
