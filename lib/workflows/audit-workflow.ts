import { sleep } from 'workflow'
import { DEMO_FIXTURES } from '@/lib/fixtures'
import { createPublicReportId } from '@/lib/public-report-id'
import type { AuditReport } from '@/lib/schemas'

export interface AuditWorkflowInput {
  text: string
  baseUrl: string
  callbackUrl?: string | null
}

export interface AuditWorkflowOutput {
  report: AuditReport
  reportUrl: string
}

function pickFixture(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('telegram') || lower.includes('80000') || lower.includes('80,000')) return DEMO_FIXTURES.highRisk
  if (lower.includes('unclear') || lower.includes('maybe') || lower.includes('caution')) return DEMO_FIXTURES.caution
  return DEMO_FIXTURES.safe
}

export async function startAuditWorkflow(input: AuditWorkflowInput): Promise<AuditWorkflowOutput> {
  'use workflow'

  await sleep('1 second')

  const now = Date.now()
  const report: AuditReport = {
    ...pickFixture(input.text),
    id: createPublicReportId('report'),
    timestamp: new Date(now).toISOString(),
    source: 'api' as const,
    mode: 'demo' as const,
  }

  return {
    report,
    reportUrl: `${input.baseUrl.replace(/\/$/, '')}/audit/${report.id}`,
  }
}
