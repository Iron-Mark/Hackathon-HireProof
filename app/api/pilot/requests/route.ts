import { cookies } from 'next/headers'
import { createPilotRequest, getUserFromSessionToken, isOperatorUser, listPilotRequests, recordProductEvent, updatePilotRequestStatus } from '@/lib/auth-store'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

const PILOT_REQUEST_PAYLOAD_LIMIT_BYTES = 65_536

async function requireUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
}

export async function GET() {
  const user = await requireUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (!isOperatorUser(user)) return noStoreJson({ error: 'Operator access required.' }, { status: 403 })
  return noStoreJson({ requests: await listPilotRequests() })
}

export async function POST(request: Request) {
  const originError = validateMutationOrigin(request)
  if (originError) return originError

  const rateLimit = await checkRateLimit(`pilot_request_submit:${requestIp(request)}`, {
    limit: 10,
    windowMs: 60000,
  })
  if (!rateLimit.success) {
    return noStoreJson({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  try {
    const parsedJson = await readJsonRequest(request, PILOT_REQUEST_PAYLOAD_LIMIT_BYTES, 'Pilot request payload')
    if (!parsedJson.ok) return parsedJson.response

    const body = parsedJson.value
    const record = await createPilotRequest({
      name: body.name,
      email: body.email,
      organization: body.organization,
      pilotType: body.pilotType,
      workflow: body.workflow,
      sourcePath: body.sourcePath || '/pilot',
    })
    await recordProductEvent({
      eventName: 'pilot_request_submitted',
      path: '/pilot',
      metadata: {
        pilotType: record.pilotType,
        hasOrganization: record.organization ? 'yes' : 'no',
      },
    }).catch(() => null)
    return noStoreJson({ request: record }, { status: 201 })
  } catch (error) {
    return noStoreJson({ error: error instanceof Error ? error.message : 'Could not save pilot request.' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const originError = validateMutationOrigin(request)
  if (originError) return originError

  const user = await requireUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (!isOperatorUser(user)) return noStoreJson({ error: 'Operator access required.' }, { status: 403 })

  const rateLimit = await checkRateLimit(`pilot_request_status:${user.id}:${requestIp(request)}`, {
    limit: 60,
    windowMs: 60000,
  })
  if (!rateLimit.success) {
    return noStoreJson({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  try {
    const parsedJson = await readJsonRequest(request, PILOT_REQUEST_PAYLOAD_LIMIT_BYTES, 'Pilot request payload')
    if (!parsedJson.ok) return parsedJson.response

    const body = parsedJson.value
    const updated = await updatePilotRequestStatus(body.id, body.status)
    await recordProductEvent({
      eventName: 'pilot_request_status_updated',
      path: '/pilot/admin',
      metadata: { status: updated.status },
    }).catch(() => null)
    return noStoreJson({ request: updated })
  } catch (error) {
    return noStoreJson({ error: error instanceof Error ? error.message : 'Could not update pilot request.' }, { status: 400 })
  }
}
