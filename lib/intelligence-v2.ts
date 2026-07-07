import type {
  AuditOperations,
  AuditReport,
  AuditReportV2,
  EvidenceItem,
  ExtractedClaims,
  IntelligenceSignal,
  IntelligenceSummary,
  ScoreTraceItem,
} from '@/lib/schemas'
import { buildVerifiedAlternativeJobs } from '@/lib/alternative-jobs'
import { buildHybridSalaryBenchmark } from '@/lib/salary-benchmarks'
import {
  calculateRiskScore,
  determineVerdict,
  extractGreenFlags,
  extractRedFlags,
  generateSummary,
  getConfidenceLabel,
  traceRiskScore,
} from '@/lib/risk-scorer'

type BuildReportV2Input = {
  id: string
  extractedClaims: ExtractedClaims
  evidence: EvidenceItem[]
  enrichmentEvidence?: EvidenceItem[]
  enrichmentRedFlags?: string[]
  /**
   * Reference timestamp (ms since epoch) used for evidence-freshness classification and the
   * report timestamp. Injectable so scoring is deterministic: identical inputs + identical `now`
   * always produce identical scores. Defaults to the current time in production.
   */
  now?: number
  /**
   * Optional per-signal weight overrides for the base engine (signal id -> weight).
   * Used by the offline trainer to evaluate learned weights end-to-end; production
   * uses the hand-tuned weights unless a trained artifact is explicitly wired in.
   */
  signalWeightOverrides?: Record<string, number>
  mode?: AuditReport['mode']
  credentialMode?: AuditReport['credentialMode']
  ownerId?: string
  apiKeyId?: string
  source?: AuditReport['source']
  chatPlatform?: AuditReport['chatPlatform']
  chatThreadId?: string
  chatChannelId?: string
  publiclyListed?: boolean
  operations?: AuditOperations
}

type NormalizedCompensation = {
  amount: number
  currency: string
  period: 'hour' | 'week' | 'month' | 'year'
  monthlyAmount: number
}

type CompanyProfileMode = NonNullable<IntelligenceSummary['companyProfileMode']>
type RecruiterIdentityStatus = NonNullable<IntelligenceSummary['recruiterIdentity']>['status']

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

// Cross-script confusables -> Latin (homoglyph evasion). Kept in sync with
// lib/audit-signals.mjs.
const CONFUSABLE_MAP: Record<string, string> = {
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'ѕ': 's', 'і': 'i', 'ј': 'j',
  'к': 'k', 'н': 'h', 'в': 'b', 'т': 't', 'м': 'm', 'ո': 'n', 'ԁ': 'd', 'ԛ': 'q', 'ѡ': 'w', 'г': 'r',
  'α': 'a', 'ο': 'o', 'ρ': 'p', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ν': 'v', 'τ': 't', 'υ': 'u', 'χ': 'x',
  'β': 'b', 'η': 'n', 'μ': 'm', 'ϲ': 'c', 'ⅼ': 'l', 'ⅰ': 'i', '，': ',', '．': '.', '；': ';',
}
const CONFUSABLE_RE = new RegExp(`[${Object.keys(CONFUSABLE_MAP).join('')}]`, 'g')

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}️™ℹ⌨⏏Ⓜ]/gu

function foldConfusables(value: string) {
  return String(value || '')
    .replace(/[​-‍﻿⁠­]/g, '')
    .replace(EMOJI_RE, '')
    .replace(CONFUSABLE_RE, ch => CONFUSABLE_MAP[ch] || ch)
}

const LEET_MAP: Record<string, string> = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't' }
function leetFold(value: string) {
  let text = String(value || '')
  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false
    const next = text.replace(/[013457]/g, (digit, index: number, source: string) => {
      const prev = source[index - 1] || ''
      const after = source[index + 1] || ''
      if (/[a-z]/i.test(prev) || /[a-z]/i.test(after)) { changed = true; return LEET_MAP[digit] }
      return digit
    })
    text = next
    if (!changed) break
  }
  return text
}

const DOUBLE_NEG_AFFIRMER_RE = /\b(?:not the case that|cannot deny|can not deny|no one can deny|it is false that|never fail(?:s)? to)\b/i

