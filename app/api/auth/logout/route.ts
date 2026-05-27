import { cookies } from 'next/headers'
import { validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

export async function POST(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const cookieStore = await cookies()
  cookieStore.set('hireproof_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return noStoreJson({ ok: true })
}
