// Type declarations for lib/scam-vocabulary.mjs — the shared scam-detection vocabulary
// and text-normalization/matcher primitives consumed by lib/audit-signals.mjs and
// lib/intelligence-v2.ts.

// --- text normalization / matching primitives ---
export function foldConfusables(value: string): string
export function leetFold(value: string): string
export function stripDiacritics(value: string): string
export function rawFolded(value: string): string
export function collapseSpacedLetters(value: string): string
export function tokenizeWithBoundaries(value: string): string[]
export function normalize(value: string): string
export function hasAny(value: string, terms: string[]): boolean
export function hasTokenPhrase(value: string, phrase: string): boolean
export function hasRawPhrase(value: string, phrases: string[]): boolean
export function hasUnnegatedTerm(value: string, terms: string[]): boolean

export const CONFUSABLE_MAP: Record<string, string>
export const CONFUSABLE_RE: RegExp
export const EMOJI_RE: RegExp
export const LEET_MAP: Record<string, string>
export const DOUBLE_NEG_AFFIRMER_RE: RegExp
export const NEGATION_TOKENS: Set<string>
export const COERCION_TOKENS: Set<string>

// --- off-platform channel vocabulary ---
export const OFF_PLATFORM_UNAMBIGUOUS: string[]
export const OFF_PLATFORM_AMBIGUOUS: string[]
export const OFF_PLATFORM_PIVOT_VERBS: Set<string>
export const OFF_PLATFORM_RAW_TERMS: string[]

// --- scam vocabulary + article/synonym-tolerant fallbacks ---
export const NO_VETTING_TERMS: string[]
export const NO_VETTING_RAW_TERMS: string[]
export const UPFRONT_PAYMENT_TERMS: string[]
export const UPFRONT_PAYMENT_RAW_TERMS: string[]
export const MONEY_MULE_TERMS: string[]
export const MONEY_MULE_RE: RegExp
export const BUY_TO_WORK_TERMS: string[]
export const BUY_TO_WORK_RE: RegExp
export const CRYPTO_DEPOSIT_TERMS: string[]
export const CRYPTO_DEPOSIT_RE: RegExp
export const CREDENTIAL_HARVEST_TERMS: string[]
