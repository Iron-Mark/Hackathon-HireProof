export const PUBLIC_ORIGIN: 'https://hireproof.tech'

export const ASK_AI_LABEL: 'Ask your AI'

export type AskAiProviderId = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'grok'

export type AskAiProvider = {
  id: AskAiProviderId
  name: string
  href: string
  lightSrc: string
  darkSrc: string
}

export const ASK_AI_PROVIDERS: readonly AskAiProvider[]

export function normalizePath(pathname: string | null | undefined): string

export function showAskAiRow(pathname: string | null | undefined): boolean

export function citePublishedCanonical(
  canonicalAttribute: string | null | undefined,
  pathname: string | null | undefined,
): string

export function buildAskAiPrompt(title: string, canonicalUrl: string): string

export function buildAskAiHref(providerHref: string, prompt: string): string
