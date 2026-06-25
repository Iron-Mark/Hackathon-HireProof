import { NextResponse } from 'next/server'
import { createChatReply, getPublicChatReadiness, type ChatPlatform } from '@/lib/hireproof-bot'
import { AuditRequestSchema } from '@/lib/schemas'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { getTrustedInternalBaseUrl } from '@/lib/trusted-base-url'

export const runtime = 'nodejs'

const supportedPlatforms = ['slack', 'discord', 'telegram', 'whatsapp', 'local'] as const
const CHAT_TEXT_LIMIT = 10_000
const CHAT_PAYLOAD_LIMIT_BYTES = 5 * 1024 * 1024

function normalizePlatform(platform: unknown): ChatPlatform {
  return supportedPlatforms.includes(platform as ChatPlatform) ? platform as ChatPlatform : 'local'
}

function optionalMetadataValue(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 300) || undefined : undefined
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ChatSDK Agents local test endpoint with multi-platform webhook wiring.',
      platformWebhooks: {
        slack: '/api/webhooks/slack',
        discord: '/api/webhooks/discord',
        telegram: '/api/webhooks/telegram',
        whatsapp: '/api/webhooks/zernio',
      },
      supportedPlatforms,
      readiness: getPublicChatReadiness(),
      usage: {
        method: 'POST',
        body: { text: 'Suspicious job post text', platform: 'discord', channel: 'demo' },
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(request: Request) {
  const originError = validateMutationOrigin(request)
  if (originError) return originError

  const rateLimitResult = await checkRateLimit(`chat_hireproof:${requestIp(request)}`, { limit: 5, windowMs: 60000 })
  if (!rateLimitResult.success) {
    const retryAfter = 'retryAfterMs' in rateLimitResult ? Math.ceil((rateLimitResult as any).retryAfterMs / 1000) : 60
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const parsedJson = await readJsonRequest(request, CHAT_PAYLOAD_LIMIT_BYTES, 'Chat payload')
  if (!parsedJson.ok) return parsedJson.response

  const body = parsedJson.value
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request format.' }, { status: 400 })
  }

  const validated = AuditRequestSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({
      error: `Validation error: ${validated.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
    }, { status: 400 })
  }

  const normalizedText = validated.data.text.trim()

  if (!normalizedText) {
    return NextResponse.json({ error: 'Missing text for chat verification.' }, { status: 400 })
  }

  if (normalizedText.length > CHAT_TEXT_LIMIT) {
    return NextResponse.json({ error: 'Job post text must be 10,000 characters or fewer.' }, { status: 400 })
  }

  const baseUrl = getTrustedInternalBaseUrl()
  const platform = normalizePlatform(body.platform)
  const { report, verdict } = await createChatReply(normalizedText, baseUrl, platform, {
    channelId: optionalMetadataValue(body.channel),
    threadId: optionalMetadataValue(body.thread),
    persist: false,
  })

  return NextResponse.json({
    status: verdict.status,
    platform,
    channel: body.channel || null,
    reply: verdict.text,
    reportUrl: verdict.reportUrl,
    report,
  })
}
