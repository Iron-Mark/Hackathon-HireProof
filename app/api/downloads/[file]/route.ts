import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { requestIp } from '@/lib/request-security'

export const runtime = 'nodejs'

const ALLOWED_DOWNLOADS: Record<string, { contentType: string }> = {
  'hireproof-automation-curl.sh': { contentType: 'text/x-shellscript; charset=utf-8' },
  'hireproof-extension.zip': { contentType: 'application/zip' },
  'hireproof-langchain-tool.ts': { contentType: 'text/plain; charset=utf-8' },
  'hireproof-make-http-config.json': { contentType: 'application/json; charset=utf-8' },
  'hireproof-n8n-workflow.json': { contentType: 'application/json; charset=utf-8' },
  'hireproof-native-integrations.zip': { contentType: 'application/zip' },
}

export async function GET(request: Request, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params
  const download = ALLOWED_DOWNLOADS[file]

  if (!download) {
    return NextResponse.json({ error: 'Download not found.' }, { status: 404 })
  }

  const rateLimit = await checkRateLimit(`download:${requestIp(request)}:${file}`, {
    limit: 20,
    windowMs: 60_000,
  })

  if (!rateLimit.success) {
    const retryAfter = 'retryAfterMs' in rateLimit ? Math.ceil((rateLimit.retryAfterMs as number) / 1000) : 60
    return NextResponse.json(
      { error: 'Download rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  const filePath = path.join(process.cwd(), 'public', 'downloads', file)
  let body: Buffer

  try {
    body = await readFile(filePath)
  } catch {
    return NextResponse.json({ error: 'Download unavailable.' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      'Cache-Control': 'private, max-age=0, no-store',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Content-Length': String(body.length),
      'Content-Type': download.contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    },
  })
}
