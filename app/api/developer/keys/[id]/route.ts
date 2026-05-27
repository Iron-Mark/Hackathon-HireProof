import { cookies } from 'next/headers'
import { getUserFromSessionToken, revokeApiKey } from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'
import { checkRateLimit } from '@/lib/rate-limit'
import { requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const cookieStore = await cookies()
  const user = await getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (isDemoAccountEmail(user.email)) {
    return noStoreJson({ error: 'Demo accounts cannot modify developer resources.' }, { status: 403 })
  }

  const rateLimit = await checkRateLimit(`developer_key_revoke:${user.id}:${requestIp(request)}`, {
    limit: 20,
    windowMs: 60_000,
  })
  if (!rateLimit.success) {
    return noStoreJson({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  const { id } = await params
  const revoked = await revokeApiKey(user.id, id)
  return noStoreJson({ revoked })
}
