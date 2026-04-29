import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of suspicious User-Agents or patterns to block
const BLOCKED_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /gobuster/i,
  /dirbuster/i,
  /masscan/i,
  /zgrab/i,
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

export function proxy(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''

  // 1. Block known malicious User-Agents
  if (BLOCKED_UA_PATTERNS.some(pattern => pattern.test(ua))) {
    console.warn(`[Security] Blocked request from suspicious User-Agent: ${ua}`)
    return new NextResponse('Access Denied', { status: 403 })
  }

  // 2. Prevent Large Header Attacks
  let headersSize = 0
  request.headers.forEach((value, key) => {
    headersSize += key.length + value.length
  })

  if (headersSize > 16384) { // 16KB limit
    return new NextResponse('Header Too Large', { status: 431 })
  }

  const response = NextResponse.next()
  
  // 3. Apply global security & SEO hardening headers
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => {
    // Only apply noindex to API routes or archived report pages
    if (k === 'X-Robots-Tag') {
      const isSensitive = request.nextUrl.pathname.startsWith('/api/') || 
                          request.nextUrl.pathname.startsWith('/audit/report_')
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
