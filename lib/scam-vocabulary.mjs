/**
 * Shared scam-detection vocabulary + text-normalization/matcher primitives.
 *
 * Single source of truth for the deterministic scoring engine. Consumed by BOTH
 * lib/audit-signals.mjs and lib/intelligence-v2.ts, which previously each kept a
 * byte-identical private copy of every constant and helper here (an ongoing drift
 * hazard — a scam-vocabulary edit had to be duplicated in two files, and the
 * careers@ apply-path bug existed in two layers for the same reason).
 *
 * Everything is exported so either layer can import exactly what it references.
 * Pure functions, no side effects, no I/O.
 */

// Cyrillic/Greek/misc look-alikes -> Latin, so homoglyph evasion ("tеlegram" with a
// Cyrillic е) folds to the real keyword. NFKC (applied in normalize) already folds
// fullwidth/compatibility forms; this map covers cross-script confusables NFKC keeps.
export const CONFUSABLE_MAP = {
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'ѕ': 's', 'і': 'i', 'ј': 'j',
  'к': 'k', 'н': 'h', 'в': 'b', 'т': 't', 'м': 'm', 'ո': 'n', 'ԁ': 'd', 'ԛ': 'q', 'ѡ': 'w', 'г': 'r',
  'α': 'a', 'ο': 'o', 'ρ': 'p', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ν': 'v', 'τ': 't', 'υ': 'u', 'χ': 'x',
  'β': 'b', 'η': 'n', 'μ': 'm', 'ϲ': 'c', 'ⅼ': 'l', 'ⅰ': 'i', '，': ',', '．': '.', '；': ';',
}
export const CONFUSABLE_RE = new RegExp(`[${Object.keys(CONFUSABLE_MAP).join('')}]`, 'g')

// Emoji / pictographs / variation selectors are DELETED (not spaced), so an emoji planted
// mid-keyword ("Tele😀gram") rejoins into the real keyword instead of splitting it.
export const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}️™ℹ⌨⏏Ⓜ]/gu

export function foldConfusables(value) {
  return String(value || '')
    .replace(/[​-‍﻿⁠­]/g, '') // zero-width + soft hyphen
    .replace(EMOJI_RE, '')
    .replace(CONFUSABLE_RE, (ch) => CONFUSABLE_MAP[ch] || ch)
}

