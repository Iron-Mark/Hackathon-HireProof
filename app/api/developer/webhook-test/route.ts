import { cookies } from 'next/headers'
import { getUserFromSessionToken, listApiKeys } from '@/lib/auth-store'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { buildHireProofWebhookHeaders } from '@/lib/webhook-signing.mjs'
import { validateWebhookUrl, WebhookUrlValidationError } from '@/lib/webhook-url-security'
import { noStoreJson } from '@/lib/response-security'

const WEBHOOK_TEST_PAYLOAD_LIMIT_BYTES = 32 * 1024

async function discardWebhookReceiverResponse(response: Response) {
  await response.body?.cancel().catch(() => undefined)
}

export async function POST(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  // 1. Authenticate (optional strict check, but good practice for developer portals)
  const cookieStore = await cookies()
  const user = await getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
  
  if (!user) {
    return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  }

  const rateLimit = await checkRateLimit(`developer_webhook_test:${user.id}:${requestIp(request)}`, {
    limit: 10,
    windowMs: 60000,
  })
  if (!rateLimit.success) {
    return noStoreJson({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  try {
    const parsedJson = await readJsonRequest(request, WEBHOOK_TEST_PAYLOAD_LIMIT_BYTES, 'Webhook test payload')
    if (!parsedJson.ok) return parsedJson.response

    const body = parsedJson.value
    let url = body?.url

    if (!url || typeof url !== 'string') {
      return noStoreJson({ error: 'Invalid or missing webhook URL.' }, { status: 400 })
    }

    try {
      url = await validateWebhookUrl(url)
    } catch (error) {
      if (error instanceof WebhookUrlValidationError) {
        return noStoreJson({ error: error.message }, { status: 400 })
      }
      return noStoreJson({ error: 'Invalid webhook URL format.' }, { status: 400 })
    }

    // 2. Generate a mock payload matching the HireProof shape
    const mockPayload = {
      event: 'audit.completed',
      id: `evt_test_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toISOString(),
      data: {
        auditId: `hp_test_${Math.random().toString(36).slice(2, 11)}`,
        verdict: 'high-risk',
        riskScore: 92,
        extractedClaims: {
          company: 'Test Company Inc.',
          role: 'Remote Testing Engineer',
          salary: '$100k/year',
          location: 'Remote',
        },
        summary: 'This is a test webhook payload sent from the HireProof Developer Sandbox.',
      }
    }
    const payload = JSON.stringify(mockPayload)
    const [firstKey] = await listApiKeys(user.id)
    const signingSecret = firstKey
      ? `sandbox:${user.id}:${firstKey.id}:${firstKey.lastFour}`
      : `sandbox:${user.id}`
    const signedHeaders = buildHireProofWebhookHeaders(
      payload,
      signingSecret,
      'audit.completed',
      'HireProof-Webhook-Sandbox/1.0',
    )

    // 3. Dispatch the webhook
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: signedHeaders,
      body: payload,
      signal: controller.signal,
      redirect: 'manual',
    })

    clearTimeout(timeoutId)
    await discardWebhookReceiverResponse(response)

    if (response.status >= 300 && response.status < 400) {
      return noStoreJson(
        { error: `Webhook redirects are not followed for safety. Receiver returned status ${response.status}` },
        { status: 502 }
      )
    }

    if (!response.ok) {
      return noStoreJson(
        { error: `Webhook receiver returned status ${response.status}` },
        { status: 502 }
      )
    }

    return noStoreJson({
      success: true,
      status: response.status,
      preview: {
        headers: signedHeaders,
        body: mockPayload,
        signing: {
          scheme: 'HMAC-SHA256',
          parity: '/api/v1/audit webhook_url delivery',
        },
      },
    })

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return noStoreJson({ error: 'Webhook request timed out after 8 seconds.' }, { status: 504 })
    }
    return noStoreJson({ error: `Failed to dispatch webhook: ${error.message}` }, { status: 500 })
  }
}
