import type { AuditRequest, ExtractedClaims } from './schemas'

export function recoverObviousClaims(input: Pick<AuditRequest, 'text' | 'url' | 'location'>, claims: ExtractedClaims): ExtractedClaims
