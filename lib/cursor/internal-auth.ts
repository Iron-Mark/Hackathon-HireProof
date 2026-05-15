import { NextResponse } from 'next/server'
import { getCursorConfig } from './config'

export function validateCursorJobSecret(request: Request) {
  const configured = getCursorConfig().webhookSecret
  if (!configured) {
    return NextResponse.json({ error: 'CURSOR_WEBHOOK_SECRET is not configured.' }, { status: 503 })
  }

  if (request.headers.get('x-cursor-job-secret') !== configured) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  return null
}
