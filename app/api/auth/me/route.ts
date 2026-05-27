import { cookies } from 'next/headers'
import { getUserFromSessionToken } from '@/lib/auth-store'
import { noStoreJson } from '@/lib/response-security'

export async function GET() {
  const cookieStore = await cookies()
  const user = await getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
  return noStoreJson({ user })
}
