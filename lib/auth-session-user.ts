import { cookies } from 'next/headers'
import { getAuthSessionToken } from './auth-session-cookie'
import { getUserFromSessionToken } from './auth-store'

export async function getCurrentSessionUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(getAuthSessionToken(cookieStore))
}
