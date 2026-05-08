import { createPublicKey, verify } from 'node:crypto'
import { Chat, type Adapter, type Thread, type Message, type WebhookOptions } from 'chat'
import { createDiscordAdapter } from '@chat-adapter/discord'
import { createSlackAdapter } from '@chat-adapter/slack'
import { createRedisState } from '@chat-adapter/state-redis'
import { createTelegramAdapter } from '@chat-adapter/telegram'
import { createZernioAdapter } from '@zernio/chat-sdk-adapter'
import { DEMO_FIXTURES } from '@/lib/fixtures'
import { formatChatVerdict } from '@/lib/chat-verdict'
import { saveReport } from '@/lib/db'
import type { AuditReport } from '@/lib/schemas'

export type ChatPlatform = 'slack' | 'discord' | 'telegram' | 'whatsapp' | 'local'
type WebhookPlatform = 'slack' | 'discord' | 'telegram' | 'zernio'

type HireProofBot = Chat<Record<string, Adapter>>

const CHAT_TEXT_LIMIT = 10_000
const DEFAULT_PRODUCTION_BASE_URL = 'https://hireproof.tech'
const CHAT_URL_PATTERN = /https?:\/\/[^\s<>"')]+/i
const DISCORD_INTERACTION_PING_TYPE = 1
const DISCORD_INTERACTION_APPLICATION_COMMAND_TYPE = 2
const DISCORD_INTERACTION_CALLBACK_PONG_TYPE = 1
const DISCORD_INTERACTION_CALLBACK_CHANNEL_MESSAGE_TYPE = 4
const DISCORD_INTERACTION_CALLBACK_DEFERRED_CHANNEL_MESSAGE_TYPE = 5
const ED25519_SPKI_DER_PREFIX = '302a300506032b6570032100'
const requiredEnvironmentByPlatform: Record<WebhookPlatform, string[]> = {
  slack: ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'REDIS_URL'],
  discord: ['DISCORD_BOT_TOKEN', 'DISCORD_PUBLIC_KEY', 'DISCORD_APPLICATION_ID', 'REDIS_URL'],
  telegram: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET_TOKEN', 'TELEGRAM_BOT_USERNAME', 'REDIS_URL'],
  zernio: ['ZERNIO_API_KEY', 'ZERNIO_WEBHOOK_SECRET', 'REDIS_URL'],
}
const chatPlatformByWebhookPlatform: Record<WebhookPlatform, Exclude<ChatPlatform, 'local'>> = {
  slack: 'slack',
  discord: 'discord',
  telegram: 'telegram',
  zernio: 'whatsapp',
}

let bot: HireProofBot | null = null
let botFingerprint: string | null = null

function present(value?: string) {
  return Boolean(value?.trim())
}

function hasChatState() {
  return Boolean(process.env.REDIS_URL?.trim())
}

function getRedisUrl() {
  return process.env.REDIS_URL!.trim()
}

function hasSlackCredentials() {
  return present(process.env.SLACK_BOT_TOKEN) && present(process.env.SLACK_SIGNING_SECRET) && hasChatState()
}

function hasDiscordCredentials() {
  return present(process.env.DISCORD_BOT_TOKEN) && present(process.env.DISCORD_PUBLIC_KEY) && present(process.env.DISCORD_APPLICATION_ID) && hasChatState()
}

function hasTelegramCredentials() {
  return present(process.env.TELEGRAM_BOT_TOKEN) && present(process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN) && present(process.env.TELEGRAM_BOT_USERNAME) && hasChatState()
}

function hasWhatsAppCredentials() {
  return present(process.env.ZERNIO_API_KEY) && present(process.env.ZERNIO_WEBHOOK_SECRET) && hasChatState()
}

