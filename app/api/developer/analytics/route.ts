import { getProductAnalyticsSummary, isOperatorUser } from '@/lib/auth-store'
import { getCurrentSessionUser } from '@/lib/auth-session-user'
import { noStoreJson } from '@/lib/response-security'

export async function GET() {
  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (!isOperatorUser(user)) return noStoreJson({ error: 'Operator access required.' }, { status: 403 })
  return noStoreJson(await getProductAnalyticsSummary())
}
