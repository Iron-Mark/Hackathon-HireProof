const GENERIC_COMPANY_TERMS = new Set([
  'the',
  'and',
  'company',
  'corp',
  'corporation',
  'inc',
  'llc',
  'ltd',
  'limited',
  'co',
  'group',
])

// Cyrillic/Greek/misc look-alikes -> Latin, so homoglyph evasion ("tеlegram" with a
// Cyrillic е) folds to the real keyword. NFKC (applied in normalize) already folds
// fullwidth/compatibility forms; this map covers cross-script confusables NFKC keeps.
const CONFUSABLE_MAP = {
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'ѕ': 's', 'і': 'i', 'ј': 'j',
  'к': 'k', 'н': 'h', 'в': 'b', 'т': 't', 'м': 'm', 'ո': 'n', 'ԁ': 'd', 'ԛ': 'q', 'ѡ': 'w', 'г': 'r',
  'α': 'a', 'ο': 'o', 'ρ': 'p', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ν': 'v', 'τ': 't', 'υ': 'u', 'χ': 'x',
  'β': 'b', 'η': 'n', 'μ': 'm', 'ϲ': 'c', 'ⅼ': 'l', 'ⅰ': 'i', '，': ',', '．': '.', '；': ';',
}
const CONFUSABLE_RE = new RegExp(`[${Object.keys(CONFUSABLE_MAP).join('')}]`, 'g')

function foldConfusables(value) {
  return String(value || '')
    .replace(/[​-‍﻿⁠­]/g, '') // zero-width + soft hyphen
    .replace(CONFUSABLE_RE, (ch) => CONFUSABLE_MAP[ch] || ch)
}

