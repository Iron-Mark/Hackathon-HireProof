import { after } from 'next/server'
import { handleZernioWebhook, getPublicChatReadiness } from '@/lib/hireproof-bot'
import { checkRateLimit } from '@/lib/rate-limit'
import { cloneRequestWithTextBody, readTextRequest, requestIp } from '@/lib/request-security'

export const runtime = 'nodejs'

const waitUntil = (task: Promise<unknown>) => after(() => task)
const WEBHOOK_PAYLOAD_LIMIT_BYTES = 1024 * 1024
const webhookName = 'zernio'

export async function GET() {
  return Response.json(
    {
      status: 'ChatSDK Agents WhatsApp webhook via Zernio',
      endpoint: '/api/webhooks/zernio',
      readiness: getPublicChatReadiness('whatsapp'),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(`webhook:${webhookName}:${requestIp(request)}`, { limit: 60, windowMs: 60000 })
  if (!rateLimit.success) {
    return Response.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const parsedBody = await readTextRequest(request, WEBHOOK_PAYLOAD_LIMIT_BYTES, 'Webhook payload')
  if (!parsedBody.ok) return parsedBody.response

  return handleZernioWebhook(cloneRequestWithTextBody(request, parsedBody.value), { waitUntil })
}
