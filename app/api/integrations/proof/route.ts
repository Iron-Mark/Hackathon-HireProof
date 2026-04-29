import { getPlatformReadiness } from '@/lib/platform-readiness'

export async function GET() {
  return Response.json(getPlatformReadiness(), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
