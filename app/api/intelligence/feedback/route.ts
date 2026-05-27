import { getReport, isPublicReportId, saveReport } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

const FEEDBACK_PAYLOAD_LIMIT_BYTES = 8 * 1024

export async function POST(request: Request) {
  try {
    const csrfError = validateMutationOrigin(request)
    if (csrfError) return csrfError

    const parsedJson = await readJsonRequest(request, FEEDBACK_PAYLOAD_LIMIT_BYTES, 'Feedback payload')
    if (!parsedJson.ok) return parsedJson.response

    const body = parsedJson.value
    const id = body.id
    const feedback = body.feedback
    const reason = body.reason
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : undefined
    const validReasons = new Set([
      'false_positive',
      'missed_risk',
      'stale_evidence',
      'salary_wrong',
      'company_match_wrong',
      'recruiter_match_wrong',
      'other',
    ])

    if (!id || typeof id !== 'string') {
      return noStoreJson({ error: 'Missing or invalid report ID' }, { status: 400 })
    }
    const safeId = id.trim()
    if (!isPublicReportId(safeId)) {
      return noStoreJson({ error: 'Missing or invalid report ID' }, { status: 400 })
    }

    const rateLimit = await checkRateLimit(`feedback_${requestIp(request)}_${safeId}`, { limit: 10, windowMs: 60000 })
    if (!rateLimit.success) {
      return noStoreJson({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    if (feedback !== 'helpful' && feedback !== 'incorrect') {
      return noStoreJson({ error: 'Feedback must be either helpful or incorrect' }, { status: 400 })
    }
    if (reason !== undefined && (!validReasons.has(reason) || typeof reason !== 'string')) {
      return noStoreJson({ error: 'Invalid feedback reason' }, { status: 400 })
    }

    const report = await getReport(safeId)
    
    if (!report) {
      return noStoreJson({ error: 'Report not found' }, { status: 404 })
    }

    // Update the report with the user's feedback
    report.userFeedback = feedback
    if (reason) report.userFeedbackReason = reason
    if (note) report.userFeedbackNote = note

    // Persist to Upstash / Local FS
    await saveReport(report)

    return noStoreJson({ success: true, message: 'Feedback recorded successfully' })
  } catch (error) {
    console.error('Failed to save feedback:', error)
    return noStoreJson({ error: 'Internal server error' }, { status: 500 })
  }
}