function stripDiacritics(value: string) {
  return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normalizeText(value: string) {
  return stripDiacritics(foldConfusables(leetFold(collapseSpacedLetters(String(value || '').normalize('NFKC')))))
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

// NFKC-composed raw string that keeps non-ASCII scripts intact (no confusable fold, no
// NFD decomposition) so precomposed CJK/Hangul/Cyrillic idiom needles can match. Kept in
// sync with lib/audit-signals.mjs.
function rawFolded(value: string) {
  return String(value || '').normalize('NFKC').toLowerCase()
}

function hasRawPhrase(value: string, phrases: string[]) {
  const text = rawFolded(value)
  return phrases.some(phrase => text.includes(phrase))
}

// Token-boundary phrase match on normalized text (' t me ' matches "t.me/handle").
function hasTokenPhrase(value: string, phrase: string) {
  return ` ${normalizeText(value)} `.includes(` ${phrase} `)
}

const NEGATION_TOKENS = new Set([
  'no', 'never', 'not', 'without', 'dont', 'doesnt', 'wont', 'zero', 'beware', 'avoid', 'nor', 'none',
  'ne', 'pas', 'jamais', 'aucun', 'aucune', 'sans', 'nunca', 'ningun', 'ninguna', 'sin', 'nao', 'nenhum', 'sem',
  'tidak', 'tanpa', 'jangan', 'nahi', 'bina', 'kein', 'keine', 'nie', 'niemals',
])

const COERCION_TOKENS = new Set([
  'cannot', 'unable', 'must', 'mandatory', 'obligatory', 'compulsory',
])

function collapseSpacedLetters(value: string) {
  return String(value || '').replace(/\b(?:[a-z0-9][ .\-_]){3,}[a-z0-9]\b/gi, (m) => m.replace(/[ .\-_]/g, ''))
}

function tokenizeWithBoundaries(value: string) {
  const marked = stripDiacritics(foldConfusables(leetFold(collapseSpacedLetters(String(value || '').normalize('NFKC')))))
    .toLowerCase()
    .replace(/[,;:!?]+|\.(?=\s|$)|\s[-–—/]\s|\b(?:but|however|though|although|yet|whereas|nevertheless)\b/g, ' cbrk ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return marked ? marked.split(' ') : []
}

// Clause-boundary-aware negation with a strong-coercion override (kept in sync with
// lib/audit-signals.mjs). A negation only suppresses within its own clause; a coercion
// marker ("cannot ... without the fee", "must pay") in the same clause overrides it.
function hasUnnegatedTerm(value: string, terms: string[]) {
  const tokens = tokenizeWithBoundaries(value)
  const globalCoerce = DOUBLE_NEG_AFFIRMER_RE.test(String(value || ''))
  for (const term of terms) {
    const parts = term.split(' ')
    for (let i = 0; i + parts.length <= tokens.length; i += 1) {
      if (!parts.every((part, k) => tokens[i + k] === part)) continue
      // Negation only governs from BEFORE the term; coercion counts either direction.
      let negated = false
      let coerced = globalCoerce
      for (let j = i - 1; j >= 0 && tokens[j] !== 'cbrk'; j -= 1) {
        if (NEGATION_TOKENS.has(tokens[j])) negated = true
        if (COERCION_TOKENS.has(tokens[j])) coerced = true
      }
      for (let j = i + parts.length; j < tokens.length && tokens[j] !== 'cbrk'; j += 1) {
        if (COERCION_TOKENS.has(tokens[j])) coerced = true
      }
      if (!negated || coerced) return true
    }
  }
  return false
}

const UPFRONT_PAYMENT_TERMS = [
  ...['training', 'registration', 'activation', 'processing', 'application', 'membership', 'placement', 'onboarding', 'handling', 'admin', 'upfront', 'setup', 'account', 'service']
    .flatMap(kind => [`${kind} fee`, `${kind} charge`, `${kind} cost`]),
  'equipment deposit', 'security deposit', 'refundable deposit', 'deposit required', 'deposit to unlock', 'with deposit',
  'purchase software', 'software license', 'starter kit', 'pay to start', 'pay before starting', 'upfront payment',
  'cuota de inscripcion', 'tarifa de inscripcion', 'cuota de registro', 'pago inicial', 'deposito inicial',
  'taxa de treinamento', 'taxa de inscricao', 'taxa de adesao', 'taxa de cadastro',
  'frais de dossier', 'frais d inscription', 'frais de formation', 'frais de traitement',
  'biaya pelatihan', 'biaya pendaftaran', 'uang pendaftaran',
  'registration ke liye', 'fees jama', 'jama karein', 'jama karna',
  'bearbeitungsgebuhr', 'schulungsgebuhr', 'anmeldegebuhr', 'vermittlungsgebuhr', 'kaution',
  'quota di iscrizione', 'tassa di formazione', 'quota di adesione', 'cauzione',
  'bayad sa registration', 'bayad sa training', 'registration bayad', 'training bayad', 'pambayad sa',
]
const UPFRONT_PAYMENT_RAW_TERMS = [
  '报名费', '培训费', '押金', '保证金', '会费', '工本费', '服务费', '手续费', '注册费', '가입비', '보증금', '수수료',
  'регистрационный взнос', 'взнос', 'залог', 'плата за обучение', 'предоплата',
  'رسوم التسجيل', 'رسوم التدريب', 'رسوم', 'عربون',
  'ค่าสมัคร', 'ค่าธรรมเนียม', 'ค่าลงทะเบียน', 'ค่าฝึกอบรม', 'เงินมัดจำ',
]
const NO_VETTING_RAW_TERMS = [
  '无需面试', '免面试', '无面试', '不需要面试', '面接なし', '면접 없이', '면접없이',
  'без собеседования', 'بدون مقابلة', 'ไม่ต้องสัมภาษณ์',
]

const NO_VETTING_TERMS = [
  'no interview', 'without interview', 'skip interview', 'no exam', 'no screening', 'no assessment',
  'walang interview', 'walang exam',
  'sin entrevista', 'sem entrevista', 'sans entretien', 'tanpa wawancara', 'senza colloquio', 'ohne vorstellungsgesprach',
  'koi interview nahi', 'bina interview', 'interview nahi',
]

// Kept in sync with lib/audit-signals.mjs.
const OFF_PLATFORM_UNAMBIGUOUS = [
  'linktree', 'linktr ee', 'wickr', 'threema', 'session app', 'snapchat', 'snap chat', 'weixin',
  'signal app', 'signal messenger', 'kakaotalk',
]
const OFF_PLATFORM_AMBIGUOUS = [
  'discord', 'skype', 'hangouts', 'google chat', 'gchat', 'wechat', 'we chat', 'kakao',
  'signal', 'line', 'instagram dm', 'ig dm', 'facebook messenger', 'fb messenger', 'messenger',
]
const OFF_PLATFORM_PIVOT_VERBS = new Set([
  'message', 'messages', 'msg', 'contact', 'add', 'dm', 'dms', 'reach', 'apply', 'applying', 'chat',
  'ping', 'connect', 'join', 'inbox', 'pm', 'hmu', 'text', 'write', 'talk', 'find', 'reply',
])
const OFF_PLATFORM_RAW_TERMS = ['微信', '加微信', '电报', '텔레그램', '왓츠앱', 'ватсап', 'телеграм', 'واتساب', 'تلغرام']

function hasAmbiguousChannelPivot(rawText: string) {
  const tokens = tokenizeWithBoundaries(rawText)
  for (const channel of OFF_PLATFORM_AMBIGUOUS) {
    const parts = channel.split(' ')
    for (let i = 0; i + parts.length <= tokens.length; i += 1) {
      if (!parts.every((part, k) => tokens[i + k] === part)) continue
      for (let j = i - 1; j >= 0 && tokens[j] !== 'cbrk'; j -= 1) {
        if (OFF_PLATFORM_PIVOT_VERBS.has(tokens[j])) return true
      }
      for (let j = i + parts.length; j < tokens.length && tokens[j] !== 'cbrk'; j += 1) {
        if (OFF_PLATFORM_PIVOT_VERBS.has(tokens[j])) return true
      }
    }
  }
  return false
}

function isSmsOnlyFunnel(contactMethod?: string, applicationPath?: string) {
  const combinedRaw = `${contactMethod || ''} ${applicationPath || ''}`
  const hasUrl = /https?:\/\/|www\.[a-z]|@[a-z0-9.-]+\.[a-z]{2,}|\b[a-z0-9][a-z0-9-]*\.(?:com|net|org|io|co|ph|me|app|xyz|top|info|site|dev|ai|gov|edu|uk|au|ca|us|in)\b/i.test(combinedRaw)
  const hasPhone = /(?:\+?\d[\d ()–—-]{7,}\d)/.test(combinedRaw)
  const smsWords = /\b(?:sms|txt|text me|text us|call or text|text this|text to apply|apply by text)\b/i.test(combinedRaw)
  return hasPhone && !hasUrl && smsWords
}

const MONEY_MULE_TERMS = [
  'deposit the check', 'deposit this check', 'deposit the cheque', 'cash the check', 'cash this check', 'mobile deposit the check',
  'wire the remaining', 'wire the balance', 'wire the funds', 'wire back', 'transfer the remaining', 'transfer the balance',
  'forward the payment', 'forward the funds', 'send the balance', 'send back the difference', 'keep your commission and wire',
  'reship', 're ship', 'reshipping', 'forward packages', 'forward parcels', 'receive packages and forward', 'receive parcels and forward',
  're label packages', 'relabel packages', 'package forwarding', 'parcel forwarding', 'process payments on our behalf',
  'money transfer agent', 'payment processing agent', 'mystery shopper', 'secret shopper',
  'western union', 'moneygram', 'wiring', 'wire to', 'deposit into your account', 'deposit funds into your',
  'withdraw it then', 'withdraw and wire', 'withdraw the funds and', 'keep the difference', 'keep your commission and',
  'evaluate a money transfer', 'money transfer service', 'test recipient', 'evaluate western union',
]
const CRYPTO_DEPOSIT_TERMS = [
  'deposit usdt', 'deposit btc', 'deposit eth', 'deposit crypto', 'load usdt', 'fund your wallet', 'fund the wallet',
  'company wallet', 'company trading', 'trading platform to activate', 'crypto deposit', 'deposit into the platform',
  'top up your account with', 'recharge your account with', 'deposit to your trading',
]
const BUY_TO_WORK_TERMS = [
  'buy your', 'purchase your', 'buy the materials', 'buy materials', 'purchase materials', 'buy your materials',
  'buy samples', 'purchase samples', 'buy gift cards', 'purchase gift cards', 'buy promotional', 'purchase promotional',
  'assembly kit', 'sample kit', 'inventory purchase', 'buy inventory', 'buy equipment first', 'purchase the starter',
]
const CREDENTIAL_HARVEST_TERMS = [
  'social security number', 'ssn and', 'your ssn', 'bank login', 'online banking username', 'online banking password',
  'banking username', 'banking password', 'account password', 'card pin', 'debit card pin', 'one time password', 'otp code',
  'photo of your id holding', 'selfie holding your id', 'selfie with your id', 'routing number and account number',
  'mother maiden name and', 'full card number and cvv',
]

// Article/synonym-tolerant fallbacks so "buy the parts kit", "buy prepaid cards", and
// "top up your wallet with USDT" fire even though the exact bigram is not listed. Run on
// normalizeText output. Kept in sync with lib/audit-signals.mjs.
const BUY_TO_WORK_RE = /\b(?:buy|purchase|pay for|order)\b(?:\s+\w+){0,3}\s+(?:material|materials|kit|kits|sample|samples|supply|supplies|inventory|equipment|gift card|gift cards|prepaid card|prepaid cards|prepaid voucher|voucher|vouchers|starter pack|starter kit|assembly)\b/
const CRYPTO_DEPOSIT_RE = /\b(?:deposit|fund|load|top up|recharge|send|transfer|pay|preload)\b(?:\s+\w+){0,4}\s+(?:usdt|usdc|btc|eth|bnb|trx|crypto|bitcoin|ethereum|tether|wallet|trading platform|trading account)\b/
const MONEY_MULE_RE = /\b(?:deposit|cash|receive)\b(?:\s+\w+){0,4}\s+check\b(?:\s+\w+){0,8}\s+(?:wire|transfer|send|forward|western union|moneygram)\b|\b(?:reship|re ship|reshipping|forward|receive)\b(?:\s+\w+){0,3}\s+(?:package|packages|parcel|parcels)\b/

// Business-purchase fees that a legitimate franchise/reseller model can charge (caution,
// not high-risk). Everything else in UPFRONT_PAYMENT_TERMS is an employee-job fee that a
// real employer never charges.
const BUSINESS_PURCHASE_TERMS = [
  'franchise fee', 'franchise charge', 'starter kit', 'software license', 'purchase software',
  'reseller', 'distributor kit', 'dealership fee', 'licensing fee',
]

// Matched as tokens through the negation guard so "no scam reports found" is clean.
const REPUTATION_RISK_TERMS = [
  'scam', 'scams', 'scammer', 'scammers',
  'fraud', 'fraudulent',
  'fake',
  'impersonation', 'impersonating', 'impersonates',
  'phishing',
  'lawsuit', 'lawsuits',
  'warning', 'warnings',
]

function hostnameFromUrl(url?: string) {
  if (!url) return undefined
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return undefined
  }
}

function rootDomain(host?: string) {
  if (!host) return undefined
  const parts = host.replace(/^www\./, '').split('.').filter(Boolean)
  if (parts.length < 2) return host
  return parts.slice(-2).join('.')
}

function hostMatchesDomain(host: string | undefined, domain: string) {
  const normalizedHost = host?.replace(/^www\./, '').toLowerCase()
  const normalizedDomain = domain.replace(/^www\./, '').toLowerCase()
  return Boolean(normalizedHost && (normalizedHost === normalizedDomain || normalizedHost.endsWith(`.${normalizedDomain}`)))
}

function emailDomain(email?: string) {
  const domain = String(email || '').trim().toLowerCase().match(/@([^@\s]+)$/)?.[1]
  return domain?.replace(/^www\./, '')
}

function isFreeEmailDomain(domain?: string) {
  return Boolean(domain && [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'proton.me',
    'protonmail.com',
    'aol.com',
  ].includes(domain))
}

// Broker-assigned evidence types that genuinely carry official-strength trust. The
// STRONGEST tiers key on this structured type (or a trusted host), never on the
// snippet text alone — otherwise a scammer's own web copy ("Trust: official") on a
// generic search result would forge trust and disarm the safety floors.
const STRUCTURED_OFFICIAL_TYPES = new Set(['Official Company Presence', 'Verified Local Presence', 'Knowledge Graph'])

function classifySourceQuality(item: EvidenceItem): NonNullable<EvidenceItem['sourceQuality']> {
  const structuredType = String(item.type || '')
  const labelText = normalizeText(`${item.source} ${item.type} ${item.snippet}`)
  const text = normalizeText(`${labelText} ${item.url || ''}`)
  const host = hostnameFromUrl(item.url)
  const trustedJobBoardDomains = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'jobstreet.com', 'workdayjobs.com', 'greenhouse.io', 'lever.co', 'smartrecruiters.com']

  if (text.includes('risk signal') || text.includes('apply path mismatch')) return 'risky'
  if (
    STRUCTURED_OFFICIAL_TYPES.has(structuredType) ||
    (/\b(careers page|careers listing|company website|official careers)\b/.test(labelText) && host && !isWeakHost(host))
  ) return 'official'
  if (
    text.includes('reputable job board') ||
    trustedJobBoardDomains.some(domain => hostMatchesDomain(host, domain)) ||
    (!host && trustedJobBoardDomains.some(domain => labelText.includes(domain.replace('.com', ''))))
  ) return 'reputable'
  if (text.includes('directory') || text.includes('mirror') || text.includes('scraped') || text.includes('aggregator')) return 'weak'
  return 'public'
}

function isWeakHost(host: string) {
  return /\b(directory|mirror|scrape|jobsora|jooble|simplyhired|careerjet|talent|trabajo)\b/.test(host)
}

function classifySourceType(item: EvidenceItem): NonNullable<EvidenceItem['sourceType']> {
  const source = normalizeText(`${item.source} ${item.type}`)
  if (source.includes('maps place')) return 'place'
  if (source.includes('maps') || source.includes('local')) return 'maps'
  if (source.includes('news') || source.includes('reputation')) return 'news'
  if (source.includes('jobs') || source.includes('linkedin') || source.includes('indeed') || source.includes('jobstreet')) return 'jobs'
  if (source.includes('enrichment') || source.includes('input conflict') || source.includes('resolved job')) return 'enrichment'
  return 'search'
}

function classifyTrustLevel(item: EvidenceItem): NonNullable<EvidenceItem['trustLevel']> {
  const text = normalizeText(`${item.type} ${item.snippet}`)
  if (text.includes('risk signal') || text.includes('mismatch') || hasUnnegatedTerm(text, REPUTATION_RISK_TERMS)) return 'risk'
  // High trust requires the structured broker type, not a snippet substring.
  if (STRUCTURED_OFFICIAL_TYPES.has(String(item.type || ''))) return 'high'
  if (text.includes('company check') || text.includes('comparable jobs') || text.includes('reputable job board')) return 'medium'
  return 'low'
}

function classifyMatchConfidence(item: EvidenceItem) {
  const text = normalizeText(`${item.type} ${item.snippet}`)
  if (text.includes('official company presence') || text.includes('verified local') || text.includes('place detail matched')) return 0.92
  if (text.includes('company check') || text.includes('comparable jobs') || text.includes('reputable job board')) return 0.72
  if (text.includes('risk signal') || text.includes('mismatch')) return 0.82
  return 0.45
}

function parseFreshnessFromText(value: string, now: number): number | undefined {
  const text = String(value || '')
  const relative = text.match(/\b(\d+)\s+(day|week|month|year)s?\s+ago\b/i)
  if (relative) {
    const amount = Number(relative[1])
    const unit = relative[2].toLowerCase()
    if (!Number.isFinite(amount)) return undefined
    if (unit === 'day') return amount
    if (unit === 'week') return amount * 7
    if (unit === 'month') return amount * 30
    if (unit === 'year') return amount * 365
  }

  const explicit = text.match(/\b(?:Date:\s*)?([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2})\b/)
  if (!explicit) return undefined
  const timestamp = Date.parse(explicit[1])
  if (!Number.isFinite(timestamp)) return undefined
  return Math.max(0, Math.floor((now - timestamp) / 86400000))
}

function classifyFreshness(item: EvidenceItem, now: number): {
  freshness: NonNullable<EvidenceItem['freshness']>
  freshnessDays?: number
} {
  const freshnessDays = parseFreshnessFromText(`${item.snippet} ${item.source}`, now)
  if (typeof freshnessDays !== 'number') return { freshness: 'unknown' }
  if (freshnessDays <= 30) return { freshness: 'fresh', freshnessDays }
  if (freshnessDays <= 180) return { freshness: 'recent', freshnessDays }
  return { freshness: 'stale', freshnessDays }
}

function attachEvidenceMetadata(evidence: EvidenceItem[], now: number) {
  return evidence.map((item, index) => {
    const freshness = classifyFreshness(item, now)
    return {
      ...item,
      id: item.id || `ev_${index + 1}`,
      sourceType: item.sourceType || classifySourceType(item),
      sourceQuality: item.sourceQuality || classifySourceQuality(item),
      freshness: item.freshness || freshness.freshness,
      freshnessDays: typeof item.freshnessDays === 'number' ? item.freshnessDays : freshness.freshnessDays,
      trustLevel: item.trustLevel || classifyTrustLevel(item),
      matchConfidence: typeof item.matchConfidence === 'number' ? item.matchConfidence : classifyMatchConfidence(item),
    }
  })
}

const TRUSTED_JOB_PAGE_PATTERN = /\b(linkedin|indeed|jobstreet|greenhouse|lever|ashby|smartrecruiters|workday|myworkdayjobs)\b/i

function hasTrustedJobPageEvidence(evidence: EvidenceItem[]) {
  return evidence.some(item => {
    const text = normalizeText(`${item.source} ${item.type} ${item.snippet} ${item.url || ''}`)
    return (
      item.sourceQuality === 'reputable' ||
      TRUSTED_JOB_PAGE_PATTERN.test(text)
    )
  })
}

const ROLE_STOP_WORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'from',
  'role',
  'jobs',
  'job',
  'page',
  'apply',
  'developer',
  'engineer',
])

