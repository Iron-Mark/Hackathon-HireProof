import { after } from 'next/server'
import { handleDiscordWebhook, getDiscordCredentialStatus } from '@/lib/hireproof-bot'

export const runtime = 'nodejs'

const waitUntil = (task: Promise<unknown>) => after(() => task)

export async function GET() {
  return Response.json({
    status: 'ChatSDK Agents Discord webhook',
    endpoint: '/api/webhooks/discord',
    credentialStatus: getDiscordCredentialStatus(),
  })
}

export async function POST(request: Request) {
  return handleDiscordWebhook(request, { waitUntil })
}
