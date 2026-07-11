import { getFixtureByVerdict } from '@/lib/fixtures'
import { buildAuditReportV2 } from '@/lib/intelligence-v2'
import type { AuditReport } from '@/lib/schemas'

export type DemoVerdict = 'safe' | 'caution' | 'high-risk'
export const DEMO_VERDICTS: DemoVerdict[] = ['high-risk', 'caution', 'safe']

function buildDemoReport(verdict: DemoVerdict): AuditReport {
  const fixture = getFixtureByVerdict(verdict)
  const report = buildAuditReportV2({
    id: `demo_${verdict}`,
    extractedClaims: fixture.extractedClaims,
    evidence: fixture.evidence,
    ownerId: 'demo',
    source: 'demo',
  })

  return {
    ...report,
    ...fixture,
    version: '2',
    intelligence: report.intelligence,
    mode: 'demo',
    credentialMode: 'demo',
    source: 'demo',
    publiclyListed: true,
  }
}

/**
 * Prebuilt sample reports for the three labelled demo cards and the `?demo=` param.
 * Computed on the server (this module imports the scoring engine) so that
 * `app/audit/audit-client.tsx` never pulls the engine — or its detection ruleset —
 * into the browser bundle. Passed to the client as a serialized prop.
 */
export const DEMO_REPORTS: Record<DemoVerdict, AuditReport> = {
  'high-risk': buildDemoReport('high-risk'),
  caution: buildDemoReport('caution'),
  safe: buildDemoReport('safe'),
}