function importantTokens(value: string) {
  return normalizeText(value)
    .split(' ')
    .filter(token => token.length >= 3 && !ROLE_STOP_WORDS.has(token))
}

function hasCompanyRoleOverlap(claims: ExtractedClaims, item: EvidenceItem) {
  const text = normalizeText(`${item.source} ${item.type} ${item.snippet} ${item.url || ''}`)
  const companyTokens = importantTokens(claims.company)
  const roleTokens = importantTokens(claims.role)
  const companyMatched = companyTokens.length === 0 || companyTokens.some(token => text.includes(token))
  const roleMatches = roleTokens.filter(token => text.includes(token)).length
  const roleThreshold = roleTokens.length >= 3 ? 2 : Math.min(1, roleTokens.length)
  return companyMatched && roleMatches >= roleThreshold
}

function isOfficialOrTrustedHiringEvidence(item: EvidenceItem) {
  const host = hostnameFromUrl(item.url)
  const text = normalizeText(`${item.source} ${item.type} ${item.snippet} ${item.url || ''}`)
  return (
    item.type === 'Official Company Presence' ||
    item.sourceQuality === 'official' ||
    isTrustedJobBoardHost(host) ||
    text.includes('official careers') ||
    text.includes('trusted ats') ||
    text.includes('ashby') ||
    text.includes('greenhouse') ||
    text.includes('lever') ||
    text.includes('workday') ||
    text.includes('smartrecruiters')
  )
}

function findOfficialSourceMatches(claims: ExtractedClaims, evidence: EvidenceItem[]) {
  return evidence.filter(item => isOfficialOrTrustedHiringEvidence(item) && hasCompanyRoleOverlap(claims, item))
}

