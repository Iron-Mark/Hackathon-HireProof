import type { ProviderCredentialKind } from './auth-store'

async function discardProviderVerificationResponse(response: Response) {
  await response.body?.cancel().catch(() => null)
}

export async function verifyProviderCredential(provider: ProviderCredentialKind, key: string) {
  const secret = key.trim()
  if (!secret) return { valid: false, error: 'No key provided.' }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${secret}` },
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    })

    await discardProviderVerificationResponse(res)
    if (res.ok) return { valid: true }
    return { valid: false, error: 'Invalid provider key.' }
  }

  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'google')
  url.searchParams.set('q', 'hireproof test')
  url.searchParams.set('api_key', secret)

  const res = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
  })
  await discardProviderVerificationResponse(res)
  if (res.ok) return { valid: true }
  return { valid: false, error: 'Invalid provider key.' }
}

export function normalizeProviderInput(provider: unknown): ProviderCredentialKind | null {
  if (provider === 'openai') return 'openai'
  if (provider === 'serpapi' || provider === 'serp') return 'serpapi'
  return null
}
