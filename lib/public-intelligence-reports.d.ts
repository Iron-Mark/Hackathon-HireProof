import type { AuditReport } from './schemas'

export function isDemoFixtureReport(report: unknown): boolean
export function isPublicIntelligenceReport(report: unknown): boolean
export function filterPublicIntelligenceReports<T extends AuditReport>(reports: T[]): T[]
export function sanitizePublicIntelligenceReport(report: AuditReport): AuditReport
export function selectPublicReports(
  rawReports: AuditReport[],
  opts?: { query?: string; verdict?: string; limit?: number }
): { reports: AuditReport[]; total: number }
export function uniquePublicTrendReports<T extends AuditReport>(reports: T[]): T[]
export function buildPublicReportTrends(reports: AuditReport[]): {
  totalReports: number
  trendReadyReports: number
  sampleQuality: 'limited' | 'developing' | 'strong'
  sampleWarning?: string
  bucketQuality: { normalized: number; unclear: number }
  verdicts: { safe: number; caution: number; 'high-risk': number }
  topLocations: Array<{ label: string; count: number }>
  topRoles: Array<{ label: string; count: number }>
  topContactMethods: Array<{ label: string; count: number }>
  recentReports: AuditReport[]
}