function hostnamesFromText(value?: string) {
  const text = String(value || '')
  const hosts = new Set<string>()

  for (const match of text.matchAll(/https?:\/\/[^\s"'<>),]+/gi)) {
    const host = hostnameFromUrl(match[0].replace(/[.,;:!?]+$/g, ''))
    if (host) hosts.add(host)
  }

  for (const match of text.matchAll(/\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+\b/gi)) {
    const candidate = match[0].replace(/^www\./i, '').toLowerCase()
    if (!candidate.includes('@')) hosts.add(candidate)
  }

  return [...hosts]
}

function urlHostnamesFromText(value?: string) {
  const text = String(value || '')
  const hosts = new Set<string>()

  for (const match of text.matchAll(/https?:\/\/[^\s"'<>),]+/gi)) {
    const host = hostnameFromUrl(match[0].replace(/[.,;:!?]+$/g, ''))
    if (host) hosts.add(host)
  }

  return [...hosts]
}

function officialRootDomainsFromEvidence(evidence: EvidenceItem[]) {
  const roots = new Set<string>()
  for (const item of evidence) {
    if (!isOfficialOrTrustedHiringEvidence(item)) continue
    const host = hostnameFromUrl(item.url)
    if (host && !isTrustedJobBoardHost(host)) {
      const root = rootDomain(host)
      if (root) roots.add(root)
    }
  }
  return roots
}

function deriveSubmittedApplyPathTrust(applicationPath: string, officialEvidence: EvidenceItem[]) {
  const text = normalizeText(applicationPath)
  const urlHosts = urlHostnamesFromText(applicationPath)
  const submittedHosts = urlHosts.length > 0 ? urlHosts : hostnamesFromText(applicationPath)
  const officialRoots = officialRootDomainsFromEvidence(officialEvidence)
  const hasSubmittedTrustedApplyPath = (
    TRUSTED_JOB_PAGE_PATTERN.test(applicationPath) ||
    submittedHosts.some(host => isTrustedJobBoardHost(host))
  )
  const hasOfficialKeyword = urlHosts.length === 0 && /\b(official|careers?|company website|employer website)\b/.test(text)
  const hasOfficialRootMatch = submittedHosts.some(host => {
    if (isTrustedJobBoardHost(host)) return false
    const root = rootDomain(host)
    return Boolean(root && officialRoots.has(root))
  })

  return {
    submittedHosts,
    hasSubmittedOfficialApplyPath: hasOfficialKeyword || hasOfficialRootMatch,
    hasSubmittedTrustedApplyPath,
  }
}

function hasGlobalHiringContext(claims: ExtractedClaims, evidence: EvidenceItem[]) {
  const text = normalizeText([
    claims.location,
    claims.applicationPath,
    claims.role,
    ...evidence.map(item => `${item.source} ${item.type} ${item.snippet} ${item.url || ''}`),
  ].join(' '))
  return /\b(remote|hybrid|global|worldwide|international|distributed|multi locale|multilocale|countries|country|apac|emea)\b/.test(text)
}

export function normalizeCompensation(value: string): NormalizedCompensation | null {
  const text = String(value || '').trim()
  if (!text || /not specified/i.test(text)) return null

  const numberMatch = text.match(/(?:PHP|Php|php|USD|usd|₱|\$)?\s*([\d,.]+)\s*(?:PHP|Php|php|USD|usd|pesos|dollars)?/i)
  if (!numberMatch) return null

  const amount = Number(numberMatch[1].replace(/,/g, ''))
  if (!Number.isFinite(amount) || amount <= 0) return null

  const hasWeeklyToken = /\bwk\b/i.test(text)

  const currency = /(?:USD|usd|\$|dollars)/.test(text)
    ? 'USD'
    : /(?:GBP|£|pounds)/i.test(text)
      ? 'GBP'
      : /(?:EUR|€|euros?)\b/i.test(text)
        ? 'EUR'
        : /\bCAD\b/i.test(text)
          ? 'CAD'
          : /\bAUD\b/i.test(text)
            ? 'AUD'
            : 'PHP'
  const lower = text.toLowerCase()
  // Prefer the explicit "per X" / "X-ly" pattern next to the amount over a bare
  // substring, so incidental words ("steps up with logged hours", "40-hour week")
  // don't hijack the period. "$720 per week ... hours" is weekly, not hourly.
  const period: NormalizedCompensation['period'] = /\bper hour\b|\bhourly\b|\/\s?hour\b|\/\s?hr\b|\bper hr\b/.test(lower)
    ? 'hour'
    : /\bper week\b|\bweekly\b|\/\s?wk\b|\bper wk\b/.test(lower) || hasWeeklyToken
      ? 'week'
      : /\bper (?:year|annum)\b|\bannually\b|\byearly\b|\bper annum\b/.test(lower)
        ? 'year'
        : /\bper month\b|\bmonthly\b|\bper mo\b/.test(lower)
          ? 'month'
          : lower.includes('hour')
            ? 'hour'
            : lower.includes('week')
              ? 'week'
              : lower.includes('year') || lower.includes('annum') || lower.includes('annual')
                ? 'year'
                : 'month'

  const monthlyAmount = period === 'hour'
    ? Math.round(amount * 173.2)
    : period === 'week'
      ? Math.round(amount * 4.33)
      : period === 'year'
        ? Math.round(amount / 12)
        : amount

  return { amount, currency, period, monthlyAmount }
}

function compensationFromEvidenceSnippet(snippet: string) {
  const salaryMatch = snippet.match(/Salary:\s*([^|]+)/i)
  return normalizeCompensation(salaryMatch?.[1] || snippet)
}

function median(values: number[]) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (sorted.length === 0) return undefined
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle]
}

function inferSeniority(role: string): NonNullable<IntelligenceSummary['marketBenchmark']['seniority']> {
  const text = normalizeText(role)
  if (/\b(intern|internship|trainee)\b/.test(text)) return 'intern'
  if (/\b(junior|jr|entry|associate)\b/.test(text)) return 'junior'
  if (/\b(senior|sr)\b/.test(text)) return 'senior'
  if (/\b(lead|principal|staff|head|manager)\b/.test(text)) return 'lead'
  if (!text) return 'unknown'
  return 'mid'
}

function inferCompanyProfileMode(
  extractedClaims: ExtractedClaims,
  evidence: EvidenceItem[],
  verifiedLocalEvidence: EvidenceItem[],
): CompanyProfileMode {
  const text = normalizeText([
    extractedClaims.company,
    extractedClaims.role,
    extractedClaims.location,
    extractedClaims.applicationPath,
    ...evidence.map(item => `${item.source} ${item.type} ${item.snippet} ${item.url || ''}`),
  ].join(' '))
  const isRemote = /\b(remote|work from home|wfh|distributed|anywhere)\b/.test(text)
  const isStartup = /\b(startup|seed|pre seed|series a|series b|founder|yc|y combinator|wellfound|angellist|crunchbase|github)\b/.test(text)

  if (isRemote && isStartup) return 'startup_remote'
  if (isRemote) return 'established_remote'
  if (verifiedLocalEvidence.length > 0 || /\b(onsite|on site|office|branch|store|warehouse|local)\b/.test(text)) return 'local_business'
  return 'unknown'
}

function deriveRecruiterIdentity(
  extractedClaims: ExtractedClaims,
  evidence: EvidenceItem[],
  officialHost?: string,
): {
  status: RecruiterIdentityStatus
  recruiterName?: string
  recruiterEmailDomain?: string
  evidenceIds: string[]
} {
  const recruiterName = extractedClaims.recruiterName?.trim() || undefined
  const recruiterEmailDomain = emailDomain(extractedClaims.recruiterEmail)
  const recruiterProfile = extractedClaims.recruiterProfile?.trim()
  const officialRoot = rootDomain(officialHost)
  const recruiterRoot = rootDomain(recruiterEmailDomain)
  const profileEvidence = evidence.filter(item => {
    const text = normalizeText(`${item.source} ${item.type} ${item.snippet} ${item.url || ''}`)
    return text.includes('linkedin') && (text.includes('recruiter') || text.includes('talent') || text.includes('hiring') || text.includes('people'))
  })
  const evidenceIds = profileEvidence.map(item => item.id || '').filter(Boolean)

  if (recruiterEmailDomain && isFreeEmailDomain(recruiterEmailDomain)) {
    return { status: 'risky', recruiterName, recruiterEmailDomain, evidenceIds }
  }

  if (officialRoot && recruiterRoot && officialRoot === recruiterRoot) {
    return { status: profileEvidence.length > 0 || recruiterProfile ? 'verified' : 'domain-match', recruiterName, recruiterEmailDomain, evidenceIds }
  }

  if (recruiterEmailDomain && officialRoot && recruiterRoot && officialRoot !== recruiterRoot) {
    return { status: 'risky', recruiterName, recruiterEmailDomain, evidenceIds }
  }

  if (profileEvidence.length > 0 || recruiterProfile) {
    return { status: 'platform-match', recruiterName, recruiterEmailDomain, evidenceIds }
  }

  if (recruiterName || recruiterEmailDomain || extractedClaims.recruiterPhone) {
    return { status: 'unverified', recruiterName, recruiterEmailDomain, evidenceIds }
  }

  return { status: 'unknown', evidenceIds }
}

function mismatchHostsFromEvidence(item: EvidenceItem) {
  const text = `${item.snippet || ''} ${item.url || ''}`
  const submittedHost = text.match(/\bsubmitted apply domain\s+([a-z0-9.-]+\.[a-z]{2,})\b/i)?.[1]?.toLowerCase()
  const claimedOfficialHost = text.match(/\bofficial company domain\s+([a-z0-9.-]+\.[a-z]{2,})\b/i)?.[1]?.toLowerCase()
  return { submittedHost, claimedOfficialHost }
}

function isTrustedJobBoardHost(host?: string) {
  return Boolean(host && /(?:^|\.)((linkedin|indeed|jobstreet)\.com|greenhouse\.io|lever\.co|ashbyhq\.com|smartrecruiters\.com|workdayjobs\.com|myworkdayjobs\.com)$/i.test(host))
}

function isComparableAggregatorHost(host?: string) {
  return Boolean(host && /(?:^|\.)(talent\.com|trabajo\.org|jobsora\.com|jooble\.org|simplyhired\.com|careerjet\.[a-z.]+)$/i.test(host))
}

function isActionableApplyPathMismatch(item: EvidenceItem, officialHost?: string) {
  const { submittedHost, claimedOfficialHost } = mismatchHostsFromEvidence(item)
  if (isTrustedJobBoardHost(submittedHost) && claimedOfficialHost && rootDomain(submittedHost) !== rootDomain(claimedOfficialHost)) return false
  if (
    claimedOfficialHost &&
    officialHost &&
    rootDomain(claimedOfficialHost) !== rootDomain(officialHost)
  ) return false

  if (isTrustedJobBoardHost(submittedHost) && isComparableAggregatorHost(claimedOfficialHost)) return false

  return true
}

function isActionableDomainMismatch(item: EvidenceItem) {
  return (
    item.trustLevel === 'risk' ||
    item.sourceQuality === 'risky' ||
    /risk signal|does not match|different domain|off domain|impersonat|phishing/i.test(`${item.source} ${item.type} ${item.snippet || ''}`)
  )
}

function addSignal(signals: IntelligenceSignal[], signal: IntelligenceSignal) {
  if (!signals.some(existing => existing.id === signal.id)) signals.push(signal)
}

const idsOf = (items: EvidenceItem[]) => items.map(item => item.id || '').filter(Boolean)

// Same multipliers as the base engine (lib/audit-signals.mjs): a signal's traced
// contribution scales with how confident the detection is; the nominal weight
// stays on the signal itself for explainability.
const CONFIDENCE_MULTIPLIER = { high: 1, medium: 0.85, low: 0.6 } as const
type SignalConfidence = keyof typeof CONFIDENCE_MULTIPLIER

function confidenceScaled(weight: number, confidence: SignalConfidence) {
  return Math.round(weight * CONFIDENCE_MULTIPLIER[confidence])
}

function applyTrace(
  trace: ScoreTraceItem[],
  score: number,
  step: string,
  delta: number,
  reason: string,
  signalId?: string,
  evidenceIds?: string[],
) {
  const scoreAfter = clampScore(score + delta)
  // Record the EFFECTIVE delta (post-clamp) so the sum of traced deltas always
  // equals the final score exactly — the trace is a complete audit of the number.
  const item: ScoreTraceItem = { step, delta: scoreAfter - score, scoreAfter, reason }
  if (signalId) item.signalId = signalId
  if (evidenceIds && evidenceIds.length > 0) item.evidenceIds = evidenceIds.slice(0, 20)
  trace.push(item)
  return scoreAfter
}

function buildNextSteps(verdict: AuditReport['verdict'], company: string) {
  if (verdict === 'high-risk') {
    return [
      'Do not send money, IDs, bank details, or verification codes.',
      'Verify the company through its official website and LinkedIn page.',
      'Use the evidence links above to confirm whether the recruiter and job post match.',
      'Prefer applying through official careers pages or trusted job boards.',
    ]
  }

  if (verdict === 'caution') {
    return [
      `Ask ${company} for the official job post, recruiter identity, and interview process.`,
      'Compare the salary and requirements against the similar roles listed above.',
      'Avoid moving the conversation to unofficial chat apps until verified.',
      'Pause if they ask for fees, purchases, personal IDs, or urgent action.',
    ]
  }

  return [
    'Apply through the official company or job-board channel.',
    'Confirm the recruiter profile and interview schedule before sharing sensitive details.',
    'Keep a copy of the job post and evidence for your records.',
  ]
}

function deriveIntelligence(
  extractedClaims: ExtractedClaims,
  evidence: EvidenceItem[],
  redFlags: string[],
  greenFlags: string[],
  baseScore: number,
): { intelligence: IntelligenceSummary; riskScore: number; operations: AuditOperations } {
  const signals: IntelligenceSignal[] = []
  const scoreTrace: ScoreTraceItem[] = []
  let score = applyTrace(scoreTrace, 0, 'Baseline', 25, 'Every HireProof v2 report starts from a cautious baseline of 25.')

  const byType = (type: string) => evidence.filter(item => item.type === type)
  const officialEvidence = byType('Official Company Presence')
  const localEvidence = evidence.filter(item => item.type === 'Verified Local Presence' || item.type === 'Local Presence')
  const verifiedLocalEvidence = byType('Verified Local Presence')
  const comparableEvidence = byType('Comparable Jobs')
  const officialHost = hostnameFromUrl(officialEvidence.find(item => item.url)?.url)
  const applyPathMismatchEvidence = byType('Apply Path Mismatch').filter(item => isActionableApplyPathMismatch(item, officialHost))
  const domainMismatchEvidence = byType('Domain Mismatch').filter(isActionableDomainMismatch)
  const mismatchEvidence = [...applyPathMismatchEvidence, ...domainMismatchEvidence]
  const inputConflictEvidence = byType('Input Conflict')
  const hasInputConflict = inputConflictEvidence.length > 0 || redFlags.some(flag => /input conflict|resolved job page|submitted .* does not match/i.test(flag))
  const reputationRiskEvidence = evidence.filter(item => item.type === 'Reputation' && (
    /risk signal/i.test(item.snippet || '') ||
    hasUnnegatedTerm(item.snippet || '', REPUTATION_RISK_TERMS)
  ))
  const staleEvidence = evidence.filter(item => item.freshness === 'stale')
  const weakEvidence = evidence.filter(item => item.sourceQuality === 'weak')
  const threatIntelEvidence = evidence.filter(item => (
    (normalizeText(item.sourceType || '') === 'threat intel' && item.trustLevel === 'risk') ||
    (/\b(known threat|known phishing|urlhaus|phishtank|threat intel)\b/i.test(`${item.type} ${item.source}`) &&
      /risk signal|phishing|malware|social.engineering|abuse/i.test(item.snippet || ''))
  ))
  const newDomainRiskEvidence = evidence.filter(item => (
    /\bdomain age\b/i.test(item.type || '') &&
    (item.trustLevel === 'risk' || /risk signal|newly registered|very new/i.test(item.snippet || ''))
  ))
  const recentCertificateEvidence = evidence.filter(item => (
    /\bcertificate transparency\b/i.test(item.type || '') &&
    /risk signal|very recent|new certificate/i.test(item.snippet || '')
  ))
  const applicationPathText = normalizeText(extractedClaims.applicationPath)
  const noVettingRaw = `${extractedClaims.applicationPath} ${extractedClaims.role}`
  const claimsNoInterview = NO_VETTING_TERMS.some(term => hasTokenPhrase(applicationPathText, term)) ||
    applicationPathText.includes('no interview') ||
    hasRawPhrase(noVettingRaw, NO_VETTING_RAW_TERMS)
  const paymentContext = `${extractedClaims.applicationPath} ${extractedClaims.salary} ${extractedClaims.role}`
  const claimsUpfrontPayment = hasUnnegatedTerm(paymentContext, UPFRONT_PAYMENT_TERMS) ||
    hasRawPhrase(paymentContext, UPFRONT_PAYMENT_RAW_TERMS)
  // A legitimate employer NEVER charges an employee-job fee. Derive it as "any upfront
  // payment that is NOT a business-purchase fee" (single source of truth = UPFRONT_
  // PAYMENT_TERMS), so a new fee synonym is treated as an employee fee by default and
  // only the explicit business-purchase allow-list qualifies for the franchise exemption.
  const claimsBusinessPurchaseFee = hasUnnegatedTerm(paymentContext, BUSINESS_PURCHASE_TERMS)
  const claimsEmployeeJobFee = (claimsUpfrontPayment && !claimsBusinessPurchaseFee) ||
    hasRawPhrase(paymentContext, UPFRONT_PAYMENT_RAW_TERMS)
  const paymentNorm = normalizeText(paymentContext)
  const claimsMoneyMule = hasUnnegatedTerm(paymentContext, MONEY_MULE_TERMS) || MONEY_MULE_RE.test(paymentNorm)
  const claimsCryptoDeposit = hasUnnegatedTerm(paymentContext, CRYPTO_DEPOSIT_TERMS) || CRYPTO_DEPOSIT_RE.test(paymentNorm)
  const claimsBuyToWork = hasUnnegatedTerm(paymentContext, BUY_TO_WORK_TERMS) || BUY_TO_WORK_RE.test(paymentNorm)
  const claimsCredentialHarvest = hasUnnegatedTerm(paymentContext, CREDENTIAL_HARVEST_TERMS)
  const hasHardFinancialVector = claimsMoneyMule || claimsCryptoDeposit || claimsCredentialHarvest
  // Same fields the base engine scans (role, salary, location, contactMethod,
  // applicationPath, evidence) so the two layers agree on contractor disclosure.
  const contractorDisclosureText = normalizeText([
    extractedClaims.role,
    extractedClaims.salary,
    extractedClaims.location,
    extractedClaims.contactMethod,
    extractedClaims.applicationPath,
    ...evidence.map(item => `${item.type} ${item.snippet}`),
  ].join(' '))
  const hasContractorDisclosure = [
    '1099',
    'independent contractor',
    'contractor role',
    'contract role',
    'project based',
    'project dependent',
    'hours vary',
    'not guaranteed',
    'no guaranteed hours',
    'weekly via paypal',
    'weekly via stripe',
    // Commission-only / variable-income disclosures are a "know what you're signing up
    // for" caution, like variable-hours contracting.
    'commission only',
    'commission based',
    'uncapped commission',
    'draw against commission',
    'depending on closed deals',
    'pay depends on',
  ].some(term => contractorDisclosureText.includes(term))
  const officialSourceMatches = findOfficialSourceMatches(extractedClaims, evidence)
  const globalHiringContext = hasGlobalHiringContext(extractedClaims, evidence)
  const normalizedContactMethod = normalizeText(extractedClaims.contactMethod)
  // Contact method and apply path together — scammers put the t.me/wa.me pivot in
  // either field, and short links ARE the platform.
  const offPlatformContext = `${extractedClaims.contactMethod} ${extractedClaims.applicationPath}`
  const hasTelegramContact = hasUnnegatedTerm(offPlatformContext, ['telegram', 't me'])
  const hasWhatsAppContact = hasUnnegatedTerm(offPlatformContext, ['whatsapp', 'wa me'])
  const hasViberContact = hasUnnegatedTerm(offPlatformContext, ['viber'])
  const hasOtherOffPlatformChannel = hasUnnegatedTerm(offPlatformContext, OFF_PLATFORM_UNAMBIGUOUS) ||
    hasAmbiguousChannelPivot(offPlatformContext) ||
    hasRawPhrase(offPlatformContext, OFF_PLATFORM_RAW_TERMS) ||
    isSmsOnlyFunnel(extractedClaims.contactMethod, extractedClaims.applicationPath)
  const hasOffPlatformContact = hasTelegramContact || hasWhatsAppContact || hasViberContact || hasOtherOffPlatformChannel
  const submittedApplyPathTrust = deriveSubmittedApplyPathTrust(extractedClaims.applicationPath || '', officialEvidence)
  const { hasSubmittedOfficialApplyPath, hasSubmittedTrustedApplyPath } = submittedApplyPathTrust
  const companyProfileMode = inferCompanyProfileMode(extractedClaims, evidence, verifiedLocalEvidence)
  const digitalFootprintEvidence = evidence.filter(item =>
    item.sourceQuality === 'official' ||
    item.sourceQuality === 'reputable' ||
    /\b(linkedin|crunchbase|wellfound|angellist|github|y combinator|yc)\b/i.test(`${item.source} ${item.snippet} ${item.url || ''}`)
  )

  if (officialEvidence.length > 0) {
    addSignal(signals, {
      id: 'company_official_match',
      label: 'Official company footprint matched',
      direction: 'trust',
      severity: 'high',
      confidence: 'high',
      weight: -14,
      evidenceIds: officialEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'The company appears in official web or knowledge-graph evidence.',
    })
    score = applyTrace(scoreTrace, score, 'Company identity', -14, 'Official company presence lowers impersonation risk.', 'company_official_match', idsOf(officialEvidence))
  } else if (normalizeText(extractedClaims.company).includes('unknown')) {
    addSignal(signals, {
      id: 'company_unverified',
      label: 'Company identity is not verifiable',
      direction: 'risk',
      severity: 'high',
      confidence: 'high',
      weight: 18,
      evidenceIds: [],
      rationale: 'A job opportunity without a verifiable company identity is materially riskier.',
    })
    score = applyTrace(scoreTrace, score, 'Company identity', 18, 'Company name could not be confidently verified.', 'company_unverified')
  }

  if (companyProfileMode === 'startup_remote' && digitalFootprintEvidence.length >= 2) {
    addSignal(signals, {
      id: 'startup_digital_footprint',
      label: 'Startup digital footprint is consistent',
      direction: 'trust',
      severity: 'medium',
      confidence: 'medium',
      weight: -8,
      evidenceIds: digitalFootprintEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Remote startups are evaluated on consistent official, founder, product, LinkedIn, and reputable platform evidence rather than requiring a local office footprint.',
    })
    score = applyTrace(scoreTrace, score, 'Company profile mode', confidenceScaled(-8, 'medium'), 'Startup-remote profile has enough consistent digital footprint evidence.', 'startup_digital_footprint', idsOf(digitalFootprintEvidence))
  } else if (companyProfileMode === 'established_remote' && digitalFootprintEvidence.length >= 2) {
    addSignal(signals, {
      id: 'remote_digital_footprint',
      label: 'Remote-company digital footprint is consistent',
      direction: 'trust',
      severity: 'medium',
      confidence: 'medium',
      weight: -6,
      evidenceIds: digitalFootprintEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Remote roles are weighted toward official domain, company profile, reputable job board, and apply-host consistency.',
    })
    score = applyTrace(scoreTrace, score, 'Company profile mode', confidenceScaled(-6, 'medium'), 'Remote profile has consistent digital footprint evidence.', 'remote_digital_footprint', idsOf(digitalFootprintEvidence))
  }

  if (officialSourceMatches.length > 0 && !hasOffPlatformContact && (hasSubmittedOfficialApplyPath || hasSubmittedTrustedApplyPath)) {
    addSignal(signals, {
      id: 'official_source_role_reconciliation',
      label: 'Official source matched company and role',
      direction: 'trust',
      severity: 'high',
      confidence: 'medium',
      weight: -8,
      evidenceIds: officialSourceMatches.map(item => item.id || '').filter(Boolean),
      rationale: globalHiringContext
        ? 'An official or trusted hiring source matches the company and role, so city-level or job-board metadata differences are treated as confirmation notes rather than scam signals.'
        : 'An official or trusted hiring source matches the company and role, reducing the chance that the submitted listing is an impersonation.',
    })
    score = applyTrace(scoreTrace, score, 'Source reconciliation', confidenceScaled(-8, 'medium'), globalHiringContext
      ? 'Official source matched the role; global/remote market wording is a minor confirmation note.'
      : 'Official source matched the submitted company and role.', 'official_source_role_reconciliation', idsOf(officialSourceMatches))
  }

  if (verifiedLocalEvidence.length > 0) {
    addSignal(signals, {
      id: 'local_presence_verified',
      label: 'Local business presence verified',
      direction: 'trust',
      severity: 'medium',
      confidence: 'high',
      weight: -10,
      evidenceIds: verifiedLocalEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Maps/place evidence includes contact or address details for the claimed company.',
    })
    score = applyTrace(scoreTrace, score, 'Local presence', -10, 'Verified local footprint supports legitimacy.', 'local_presence_verified', idsOf(verifiedLocalEvidence))
  } else if (redFlags.some(flag => /no local/i.test(flag)) && companyProfileMode !== 'startup_remote' && companyProfileMode !== 'established_remote') {
    addSignal(signals, {
      id: 'local_presence_missing',
      label: 'No local footprint found',
      direction: 'risk',
      severity: 'medium',
      confidence: 'medium',
      weight: 8,
      evidenceIds: [],
      rationale: 'The audit could not find local presence for a company claiming a local hiring footprint.',
    })
    score = applyTrace(scoreTrace, score, 'Local presence', confidenceScaled(8, 'medium'), 'No matching local presence was found.', 'local_presence_missing')
  } else if (redFlags.some(flag => /no local/i.test(flag))) {
    addSignal(signals, {
      id: 'remote_local_presence_not_required',
      label: 'Local footprint is not required for this remote profile',
      direction: 'neutral',
      severity: 'low',
      confidence: 'medium',
      weight: 0,
      evidenceIds: digitalFootprintEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Missing Maps or office evidence is not treated as a strong risk for remote/startup roles when the digital footprint is otherwise consistent.',
    })
    score = applyTrace(scoreTrace, score, 'Local presence', 0, 'Remote/startup mode avoids penalizing missing local office evidence.', 'remote_local_presence_not_required', idsOf(digitalFootprintEvidence))
  }

  const claimedSalary = normalizeCompensation(extractedClaims.salary)
  const seniority = inferSeniority(extractedClaims.role)
  // Only comparables quoted in the SAME currency as the claim can produce a ratio —
  // dividing a PHP claim by a USD benchmark manufactured 5x+ false anomalies.
  const liveComparableMonthlyValues = comparableEvidence
    .map(item => compensationFromEvidenceSnippet(item.snippet || ''))
    .filter((comp): comp is NormalizedCompensation => Boolean(comp && (!claimedSalary || comp.currency === claimedSalary.currency)))
    .map(comp => comp.monthlyAmount)
  const benchmark = buildHybridSalaryBenchmark({
    role: extractedClaims.role,
    location: extractedClaims.location,
    seniority,
    liveComparableMonthlyValues,
  })
  const liveComparableMedian = median(liveComparableMonthlyValues)
  const benchmarkCurrencyMatches = !claimedSalary || benchmark.currency === claimedSalary.currency
  const comparableMonthly = liveComparableMedian || (benchmarkCurrencyMatches ? benchmark.comparableMonthlyAmount : undefined)
  const salaryRatio = claimedSalary && comparableMonthly ? Number((claimedSalary.monthlyAmount / comparableMonthly).toFixed(2)) : undefined
  // A weekly quote is only anomalous when it is also far above the comparable band
  // (or, absent a benchmark, an implausibly high monthly-equivalent). A modest weekly
  // wage (cruise crew, au-pair stipend, hourly-paid-weekly) is a normal pay schedule,
  // not a scam signal — the bare weekly PERIOD no longer forces an anomaly.
  const hasOfficialOrReputableEvidence = officialEvidence.length > 0 || verifiedLocalEvidence.length > 0 ||
    evidence.some(item => item.sourceQuality === 'reputable' || item.sourceQuality === 'official')
  const salaryAnomalous = Boolean(claimedSalary && (
    (typeof salaryRatio === 'number' && salaryRatio >= 2.5) ||
    (typeof salaryRatio !== 'number' && claimedSalary.period === 'week' && claimedSalary.monthlyAmount >= 25000 && !hasOfficialOrReputableEvidence)
  ))

  // Live comparables give a high-confidence anomaly read; a seeded band or a
  // bare weekly-quote inference is medium confidence.
  const salaryAnomalyConfidence: SignalConfidence = liveComparableMedian ? 'high' : 'medium'
  if (salaryAnomalous) {
    addSignal(signals, {
      id: 'salary_anomaly',
      label: 'Salary is far outside comparable market signals',
      direction: 'risk',
      severity: 'high',
      confidence: salaryAnomalyConfidence,
      weight: 22,
      evidenceIds: comparableEvidence.map(item => item.id || '').filter(Boolean),
      rationale: typeof salaryRatio === 'number'
        ? `The claimed pay is ${salaryRatio}x the comparable monthly benchmark for this role/location.`
        : 'The claimed pay is weekly or far above comparable job listings for the role/location.',
    })
    score = applyTrace(scoreTrace, score, 'Market salary', confidenceScaled(22, salaryAnomalyConfidence), typeof salaryRatio === 'number'
      ? `Claimed compensation is ${salaryRatio}x comparable listings.`
      : 'Claimed compensation is materially above comparable listings.', 'salary_anomaly', idsOf(comparableEvidence))
  } else if (comparableEvidence.length > 0) {
    addSignal(signals, {
      id: 'market_comparable_found',
      label: 'Comparable market jobs found',
      direction: 'trust',
      severity: 'low',
      confidence: 'medium',
      weight: -4,
      evidenceIds: comparableEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Comparable roles exist for checking salary and application path realism.',
    })
    score = applyTrace(scoreTrace, score, 'Market salary', confidenceScaled(-4, 'medium'), 'Comparable jobs provide market context.', 'market_comparable_found', idsOf(comparableEvidence))
  }

  if (mismatchEvidence.length > 0) {
    addSignal(signals, {
      id: 'apply_path_mismatch',
      label: 'Apply path does not match official company domain',
      direction: 'risk',
      severity: 'high',
      confidence: 'high',
      weight: 18,
      evidenceIds: mismatchEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'The submitted apply link appears inconsistent with the official company or apply options.',
    })
    score = applyTrace(scoreTrace, score, 'Apply path', 18, 'Apply domain mismatch is a strong impersonation signal.', 'apply_path_mismatch', idsOf(mismatchEvidence))
  } else if (hasInputConflict) {
    addSignal(signals, {
      id: 'input_conflict',
      label: 'Submitted text conflicts with resolved job page',
      direction: 'risk',
      severity: 'medium',
      confidence: 'high',
      weight: 16,
      evidenceIds: inputConflictEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'The submitted job text disagrees with the public job page that HireProof resolved from the URL.',
    })
    score = applyTrace(scoreTrace, score, 'Input conflict', 16, 'Conflicting submitted claims keep the report in caution territory.', 'input_conflict', idsOf(inputConflictEvidence))
  } else if (hasSubmittedOfficialApplyPath || hasSubmittedTrustedApplyPath) {
    addSignal(signals, {
      id: 'apply_path_professional',
      label: 'Application path appears professional',
      direction: 'trust',
      severity: 'low',
      confidence: 'medium',
      weight: -5,
      evidenceIds: officialEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'The post references an official or trusted application path.',
    })
    score = applyTrace(scoreTrace, score, 'Apply path', confidenceScaled(-5, 'medium'), 'Professional application path lowers risk.', 'apply_path_professional', idsOf(officialEvidence))
  }

  const recruiterIdentity = deriveRecruiterIdentity(extractedClaims, evidence, officialHost)
  if (recruiterIdentity.status === 'verified' || recruiterIdentity.status === 'domain-match') {
    addSignal(signals, {
      id: 'recruiter_domain_match',
      label: 'Recruiter identity matches company domain',
      direction: 'trust',
      severity: 'medium',
      confidence: 'high',
      weight: -8,
      evidenceIds: recruiterIdentity.evidenceIds,
      rationale: 'The recruiter email domain matches the official company domain, which lowers impersonation risk.',
    })
    score = applyTrace(scoreTrace, score, 'Recruiter identity', -8, 'Recruiter domain matches official company domain.', 'recruiter_domain_match', recruiterIdentity.evidenceIds)
  } else if (recruiterIdentity.status === 'platform-match') {
    addSignal(signals, {
      id: 'recruiter_platform_match',
      label: 'Recruiter profile has a professional platform signal',
      direction: 'trust',
      severity: 'low',
      confidence: 'medium',
      weight: -4,
      evidenceIds: recruiterIdentity.evidenceIds,
      rationale: 'A LinkedIn or professional recruiter profile is present, but domain ownership still needs confirmation.',
    })
    score = applyTrace(scoreTrace, score, 'Recruiter identity', confidenceScaled(-4, 'medium'), 'Professional recruiter profile provides partial identity support.', 'recruiter_platform_match', recruiterIdentity.evidenceIds)
  } else if (recruiterIdentity.status === 'risky') {
    addSignal(signals, {
      id: 'recruiter_identity_mismatch',
      label: 'Recruiter identity does not match the company',
      direction: 'risk',
      severity: 'high',
      confidence: 'high',
      weight: 20,
      evidenceIds: recruiterIdentity.evidenceIds,
      rationale: isFreeEmailDomain(recruiterIdentity.recruiterEmailDomain)
        ? 'The recruiter uses a free email domain instead of the official company domain.'
        : 'The recruiter email domain does not match the official company domain.',
    })
    score = applyTrace(scoreTrace, score, 'Recruiter identity', 20, 'Recruiter identity is inconsistent with official company evidence.', 'recruiter_identity_mismatch', recruiterIdentity.evidenceIds)
  }

  if (reputationRiskEvidence.length > 0) {
    addSignal(signals, {
      id: 'reputation_risk',
      label: 'Reputation risk signal found',
      direction: 'risk',
      severity: 'high',
      confidence: 'medium',
      weight: 16,
      evidenceIds: reputationRiskEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Company-specific news or reputation results include scam, fraud, warning, or impersonation language.',
    })
    score = applyTrace(scoreTrace, score, 'Reputation', confidenceScaled(16, 'medium'), 'Company-specific negative reputation evidence increases risk.', 'reputation_risk', idsOf(reputationRiskEvidence))
  }

  if (threatIntelEvidence.length > 0) {
    addSignal(signals, {
      id: 'threat_intel_match',
      label: 'Known threat intelligence match',
      direction: 'risk',
      severity: 'high',
      confidence: 'high',
      weight: 30,
      evidenceIds: threatIntelEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'A submitted URL or domain matched known phishing, malware, or social-engineering intelligence.',
    })
    score = applyTrace(scoreTrace, score, 'Threat intelligence', 30, 'Known-threat intelligence match is a direct danger signal.', 'threat_intel_match', idsOf(threatIntelEvidence))
  }

  if (newDomainRiskEvidence.length > 0) {
    addSignal(signals, {
      id: 'domain_newly_registered',
      label: 'Apply or contact domain is newly registered',
      direction: 'risk',
      severity: 'medium',
      confidence: 'high',
      weight: 10,
      evidenceIds: newDomainRiskEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Newly registered domains are cheap impersonation infrastructure and need stronger verification.',
    })
    score = applyTrace(scoreTrace, score, 'Domain age', 10, 'Newly registered domain increases impersonation risk.', 'domain_newly_registered', idsOf(newDomainRiskEvidence))
  }

  if (recentCertificateEvidence.length > 0) {
    addSignal(signals, {
      id: 'certificate_very_recent',
      label: 'Very recent certificate activity',
      direction: 'risk',
      severity: 'medium',
      confidence: 'medium',
      weight: 6,
      evidenceIds: recentCertificateEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Brand-new certificate issuance for the submitted domain is consistent with freshly stood-up infrastructure.',
    })
    score = applyTrace(scoreTrace, score, 'Certificate transparency', confidenceScaled(6, 'medium'), 'Very recent certificate activity slightly increases risk.', 'certificate_very_recent', idsOf(recentCertificateEvidence))
  }

  if (claimsNoInterview) {
    addSignal(signals, {
      id: 'process_no_interview',
      label: 'Hiring flow claims no interview',
      direction: 'risk',
      severity: 'medium',
      confidence: 'high',
      weight: 12,
      evidenceIds: [],
      rationale: 'Legitimate employment almost always includes an interview or structured screening step.',
    })
    score = applyTrace(scoreTrace, score, 'Hiring process', 12, 'A no-interview hiring flow is unusual for legitimate employment.', 'process_no_interview')
  }

  if (claimsUpfrontPayment) {
    addSignal(signals, {
      id: 'process_upfront_payment',
      label: 'Upfront fee, deposit, or purchase required',
      direction: 'risk',
      severity: 'high',
      confidence: 'high',
      weight: 22,
      evidenceIds: [],
      rationale: 'Asking applicants to pay fees, deposits, or purchases before starting is the classic advance-fee scam pattern.',
    })
    score = applyTrace(scoreTrace, score, 'Upfront payment', 22, 'Upfront fee, deposit, or purchase request is a direct financial-loss vector.', 'process_upfront_payment')
  }

  if (claimsMoneyMule) {
    addSignal(signals, {
      id: 'process_money_mule',
      label: 'Money-mule / reshipping pattern',
      direction: 'risk',
      severity: 'high',
      confidence: 'high',
      weight: 34,
      evidenceIds: [],
      rationale: 'The role asks the applicant to receive and redistribute money or reship packages, a money-laundering pattern.',
    })
    score = applyTrace(scoreTrace, score, 'Money mule', 34, 'Receiving and forwarding money or packages is a laundering / fake-check pattern.', 'process_money_mule')
  }

  if (claimsCryptoDeposit) {
    addSignal(signals, {
      id: 'process_crypto_deposit',
      label: 'Crypto funding required to activate',
      direction: 'risk',
      severity: 'high',
      confidence: 'high',
      weight: 32,
      evidenceIds: [],
      rationale: 'Requiring the applicant to deposit or fund crypto to "activate" is a direct financial-loss vector.',
    })
    score = applyTrace(scoreTrace, score, 'Crypto deposit', 32, 'Applicant-funded crypto deposit to activate is a financial-loss scam.', 'process_crypto_deposit')
  }

  if (claimsBuyToWork) {
    addSignal(signals, {
      id: 'process_buy_to_work',
      label: 'Must purchase materials/kit/gift cards to work',
      direction: 'risk',
      severity: 'high',
      confidence: 'high',
      weight: 26,
      evidenceIds: [],
      rationale: 'Requiring a purchase of materials, kits, or gift cards before earning is a purchase/advance-fee scam.',
    })
    score = applyTrace(scoreTrace, score, 'Buy to work', 26, 'Buying materials, kits, or gift cards before earning is an advance-fee scam pattern.', 'process_buy_to_work')
  }

  if (claimsCredentialHarvest) {
    addSignal(signals, {
      id: 'process_credential_harvest',
      label: 'Pre-hire credential / identity harvesting',
      direction: 'risk',
      severity: 'high',
      confidence: 'high',
      weight: 30,
      evidenceIds: [],
      rationale: 'Collecting bank logins, government IDs, or one-time codes before any hire is an identity/account-theft pattern.',
    })
    score = applyTrace(scoreTrace, score, 'Credential harvest', 30, 'Pre-hire collection of bank logins, IDs, or OTPs is a credential-theft pattern.', 'process_credential_harvest')
  }

  if (staleEvidence.length > 0) {
    addSignal(signals, {
      id: 'stale_evidence',
      label: 'Some evidence is stale',
      direction: 'neutral',
      severity: 'low',
      confidence: 'low',
      weight: 4,
      evidenceIds: staleEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Older search/news evidence is kept visible, but it carries less confidence than fresh or recent sources.',
    })
    score = applyTrace(scoreTrace, score, 'Evidence freshness', confidenceScaled(4, 'low'), 'Stale evidence slightly reduces confidence in the current-state match.', 'stale_evidence', idsOf(staleEvidence))
  }

  if (weakEvidence.length > 0) {
    addSignal(signals, {
      id: 'weak_source_present',
      label: 'Weak source found',
      direction: 'neutral',
      severity: 'low',
      confidence: 'low',
      weight: 2,
      evidenceIds: weakEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Directory or mirror results are retained for transparency but ranked below official, registry, maps, LinkedIn, and trusted job-board sources.',
    })
    score = applyTrace(scoreTrace, score, 'Source quality', confidenceScaled(2, 'low'), 'Weak mirrored sources have lower evidentiary value.', 'weak_source_present', idsOf(weakEvidence))
  }

  const contactMethod = normalizedContactMethod
  if (hasOffPlatformContact) {
    const offPlatformWeight = recruiterIdentity.status === 'verified' || recruiterIdentity.status === 'domain-match' ? 8 : hasTelegramContact ? 16 : 12
    addSignal(signals, {
      id: 'off_platform_contact',
      label: 'Off-platform recruiter contact',
      direction: 'risk',
      severity: offPlatformWeight >= 16 ? 'high' : 'medium',
      confidence: 'high',
      weight: offPlatformWeight,
      evidenceIds: recruiterIdentity.evidenceIds,
      rationale: offPlatformWeight < 12
        ? 'Off-platform contact is still risky, but verified recruiter/company-domain evidence reduces the severity.'
        : 'Telegram, WhatsApp, or Viber-only hiring paths (including t.me/wa.me short links) commonly bypass official recruiter verification.',
    })
    score = applyTrace(scoreTrace, score, 'Contact method', offPlatformWeight, 'Off-platform contact increases job-scam risk.', 'off_platform_contact', recruiterIdentity.evidenceIds)
  }

  const rawFinalDelta = Math.max(0, clampScore(baseScore) - score)
  const hasTrustedHiringSurface = officialEvidence.length > 0 &&
    comparableEvidence.length > 0 &&
    mismatchEvidence.length === 0 &&
    !hasInputConflict &&
    reputationRiskEvidence.length === 0 &&
    threatIntelEvidence.length === 0 &&
    newDomainRiskEvidence.length === 0 &&
    !hasOffPlatformContact &&
    (
      hasSubmittedOfficialApplyPath ||
      hasSubmittedTrustedApplyPath
    )
  const finalDelta = hasTrustedHiringSurface ? Math.min(rawFinalDelta, 12) : rawFinalDelta
  score = applyTrace(scoreTrace, score, 'Policy reconciliation', finalDelta, 'Reconciles with the base signal engine (full breakdown in baseScoreTrace): when the base engine scores higher, the difference is added here so structured base-engine risk is never lost.')
  if (mismatchEvidence.length > 0 && score < 35) {
    score = applyTrace(scoreTrace, score, 'Apply path floor', 35 - score, 'Actionable apply-domain mismatch prevents a safe verdict.')
  }

  // Hard safety floor: a known-threat match can never be argued down by trust signals.
  if (threatIntelEvidence.length > 0 && score < 70) {
    score = applyTrace(scoreTrace, score, 'Threat intel floor', 70 - score, 'Known phishing/malware intelligence match forces a high-risk verdict regardless of other context.')
  }

  // Hard financial/identity-loss vectors: money-mule/reshipping, applicant-funded
  // crypto, and pre-hire credential harvesting are scams regardless of any trust
  // evidence (evidence can't launder a "deposit this check and wire the balance" ask).
  if (hasHardFinancialVector && score < 80) {
    const vectors = [
      claimsMoneyMule ? 'money-mule/reshipping' : '',
      claimsCryptoDeposit ? 'applicant-funded crypto' : '',
      claimsCredentialHarvest ? 'pre-hire credential harvesting' : '',
    ].filter(Boolean).join('; ')
    score = applyTrace(scoreTrace, score, 'Financial/identity-vector floor', 80 - score, `Direct financial/identity-loss pattern (${vectors}) forces a high-risk verdict.`)
  }

  // Impersonation stack: a mismatching apply path combined with independent
  // infrastructure or identity risk is a scam pattern, not a caution pattern.
  const hasImpersonationStack = mismatchEvidence.length > 0 && (
    recruiterIdentity.status === 'risky' ||
    newDomainRiskEvidence.length > 0 ||
    recentCertificateEvidence.length > 0
  )
  if (hasImpersonationStack && score < 65) {
    score = applyTrace(scoreTrace, score, 'Impersonation floor', 65 - score, 'Apply-domain mismatch layered with recruiter or domain-infrastructure risk matches employer-impersonation scams.')
  }

  // Advance-fee floor: an upfront fee/deposit or buy-to-work ask forces high-risk when
  // there is no strong corroboration AND a scam co-signal is present (unverifiable
  // company, off-platform pivot, no interview, reputation risk). A NAMED, plausibly-real
  // company charging a business/franchise/reseller fee lacks a co-signal, so it stays in
  // the caution band (the +22/+26 signal still applies) rather than being forced high-risk.
  const hasStrongCorroborationEvidence = officialEvidence.length > 0 ||
    verifiedLocalEvidence.length > 0 ||
    evidence.some(item => item.sourceQuality === 'reputable' || item.sourceQuality === 'official')
  const companyIsUnverifiable = normalizeText(extractedClaims.company).includes('unknown') ||
    normalizeText(extractedClaims.company).length <= 2

  // Buy-to-work (materials / gift cards / samples) is a pure-loss scam pattern that
  // legitimate employment never uses — force high-risk unconditionally.
  if (claimsBuyToWork && score < 65) {
    score = applyTrace(scoreTrace, score, 'Buy-to-work floor', 65 - score, 'Requiring the applicant to buy materials, kits, or gift cards to work is a purchase scam.')
  }

  // Upfront fee/deposit forces high-risk UNLESS it looks like a named, plausibly-real
  // business charging a franchise/reseller fee (named company with at least a partial
  // web footprint and no other scam co-signal) — that stays caution.
  // Only a business-purchase fee (not an employee-job fee) from a named company with a
  // web footprint and no scam co-signal qualifies as franchise-like caution.
  const franchiseLikeCaution = !claimsEmployeeJobFee &&
    !companyIsUnverifiable &&
    byType('Company Check').length > 0 &&
    !hasOffPlatformContact && !claimsNoInterview && reputationRiskEvidence.length === 0 &&
    !hasHardFinancialVector
  if (claimsUpfrontPayment && !hasStrongCorroborationEvidence && !franchiseLikeCaution && score < 65) {
    score = applyTrace(scoreTrace, score, 'Advance-fee floor', 65 - score, 'Upfront fee or deposit request with no strong corroboration and no legitimate-business context matches advance-fee scams.')
  }

  // Unverifiable + off-platform floor: an unidentifiable company that funnels ALL
  // contact to a personal messaging app with no corroborating evidence is the canonical
  // off-platform recruitment scam, stronger than a caution-band off-platform case
  // (which has official/reputable evidence).
  if (companyIsUnverifiable && hasOffPlatformContact && !hasStrongCorroborationEvidence &&
    byType('Company Check').length === 0 && score < 65) {
    score = applyTrace(scoreTrace, score, 'Unverifiable off-platform floor', 65 - score, 'An unverifiable company steering all contact to a personal messaging app with no footprint is an off-platform scam.')
  }

  // Reputation scam-pattern floor: company-specific scam warnings combined with
  // any structural scam signal is a high-risk pattern, not a caution pattern.
  if (
    reputationRiskEvidence.length > 0 &&
    (salaryAnomalous || claimedSalary?.period === 'week' || hasOffPlatformContact || claimsNoInterview ||
      claimsUpfrontPayment || claimsBuyToWork || hasHardFinancialVector) &&
    score < 65
  ) {
    score = applyTrace(scoreTrace, score, 'Reputation scam-pattern floor', 65 - score, 'Scam-warning reputation evidence combined with a structural scam signal forces a high-risk verdict.')
  }

  // Verification floor: any unresolved moderate risk means the report should ask
  // for verification (caution) instead of certifying the post as safe. Trust
  // evidence lowers the score inside the caution band but cannot cross it while
  // one of these concerns is open.
  const hasFreshCorroboration = evidence.some(item => item.freshness === 'fresh' || item.freshness === 'recent')
  const hasStrongCorroboration = hasStrongCorroborationEvidence
  // A no-interview flow is expected for app-based gig platforms and open-enrollment
  // programs — but ONLY when the post shows an explicit alternative-vetting signal
  // (background check, aptitude test, orientation, online sign-up) AND broker-verified
  // official evidence corroborates. A plain "no interview, direct onboarding" at a real
  // company is still anomalous and stays caution.
  const hasAlternativeVettingSignal = /\b(background check|aptitude test|skills? (?:test|assessment)|open enrollment|orientation|sign up online|app[- ]based|gig|shopper|driver partner|onboarding assessment|drug (?:test|screen))\b/i
    .test(`${extractedClaims.applicationPath} ${extractedClaims.role}`)
  const noInterviewExpectedGivenCorroboration = claimsNoInterview && hasStrongCorroboration && hasAlternativeVettingSignal &&
    !hasOffPlatformContact && !claimsUpfrontPayment && !claimsBuyToWork && !hasHardFinancialVector &&
    mismatchEvidence.length === 0 && reputationRiskEvidence.length === 0 && !salaryAnomalous
  const verificationConcerns: string[] = []
  if (hasOffPlatformContact) verificationConcerns.push('off-platform recruiter contact')
  if (claimsNoInterview && !noInterviewExpectedGivenCorroboration) verificationConcerns.push('no-interview hiring flow')
  if (claimsUpfrontPayment || claimsBuyToWork) verificationConcerns.push('upfront fee, deposit, or purchase request')
  if (salaryAnomalous) verificationConcerns.push('salary far outside comparable market signals')
  if (newDomainRiskEvidence.length > 0) verificationConcerns.push('newly registered domain')
  if (recruiterIdentity.status === 'risky') verificationConcerns.push('recruiter identity mismatch or free-mail contact')
  if (staleEvidence.length > 0 && !hasFreshCorroboration) verificationConcerns.push('only stale supporting evidence')
  if (evidence.length > 0 && !hasStrongCorroboration) verificationConcerns.push('no official, verified-local, or reputable-source corroboration')
  if (hasContractorDisclosure) verificationConcerns.push('disclosed contractor/variable-hours terms')
  if (verificationConcerns.length > 0 && score < 35) {
    score = applyTrace(scoreTrace, score, 'Verification floor', 35 - score, `Open verification concerns prevent a safe verdict: ${verificationConcerns.join('; ')}.`)
  }

  const mismatchHostPair = mismatchEvidence.map(mismatchHostsFromEvidence).find(item => item.submittedHost || item.claimedOfficialHost)
  const submittedHost = hostnameFromUrl(mismatchEvidence.find(item => item.url)?.url) || mismatchHostPair?.submittedHost
  const companyCoverage: IntelligenceSummary['coverage']['company'] = officialEvidence.length > 0 ? 'verified' : byType('Company Check').length > 0 ? 'partial' : 'missing'
  const localCoverage: IntelligenceSummary['coverage']['local'] = verifiedLocalEvidence.length > 0 ? 'verified' : localEvidence.length > 0 ? 'partial' : 'missing'
  const reputationCoverage: IntelligenceSummary['coverage']['reputation'] = reputationRiskEvidence.length > 0 ? 'risk' : byType('Reputation').length > 0 ? 'clear' : 'missing'
  const marketCoverage: IntelligenceSummary['coverage']['market'] = salaryAnomalous ? 'anomalous' : comparableEvidence.length > 0 ? 'normal' : 'missing'
  const applyPathStatus: IntelligenceSummary['applyPath']['status'] = mismatchEvidence.length > 0
    ? 'mismatch'
    : hasSubmittedOfficialApplyPath
      ? 'official'
      : hasSubmittedTrustedApplyPath
        ? 'trusted-board'
        : 'unknown'
  const missingCoverageCount = [companyCoverage, localCoverage, reputationCoverage, marketCoverage, applyPathStatus]
    .filter(status => status === 'missing' || status === 'unknown').length
  const hasNamedCompany = !normalizeText(extractedClaims.company).includes('unknown') && normalizeText(extractedClaims.company).length > 2
  const coverageBackfill: NonNullable<AuditOperations>['coverageBackfill'] = hasNamedCompany && (evidence.length < 3 || missingCoverageCount >= 3)
    ? {
        status: 'degraded',
        message: 'Limited evidence coverage: HireProof identified the job page, but company identity, reputation, local footprint, or market comparables need more receipts before treating the result as fully verified.',
      }
    : undefined

  if (coverageBackfill) {
    addSignal(signals, {
      id: 'limited_evidence_coverage',
      label: 'Evidence coverage is limited',
      direction: 'neutral',
      severity: 'medium',
      confidence: 'medium',
      weight: 0,
      evidenceIds: evidence.map(item => item.id || '').filter(Boolean).slice(0, 5),
      rationale: 'The report has too few independent receipts to present missing dimensions as verified.',
    })
    scoreTrace.push({
      step: 'Evidence coverage',
      delta: 0,
      scoreAfter: clampScore(score),
      reason: 'Sparse coverage is disclosed to the user and treated as a confidence limitation.',
    })
  }

  return {
    riskScore: clampScore(score),
    intelligence: {
      coverage: {
        company: companyCoverage,
        local: localCoverage,
        recruiter: recruiterIdentity.status === 'verified' || recruiterIdentity.status === 'domain-match'
          ? 'verified'
          : recruiterIdentity.status === 'risky'
            ? 'risk'
            : recruiterIdentity.status === 'platform-match' || recruiterIdentity.status === 'unverified'
              ? 'partial'
              : 'missing',
        reputation: reputationCoverage,
        market: marketCoverage,
        applyPath: applyPathStatus,
      },
      companyProfileMode,
      companyIdentity: {
        status: officialEvidence.length > 0 ? 'matched' : byType('Company Check').length > 0 ? 'partial' : 'unverified',
        officialDomain: officialHost,
        evidenceIds: [...officialEvidence, ...byType('Company Check')].map(item => item.id || '').filter(Boolean),
      },
      recruiterIdentity,
      localPresence: {
        status: verifiedLocalEvidence.length > 0 ? 'verified' : localEvidence.length > 0 ? 'partial' : 'missing',
        evidenceIds: localEvidence.map(item => item.id || '').filter(Boolean),
      },
      marketBenchmark: {
        status: salaryAnomalous ? 'anomalous' : comparableEvidence.length > 0 ? 'normal' : 'missing',
        claimedMonthlyAmount: claimedSalary?.monthlyAmount,
        comparableMonthlyAmount: comparableMonthly,
        currency: claimedSalary?.currency || benchmark.currency,
        ratio: salaryRatio,
        seniority,
        country: benchmark.country,
        source: benchmark.source,
        evidenceIds: comparableEvidence.map(item => item.id || '').filter(Boolean),
      },
      applyPath: {
        status: applyPathStatus,
        submittedHost,
        officialHost,
        evidenceIds: mismatchEvidence.map(item => item.id || '').filter(Boolean),
      },
      signals,
      scoreTrace,
    },
    operations: {
      coverageBackfill,
      salaryBenchmark: {
        source: benchmark.source,
        country: benchmark.country,
        currency: benchmark.currency,
        message: benchmark.source === 'serpapi-live-comparables'
          ? 'Salary benchmark used fresh live comparable job evidence.'
          : 'Salary benchmark used a seeded country/role band because live comparables were sparse.',
      },
      falsePositiveControl: {
        profileModeExplanation: companyProfileMode === 'startup_remote'
          ? 'HireProof detected a remote startup profile, so missing local office or Maps evidence did not hurt the score when official and reputable digital footprint evidence was consistent.'
          : companyProfileMode === 'established_remote'
            ? 'HireProof detected an established remote or global hiring profile, so official source, trusted ATS/job-board, and recruiter consistency were weighted above local office evidence. City-level wording differences should be confirmed, but they are not treated as scam signals when the role is officially matched.'
            : officialSourceMatches.length > 0 && globalHiringContext
              ? 'HireProof matched the company and role on an official or trusted hiring source. City-level metadata differences should still be confirmed against the submitted application path before treating the listing as verified.'
            : undefined,
      },
    },
  }
}

export function buildAuditReportV2(input: BuildReportV2Input): AuditReportV2 {
  const now = typeof input.now === 'number' && Number.isFinite(input.now) ? input.now : Date.now()
  const evidence = attachEvidenceMetadata([...(input.enrichmentEvidence || []), ...(input.evidence || [])], now)
  const reportOfficialHost = hostnameFromUrl(evidence.find(item => item.type === 'Official Company Presence')?.url)
  const reportEvidence = evidence.filter(item =>
    item.type !== 'Apply Path Mismatch' || isActionableApplyPathMismatch(item, reportOfficialHost)
  )
  const trustedJobPageEvidence = hasTrustedJobPageEvidence(reportEvidence)
  let redFlags = [
    ...extractRedFlags(input.extractedClaims, reportEvidence),
    ...(input.enrichmentRedFlags || []),
  ]
  if (trustedJobPageEvidence) {
    redFlags = redFlags.filter(flag => !/no supporting evidence/i.test(flag))
  }
  const greenFlags = extractGreenFlags(input.extractedClaims, reportEvidence)
  const preliminaryProfileMode = inferCompanyProfileMode(
    input.extractedClaims,
    reportEvidence,
    reportEvidence.filter(item => item.type === 'Verified Local Presence'),
  )

  if (
    preliminaryProfileMode === 'startup_remote' ||
    preliminaryProfileMode === 'established_remote'
  ) {
    redFlags = redFlags.filter(flag => !/no local/i.test(flag))
  }

  if (normalizeText(input.extractedClaims.company).includes('unknown')) {
    redFlags.push('Company name could not be confidently extracted from the post')
  }

  // Only enrichment-sourced flags feed the base score. The flags derived via
  // extractRedFlags/extractGreenFlags are explanations of structured signals that
  // buildAuditSignals already derives internally from claims + evidence, so passing
  // them back in double-counted every top signal (see legacy flag signals).
  // Guarded because unit tests mock '@/lib/risk-scorer' without the trace export.
  const baseTraceResult = typeof traceRiskScore === 'function'
    ? traceRiskScore(input.extractedClaims, input.enrichmentRedFlags || [], [], reportEvidence, input.signalWeightOverrides)
    : undefined
  const rawBaseScore = baseTraceResult
    ? baseTraceResult.score
    : calculateRiskScore(input.extractedClaims, input.enrichmentRedFlags || [], [], reportEvidence, input.signalWeightOverrides)
  const baseScore = Math.max(rawBaseScore, (input.enrichmentRedFlags || []).length > 0 ? 45 : 0)
  const baseScoreTrace = baseTraceResult ? [...baseTraceResult.trace] : undefined
  if (baseScoreTrace && baseScore > rawBaseScore) {
    baseScoreTrace.push({
      step: 'Enrichment floor',
      delta: baseScore - rawBaseScore,
      scoreAfter: baseScore,
      reason: 'Enrichment red flags (URL resolution conflicts) keep the base score at or above the caution band.',
    })
  }
  const { intelligence, riskScore, operations } = deriveIntelligence(input.extractedClaims, reportEvidence, redFlags, greenFlags, baseScore)
  if (baseScoreTrace) intelligence.baseScoreTrace = baseScoreTrace
  const verdict = determineVerdict(riskScore)
  const salaryBenchmarkOperation = operations?.salaryBenchmark
    ? {
        ...operations.salaryBenchmark,
        ...(input.operations?.salaryBenchmark || {}),
      }
    : input.operations?.salaryBenchmark

  return {
    id: input.id,
    version: '2',
    verdict,
    riskScore,
    confidence: getConfidenceLabel(riskScore, evidence.length),
    summary: generateSummary(verdict, riskScore, redFlags),
    extractedClaims: input.extractedClaims,
    redFlags,
    greenFlags,
    evidence: reportEvidence,
    alternatives: buildVerifiedAlternativeJobs(reportEvidence),
    nextSteps: buildNextSteps(verdict, input.extractedClaims.company),
    timestamp: new Date(now).toISOString(),
    mode: input.mode || 'live',
    credentialMode: input.credentialMode,
    ownerId: input.ownerId,
    apiKeyId: input.apiKeyId,
    source: input.source,
    chatPlatform: input.chatPlatform,
    chatThreadId: input.chatThreadId,
    chatChannelId: input.chatChannelId,
    publiclyListed: input.publiclyListed ?? true,
    intelligence,
    operations: {
      ...(operations || {}),
      ...(input.operations || {}),
      salaryBenchmark: salaryBenchmarkOperation,
      falsePositiveControl: {
        ...(operations?.falsePositiveControl || {}),
        ...(input.operations?.falsePositiveControl || {}),
      },
      liveSearch: input.operations?.liveSearch || operations?.liveSearch,
    },
  }
}
