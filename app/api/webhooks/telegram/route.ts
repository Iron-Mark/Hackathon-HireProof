import { after } from 'next/server'
import { handleTelegramWebhook, getTelegramCredentialStatus } from '@/lib/hireproof-bot'

export const runtime = 'nodejs'

const waitUntil = (task: Promise<unknown>) => after(() => task)

export async function GET() {
  return Response.json({
    status: 'ChatSDK Agents Telegram webhook',
    endpoint: '/api/webhooks/telegram',
    credentialStatus: getTelegramCredentialStatus(),
  })
}

export async function POST(request: Request) {
  return handleTelegramWebhook(request, { waitUntil })
}
