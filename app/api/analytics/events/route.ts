import { recordProductEvent } from '@/lib/auth-store'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

const ANALYTICS_EVENT_PAYLOAD_LIMIT_BYTES = 16_384

export async function POST(request: Request) {
  const originError = validateMutationOrigin(request)
  if (originError) return originError

  const rateLimit = await checkRateLimit(`analytics_events:${requestIp(request)}`, {
    limit: 60,
    windowMs: 60000,
  })
  if (!rateLimit.success) {
    return noStoreJson({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  try {
    const parsedJson = await readJsonRequest(request, ANALYTICS_EVENT_PAYLOAD_LIMIT_BYTES, 'Analytics event payload')
    if (!parsedJson.ok) return parsedJson.response
    const body = parsedJson.value
    await recordProductEvent({
      eventName: body.eventName,
      path: body.path,
      metadata: body.metadata,
    })
    return noStoreJson({ ok: true })
  } catch {
    return noStoreJson({ error: 'Could not record event.' }, { status: 400 })
  }
}
