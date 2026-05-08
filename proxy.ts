import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of suspicious security scanner User-Agents or patterns to block globally.
const BLOCKED_SCANNER_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /gobuster/i,
  /dirbuster/i,
  /masscan/i,
  /zgrab/i,
]

// AI crawler User-Agents are blocked on public pages only.
// API, MCP, webhook, and headless agent routes stay reachable for AI-to-AI integrations.
const BLOCKED_AI_CRAWLER_UA_PATTERNS = [
  /gptbot/i,
  /chatgpt-user/i,
  /oai-searchbot/i,
  /claudebot/i,
  /anthropic-ai/i,
  /perplexitybot/i,
  /perplexity-user/i,
  /ccbot/i,
  /bytespider/i,
  /google-extended/i,
  /applebot-extended/i,
  /meta-externalagent/i,
  /facebookbot/i,
  /amazonbot/i,
  /youbot/i,
  /diffbot/i,
  /cohere-ai/i,
  /omgili/i,
]

const SECURITY_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN', // Changed from DENY to SAMEORIGIN for internal badge demo
  'X-XSS-Protection': '1; mode=block',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Referrer-Policy': 'strict-origin-when-cross-origin', // Added from previous middleware
}

const DOWNLOAD_ROUTE_FILES = new Set([
  'hireproof-automation-curl.sh',
  'hireproof-extension.zip',
  'hireproof-langchain-tool.ts',
  'hireproof-make-http-config.json',
  'hireproof-n8n-workflow.json',
  'hireproof-native-integrations.zip',
])

export function proxy(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''
  const pathname = request.nextUrl.pathname
  const host = request.headers.get('host')?.toLowerCase().split(':')[0] || ''

  if (host === 'hireproof-sigma.vercel.app' || host === 'www.hireproof.tech') {
    const url = request.nextUrl.clone()
    url.hostname = 'hireproof.tech'
    url.protocol = 'https'
    return NextResponse.redirect(url, 308)
  }

  const isApiOrIntegrationRoute = (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/.well-known/workflow/')
  )

  // 1. Block known malicious scanner User-Agents everywhere.
  if (BLOCKED_SCANNER_UA_PATTERNS.some(pattern => pattern.test(ua))) {
    console.warn(`[Security] Blocked request from suspicious scanner User-Agent: ${ua}`)
    return new NextResponse('Access Denied', {
      status: 403,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
      },
    })
  }

  // 1.1. Block common AI crawlers from public pages, but keep APIs available for agents.
  if (!isApiOrIntegrationRoute && BLOCKED_AI_CRAWLER_UA_PATTERNS.some(pattern => pattern.test(ua))) {
    console.warn(`[Security] Blocked request from disallowed AI crawler User-Agent: ${ua}`)
    return new NextResponse('Access Denied', {
      status: 403,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive, noai, noimageai',
      },
    })
  }

  // 2. Prevent Large Header Attacks
  let headersSize = 0
  request.headers.forEach((value, key) => {
    headersSize += key.length + value.length
  })

  if (headersSize > 16384) { // 16KB limit
    return new NextResponse('Header Too Large', { status: 431 })
  }

  const legacyDownloadMatch = pathname.match(/^\/downloads\/([^/]+)$/)
  if (legacyDownloadMatch && DOWNLOAD_ROUTE_FILES.has(legacyDownloadMatch[1])) {
    const url = request.nextUrl.clone()
    url.pathname = `/api/downloads/${legacyDownloadMatch[1]}`
    return NextResponse.rewrite(url)
  }

  const response = NextResponse.next()
  
  // 3. Apply global security & SEO hardening headers
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => {
    // Only apply noindex to API routes or archived report pages
    if (k === 'X-Robots-Tag') {
      const isSensitive = pathname.startsWith('/api/') ||
                          pathname.startsWith('/audit/report_')
      if (isSensitive) {
        response.headers.set(k, v)
      }
    } else {
      response.headers.set(k, v)
    }
  })

  return response
}

// Apply proxy to all routes except static assets, icons, and next internals
export const config = {
  matcher: ['/((?!_next/static|_next/image|icons/|favicon.ico|icon.svg|apple-icon.png|og-image.png).*)'],
}
