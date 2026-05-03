import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserFromSessionToken } from '@/lib/auth-store'
import { getReport, saveReport } from '@/lib/db'
import { repairAuditReportForDisplay } from '@/lib/report-repair.mjs'

export const runtime = 'nodejs'

async function requireUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
}

function parseOrigin(value: string | null) {
  if (!value) return null

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function allowedMutationOrigins(request: Request) {
  const origins = new Set<string>([new URL(request.url).origin])
  const appBaseOrigin = parseOrigin(process.env.APP_BASE_URL || null)
  if (appBaseOrigin) origins.add(appBaseOrigin)
  return origins
}

function validateMutationOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const sourceOrigin = parseOrigin(origin) || parseOrigin(referer)

  if (!sourceOrigin || !allowedMutationOrigins(request).has(sourceOrigin)) {
    return NextResponse.json({ error: 'CSRF validation failed.' }, { status: 403 })
  }

  return null
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
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const ids = normalizeIds(body.ids)
  const dryRun = body.dryRun !== false

  if (ids.length === 0) {
    return NextResponse.json({ error: 'At least one valid report id is required.' }, { status: 400 })
  }

  const results = []

  for (const id of ids) {
    const existing = await getReport(id)
    if (!existing) {
      results.push({ id, status: 'missing', changed: false, changedFields: [] })
      continue
    }

    const repaired = repairAuditReportForDisplay(existing)
    if (repaired.changed && !dryRun) {
      await saveReport(repaired.report)
    }

    results.push({
      id,
      status: repaired.changed ? (dryRun ? 'would-repair' : 'repaired') : 'unchanged',
      changed: repaired.changed,
      changedFields: repaired.changedFields,
      report: dryRun ? repaired.report : undefined,
    })
  }

  return NextResponse.json({ dryRun, results })
}
