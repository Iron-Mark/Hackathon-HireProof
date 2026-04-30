import { after } from 'next/server'
import { handleZernioWebhook, getWhatsAppCredentialStatus } from '@/lib/hireproof-bot'

export const runtime = 'nodejs'

const waitUntil = (task: Promise<unknown>) => after(() => task)

export async function GET() {
  return Response.json({
    status: 'ChatSDK Agents WhatsApp webhook via Zernio',
    endpoint: '/api/webhooks/zernio',
    credentialStatus: getWhatsAppCredentialStatus(),
  })
}

export async function POST(request: Request) {
  return handleZernioWebhook(request, { waitUntil })
}