function pickFixture(text: string) {
  const lower = text.toLowerCase()

  if (
    (lower.includes('check') || lower.includes('cheque')) &&
    (lower.includes('deposit') || lower.includes('supplier') || lower.includes('zelle') || lower.includes('crypto'))
  ) {
    return {
      ...DEMO_FIXTURES.highRisk,
      summary: 'This opportunity matches a common fake-check job scam. The employer is asking you to deposit a check, keep part of the funds, and forward money to a supplier before the payment can safely clear.',
      extractedClaims: {
        company: 'Unknown / Not Verifiable',
        role: 'Part-time Data Entry',
        salary: '$45/hour',
        location: 'Remote',
        contactMethod: 'Chat message',
        applicationPath: 'Direct recruiter approval',
      },
      redFlags: [
        'Check-deposit workflow before confirmed employment',
        'Request to send money to a supplier through Zelle or crypto',
        'Approved after only a short text chat',
        'Urgent pressure to act before finance staff can be reached',
        'Payment handling is shifted onto the applicant',
      ],
      evidence: [
        {
          source: 'Fake Check Pattern',
          snippet: 'Legitimate employers do not ask applicants to deposit checks and forward funds to vendors during onboarding.',
          type: 'Scam Pattern',
          url: undefined,
        },
        {
          source: 'Payment Risk Review',
          snippet: 'Zelle, crypto, and supplier-transfer requests are high-risk because funds may be irreversible after the original check fails.',
          type: 'Payment Safety',
          url: undefined,
        },
      ],
      nextSteps: [
        'Do not deposit the check or forward any money',
        'Do not share banking details or payment app information',
        'Call the company through an independently verified phone number',
        'Report the recruiter account and preserve screenshots',
      ],
    }
  }

  if (
    lower.includes('software') &&
    (lower.includes('vendor') || lower.includes('receipt') || lower.includes('reimburse') || lower.includes('buy'))
  ) {
    return {
      ...DEMO_FIXTURES.highRisk,
      summary: 'This opportunity matches an advance-fee equipment or software scam. A legitimate employer should not require you to buy onboarding software from a specified vendor before your employment is verified.',
      extractedClaims: {
        company: 'Unknown / Not Verifiable',
        role: 'Remote Payroll Assistant',
        salary: '$38/hour',
        location: 'Remote',
        contactMethod: 'Personal email or chat',
        applicationPath: 'Direct recruiter message',
      },
      redFlags: [
        'Required purchase before onboarding can continue',
        'Approved without a real interview',
        'Recruiter avoids video calls and official channels',
        'Reimbursement promised only after a future paycheck',
        'Pressure to send a receipt immediately',
      ],
      evidence: [
        {
          source: 'Advance-Fee Pattern',
          snippet: 'Upfront purchases through a recruiter-selected vendor are a known job-scam pattern.',
          type: 'Scam Pattern',
          url: undefined,
        },
        {
          source: 'Hiring Process Review',
          snippet: 'Payroll roles normally require formal interviews, identity checks through official systems, and written employment documents.',
          type: 'Process Check',
          url: undefined,
        },
      ],
      nextSteps: [
        'Do not buy the software or send a receipt',
        'Ask for a formal offer through a verified company domain',
        'Verify the recruiter through the company switchboard or careers site',
        'Preserve screenshots and report the account if verification fails',
      ],
    }
  }

  if (
    (lower.includes('passport') || lower.includes('bank login') || lower.includes('selfie') || lower.includes('holding my id')) &&
    (lower.includes('payroll') || lower.includes('personal account') || lower.includes('activate'))
  ) {
    return {
      ...DEMO_FIXTURES.highRisk,
      summary: 'This opportunity is high-risk for identity theft and money-mule abuse. The recruiter is asking for sensitive identity and banking material before providing a verifiable contract.',
      extractedClaims: {
        company: 'Unknown / Not Verifiable',
        role: 'Virtual Assistant',
        salary: 'Not specified',
        location: 'Remote',
        contactMethod: 'Messaging app',
        applicationPath: 'Direct message only',
      },
      redFlags: [
        'Requests passport scan, selfie with ID, or bank login screenshots',
        'Asks applicant to receive customer payments through a personal account',
        'No written employment contract before sensitive data is requested',
        'Recruiter number is not listed on official company channels',
      ],
      evidence: [
        {
          source: 'Identity Theft Pattern',
          snippet: 'Employers should not request bank login screenshots or identity selfies through chat during early screening.',
          type: 'Identity Safety',
          url: undefined,
        },
        {
          source: 'Money Mule Risk',
          snippet: 'Receiving customer payments through a personal account can expose applicants to fraud and compliance risk.',
          type: 'Financial Safety',
          url: undefined,
        },
      ],
      nextSteps: [
        'Do not send ID scans, banking screenshots, or account credentials',
        'Do not receive or forward payments through personal accounts',
        'Demand a formal contract and verify the company independently',
        'Report the recruiter if they continue requesting sensitive documents',
      ],
    }
  }

  if (
    (lower.includes('shipping coordinator') || lower.includes('packages') || lower.includes('relabel') || lower.includes('forwarding')) &&
    (lower.includes('home address') || lower.includes('overseas') || lower.includes('do not open') || lower.includes('bank details'))
  ) {
    return {
      ...DEMO_FIXTURES.highRisk,
      summary: 'This opportunity matches a reshipping scam. Work-from-home package forwarding can involve stolen goods, identity misuse, and financial exposure for the applicant.',
      extractedClaims: {
        company: 'Unknown / Not Verifiable',
        role: 'Remote Shipping Coordinator',
        salary: '$900/week plus bonuses',
        location: 'Work from home',
        contactMethod: 'Personal email',
        applicationPath: 'Direct recruiter message',
      },
      redFlags: [
        'Packages are sent to the applicant home address',
        'Applicant is told not to open packages',
        'Goods must be relabeled and forwarded overseas',
        'ID and bank details requested before a formal contract',
      ],
      evidence: [
        {
          source: 'Reshipping Scam Pattern',
          snippet: 'Package-forwarding jobs that use a personal home address are a known fraud pattern.',
          type: 'Scam Pattern',
          url: undefined,
        },
        {
          source: 'Identity and Address Risk',
          snippet: 'Providing ID, home address, and bank details before verified employment increases exposure to identity misuse.',
          type: 'Safety Review',
          url: undefined,
        },
      ],
      nextSteps: [
        'Do not accept packages or provide your home address',
        'Do not submit ID or bank details before independent verification',
        'Verify the company through official registry and career channels',
        'Report the listing to the job board or platform',
      ],
    }
  }

  if (
    lower.includes('telegram') ||
    lower.includes('80000') ||
    lower.includes('80,000') ||
    lower.includes('processing fee') ||
    lower.includes('wallet activation') ||
    lower.includes('background verification')
  ) return DEMO_FIXTURES.highRisk
  if (lower.includes('unclear') || lower.includes('maybe') || lower.includes('caution')) return DEMO_FIXTURES.caution
  return DEMO_FIXTURES.safe
}