// Leetspeak fold for digits that sit ADJACENT to a letter ("Te1egram", "f33",
// "registrati0n"). Pure number runs (salary amounts) have no letter neighbour and are
// left untouched, so "$80,000 per week" and "Web3" salaries survive. Applied only in the
// keyword-matching normalizers, never to amount parsing.
export const LEET_MAP = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't' }
export function leetFold(value) {
  let text = String(value || '')
  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false
    const next = text.replace(/[013457]/g, (digit, index, source) => {
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

// Double-negation affirmers: phrases that flip an inner negation back to an affirmation
// ("it is not the case that we do not require a charge" = we DO require it).
export const DOUBLE_NEG_AFFIRMER_RE = /\b(?:not the case that|cannot deny|can not deny|no one can deny|it is false that|never fail(?:s)? to)\b/i

// Strip combining diacritics so accented non-English matches ("inscripción" ->
// "inscripcion", "entretien" unaffected, "démarrage" -> "demarrage").
export function stripDiacritics(value) {
  return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// NFKC-composed, lowercased view that KEEPS non-ASCII scripts intact for multilingual
// idiom matching. It must NOT fold confusables (which would Latinize Cyrillic needles
// like 'телеграм') nor NFD-strip diacritics (which would decompose precomposed Hangul
// like '가입비' into jamo). NFKC composes fullwidth/compatibility forms and leaves
// CJK/Hangul/Arabic/Cyrillic precomposed so the literal needles can match.
export function rawFolded(value) {
  return String(value || '').normalize('NFKC').toLowerCase()
}

export function hasRawPhrase(value, phrases) {
  const text = rawFolded(value)
  return phrases.some((phrase) => text.includes(phrase))
}

export function normalize(value) {
  return stripDiacritics(foldConfusables(leetFold(collapseSpacedLetters(String(value || '').normalize('NFKC')))))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasAny(value, terms) {
  const text = normalize(value)
  return terms.some((term) => text.includes(term))
}

// Token-boundary phrase match on normalized text: ' t me ' matches "t.me/handle"
// but never the inside of "don't message" ('don t message').
export function hasTokenPhrase(value, phrase) {
  return ` ${normalize(value)} `.includes(` ${phrase} `)
}

export const NEGATION_TOKENS = new Set([
  'no', 'never', 'not', 'without', 'dont', 'doesnt', 'wont', 'zero', 'beware', 'avoid', 'nor', 'none',
  // Multilingual negations (diacritics already folded): fr, es, pt, it, id, hi, de
  'ne', 'pas', 'jamais', 'aucun', 'aucune', 'sans', 'nunca', 'ningun', 'ninguna', 'sin', 'nao', 'nenhum', 'sem',
  'tidak', 'tanpa', 'jangan', 'nahi', 'bina', 'kein', 'keine', 'nie', 'niemals',
])

// Strong coercion markers turn a "negated" clause back into a demand: "you CANNOT start
// without the training fee", "you MUST pay before onboarding". These never appear in a
// genuine "we never charge a fee" disclaimer (which uses ask/charge/require, not
// cannot/must), so they safely override a negation in the same clause.
export const COERCION_TOKENS = new Set([
  'cannot', 'unable', 'must', 'mandatory', 'obligatory', 'compulsory',
])

// Collapse letter-spaced evasion ("t-e-l-e-g-r-a-m", "r e g i s t r a t i o n") — a run
// of 3+ single alphanumerics joined by spaces/separators becomes one token.
export function collapseSpacedLetters(value) {
  return String(value || '').replace(/\b(?:[a-z0-9][ .\-_]){3,}[a-z0-9]\b/gi, (m) => m.replace(/[ .\-_]/g, ''))
}

// Tokenize with clause-boundary markers ('cbrk'). Sentence punctuation, dashes, and
// contrastive conjunctions end a negation's scope so a benign negation in one clause
// cannot suppress a risk term in the next ("we never charge a fee, but pay the deposit").
// The period inside "t.me" is NOT a boundary (only '.' followed by space/end is).
export function tokenizeWithBoundaries(value) {
  const marked = stripDiacritics(foldConfusables(leetFold(collapseSpacedLetters(String(value || '').normalize('NFKC')))))
    .toLowerCase()
    .replace(/[,;:!?]+|\.(?=\s|$)|\s[-–—/]\s|\b(?:but|however|though|although|yet|whereas|nevertheless)\b/g, ' cbrk ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return marked ? marked.split(' ') : []
}

// True when any term appears in a clause WITHOUT a governing negation. A negation's scope
// stops at clause boundaries, and a coercion marker in the same clause ("cannot start
// without the fee", "you must pay") overrides the negation. This fires weaponized
// negation ("beware of scams, pay the activation fee") and coercive preconditions while
// keeping genuine disclaimers ("we never ask for a fee") silent.
export function hasUnnegatedTerm(value, terms) {
  const tokens = tokenizeWithBoundaries(value)
  // A double-negation affirmer anywhere re-affirms an inner negation, so treat it as a
  // coercion for this whole value ("not the case that we do not require a charge").
  const globalCoerce = DOUBLE_NEG_AFFIRMER_RE.test(String(value || ''))
  for (const term of terms) {
    const parts = term.split(' ')
    for (let i = 0; i + parts.length <= tokens.length; i += 1) {
      if (!parts.every((part, k) => tokens[i + k] === part)) continue
      // Scan the WHOLE enclosing clause (both directions to a boundary) for negation
      // and coercion — don't stop at the first negation, or a coercion marker further
      // out ("cannot ... without ... fee") would be missed.
      // Negation only governs from BEFORE the term (a 'no' after it — e.g. "whatsapp,
      // no interview" — must not suppress it). Coercion markers count in either
      // direction ("cannot start without the fee" / "the fee is mandatory").
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

// Off-official channels that are unambiguous recruitment pivots on bare mention (no
// legitimate job posts its hiring on these, and they are not common work tools).
export const OFF_PLATFORM_UNAMBIGUOUS = [
  'linktree', 'linktr ee', 'wickr', 'threema', 'session app', 'snapchat', 'snap chat', 'weixin',
  'signal app', 'signal messenger', 'kakaotalk',
]

// Channels that are ALSO legitimate work/collab tools (Discord, Skype, Slack-adjacent) or
// job duties ("manage Instagram DMs"). These only count as an off-platform pivot when a
// recruitment-pivot verb sits near the channel name.
export const OFF_PLATFORM_AMBIGUOUS = [
  'discord', 'skype', 'hangouts', 'google chat', 'gchat', 'wechat', 'we chat', 'kakao',
  'signal', 'line', 'instagram dm', 'ig dm', 'facebook messenger', 'fb messenger', 'messenger',
]
export const OFF_PLATFORM_PIVOT_VERBS = new Set([
  'message', 'messages', 'msg', 'contact', 'add', 'dm', 'dms', 'reach', 'apply', 'applying', 'chat',
  'ping', 'connect', 'join', 'inbox', 'pm', 'hmu', 'text', 'write', 'talk', 'find', 'reply',
])

// Non-Latin channel idioms (matched on the raw NFKC string).
export const OFF_PLATFORM_RAW_TERMS = ['微信', '加微信', '电报', '텔레그램', '왓츠앱', 'ватсап', 'телеграм', 'واتساب', 'تلغرام']

// fee/charge variants scammers rotate through (incl. the "cost" evasion and
// Spanish/Portuguese/French/Bahasa/Hinglish equivalents), plus deposit phrasings.
export const UPFRONT_PAYMENT_TERMS = [
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
  // German / Italian / Tagalog (diacritics folded: gebühr -> gebuhr)
  'bearbeitungsgebuhr', 'schulungsgebuhr', 'anmeldegebuhr', 'vermittlungsgebuhr', 'kaution',
  'quota di iscrizione', 'tassa di formazione', 'quota di adesione', 'cauzione',
  'bayad sa registration', 'bayad sa training', 'registration bayad', 'training bayad', 'pambayad sa',
]

// CJK / Cyrillic / Arabic / Thai fee & no-vetting idioms (matched on the raw NFKC string,
// since the ASCII normalizer erases these scripts entirely).
export const UPFRONT_PAYMENT_RAW_TERMS = [
  '报名费', '培训费', '押金', '保证金', '会费', '工本费', '服务费', '手续费', '注册费', '가입비', '보증금', '수수료',
  'регистрационный взнос', 'взнос', 'залог', 'плата за обучение', 'предоплата',
  'رسوم التسجيل', 'رسوم التدريب', 'رسوم', 'عربون',
  'ค่าสมัคร', 'ค่าธรรมเนียม', 'ค่าลงทะเบียน', 'ค่าฝึกอบรม', 'เงินมัดจำ',
]
export const NO_VETTING_RAW_TERMS = [
  '无需面试', '免面试', '无面试', '不需要面试', '面接なし', '면접 없이', '면접없이',
  'без собеседования', 'بدون مقابلة', 'ไม่ต้องสัมภาษณ์',
]

// "No interview" in every phrasing scammers use, incl. Taglish and other languages.
export const NO_VETTING_TERMS = [
  'no interview', 'without interview', 'skip interview', 'no exam', 'no screening', 'no assessment',
  'walang interview', 'walang exam',
  'sin entrevista', 'sem entrevista', 'sans entretien', 'tanpa wawancara', 'senza colloquio', 'ohne vorstellungsgesprach',
  'koi interview nahi', 'bina interview', 'interview nahi',
]

// Inbound-money / package-mule laundering patterns: money flows TO the applicant to
// redistribute, or goods are reshipped. A hard financial/laundering vector.
export const MONEY_MULE_TERMS = [
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
export const CRYPTO_DEPOSIT_TERMS = [
  'deposit usdt', 'deposit btc', 'deposit eth', 'deposit crypto', 'load usdt', 'fund your wallet', 'fund the wallet',
  'company wallet', 'company trading', 'trading platform to activate', 'crypto deposit', 'deposit into the platform',
  'top up your account with', 'recharge your account with', 'deposit to your trading',
]

// Article/synonym-tolerant fallbacks so "buy the parts kit", "buy prepaid cards", and "top up
// your wallet with USDT" fire even when the exact bigram is not listed. Run on normalize() output.
export const BUY_TO_WORK_RE = /\b(?:buy|purchase|pay for|order)\b(?:\s+\w+){0,3}\s+(?:material|materials|kit|kits|sample|samples|supply|supplies|inventory|equipment|gift card|gift cards|prepaid card|prepaid cards|prepaid voucher|voucher|vouchers|starter pack|starter kit|assembly)\b/
export const CRYPTO_DEPOSIT_RE = /\b(?:deposit|fund|load|top up|recharge|send|transfer|pay|preload)\b(?:\s+\w+){0,4}\s+(?:usdt|usdc|btc|eth|bnb|trx|crypto|bitcoin|ethereum|tether|wallet|trading platform|trading account)\b/
export const MONEY_MULE_RE = /\b(?:deposit|cash|receive)\b(?:\s+\w+){0,4}\s+check\b(?:\s+\w+){0,8}\s+(?:wire|transfer|send|forward|western union|moneygram)\b|\b(?:reship|re ship|reshipping|forward|receive)\b(?:\s+\w+){0,3}\s+(?:package|packages|parcel|parcels)\b/

// Buy-to-work: the applicant must purchase materials/kits/gift cards before earning.
export const BUY_TO_WORK_TERMS = [
  'buy your', 'purchase your', 'buy the materials', 'buy materials', 'purchase materials', 'buy your materials',
  'buy samples', 'purchase samples', 'buy gift cards', 'purchase gift cards', 'buy promotional', 'purchase promotional',
  'assembly kit', 'sample kit', 'inventory purchase', 'buy inventory', 'buy equipment first', 'purchase the starter',
]

// Credential/identity harvesting before any hire.
export const CREDENTIAL_HARVEST_TERMS = [
  'social security number', 'ssn and', 'your ssn', 'bank login', 'online banking username', 'online banking password',
  'banking username', 'banking password', 'account password', 'card pin', 'debit card pin', 'one time password', 'otp code',
  'photo of your id holding', 'selfie holding your id', 'selfie with your id', 'routing number and account number',
  'mother maiden name and', 'full card number and cvv',
]
