'use client'

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'

interface RiskRadarChartProps {
  extractedClaims: {
    company: string
    salary: string
    contactMethod: string
    applicationPath: string
    location: string
  }
  redFlags: string[]
  greenFlags: string[]
  evidence: Array<{ type: string }>
  verdict: 'safe' | 'caution' | 'high-risk'
}

function computeAxis(label: string, score: number) {
  return { axis: label, value: Math.max(0, Math.min(100, score)) }
}

export default function RiskRadarChart({ extractedClaims, redFlags, greenFlags, evidence, verdict }: RiskRadarChartProps) {
  // Company Legitimacy: starts safe, degrades if company is unknown or no evidence
  let companyScore = 25
  const hasCompanyEvidence = evidence.some(e => e.type === 'Company Check')
  if (hasCompanyEvidence) companyScore = 15
  if (extractedClaims.company.toLowerCase().includes('unknown')) companyScore = 85
  if (redFlags.some(f => f.toLowerCase().includes('company'))) companyScore += 20

  // Reputation: starts safe, increases with negative signals
  let reputationScore = 20
  if (redFlags.some(f => f.toLowerCase().includes('reputation') || f.toLowerCase().includes('scam'))) reputationScore = 80
  if (greenFlags.some(f => f.toLowerCase().includes('verified') || f.toLowerCase().includes('presence'))) reputationScore -= 15
  const newsEvidence = evidence.filter(e => e.type === 'News & Reputation')
  if (newsEvidence.length > 0) reputationScore -= 10

  // Salary Realism: starts safe, increases if unrealistic
  let salaryScore = 20
  const sal = extractedClaims.salary.toLowerCase()
  if (sal.includes('80,000') || sal.includes('80000') || sal.includes('100,000')) salaryScore = 90
  if (redFlags.some(f => f.toLowerCase().includes('salary') || f.toLowerCase().includes('unrealistic'))) salaryScore += 25
  if (sal.includes('week') || sal.includes('/week')) salaryScore += 20
  if (greenFlags.some(f => f.toLowerCase().includes('salary') || f.toLowerCase().includes('standard'))) salaryScore -= 20

  // Local Presence: starts moderate, improves with evidence
  let localScore = 40
  const localEvidence = evidence.filter(e => e.type === 'Local Presence')
  if (localEvidence.length > 0) localScore = 15
  if (redFlags.some(f => f.toLowerCase().includes('local'))) localScore = 75
  if (extractedClaims.location.toLowerCase().includes('unknown')) localScore += 20

  // Contact Safety: starts safe, gets risky with Telegram/WhatsApp
  let contactScore = 15
  const cm = extractedClaims.contactMethod.toLowerCase()
  if (cm.includes('telegram')) contactScore = 85
  if (cm.includes('whatsapp')) contactScore = 70
  if (cm.includes('linkedin') || cm.includes('email')) contactScore = 10
  if (redFlags.some(f => f.toLowerCase().includes('interview'))) contactScore += 15

  const data = [
    computeAxis('Company', companyScore),
    computeAxis('Reputation', reputationScore),
    computeAxis('Salary', salaryScore),
    computeAxis('Local Presence', localScore),
    computeAxis('Contact Safety', contactScore),
  ]

  const fillColor = verdict === 'safe' ? 'var(--hireproof-safe)' : verdict === 'caution' ? 'var(--hireproof-caution)' : 'var(--hireproof-risk)'
  const strokeColor = verdict === 'safe' ? 'var(--hireproof-safe-text)' : verdict === 'caution' ? 'var(--hireproof-caution-text)' : 'var(--hireproof-risk-text)'

  return (
    <div className="w-full h-[280px] sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="var(--hireproof-border, #cbd5c7)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: 'var(--hireproof-muted, #475569)', fontSize: 11, fontWeight: 700 }}
          />
          <Radar
            name="Risk"
            dataKey="value"
            stroke={strokeColor}
            fill={fillColor}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
