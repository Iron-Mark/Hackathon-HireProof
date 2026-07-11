import type { ExtractedClaims, EvidenceItem, ScoreTraceItem } from '@/lib/schemas'
import {
  buildAuditSignals,
  scoreAuditSignals,
  traceAuditSignals,
  strongestRiskSignals,
  strongestTrustSignals,
} from '@/lib/audit-signals.mjs'

export function calculateRiskScore(
  extractedClaims: ExtractedClaims,
  redFlags: string[],
  greenFlags: string[],
  evidence: EvidenceItem[],
  signalWeightOverrides?: Record<string, number>,
  rawText = ''
): number {
  const signals = buildAuditSignals(extractedClaims, redFlags, greenFlags, evidence, rawText)
  return scoreAuditSignals(signals, evidence, signalWeightOverrides)
}

/**
 * Same computation as calculateRiskScore, but returns the full ordered account of
 * the number: baseline, per-signal confidence-scaled deltas, binding floors and
 * ceilings, and final rounding. The sum of trace deltas equals the score exactly.
 */
export function traceRiskScore(
  extractedClaims: ExtractedClaims,
  redFlags: string[],
  greenFlags: string[],
  evidence: EvidenceItem[],
  signalWeightOverrides?: Record<string, number>,
  rawText = ''
): { score: number; trace: ScoreTraceItem[] } {
  const signals = buildAuditSignals(extractedClaims, redFlags, greenFlags, evidence, rawText)
  return traceAuditSignals(signals, evidence, signalWeightOverrides)
}

export function determineVerdict(riskScore: number): 'safe' | 'caution' | 'high-risk' {
  if (typeof riskScore !== 'number' || isNaN(riskScore)) return 'caution'
  if (riskScore < 35) return 'safe'
  if (riskScore < 65) return 'caution'
  return 'high-risk'
}

export function getConfidenceLabel(riskScore: number, evidenceCount: number): string {
  if (typeof riskScore !== 'number' || isNaN(riskScore) || typeof evidenceCount !== 'number') return 'Low'
  if (evidenceCount < 1) return 'Low'
  if (evidenceCount < 2 && riskScore < 65) return 'Medium'
  if (riskScore >= 80 || riskScore <= 25) return evidenceCount >= 3 ? 'Very High' : 'High'
  if (riskScore >= 65 || riskScore <= 35) return 'High'
  return evidenceCount >= 3 ? 'Medium' : 'Low'
}

export function extractRedFlags(
  extractedClaims: ExtractedClaims,
  evidence: EvidenceItem[],
  rawText = ''
): string[] {
  const signals = buildAuditSignals(extractedClaims, [], [], evidence, rawText)
  return strongestRiskSignals(signals, 8).map((item: any) => item.explanation)
}

export function extractGreenFlags(
  extractedClaims: ExtractedClaims,
  evidence: EvidenceItem[],
  rawText = ''
): string[] {
  const signals = buildAuditSignals(extractedClaims, [], [], evidence, rawText)
  return strongestTrustSignals(signals, 8).map((item: any) => item.explanation)
}

export function generateSummary(
  verdict: 'safe' | 'caution' | 'high-risk',
  riskScore: number,
  redFlags: string[]
): string {
  const safeRedFlags = Array.isArray(redFlags) ? redFlags.filter(Boolean) : []
  const topIssues = safeRedFlags.slice(0, 3)

  switch (verdict) {
    case 'high-risk':
      return topIssues.length > 0
        ? `This opportunity shows high-risk job-scam patterns. Strongest signals: ${topIssues.join('; ')}.`
        : 'This opportunity exhibits high-risk patterns suggesting a potential scam. Proceed with extreme caution.'

    case 'caution':
      return topIssues.length > 0
        ? `This opportunity needs more verification before applying. Main concerns: ${topIssues.join('; ')}.`
        : 'This opportunity lacks enough reliable evidence for a confident safe verdict. Further verification is recommended.'

    case 'safe':
      return riskScore <= 25
        ? 'Low risk signals found. Available evidence points to a conventional hiring path, but standard due diligence is still recommended.'
        : 'Low risk signals found, with no major scam indicators in the available evidence. Standard due diligence is still recommended.'

    default:
      return 'Unable to determine a definitive verdict based on the available evidence. Please perform manual verification.'
  }
}
