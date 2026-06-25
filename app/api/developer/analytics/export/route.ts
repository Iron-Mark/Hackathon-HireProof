import { NextResponse } from 'next/server'
import { buildProductEventsCsv, isOperatorUser, listProductEvents } from '@/lib/auth-store'
import { getCurrentSessionUser } from '@/lib/auth-session-user'
import { noStoreJson } from '@/lib/response-security'

export async function GET() {
  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (!isOperatorUser(user)) return noStoreJson({ error: 'Operator access required.' }, { status: 403 })

  const csv = buildProductEventsCsv(await listProductEvents())
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="hireproof-product-events-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