function normalizeChatText(text: string) {
  return text.trim().slice(0, CHAT_TEXT_LIMIT)
}

function normalizeBaseUrl(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function getChatReplyBaseUrl() {
  return normalizeBaseUrl(process.env.APP_BASE_URL) ||
    normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL) ||
    (process.env.VERCEL ? DEFAULT_PRODUCTION_BASE_URL : '')
}

function verifyDiscordInteractionRequest(request: Request, body: string) {
  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')
  const publicKey = process.env.DISCORD_PUBLIC_KEY?.trim()

  if (!signature || !timestamp || !publicKey) return false
  if (!/^[\da-f]{128}$/i.test(signature) || !/^[\da-f]{64}$/i.test(publicKey)) return false

  const key = createPublicKey({
    key: Buffer.concat([
      Buffer.from(ED25519_SPKI_DER_PREFIX, 'hex'),
      Buffer.from(publicKey, 'hex'),
    ]),
    format: 'der',
    type: 'spki',
  })

  return verify(
    null,
    Buffer.from(`${timestamp}${body}`),
    key,
    Buffer.from(signature, 'hex'),
  )
}

function createDiscordInteractionResponse(content: string) {
  return Response.json({
    type: DISCORD_INTERACTION_CALLBACK_CHANNEL_MESSAGE_TYPE,
    data: {
      content,
      allowed_mentions: { parse: [] },
    },
  })
}

function createDeferredDiscordInteractionResponse() {
  return Response.json({
    type: DISCORD_INTERACTION_CALLBACK_DEFERRED_CHANNEL_MESSAGE_TYPE,
  })
}

function truncateDiscordMessage(content: string) {
  return content.length > 1900 ? `${content.slice(0, 1897)}...` : content
}

async function updateDiscordInteraction(applicationId: string, token: string, content: string) {
  await fetch(`https://discord.com/api/v10/webhooks/${applicationId}/${token}/messages/@original`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: truncateDiscordMessage(content),
      allowed_mentions: { parse: [] },
    }),
  })
}

