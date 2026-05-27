import { cookies } from 'next/headers'
import { getUserFromSessionToken, isOperatorUser } from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'
import { getReport, saveReport } from '@/lib/db'
import { repairAuditReportForDisplay } from '@/lib/report-repair.mjs'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

export const runtime = 'nodejs'
const REPAIR_REPORTS_PAYLOAD_LIMIT_BYTES = 32 * 1024

async function requireUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
}

type RepairUser = NonNullable<Awaited<ReturnType<typeof requireUser>>>
type RepairReport = NonNullable<Awaited<ReturnType<typeof getReport>>>

function canRepairReport(user: RepairUser, report: RepairReport | null | undefined) {
  if (!report) return false
  if (report.ownerId && report.ownerId === user.id) return true
  return isOperatorUser(user)
}

function normalizeIds(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter((id) => /^(report|chat)_[a-zA-Z0-9_-]{1,90}$/.test(id))
    .slice(0, 25)
}

export async function POST(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const user = await requireUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (isDemoAccountEmail(user.email)) {
    return noStoreJson({ error: 'Demo accounts cannot modify developer resources.' }, { status: 403 })
  }

  const rateLimit = await checkRateLimit(`developer_repair_reports:${user.id}:${requestIp(request)}`, {
    limit: 10,
    windowMs: 60_000,
  })
  if (!rateLimit.success) {
    return noStoreJson({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  const parsedJson = await readJsonRequest(request, REPAIR_REPORTS_PAYLOAD_LIMIT_BYTES, 'Repair payload')
  if (!parsedJson.ok) return parsedJson.response

  const body = parsedJson.value
  const ids = normalizeIds(body.ids)
  const dryRun = body.dryRun !== false

  if (ids.length === 0) {
    return noStoreJson({ error: 'At least one valid report id is required.' }, { status: 400 })
  }

  const results = []

  for (const id of ids) {
    const existing = await getReport(id)
    if (!existing || !canRepairReport(user, existing)) {
      results.push({ id, status: 'missing', changed: false, changedFields: [] })
      continue
    }

    const repaired = repairAuditReportForDisplay(existing)
    if (repaired.changed && !dryRun) {
      await saveReport(repaired.report)
      console.info('developer repair-reports mutation', {
        actorUserId: user.id,
        reportId: id,
        changedFields: repaired.changedFields,
      })
    }

    results.push({
      id,
      status: repaired.changed ? (dryRun ? 'would-repair' : 'repaired') : 'unchanged',
      changed: repaired.changed,
      changedFields: repaired.changedFields,
      report: dryRun ? repaired.report : undefined,
    })
  }

  return noStoreJson({ dryRun, results })
}
