import { cookies } from 'next/headers'
import { clearAuthSessionCookie } from '@/lib/auth-session-cookie'
import { validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

export async function POST(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const cookieStore = await cookies()
  clearAuthSessionCookie(cookieStore)
  return noStoreJson({ ok: true })
}