function extractDiscordCommandText(payload: {
  data?: {
    options?: Array<{
      name?: string
      value?: unknown
    }>
  }
}) {
  const option = payload.data?.options?.find((item) => item.name === 'job_post')
  return typeof option?.value === 'string' ? option.value : ''
}

async function handleDiscordApplicationCommand(payload: {
  application_id?: string
  token?: string
  data?: {
    name?: string
    options?: Array<{
      name?: string
      value?: unknown
    }>
  }
  channel_id?: string
  guild_id?: string
}, options?: WebhookOptions) {
  const command = payload.data?.name

  if (command === 'help') {
    return createDiscordInteractionResponse(
      'HireProof checks suspicious job posts, recruiter messages, and apply links. Use `/verify` and paste the full job text to get a Safe, Caution, or High-Risk verdict.',
    )
  }

  if (command !== 'verify') return null

  const text = normalizeChatText(extractDiscordCommandText(payload))

  if (!text) {
    return createDiscordInteractionResponse(
      'Paste the job post into the `job_post` field, then run `/verify` again.',
    )
  }

  const runVerify = async () => {
    const baseUrl = getChatReplyBaseUrl()
    const { verdict } = await createDiscordAuditReply(text, baseUrl, {
      threadId: payload.guild_id ? `discord:${payload.guild_id}` : undefined,
      channelId: payload.channel_id,
    })

    if (payload.application_id && payload.token) {
      await updateDiscordInteraction(payload.application_id, payload.token, verdict.text)
    }

    return verdict.text
  }

  if (payload.application_id && payload.token && options?.waitUntil) {
    options.waitUntil(runVerify().catch(async (error) => {
      console.error('[Discord] verify command failed:', error instanceof Error ? error.message : 'Unknown command error')
      await updateDiscordInteraction(
        payload.application_id as string,
        payload.token as string,
        'HireProof could not complete this Discord audit. If this was a job URL, paste the visible job title, company, pay, location, and application process into `/verify`.',
      )
    }))

    return createDeferredDiscordInteractionResponse()
  }

  return createDiscordInteractionResponse(await runVerify())
}

function cloneRequestWithBody(request: Request, body: string) {
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body,
  })
}

async function sendTelegramMessage(chatId: number | string, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!botToken) return

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })
}

async function handleTelegramStartCommand(request: Request, body: string) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN?.trim()
  const providedSecret = request.headers.get('x-telegram-bot-api-secret-token')?.trim()

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response('invalid telegram webhook secret', { status: 401 })
  }

  const update = JSON.parse(body) as {
    message?: {
      text?: string
      chat?: { id?: number | string }
    }
  }
  const text = update.message?.text?.trim()
  const chatId = update.message?.chat?.id

  if (!chatId || !text?.startsWith('/start')) return null

  await sendTelegramMessage(
    chatId,
    'Welcome to HireProof. Send a suspicious job post, recruiter message, or apply link and I will return a Safe, Caution, or High-Risk verdict with evidence.',
  )

  return Response.json({ ok: true, handled: 'telegram-start' })
}

export function getSlackCredentialStatus() {
  return {
    botToken: present(process.env.SLACK_BOT_TOKEN),
    signingSecret: present(process.env.SLACK_SIGNING_SECRET),
    redis: hasChatState(),
    ready: hasSlackCredentials(),
  }
}

export function getDiscordCredentialStatus() {
  return {
    botToken: present(process.env.DISCORD_BOT_TOKEN),
    publicKey: present(process.env.DISCORD_PUBLIC_KEY),
    applicationId: present(process.env.DISCORD_APPLICATION_ID),
    redis: hasChatState(),
    ready: hasDiscordCredentials(),
  }
}

export function getTelegramCredentialStatus() {
  return {
    botToken: present(process.env.TELEGRAM_BOT_TOKEN),
    webhookSecretToken: present(process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN),
    botUsername: present(process.env.TELEGRAM_BOT_USERNAME),
    redis: hasChatState(),
    ready: hasTelegramCredentials(),
  }
}

export function getWhatsAppCredentialStatus() {
  return {
    apiKey: present(process.env.ZERNIO_API_KEY),
    webhookSecret: present(process.env.ZERNIO_WEBHOOK_SECRET),
    redis: hasChatState(),
    ready: hasWhatsAppCredentials(),
  }
}

