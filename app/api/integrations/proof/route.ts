import { getPublicPlatformReadiness } from '@/lib/platform-readiness'

export async function GET() {
  return Response.json(getPublicPlatformReadiness(), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
