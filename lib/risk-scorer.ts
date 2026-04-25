import type { AuditReport, ExtractedClaims, EvidenceItem } from '@/lib/schemas'

interface ScoringFactors {
  salary_unrealistic: number
  no_interview: number
  pressure_contact: number
  telegram_whatsapp: number
  no_company_info: number
  negative_reputation: number
  no_local_presence: number
  payment_request: number
  green_flag_company: number
  green_flag_formal: number
}

/**
 * Calculate risk score based on red/green flags
 */
export function calculateRiskScore(
  extractedClaims: ExtractedClaims,
  redFlags: string[],
  greenFlags: string[],
  evidence: EvidenceItem[]
): number {
  let score = 50 // Base neutral score

  // Red flags deduct points
  const redFlagWeights: Record<string, number> = {
    'unrealistic_salary': -20,
    'no_interview': -15,
    'telegram_contact': -15,
    'no_company_info': -20,
    'negative_reputation': -15,
    'no_local_presence': -10,
    'payment_request': -25,
  }

  redFlags.forEach(flag => {
    for (const [key, weight] of Object.entries(redFlagWeights)) {
      if (flag.toLowerCase().includes(key)) {
        score += weight
      }
    }
  })

  // Green flags add points
  const greenFlagWeights: Record<string, number> = {
    'company_verified': 15,
    'formal_process': 10,
    'industry_standard': 15,
    'legitimate_company': 20,
  }

  greenFlags.forEach(flag => {
    for (const [key, weight] of Object.entries(greenFlagWeights)) {
      if (flag.toLowerCase().includes(key)) {
        score += weight
      }
    }
  })

  // Clamp score between 0-100
  return Math.max(0, Math.min(100, score))
}

/**
 * Determine verdict based on risk score
 */
export function determineVerdict(riskScore: number): 'safe' | 'caution' | 'high-risk' {
  if (riskScore < 35) return 'safe'
  if (riskScore < 65) return 'caution'
  return 'high-risk'
}

/**
 * Generate confidence level
 */
export function getConfidenceLabel(riskScore: number, evidenceCount: number): string {
  if (evidenceCount < 2) return 'Low'
  if (riskScore < 30 || riskScore > 80) return 'Very High'
  if (riskScore < 45 || riskScore > 70) return 'High'
  return 'Medium'
}

/**
 * Build red flags from analysis
 */
export function extractRedFlags(
  extractedClaims: ExtractedClaims,
  evidence: EvidenceItem[]
): string[] {
  const flags: string[] = []

  // Salary analysis
  const salary = extractedClaims.salary.toLowerCase()
  if (salary.includes('80,000') || salary.includes('80000')) {
    flags.push('Unrealistically high salary for the role level')
  }
  if (salary.includes('week') || salary.includes('/week')) {
    flags.push('Salary quoted per week instead of annual (suspicious)')
  }

  // Contact method
  if (extractedClaims.contactMethod.toLowerCase().includes('telegram')) {
    flags.push('Telegram-only contact method (bypasses official channels)')
  }
  if (extractedClaims.contactMethod.toLowerCase().includes('whatsapp')) {
    flags.push('WhatsApp-only contact (not standard for hiring)')
  }

  // Company verification
  if (extractedClaims.company.toLowerCase().includes('unknown')) {
    flags.push('Company name not verifiable via web search')
  }

  // Interview process
  if (extractedClaims.applicationPath.toLowerCase().includes('no interview')) {
    flags.push('No interview process mentioned')
  }

  // Evidence-based flags
  const negativeEvidence = evidence.filter(e =>
    e.snippet?.toLowerCase().includes('scam') ||
    e.snippet?.toLowerCase().includes('fraud')
  )
  if (negativeEvidence.length > 0) {
    flags.push('Negative reputation signals found in search results')
  }

  return flags
}

/**
 * Build green flags from analysis
 */
export function extractGreenFlags(
  extractedClaims: ExtractedClaims,
  evidence: EvidenceItem[]
): string[] {
  const flags: string[] = []

  // Company verification
  const companyEvidence = evidence.filter(e => e.type === 'Company Check')
  if (companyEvidence.length > 0) {
    flags.push('Company web presence verified')
  }

  // Professional application
  if (extractedClaims.applicationPath.toLowerCase().includes('linkedin') ||
      extractedClaims.applicationPath.toLowerCase().includes('official')) {
    flags.push('Professional application through official channels')
  }

  // Standard salary format
  if (extractedClaims.salary.toLowerCase().includes('per month') ||
      extractedClaims.salary.toLowerCase().includes('per year') ||
      extractedClaims.salary.toLowerCase().includes('annually')) {
    flags.push('Salary formatted as standard market rate')
  }

  // Location specificity
  if (extractedClaims.location && !extractedClaims.location.toLowerCase().includes('unknown')) {
    flags.push('Specific location provided')
  }

  return flags
}

/**
 * Generate summary based on verdict and factors
 */
export function generateSummary(
  verdict: 'safe' | 'caution' | 'high-risk',
  riskScore: number,
  redFlags: string[]
): string {
  switch (verdict) {
    case 'high-risk':
      return `This opportunity has multiple red flags suggesting a potential scam. The combination of ${redFlags.slice(0, 2).join(', ')} strongly indicate this is fraudulent.`
    case 'caution':
      return `This opportunity has some positive signs but lacks clarity in key areas. ${redFlags.length > 0 ? `Issues include: ${redFlags.slice(0, 2).join(', ')}.` : ''} Further investigation before applying is warranted.`
    case 'safe':
      return 'This opportunity appears legitimate. The company is well-established with a strong reputation, clear job requirements, transparent information, and professional application process. Standard due diligence recommended.'
    default:
      return 'Unable to determine verdict'
  }
}
