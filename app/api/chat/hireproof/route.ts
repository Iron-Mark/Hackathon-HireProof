import { NextResponse } from 'next/server'
import { createChatReply, getChatCredentialStatus, type ChatPlatform } from '@/lib/hireproof-bot'

export const runtime = 'nodejs'

const supportedPlatforms = ['slack', 'discord', 'telegram', 'whatsapp', 'local'] as const

function normalizePlatform(platform: unknown): ChatPlatform {
  return supportedPlatforms.includes(platform as ChatPlatform) ? platform as ChatPlatform : 'local'
}

export async function GET() {
  return NextResponse.json({
    status: 'ChatSDK Agents local test endpoint with multi-platform webhook wiring.',
    platformWebhooks: {
      slack: '/api/webhooks/slack',
      discord: '/api/webhooks/discord',
      telegram: '/api/webhooks/telegram',
      whatsapp: '/api/webhooks/zernio',
    },
    supportedPlatforms,
    credentialStatus: getChatCredentialStatus(),
    usage: {
      method: 'POST',
      body: { text: 'Suspicious job post text', platform: 'discord', channel: 'demo' },
    },
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const text = typeof body.text === 'string' ? body.text : ''

  if (!text.trim()) {
    return NextResponse.json({ error: 'Missing text for chat verification.' }, { status: 400 })
  }

  const baseUrl = process.env.APP_BASE_URL || new URL(request.url).origin
  const platform = normalizePlatform(body.platform)
  const { report, verdict } = await createChatReply(text, baseUrl, platform, {
    channelId: typeof body.channel === 'string' ? body.channel : undefined,
    threadId: typeof body.thread === 'string' ? body.thread : undefined,
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
