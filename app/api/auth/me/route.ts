import { getCurrentSessionUser } from '@/lib/auth-session-user'
import { noStoreJson } from '@/lib/response-security'

export async function GET() {
  const user = await getCurrentSessionUser()
  return noStoreJson({ user })
}
