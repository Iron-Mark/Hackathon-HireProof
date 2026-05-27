import dns from 'node:dns/promises'
import net from 'node:net'

export class WebhookUrlValidationError extends Error {
  constructor(message = 'Webhook URL cannot target a private or local network address') {
    super(message)
    this.name = 'WebhookUrlValidationError'
  }
}

function normalizeWebhookHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/\.$/, '')
}

export function isPrivateOrReservedIpAddress(address: string) {
  const version = net.isIP(address)
  if (version === 4) {
    const parts = address.split('.').map((part) => Number(part))
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true
    const [a, b] = parts
    return a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0 && parts[2] === 0) ||
      (a === 192 && b === 0 && parts[2] === 2) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && parts[2] === 100) ||
      (a === 203 && b === 0 && parts[2] === 113)
  }

  if (version === 6) {
    const normalized = address.toLowerCase()
    if (normalized.startsWith('::ffff:')) {
      return isPrivateOrReservedIpAddress(normalized.replace(/^::ffff:/, ''))
    }
    return normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('64:ff9b:1:') ||
      normalized.startsWith('100:') ||
      normalized.startsWith('2001:2:') ||
      normalized.startsWith('2001:db8:') ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:') ||
      normalized.startsWith('ff')
  }

  return true
}

function isBlockedWebhookHostname(hostname: string) {
  return !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
}

export async function validateWebhookUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  if (url.protocol !== 'https:') throw new WebhookUrlValidationError('Webhook URL must use https://')
  if (url.username || url.password) throw new WebhookUrlValidationError('Webhook URL cannot include credentials')

  const hostname = normalizeWebhookHostname(url.hostname)
  if (isBlockedWebhookHostname(hostname)) throw new WebhookUrlValidationError()

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIpAddress(hostname)) throw new WebhookUrlValidationError()
    return url.toString()
  }

  const resolved = await dns.lookup(hostname, { all: true, verbatim: true })
  if (!resolved.length || resolved.some((record) => isPrivateOrReservedIpAddress(record.address))) {
    throw new WebhookUrlValidationError('Webhook URL resolves to a private or local network address')
  }

  return url.toString()
}