// Strip combining diacritics so accented non-English matches ("inscripción" ->
// "inscripcion", "entretien" unaffected, "démarrage" -> "demarrage").
function stripDiacritics(value) {
  return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// NFKC-folded, lowercased, diacritic-stripped view that KEEPS non-ASCII scripts
// (CJK, Arabic, Devanagari) so raw-phrase scans can match idioms that the ASCII
// normalizer would erase. Used for multilingual scam-idiom detection.
function rawFolded(value) {
  return stripDiacritics(foldConfusables(String(value || '').normalize('NFKC'))).toLowerCase()
}

function hasRawPhrase(value, phrases) {
  const text = rawFolded(value)
  return phrases.some((phrase) => text.includes(phrase))
}

function normalize(value) {
  return stripDiacritics(foldConfusables(String(value || '').normalize('NFKC')))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasAny(value, terms) {
  const text = normalize(value)
  return terms.some((term) => text.includes(term))
}

// Token-boundary phrase match on normalized text: ' t me ' matches "t.me/handle"
// but never the inside of "don't message" ('don t message').
function hasTokenPhrase(value, phrase) {
  return ` ${normalize(value)} `.includes(` ${phrase} `)
}

const NEGATION_TOKENS = new Set([
  'no', 'never', 'not', 'without', 'dont', 'doesnt', 'wont', 'zero', 'beware', 'avoid', 'anti', 'nor', 'none',
  // Multilingual negations (diacritics already folded): fr, es, pt, it, id, hi, de
  'ne', 'pas', 'jamais', 'aucun', 'aucune', 'sans', 'nunca', 'ningun', 'ninguna', 'sin', 'nao', 'nenhum', 'sem',
  'tidak', 'tanpa', 'jangan', 'nahi', 'bina', 'kein', 'keine', 'nie', 'niemals',
])

// Applicant-payment demand verbs. A demand in the same clause as a risk term FIRES
// regardless of negation elsewhere — "we do not overcharge, pay the deposit" is a
// demand. Excludes the asking verbs (ask/charge/require/collect/request) that appear
// in legitimate disclaimers ("we never ask for a fee").
const DEMAND_TOKENS = new Set([
  'pay', 'send', 'deposit', 'remit', 'wire', 'transfer', 'submit', 'purchase', 'buy', 'settle', 'load', 'reload',
])

// Tokenize with clause-boundary markers ('cbrk'). Sentence punctuation, dashes, and
// contrastive conjunctions end a negation's scope so a benign negation in one clause
// cannot suppress a risk term in the next ("we never charge a fee, but pay the deposit").
// The period inside "t.me" is NOT a boundary (only '.' followed by space/end is).
function tokenizeWithBoundaries(value) {
  const marked = stripDiacritics(foldConfusables(String(value || '').normalize('NFKC')))
    .toLowerCase()
    .replace(/[,;:!?]+|\.(?=\s|$)|\s[-–—/]\s|\b(?:but|however|though|although|yet|whereas|nevertheless)\b/g, ' cbrk ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return marked ? marked.split(' ') : []
}

// True when any term appears in a clause WITHOUT a preceding negation (scope stops at
// clause boundaries), OR when a payment-demand verb co-occurs in the same clause
// (demand overrides negation). Fixes weaponized negation ("beware of scams, pay the
// activation fee") while keeping genuine disclaimers ("we never ask for a fee") silent.
function hasUnnegatedTerm(value, terms) {
  const tokens = tokenizeWithBoundaries(value)
  for (const term of terms) {
    const parts = term.split(' ')
    for (let i = 0; i + parts.length <= tokens.length; i += 1) {
      if (!parts.every((part, k) => tokens[i + k] === part)) continue
      let negated = false
      let demand = false
      // Scan the enclosing clause (back to a boundary, and forward to a boundary).
      for (let j = i - 1; j >= 0; j -= 1) {
        if (tokens[j] === 'cbrk') break
        if (DEMAND_TOKENS.has(tokens[j])) demand = true
        if (NEGATION_TOKENS.has(tokens[j])) { negated = true; break }
      }
      for (let j = i + parts.length; j < tokens.length; j += 1) {
        if (tokens[j] === 'cbrk') break
        if (DEMAND_TOKENS.has(tokens[j])) demand = true
      }
      if (!negated || demand) return true
    }
  }
  return false
}

function companyTokens(companyName) {
  return normalize(companyName)
    .split(' ')
    .filter((token) => token.length >= 3 && !GENERIC_COMPANY_TERMS.has(token))
}

function isUnknown(value) {
  const text = normalize(value)
  return !text || text.includes('unknown') || text.includes('not verifiable') || text.includes('not specified')
}

function evidenceText(item) {
  return `${item?.type || ''} ${item?.source || ''} ${item?.snippet || ''} ${item?.url || ''}`
}

const STRUCTURED_OFFICIAL_TYPES = new Set(['Official Company Presence', 'Verified Local Presence', 'Knowledge Graph'])

function sourceTier(item) {
  const text = normalize(evidenceText(item))
  // Official trust requires the structured broker-assigned type, not snippet text that a
  // scammer could plant ("Trust: official" in their own web copy).
  if (STRUCTURED_OFFICIAL_TYPES.has(String(item?.type || ''))) return 'official'

  if (
    text.includes('linkedin') ||
    text.includes('greenhouse') ||
    text.includes('lever') ||
    text.includes('ashby') ||
    text.includes('smartrecruiters') ||
    text.includes('workday') ||
    text.includes('indeed') ||
    text.includes('glassdoor') ||
    text.includes('jobstreet') ||
    text.includes('reputable job board')
  ) return 'reputable_job_board'

  if (text.includes('company check') || text.includes('web search') || text.includes('public job page')) return 'public_web'
  if (text.includes('directory') || text.includes('mirror') || text.includes('scraped')) return 'weak_directory'
  return 'user_claim_only'
}

// Reputation risk words, matched as tokens through the negation guard so that
// "no scam or fraud reports found" reads as clean, not risky.
const REPUTATION_RISK_TERMS = [
  'scam', 'scams', 'scammer', 'scammers',
  'fraud', 'fraudulent',
  'fake',
  'impersonation', 'impersonating', 'impersonates',
  'phishing',
  'lawsuit', 'lawsuits',
  'warning', 'warnings',
]

const STRUCTURED_BROKER_SOURCE_TYPES = new Set([
  'domain',
  'dns',
  'certificate',
  'threat intel',
  'company registry',
])

function canUseGenericNegativeReputation(item, sourceType, type, source) {
  if (STRUCTURED_BROKER_SOURCE_TYPES.has(sourceType)) return false
  return (
    type.includes('reputation') ||
    type.includes('news') ||
    sourceType === 'news' ||
    sourceType === 'search' ||
    source.includes('serpapi') ||
    source.includes('google search') ||
    source.includes('news')
  )
}

function signal(id, category, direction, severity, confidence, weight, explanation, evidenceType) {
  return {
    id,
    category,
    direction,
    severity,
    confidence,
    weight,
    explanation,
    evidenceType,
  }
}

function addUnique(output, item) {
  if (output.some((existing) => existing.id === item.id && existing.explanation === item.explanation)) return
  output.push(item)
}

// Personal messaging apps / off-official channels beyond Telegram/WhatsApp/Viber.
// 'line' and 'signal' are English words, so they are matched only via disambiguating
// multi-word phrases, never as a bare token.
const OFF_PLATFORM_MESSAGING_TERMS = [
  'discord', 'wechat', 'we chat', 'weixin', 'skype', 'kakao', 'kakaotalk', 'snapchat', 'snap chat',
  'signal app', 'on signal', 'via signal', 'signal messenger', 'add me on signal', 'message on signal', 'signal number',
  'line app', 'line id', 'line official', 'add me on line', 'message on line', 'chat on line', 'reach me on line',
  'facebook messenger', 'fb messenger', 'instagram dm', 'ig dm', 'dm on instagram', 'dm me on ig', 'dm us on',
  'google chat', 'gchat', 'google hangouts', 'hangouts', 'session app', 'threema', 'wickr',
  'linktree', 'linktr ee', 'text to apply', 'sms only', 'text me at', 'text us at', 'text to start',
]

// Non-Latin channel idioms (matched on the diacritic-folded raw string).
const OFF_PLATFORM_RAW_TERMS = ['微信', '加微信', '电报', '텔레그램', '왓츠앱', 'ватсап', 'телеграм', 'واتساب', 'تلغرام']

// A raw phone number as the contact route (no domain/URL) with a text/call funnel is
// an SMS-only channel that keeps the applicant off any accountable platform.
function isSmsOnlyFunnel(claims) {
  const contact = String(claims?.contactMethod || '')
  const appPath = String(claims?.applicationPath || '')
  const combinedRaw = `${contact} ${appPath}`
  const hasUrl = /https?:\/\/|www\.|@|\.[a-z]{2,}/i.test(combinedRaw)
  const hasPhone = /(?:\+?\d[\d ()–—-]{7,}\d)/.test(combinedRaw)
  const smsWords = /\b(text|sms|call or text|txt|text me|text us)\b/i.test(combinedRaw)
  return hasPhone && !hasUrl && smsWords
}

function buildContactSignals(claims, output) {
  const contact = normalize(claims?.contactMethod)
  const appPath = normalize(claims?.applicationPath)
  const combined = `${contact} ${appPath}`
  // hasUnnegatedTerm does its own boundary-aware normalization — it must see the RAW
  // text so clause punctuation (which normalize() would strip) still marks boundaries.
  const combinedRaw = `${claims?.contactMethod || ''}. ${claims?.applicationPath || ''}`

  // Short links ARE the platform: t.me -> Telegram, wa.me -> WhatsApp.
  if (hasUnnegatedTerm(combinedRaw, ['telegram', 't me'])) {
    addUnique(output, signal(
      'contact.telegram_only',
      'contact',
      'risk',
      'high',
      'high',
      20,
      'Recruitment is pushed to Telegram, which bypasses normal company-controlled hiring channels.',
      'Contact Safety',
    ))
  }

  if (hasUnnegatedTerm(combinedRaw, ['whatsapp', 'wa me'])) {
    addUnique(output, signal(
      'contact.whatsapp_only',
      'contact',
      'risk',
      'medium',
      'high',
      17,
      'Recruitment is pushed to WhatsApp, which is weaker than a company-owned or job-board apply path.',
      'Contact Safety',
    ))
  }

  if (hasUnnegatedTerm(combinedRaw, ['viber'])) {
    addUnique(output, signal(
      'contact.viber_only',
      'contact',
      'risk',
      'medium',
      'high',
      15,
      'Recruitment is pushed to Viber, which bypasses company-controlled hiring channels.',
      'Contact Safety',
    ))
  }

  const offPlatformMessaging = hasUnnegatedTerm(combinedRaw, OFF_PLATFORM_MESSAGING_TERMS) ||
    hasRawPhrase(`${claims?.contactMethod || ''} ${claims?.applicationPath || ''}`, OFF_PLATFORM_RAW_TERMS) ||
    isSmsOnlyFunnel(claims)
  if (offPlatformMessaging) {
    addUnique(output, signal(
      'contact.off_platform_messaging',
      'contact',
      'risk',
      'medium',
      'high',
      15,
      'Recruitment is pushed to a personal messaging app or off-platform channel that bypasses company-controlled hiring.',
      'Contact Safety',
    ))
  }

  const hasOffPlatform = hasUnnegatedTerm(combinedRaw, ['telegram', 't me', 'whatsapp', 'wa me', 'viber']) || offPlatformMessaging
  // Professional-apply-path trust requires a genuinely recognizable channel — not the
  // bare word "official" (which collides with lures like "Line official account") — and
  // it never fires when the post also pushes an off-platform channel.
  if (!hasOffPlatform && hasAny(combined, [
    'linkedin', 'careers page', 'careers portal', 'official careers', 'official website', 'official company',
    'official platform', 'company website', 'easy apply', 'provided job url', 'greenhouse', 'lever', 'workday', 'ashby', 'jobstreet', 'indeed',
  ])) {
    addUnique(output, signal(
      'contact.professional_apply_path',
      'contact',
      'trust',
      'medium',
      'medium',
      -8,
      'The application path uses a recognizable job board, official channel, or public job URL.',
      'Apply Path',
    ))
  }
}

// fee/charge variants scammers rotate through (incl. the "cost" evasion and
// Spanish/Portuguese/French/Bahasa/Hinglish equivalents), plus deposit phrasings.
const UPFRONT_PAYMENT_TERMS = [
  ...['training', 'registration', 'activation', 'processing', 'application', 'membership', 'placement', 'onboarding', 'handling', 'admin', 'upfront', 'setup', 'account', 'service']
    .flatMap((kind) => [`${kind} fee`, `${kind} charge`, `${kind} cost`]),
  'equipment deposit', 'security deposit', 'refundable deposit', 'deposit required', 'deposit to unlock', 'with deposit',
  'purchase software', 'software license', 'starter kit', 'pay to start', 'pay before starting', 'upfront payment',
  // Spanish / Portuguese / French / Bahasa / romanized Hindi
  'cuota de inscripcion', 'tarifa de inscripcion', 'cuota de registro', 'pago inicial', 'deposito inicial',
  'taxa de treinamento', 'taxa de inscricao', 'taxa de adesao', 'taxa de cadastro',
  'frais de dossier', 'frais d inscription', 'frais de formation', 'frais de traitement',
  'biaya pelatihan', 'biaya pendaftaran', 'uang pendaftaran',
  'registration ke liye', 'fees jama', 'jama karein', 'jama karna',
]

// CJK / other-script fee & no-vetting idioms (matched on the raw folded string, since
// the ASCII normalizer erases these scripts entirely).
const UPFRONT_PAYMENT_RAW_TERMS = ['报名费', '培训费', '押金', '保证金', '会费', '工本费', '服务费', '手续费', '注册费', '가입비', '보증금', '수수료']
const NO_VETTING_RAW_TERMS = ['无需面试', '免面试', '无面试', '不需要面试', '面接なし', '면접 없이', '면접없이']

// "No interview" in every phrasing scammers use, incl. Taglish and other languages.
const NO_VETTING_TERMS = [
  'no interview', 'without interview', 'skip interview', 'no exam', 'no screening', 'no assessment',
  'walang interview', 'walang exam',
  'sin entrevista', 'sem entrevista', 'sans entretien', 'tanpa wawancara', 'senza colloquio', 'ohne vorstellungsgesprach',
  'koi interview nahi', 'bina interview', 'interview nahi',
]

// Inbound-money / package-mule laundering patterns: money flows TO the applicant to
// redistribute, or goods are reshipped. A hard financial/laundering vector.
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

// Crypto-funding advance-fee: the applicant must fund a wallet/platform to "activate".
const CRYPTO_DEPOSIT_TERMS = [
  'deposit usdt', 'deposit btc', 'deposit eth', 'deposit crypto', 'load usdt', 'fund your wallet', 'fund the wallet',
  'company wallet', 'company trading', 'trading platform to activate', 'crypto deposit', 'deposit into the platform',
  'top up your account with', 'recharge your account with', 'deposit to your trading',
]

// Buy-to-work: the applicant must purchase materials/kits/gift cards before earning.
const BUY_TO_WORK_TERMS = [
  'buy your', 'purchase your', 'buy the materials', 'buy materials', 'purchase materials', 'buy your materials',
  'buy samples', 'purchase samples', 'buy gift cards', 'purchase gift cards', 'buy promotional', 'purchase promotional',
  'assembly kit', 'sample kit', 'inventory purchase', 'buy inventory', 'buy equipment first', 'purchase the starter',
]

// Credential/identity harvesting before any hire.
const CREDENTIAL_HARVEST_TERMS = [
  'social security number', 'ssn and', 'your ssn', 'bank login', 'online banking username', 'online banking password',
  'banking username', 'banking password', 'account password', 'card pin', 'debit card pin', 'one time password', 'otp code',
  'photo of your id holding', 'selfie holding your id', 'selfie with your id', 'routing number and account number',
  'mother maiden name and', 'full card number and cvv',
]

function buildProcessSignals(claims, output) {
  const appPath = normalize(claims?.applicationPath)
  const appPathRaw = `${claims?.applicationPath || ''} ${claims?.role || ''}`
  const paymentContext = `${appPath} ${normalize(claims?.salary)} ${normalize(claims?.role)}`
  const paymentContextRaw = `${claims?.applicationPath || ''} ${claims?.salary || ''} ${claims?.role || ''}`

  if (
    NO_VETTING_TERMS.some((term) => hasTokenPhrase(appPath, term)) ||
    appPath.includes('no interview') ||
    hasRawPhrase(appPathRaw, NO_VETTING_RAW_TERMS)
  ) {
    addUnique(output, signal(
      'process.no_interview',
      'process',
      'risk',
      'high',
      'high',
      18,
      'The hiring flow mentions no interview, which is unusual for legitimate employment.',
      'Recruitment Process',
    ))
  }

  if (hasUnnegatedTerm(paymentContextRaw, MONEY_MULE_TERMS)) {
    addUnique(output, signal(
      'process.money_mule',
      'process',
      'risk',
      'high',
      'high',
      34,
      'The role asks the applicant to receive and redistribute money or reship packages, which is a money-mule / laundering pattern.',
      'Financial Safety',
    ))
  }

  if (hasUnnegatedTerm(paymentContextRaw, CRYPTO_DEPOSIT_TERMS)) {
    addUnique(output, signal(
      'process.crypto_deposit',
      'process',
      'risk',
      'high',
      'high',
      32,
      'The role requires the applicant to deposit or fund crypto to "activate", which is a direct financial-loss vector.',
      'Financial Safety',
    ))
  }

  if (hasUnnegatedTerm(paymentContextRaw, BUY_TO_WORK_TERMS)) {
    addUnique(output, signal(
      'process.buy_to_work',
      'process',
      'risk',
      'high',
      'high',
      26,
      'The applicant must purchase materials, kits, or gift cards before working, which is a purchase/advance-fee scam pattern.',
      'Financial Safety',
    ))
  }

  if (hasUnnegatedTerm(paymentContextRaw, CREDENTIAL_HARVEST_TERMS)) {
    addUnique(output, signal(
      'process.credential_harvest',
      'process',
      'risk',
      'high',
      'high',
      30,
      'The listing collects bank logins, government IDs, or one-time codes before any hire, which is a credential/identity-theft pattern.',
      'Identity Safety',
    ))
  }

  if (hasUnnegatedTerm(paymentContextRaw, UPFRONT_PAYMENT_TERMS) || hasRawPhrase(paymentContextRaw, UPFRONT_PAYMENT_RAW_TERMS)) {
    addUnique(output, signal(
      'process.upfront_payment',
      'process',
      'risk',
      'high',
      'high',
      26,
      'The opportunity asks for an upfront fee, deposit, or purchase before work starts, which is a classic advance-fee scam pattern.',
      'Recruitment Process',
    ))
  }
}

function parseSalaryAmount(normalizedSalary) {
  // First digit run (allowing thousands separators normalized to spaces): "80 000 per week" -> 80000
  const match = normalizedSalary.match(/\d[\d ]*/)
  if (!match) return undefined
  const amount = Number(match[0].replace(/ /g, ''))
  return Number.isFinite(amount) && amount > 0 ? amount : undefined
}

function buildSalarySignals(claims, output) {
  const salary = normalize(claims?.salary)
  const role = normalize(claims?.role)
  if (!salary) return

  // 'wk' abbreviation counts as weekly; an hourly rate "paid weekly" is a pay
  // SCHEDULE for an hourly wage, not a weekly salary quote.
  const weekly = (salary.includes('week') || hasTokenPhrase(salary, 'wk')) && !salary.includes('hour')
  const amount = parseSalaryAmount(salary)
  const juniorRole = ['intern', 'entry', 'junior', 'trainee', 'encoder', 'typist'].some((term) => role.includes(term))
  // Weekly quotes are implausible when the amount is extreme in any currency, or
  // clearly outsized for a junior-level role (generalizes the old 80k/100k literals).
  const highWeekly = weekly && typeof amount === 'number' && (amount >= 60000 || (juniorRole && amount >= 3000))

  if (highWeekly || (weekly && juniorRole)) {
    addUnique(output, signal(
      'salary.implausible_weekly_entry_role',
      'salary',
      'risk',
      'high',
      'high',
      30,
      'The salary format and role level look implausible for a normal hiring process.',
      'Market Plausibility',
    ))
    return
  }

  if (weekly) {
    addUnique(output, signal(
      'salary.weekly_quote',
      'salary',
      'risk',
      'medium',
      'medium',
      12,
      'Salary is quoted weekly, which needs extra verification against market norms.',
      'Market Plausibility',
    ))
  }

  if (hasAny(salary, ['per year', 'annually', 'per month', 'per hour', 'hour'])) {
    addUnique(output, signal(
      'salary.standard_format',
      'salary',
      'trust',
      'low',
      'medium',
      -4,
      'The compensation format is a recognizable market format.',
      'Market Plausibility',
    ))
  }
}

function buildClaimCompletenessSignals(claims, output) {
  if (isUnknown(claims?.company)) {
    addUnique(output, signal(
      'entity.company_unknown',
      'entity',
      'risk',
      'medium',
      'high',
      14,
      'The company name is missing or not verifiable from the submitted post.',
      'Company Verification',
    ))
  }

  if (!isUnknown(claims?.location)) {
    addUnique(output, signal(
      'entity.location_specific',
      'entity',
      'trust',
      'low',
      'medium',
      -3,
      'The post includes a specific location or remote market context.',
      'Job Detail Quality',
    ))
  }
}

function buildContractorSignals(claims, evidence, output) {
  const safeEvidence = Array.isArray(evidence) ? evidence : []
  const combined = normalize([
    claims?.role,
    claims?.salary,
    claims?.location,
    claims?.contactMethod,
    claims?.applicationPath,
    ...safeEvidence.map(evidenceText),
  ].join(' '))

  const contractorTerms = [
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
    'commission only',
    'commission based',
    'uncapped commission',
    'draw against commission',
    'depending on closed deals',
  ]
  const transparentCaveats = [
    'accepted countries',
    'accepted locations',
    'unable to process applications from unlisted locations',
    'not compatible with f 1 opt',
    'stem opt',
    'w 2 employment',
    'employer sponsorship',
    'unable to provide offer letters',
    'employment verification',
    'identity verification',
    'valid documentation',
  ]
  const aiTrainingTerms = [
    'rlhf',
    'large language models',
    'llms',
    'rank multiple code snippets',
    'ai generated code',
    'reward signals',
    'model learns',
    'code review',
  ]

  const hasContractorDisclosure = hasAny(combined, contractorTerms)
  const hasTransparentCaveats = hasAny(combined, transparentCaveats)
  const hasAiTrainingContext = hasAny(combined, aiTrainingTerms)

  if (hasContractorDisclosure) {
    addUnique(output, signal(
      'contractor.variable_hours_caution',
      'process',
      'risk',
      'medium',
      'high',
      12,
      'The role is disclosed as contractor or project-dependent work, so it should not be treated as stable employment.',
      'Contract Terms',
    ))
  }

  if (hasTransparentCaveats) {
    addUnique(output, signal(
      'contractor.transparent_limitations',
      'process',
      'trust',
      'medium',
      'high',
      -7,
      'The listing clearly discloses eligibility, visa, identity, employment-verification, or hours limitations.',
      'Contract Transparency',
    ))
  }

  if (hasAiTrainingContext) {
    addUnique(output, signal(
      'role.rlhf_ai_training_context',
      'entity',
      'trust',
      'low',
      'medium',
      -3,
      'The role description matches a recognizable AI training or RLHF coding-review work pattern.',
      'Role Plausibility',
    ))
  }
}

function buildEvidenceSignals(claims, evidence, output) {
  const safeEvidence = Array.isArray(evidence) ? evidence : []
  const tiers = new Set(safeEvidence.map(sourceTier))
  const company = claims?.company || ''
  const tokens = companyTokens(company)

  if (tiers.has('official')) {
    addUnique(output, signal(
      'source.official_match',
      'source',
      'trust',
      'high',
      'high',
      -16,
      'Evidence includes official or verified company presence.',
      'Official Company Presence',
    ))
  }

  if (tiers.has('reputable_job_board')) {
    addUnique(output, signal(
      'source.reputable_job_board',
      'source',
      'trust',
      'medium',
      'high',
      -8,
      'Evidence includes a reputable job board or known ATS source.',
      'Job Post Source',
    ))
  }

  if (tiers.has('weak_directory')) {
    addUnique(output, signal(
      'source.weak_directory',
      'source',
      'risk',
      'low',
      'medium',
      6,
      'Some evidence comes from weak directory or mirrored job sources.',
      'Source Reliability',
    ))
  }

  if (safeEvidence.length === 0) {
    addUnique(output, signal(
      'evidence.none',
      'evidence',
      'risk',
      'medium',
      'high',
      10,
      'No external supporting evidence was available for the audit.',
      'Evidence Coverage',
    ))
  }

  for (const item of safeEvidence) {
    const text = normalize(evidenceText(item))
    const type = normalize(item?.type)
    const source = normalize(item?.source)
    const sourceType = normalize(item?.sourceType)
    const trustLevel = normalize(item?.trustLevel)

    if (sourceType === 'domain' && type.includes('domain age') && trustLevel === 'risk') {
      addUnique(output, signal(
        'domain.newly_registered',
        'source',
        'risk',
        'medium',
        'high',
        16,
        'The hiring or apply domain appears newly registered, which increases impersonation risk.',
        item?.type || 'Domain Age',
      ))
    }

    if (sourceType === 'domain' && type.includes('recruiter domain') && trustLevel === 'risk') {
      addUnique(output, signal(
        'domain.recruiter_mismatch',
        'contact',
        'risk',
        'high',
        'high',
        18,
        'The recruiter contact domain does not match the verified company or apply domain.',
        item?.type || 'Recruiter Domain Check',
      ))
    }

    if (sourceType === 'threat intel' && trustLevel === 'risk') {
      addUnique(output, signal(
        'threat.known_bad_url',
        'evidence',
        'risk',
        'high',
        'high',
        26,
        'A submitted URL matched known phishing, malware, social-engineering, or abuse intelligence.',
        item?.type || 'Known Threat Check',
      ))
    }

    if (sourceType === 'domain' && type.includes('domain mismatch') && trustLevel === 'risk') {
      addUnique(output, signal(
        'domain.apply_mismatch',
        'entity',
        'risk',
        'high',
        'high',
        20,
        'The submitted apply domain does not match the expected official company or reputable apply path.',
        item?.type || 'Domain Mismatch',
      ))
    }

    if (sourceType === 'domain' && type.includes('domain mismatch') && trustLevel !== 'risk' && /\b(match|matches|official)\b/.test(text)) {
      addUnique(output, signal(
        'domain.apply_official',
        'source',
        'trust',
        'medium',
        'high',
        -10,
        'The submitted apply domain matches the verified company or official hiring domain.',
        item?.type || 'Apply Domain Check',
      ))
    }

    if (type.includes('screenshot ocr unavailable')) {
      addUnique(output, signal(
        'screenshot.ocr_unavailable',
        'evidence',
        'risk',
        'low',
        'high',
        8,
        'Screenshot text could not be extracted, so image-only audit confidence is lower.',
        'Screenshot OCR',
      ))
    }

    if (type.includes('screenshot ocr') && !type.includes('unavailable')) {
      const usedGoogleVision = source.includes('google vision')
      addUnique(output, signal(
        usedGoogleVision ? 'screenshot.ocr_google_vision' : 'screenshot.ocr_fallback',
        'evidence',
        'trust',
        'low',
        usedGoogleVision ? 'high' : 'medium',
        usedGoogleVision ? -4 : -2,
        usedGoogleVision
          ? 'Screenshot text was extracted with Google Vision OCR and included in the audit.'
          : 'Screenshot text was extracted with fallback OCR and included in the audit.',
        'Screenshot OCR',
      ))
    }

    if (type.includes('apply path mismatch')) {
      addUnique(output, signal(
        'entity.apply_path_mismatch',
        'entity',
        'risk',
        'high',
        'high',
        18,
        'The submitted application path does not match the expected official or reputable apply path.',
        'Apply Path Mismatch',
      ))
    }

    if (sourceType !== 'domain' && type.includes('domain age') && /\b(newly registered|very new|registered 2026|registered 2027)\b/.test(text)) {
      addUnique(output, signal(
        'domain.newly_registered',
        'entity',
        'risk',
        'high',
        'high',
        18,
        'The apply, recruiter, or linked domain appears newly registered and needs stronger verification.',
        'Domain Age',
      ))
    }

    if (type.includes('domain age') && !text.includes('risk signal') && /\bregistered\b/.test(text)) {
      addUnique(output, signal(
        'domain.established_registration',
        'entity',
        'trust',
        'low',
        'medium',
        -4,
        'Domain registry evidence exists for the submitted domain, but age alone does not prove the job is safe.',
        'Domain Age',
      ))
    }

    if (sourceType !== 'domain' && type.includes('domain mismatch')) {
      const isTrust = text.includes('trust signal') || text.includes('matches the official') || text.includes('recognized job board')
      addUnique(output, signal(
        isTrust ? 'domain.apply_official' : 'domain.apply_mismatch',
        'entity',
        isTrust ? 'trust' : 'risk',
        isTrust ? 'medium' : 'high',
        'high',
        isTrust ? -10 : 20,
        isTrust
          ? 'The submitted apply domain matches the official company root or a recognized job board/ATS.'
          : 'The submitted apply domain does not match the expected official company or reputable apply path.',
        'Domain Mismatch',
      ))
    }

    if (sourceType !== 'domain' && type.includes('recruiter domain check')) {
      const isTrust = text.includes('trust signal') || text.includes('matches official')
      const freeMail = text.includes('free mail') || text.includes('free-mail')
      addUnique(output, signal(
        isTrust ? 'domain.recruiter_official' : freeMail ? 'domain.recruiter_free_mail' : 'domain.recruiter_mismatch',
        'entity',
        isTrust ? 'trust' : 'risk',
        isTrust ? 'medium' : freeMail ? 'medium' : 'high',
        'high',
        isTrust ? -8 : freeMail ? 12 : 18,
        isTrust
          ? 'The recruiter email domain matches the official company root.'
          : freeMail
            ? 'The recruiter uses a free-mail address instead of a company-controlled domain.'
            : 'The recruiter email domain does not match the official company root.',
        'Recruiter Domain Check',
      ))
    }

    if (type.includes('dns liveness') && (text.includes('mail records no') || text.includes('did not return common'))) {
      addUnique(output, signal(
        'domain.no_custom_mail_dns',
        'entity',
        'risk',
        'medium',
        'medium',
        8,
        'The checked domain did not show mail DNS records, which weakens recruiter-domain trust for custom email claims.',
        'DNS Liveness',
      ))
    }

    if (type.includes('certificate transparency') && /\b(very recent|new certificate|risk signal)\b/.test(text)) {
      addUnique(output, signal(
        'domain.recent_certificate',
        'entity',
        'risk',
        'medium',
        'medium',
        10,
        'Certificate transparency evidence shows very recent certificate activity for a submitted domain.',
        'Certificate Transparency',
      ))
    }

    if (sourceType !== 'threat intel' && type.includes('known phishing check') && /\b(risk signal|known|phishing|malware|social engineering|urlhaus|phishtank)\b/.test(text)) {
      addUnique(output, signal(
        'threat.known_bad_url',
        'evidence',
        'risk',
        'high',
        'high',
        35,
        'A submitted URL or domain matched a known phishing, malware, or social-engineering intelligence source.',
        'Known Phishing Check',
      ))
    }

    if (type.includes('company registry') && /\b(active|registry match)\b/.test(text) && !text.includes('inactive')) {
      addUnique(output, signal(
        'registry.active_company_match',
        'entity',
        'trust',
        'medium',
        'medium',
        -8,
        'Company registry evidence contains an active company match, but it should still be compared against the job domain and recruiter path.',
        'Company Registry',
      ))
    }

    if (type.includes('input conflict')) {
      addUnique(output, signal(
        'entity.input_conflict',
        'entity',
        'risk',
        'medium',
        'high',
        16,
        'The submitted text conflicts with the resolved public job page.',
        'Input Conflict',
      ))
    }

    if (canUseGenericNegativeReputation(item, sourceType, type, source) && hasUnnegatedTerm(text, REPUTATION_RISK_TERMS)) {
      addUnique(output, signal(
        'evidence.negative_reputation',
        'evidence',
        'risk',
        'high',
        'medium',
        14,
        'External evidence contains scam, fraud, fake, impersonation, warning, or mismatch language.',
        item?.type || 'Reputation',
      ))
    }

    if (tokens.length > 0 && tokens.some((token) => text.includes(token)) && type.includes('company')) {
      addUnique(output, signal(
        'entity.company_evidence_match',
        'entity',
        'trust',
        'medium',
        'medium',
        -5,
        'Company evidence contains tokens matching the extracted company.',
        item?.type || 'Company Check',
      ))
    }
  }
}

function buildLegacyFlagSignals(redFlags, greenFlags, output) {
  for (const flag of Array.isArray(redFlags) ? redFlags : []) {
    const text = normalize(flag)
    if (!text) continue

    let weight = 8
    let severity = 'medium'
    if (hasAny(text, ['payment', 'fee', 'unrealistic'])) {
      weight = 24
      severity = 'high'
    } else if (hasAny(text, ['telegram', 'whatsapp', 'interview', 'company', 'mismatch'])) {
      weight = 14
    }

    addUnique(output, signal(
      `legacy.risk.${text.slice(0, 48).replace(/\s+/g, '_')}`,
      'integrity',
      'risk',
      severity,
      'medium',
      weight,
      String(flag),
      'Risk Flag',
    ))
  }

  for (const flag of Array.isArray(greenFlags) ? greenFlags : []) {
    const text = normalize(flag)
    if (!text) continue

    let weight = -5
    if (hasAny(text, ['verified', 'official', 'professional', 'legitimate'])) weight = -9

    addUnique(output, signal(
      `legacy.trust.${text.slice(0, 48).replace(/\s+/g, '_')}`,
      'integrity',
      'trust',
      'low',
      'medium',
      weight,
      String(flag),
      'Trust Flag',
    ))
  }
}

export function buildAuditSignals(extractedClaims, redFlags = [], greenFlags = [], evidence = []) {
  const output = []
  buildContactSignals(extractedClaims, output)
  buildProcessSignals(extractedClaims, output)
  buildSalarySignals(extractedClaims, output)
  buildClaimCompletenessSignals(extractedClaims, output)
  buildContractorSignals(extractedClaims, evidence, output)
  buildEvidenceSignals(extractedClaims, evidence, output)
  buildLegacyFlagSignals(redFlags, greenFlags, output)
  return output
}

// Confidence-aware scoring: a signal's contribution scales with how confident the
// engine is in the underlying detection. High-confidence signals count fully;
// low-confidence signals are heavily discounted.
const CONFIDENCE_MULTIPLIER = { high: 1, medium: 0.85, low: 0.6 }

/**
 * @param {{ id?: string, weight?: number, confidence?: string }} item
 * @param {Record<string, number>} [weightOverrides]
 * @returns {number}
 */
export function effectiveSignalWeight(item, weightOverrides) {
  const override = weightOverrides && typeof weightOverrides[item?.id] === 'number' && Number.isFinite(weightOverrides[item.id])
    ? weightOverrides[item.id]
    : undefined
  const weight = typeof override === 'number' ? override : Number(item?.weight || 0)
  const multiplier = CONFIDENCE_MULTIPLIER[item?.confidence] ?? CONFIDENCE_MULTIPLIER.medium
  return weight * multiplier
}

/**
 * Ordered, auditable account of how the base score is computed: baseline, one step
 * per signal (confidence-scaled delta), then every pattern floor/ceiling that binds,
 * then final rounding/clamping. The sum of all deltas equals the returned score
 * exactly — scoreAuditSignals delegates here so trace and score can never diverge.
 *
 * @param {Array<object>} signals
 * @param {Array<object>} [evidence]
 * @param {Record<string, number>} [weightOverrides]
 * @returns {{ score: number, trace: Array<{ step: string, delta: number, scoreAfter: number, reason: string, signalId?: string }> }}
 */
export function traceAuditSignals(signals, evidence = [], weightOverrides = undefined) {
  const safeSignals = Array.isArray(signals) ? signals : []
  const trace = []
  let running = 0

  const push = (step, delta, reason, signalId) => {
    running += delta
    const item = {
      step,
      delta: Number(delta.toFixed(2)),
      scoreAfter: Number(Math.max(0, Math.min(100, running)).toFixed(2)),
      reason,
    }
    if (signalId) item.signalId = signalId
    trace.push(item)
  }

  push('Baseline', 25, 'Every audit starts from a cautious baseline of 25.')

  for (const item of safeSignals) {
    const delta = effectiveSignalWeight(item, weightOverrides)
    push(
      item.direction === 'trust' ? `Trust: ${item.evidenceType || item.id}` : `Risk: ${item.evidenceType || item.id}`,
      delta,
      String(item.explanation || ''),
      item.id,
    )
  }

  const ids = new Set(safeSignals.map((item) => item.id))
  const evidenceCount = Array.isArray(evidence) ? evidence.length : 0
  const floor = (minimum, step, reason) => {
    if (running < minimum) push(step, minimum - running, reason)
  }
  const ceiling = (maximum, step, reason) => {
    if (running > maximum) push(step, maximum - running, reason)
  }

  const hasOffPlatformContactSignal = (
    ids.has('contact.telegram_only') || ids.has('contact.whatsapp_only') ||
    ids.has('contact.viber_only') || ids.has('contact.off_platform_messaging')
  )
  const hasCriticalScamPattern = (
    ids.has('salary.implausible_weekly_entry_role') &&
    hasOffPlatformContactSignal &&
    ids.has('process.no_interview')
  )

  // Hard financial/identity-loss vectors: money-mule, crypto funding, and credential
  // harvesting are scams regardless of anything else in the post.
  if (ids.has('process.money_mule') || ids.has('process.crypto_deposit') || ids.has('process.credential_harvest')) {
    floor(80, 'Financial/identity-vector floor', 'Money-mule, crypto-funding, or credential-harvesting patterns are direct-loss scams.')
  }
  // Buy-to-work (materials / gift cards / samples) is a pure-loss scam pattern that
  // legitimate employment never uses — force high-risk unconditionally.
  if (ids.has('process.buy_to_work')) {
    floor(65, 'Buy-to-work floor', 'Requiring the applicant to buy materials, kits, or gift cards to work is a purchase scam.')
  }
  // Upfront fee/deposit forces high-risk only with a scam co-signal (unverifiable
  // company / off-platform / no interview); a named business charging a franchise or
  // reseller fee keeps only the +26 signal weight (caution) rather than being floored.
  const hasAdvanceFeeCoSignal = ids.has('entity.company_unknown') || hasOffPlatformContactSignal || ids.has('process.no_interview')
  if (ids.has('process.upfront_payment') && hasAdvanceFeeCoSignal) {
    floor(65, 'Advance-fee floor', 'An upfront fee or deposit demand with a scam co-signal is a financial-loss scam pattern.')
  }
  if (hasCriticalScamPattern) floor(80, 'Critical scam-pattern floor', 'Implausible weekly pay + off-platform contact + no interview is the canonical job-scam bundle.')
  if (hasOffPlatformContactSignal && ids.has('process.no_interview')) {
    floor(65, 'Off-platform no-vetting floor', 'Off-platform contact combined with a no-interview flow forces a high-risk verdict.')
  }
  if (ids.has('entity.apply_path_mismatch') || ids.has('domain.apply_mismatch') || ids.has('entity.input_conflict')) {
    floor(45, 'Mismatch floor', 'Apply-path mismatch or submitted-text conflict keeps the report in caution territory or above.')
  }
  if (ids.has('entity.company_unknown') && evidenceCount < 2) {
    floor(40, 'Unverifiable-company floor', 'An unverifiable company with almost no evidence cannot be rated safe.')
  }
  if (ids.has('contractor.variable_hours_caution')) {
    floor(35, 'Contractor-disclosure floor', 'Disclosed contractor/variable-hours work should be presented as caution, not certified safe.')
  }

  if (
    ids.has('source.official_match') &&
    ids.has('contact.professional_apply_path') &&
    !ids.has('entity.apply_path_mismatch') &&
    !ids.has('entity.input_conflict') &&
    !ids.has('evidence.negative_reputation') &&
    !hasOffPlatformContactSignal &&
    !ids.has('contractor.variable_hours_caution')
  ) {
    ceiling(30, 'Official-surface ceiling', 'Official company presence with a professional apply path and no conflicts caps the score in the safe band.')
  } else if (
    ids.has('source.reputable_job_board') &&
    ids.has('contact.professional_apply_path') &&
    !ids.has('entity.apply_path_mismatch') &&
    !ids.has('entity.input_conflict') &&
    !ids.has('contractor.variable_hours_caution')
  ) {
    ceiling(45, 'Reputable-board ceiling', 'Reputable job-board sourcing with a professional apply path caps the score at the low-caution boundary.')
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(running)))
  if (finalScore !== Number(running.toFixed(2))) {
    push('Round & clamp', finalScore - running, 'Final score is rounded and clamped to the 0-100 range.')
  }

  return { score: finalScore, trace }
}

/**
 * @param {Array<object>} signals
 * @param {Array<object>} [evidence]
 * @param {Record<string, number>} [weightOverrides]
 * @returns {number}
 */
export function scoreAuditSignals(signals, evidence = [], weightOverrides = undefined) {
  return traceAuditSignals(signals, evidence, weightOverrides).score
}

export function strongestRiskSignals(signals, limit = 3) {
  return (Array.isArray(signals) ? signals : [])
    .filter((item) => item.direction === 'risk')
    .sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0))
    .slice(0, limit)
}

export function strongestTrustSignals(signals, limit = 3) {
  return (Array.isArray(signals) ? signals : [])
    .filter((item) => item.direction === 'trust')
    .sort((a, b) => Number(a.weight || 0) - Number(b.weight || 0))
    .slice(0, limit)
}