export function getChatCredentialStatus() {
  return {
    slack: getSlackCredentialStatus(),
    discord: getDiscordCredentialStatus(),
    telegram: getTelegramCredentialStatus(),
    whatsapp: getWhatsAppCredentialStatus(),
  }
}

function getChatConfigFingerprint() {
  return JSON.stringify({
    redis: process.env.REDIS_URL?.trim() || '',
    slack: hasSlackCredentials(),
    discord: hasDiscordCredentials(),
    telegram: hasTelegramCredentials(),
    whatsapp: hasWhatsAppCredentials(),
  })
}

function createCredentialGateResponse(platform: WebhookPlatform) {
  const chatPlatform = chatPlatformByWebhookPlatform[platform]

  return Response.json({
    error: `${platform === 'zernio' ? 'WhatsApp/Zernio' : platform} ChatSDK credentials are not configured.`,
    platform: chatPlatform,
    required: requiredEnvironmentByPlatform[platform],
    credentialStatus: getChatCredentialStatus()[chatPlatform],
  }, { status: 503 })
}

export async function createChatReply(text: string, baseUrl: string, platform: ChatPlatform = 'local', metadata?: {
  threadId?: string
  channelId?: string
}) {
  const now = Date.now()
  const safeText = normalizeChatText(text)
  const report: AuditReport = {
    ...pickFixture(safeText),
    id: `chat_${now}`,
    timestamp: new Date(now).toISOString(),
    source: 'chat' as const,
    mode: 'demo' as const,
    chatPlatform: platform,
    chatThreadId: metadata?.threadId,
    chatChannelId: metadata?.channelId,
  }

  try {
    await saveReport(report)
  } catch (error) {
    console.error('[ChatSDK] Report persistence failed:', error instanceof Error ? error.message : 'Unknown persistence error')
  }
  const verdict = formatChatVerdict(report, baseUrl)

  return { report, verdict }
}

export async function createDiscordAuditReply(text: string, baseUrl: string, metadata?: {
  threadId?: string
  channelId?: string
}) {
  const safeText = normalizeChatText(text)
  const inputUrl = safeText.match(CHAT_URL_PATTERN)?.[0]?.replace(/[),.;]+$/, '')

  const auditBaseUrl = baseUrl || DEFAULT_PRODUCTION_BASE_URL
  const apiKey = process.env.AGENT_API_KEY?.trim() || 'hireproof_agent_demo_key'
  const response = await fetch(`${auditBaseUrl}/api/v1/audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      text: safeText,
      url: inputUrl || undefined,
      mode: 'live',
    }),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Discord audit API returned HTTP ${response.status}: ${details.slice(0, 300)}`)
  }

  const now = Date.now()
  const apiReport = await response.json() as AuditReport
  const report: AuditReport = {
    ...apiReport,
    id: `chat_${now}`,
    timestamp: new Date(now).toISOString(),
    source: 'chat',
    chatPlatform: 'discord',
    chatThreadId: metadata?.threadId,
    chatChannelId: metadata?.channelId,
  }

  try {
    await saveReport(report)
  } catch (error) {
    console.error('[Discord] Report persistence failed:', error instanceof Error ? error.message : 'Unknown persistence error')
  }

  return { report, verdict: formatChatVerdict(report, auditBaseUrl) }
}

async function replyToThread(thread: Thread, message: Message, platform: ChatPlatform) {
  const text = normalizeChatText(message.text || '')
  if (!text) return

  const baseUrl = getChatReplyBaseUrl()
  const { verdict } = await createChatReply(text, baseUrl, platform, {
    threadId: thread.id,
    channelId: thread.channelId,
  })
  await thread.post(verdict.text)
}

function platformFromThreadId(threadId: string): ChatPlatform {
  if (threadId.startsWith('discord:')) return 'discord'
  if (threadId.startsWith('telegram:')) return 'telegram'
  if (threadId.startsWith('zernio:')) return 'whatsapp'
  if (threadId.startsWith('slack:')) return 'slack'
  return 'local'
}

