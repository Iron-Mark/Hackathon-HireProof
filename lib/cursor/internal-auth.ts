import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getCursorConfig } from './config'

function timingSafeSecretEqual(provided: string, configured: string) {
  const providedBuffer = Buffer.from(provided)
  const configuredBuffer = Buffer.from(configured)
  return providedBuffer.length === configuredBuffer.length && timingSafeEqual(providedBuffer, configuredBuffer)
}

export function validateCursorJobSecret(request: Request) {
  const configured = getCursorConfig().webhookSecret
  if (!configured) {
    return NextResponse.json({ error: 'CURSOR_WEBHOOK_SECRET is not configured.' }, { status: 503 })
  }

  const provided = request.headers.get('x-cursor-job-secret') || ''
  if (!timingSafeSecretEqual(provided, configured)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  return null
}