function getAdapters() {
  const adapters: Record<string, Adapter> = {}

  if (hasSlackCredentials()) {
    adapters.slack = createSlackAdapter({
      botToken: process.env.SLACK_BOT_TOKEN!.trim(),
      signingSecret: process.env.SLACK_SIGNING_SECRET!.trim(),
      userName: 'hireproof',
    })
  }

  if (hasDiscordCredentials()) {
    adapters.discord = createDiscordAdapter({
      botToken: process.env.DISCORD_BOT_TOKEN!.trim(),
      publicKey: process.env.DISCORD_PUBLIC_KEY!.trim(),
      applicationId: process.env.DISCORD_APPLICATION_ID!.trim(),
      userName: 'hireproof',
    })
  }

  if (hasTelegramCredentials()) {
    adapters.telegram = createTelegramAdapter({
      botToken: process.env.TELEGRAM_BOT_TOKEN!.trim(),
      secretToken: process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN!.trim(),
      userName: process.env.TELEGRAM_BOT_USERNAME!.trim(),
      mode: 'webhook',
    })
  }

  if (hasWhatsAppCredentials()) {
    adapters.zernio = createZernioAdapter({
      apiKey: process.env.ZERNIO_API_KEY!.trim(),
      webhookSecret: process.env.ZERNIO_WEBHOOK_SECRET!.trim(),
      botName: process.env.ZERNIO_BOT_NAME?.trim() || 'HireProof',
    })
  }

  return adapters
}

export function getHireProofBot() {
  const fingerprint = getChatConfigFingerprint()
  if (bot && botFingerprint === fingerprint) return bot
  bot = null
  botFingerprint = fingerprint

  if (!hasChatState()) return null

  const adapters = getAdapters()
  if (Object.keys(adapters).length === 0) return null

  bot = new Chat({
    userName: 'hireproof',
    adapters,
    state: createRedisState({
      url: getRedisUrl(),
      keyPrefix: 'hireproof:chat-sdk',
    }),
    dedupeTtlMs: 600_000,
  })

  bot.onNewMention(async (thread, message) => {
    await thread.subscribe()
    await replyToThread(thread, message, platformFromThreadId(thread.id))
  })

  bot.onDirectMessage(async (thread, message) => {
    await thread.subscribe()
    await replyToThread(thread, message, platformFromThreadId(thread.id))
  })

  bot.onSubscribedMessage(async (thread, message) => {
    await replyToThread(thread, message, platformFromThreadId(thread.id))
  })

  return bot
}

async function handlePlatformWebhook(platform: WebhookPlatform, request: Request, options?: WebhookOptions) {
  const chat = getHireProofBot()

  if (!chat || !chat.webhooks[platform]) {
    return createCredentialGateResponse(platform)
  }

  return chat.webhooks[platform](request, options)
}

export async function handleSlackWebhook(request: Request, options?: WebhookOptions) {
  return handlePlatformWebhook('slack', request, options)
}

export async function handleDiscordWebhook(request: Request, options?: WebhookOptions) {
  const body = await request.text()

  try {
    const payload = JSON.parse(body) as {
      type?: number
      application_id?: string
      token?: string
      data?: {
        name?: string
        options?: Array<{
          name?: string
          value?: unknown
        }>
      }
      channel_id?: string
      guild_id?: string
    }

    if (payload.type === DISCORD_INTERACTION_PING_TYPE) {
      if (!verifyDiscordInteractionRequest(request, body)) {
        return new Response('invalid request signature', { status: 401 })
      }

      return Response.json({ type: DISCORD_INTERACTION_CALLBACK_PONG_TYPE })
    }

    if (payload.type === DISCORD_INTERACTION_APPLICATION_COMMAND_TYPE) {
      if (!verifyDiscordInteractionRequest(request, body)) {
        return new Response('invalid request signature', { status: 401 })
      }

      const commandResponse = await handleDiscordApplicationCommand(payload, options)
      if (commandResponse) return commandResponse
    }
  } catch {
    // Non-JSON requests are passed through so the adapter can return its own response.
  }

  return handlePlatformWebhook('discord', cloneRequestWithBody(request, body), options)
}

export async function handleTelegramWebhook(request: Request, options?: WebhookOptions) {
  const body = await request.text()

  try {
    const startResponse = await handleTelegramStartCommand(request, body)
    if (startResponse) return startResponse
  } catch {
    // Non-standard updates are passed through so the adapter can handle them.
  }

  return handlePlatformWebhook('telegram', cloneRequestWithBody(request, body), options)
}

export async function handleZernioWebhook(request: Request, options?: WebhookOptions) {
  return handlePlatformWebhook('zernio', request, options)
}
