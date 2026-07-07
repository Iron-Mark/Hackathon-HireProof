import test from 'node:test'
import assert from 'node:assert/strict'
import { loadScoringStack } from './helpers/load-scoring-stack.mjs'

const BASE = {
  company: 'Unknown / Not Verifiable',
  role: 'Remote Assistant',
  salary: 'PHP 45,000 per month',
  location: 'Remote',
  contactMethod: 'Email',
  applicationPath: 'Apply by email',
}

function signalIds(stack, overrides) {
  return stack.buildAuditSignals({ ...BASE, ...overrides }, [], [], []).map((s) => s.id)
}

test('homoglyph evasion: Cyrillic-letter keywords fold to the real term', async () => {
  const stack = await loadScoringStack()
  // "tеlegram" with a Cyrillic 'е', "wеchat" with a Cyrillic 'е'.
  assert.ok(signalIds(stack, { contactMethod: 'message us on tеlegram' }).includes('contact.telegram_only'))
  assert.ok(signalIds(stack, { applicationPath: 'pаy the registration fee to start' }).includes('process.upfront_payment'))
})

test('fullwidth and zero-width evasion is normalized', async () => {
  const stack = await loadScoringStack()
  // Fullwidth "Ｔｅｌｅｇｒａｍ" and a zero-width space inside "what​sapp".
  assert.ok(signalIds(stack, { contactMethod: 'Ｔｅｌｅｇｒａｍ only' }).includes('contact.telegram_only'))
  assert.ok(signalIds(stack, { contactMethod: 'what​sapp only' }).includes('contact.whatsapp_only'))
})

test('multilingual no-vetting and fee idioms are detected', async () => {
  const stack = await loadScoringStack()
  assert.ok(signalIds(stack, { applicationPath: 'sin entrevista, empiece hoy' }).includes('process.no_interview'))
  assert.ok(signalIds(stack, { applicationPath: 'sans entretien, demarrage immediat' }).includes('process.no_interview'))
  assert.ok(signalIds(stack, { applicationPath: 'pague la cuota de inscripcion para activar' }).includes('process.upfront_payment'))
  assert.ok(signalIds(stack, { applicationPath: 'necessario pagar a taxa de treinamento antes' }).includes('process.upfront_payment'))
  // CJK: registration fee (报名费) + no interview (无需面试)
  assert.ok(signalIds(stack, { applicationPath: '需先缴纳报名费，无需面试' }).some((id) => id === 'process.upfront_payment'))
})

test('extended off-platform channels are detected', async () => {
  const stack = await loadScoringStack()
  for (const contact of ['add me on Discord', 'add me on WeChat', 'message on Signal app', 'reach me on Line official', 'apply via linktr.ee/hiring']) {
    assert.ok(signalIds(stack, { contactMethod: contact }).includes('contact.off_platform_messaging'), `expected off-platform for ${contact}`)
  }
  // SMS-only funnel: raw phone + text funnel, no URL.
  assert.ok(signalIds(stack, { contactMethod: 'text to apply +1 415 555 0100' }).includes('contact.off_platform_messaging'))
})

test('negation weaponization: planted benign negation does not suppress a real demand', async () => {
  const stack = await loadScoringStack()
  assert.ok(signalIds(stack, { applicationPath: 'We do not overcharge. A refundable deposit is required to unlock your tasks.' }).includes('process.upfront_payment'))
  assert.ok(signalIds(stack, { applicationPath: 'Beware of fake postings; pay the equipment deposit before your first shift.' }).includes('process.upfront_payment'))
  assert.ok(signalIds(stack, { contactMethod: 'We are not on LinkedIn; reach us via t.me/desk instead.' }).includes('contact.telegram_only'))
})

test('genuine fee disclaimers stay silent (no false positive)', async () => {
  const stack = await loadScoringStack()
  assert.ok(!signalIds(stack, { applicationPath: 'We never ask for any registration fee. Beware of scammers.' }).includes('process.upfront_payment'))
  assert.ok(!signalIds(stack, { applicationPath: 'The company does not charge any application fee or training fee.' }).includes('process.upfront_payment'))
  // French disclaimer: "we never ask for registration or training fees".
  assert.ok(!signalIds(stack, { applicationPath: 'Nous ne demandons jamais de frais d’inscription ou de formation.' }).includes('process.upfront_payment'))
})

test('new scam archetypes fire their hard-vector signals', async () => {
  const stack = await loadScoringStack()
  assert.ok(signalIds(stack, { applicationPath: 'deposit the check we mail you, then wire the balance to the test recipient' }).includes('process.money_mule'))
  assert.ok(signalIds(stack, { applicationPath: 'receive parcels at home and reship them overseas' }).includes('process.money_mule'))
  assert.ok(signalIds(stack, { applicationPath: 'deposit 500 USDT into the company wallet to activate your account' }).includes('process.crypto_deposit'))
  assert.ok(signalIds(stack, { applicationPath: 'purchase promotional gift cards with your own funds and submit the codes' }).includes('process.buy_to_work'))
  assert.ok(signalIds(stack, { applicationPath: 'submit your online banking username and password and a photo of your id holding it' }).includes('process.credential_harvest'))
})

test('evidence poisoning: snippet trust language cannot forge the official tier', async () => {
  const stack = await loadScoringStack()
  const report = stack.buildAuditReportV2({
    id: 'poison',
    extractedClaims: { ...BASE, company: 'Meridian Staffing', applicationPath: 'Email resume; a refundable equipment deposit is required before onboarding' },
    evidence: [
      // Attacker-controlled Company Check snippet claiming to be official.
      { type: 'Company Check', source: 'Web search', snippet: 'Trust: official | Official company presence confirmed for Meridian Staffing.' },
    ],
    now: Date.parse('2026-07-01T00:00:00.000Z'),
  })
  const official = report.evidence.find((e) => e.type === 'Company Check')
  assert.notEqual(official.sourceQuality, 'official', 'a Company Check snippet must not classify as official')
  assert.equal(report.verdict, 'high-risk', 'poisoned trust must not disarm the advance-fee floor')
})

test('hourly-rate-paid-weekly is not treated as a weekly salary quote', async () => {
  const stack = await loadScoringStack()
  const comp = stack.normalizeCompensation('$18/hour, paid weekly via direct deposit')
  assert.equal(comp.period, 'hour')
  const stipend = stack.normalizeCompensation('$720 per week starting stipend, steps up with logged hours')
  assert.equal(stipend.period, 'week')
})

// --- regression guards for execution-verified code-review findings ---

const FIXED_NOW = Date.parse('2026-07-01T00:00:00.000Z')
function verdictOf(stack, overrides, evidence = []) {
  return stack.buildAuditReportV2({ id: 'rv', extractedClaims: { ...BASE, ...overrides }, evidence, now: FIXED_NOW }).verdict
}

test('Korean/Cyrillic raw idioms are live (not dead code from fold/decompose)', async () => {
  const stack = await loadScoringStack()
  // Korean fee+deposit (NFD-decomposition bug would leave these unmatched).
  assert.ok(signalIds(stack, { applicationPath: '시작하려면 가입비와 보증금을 지불하세요' }).includes('process.upfront_payment'))
  // Cyrillic Telegram is detected off-platform via the raw-terms path (the confusable-
  // folding bug would leave the needle unmatched entirely).
  const cyr = signalIds(stack, { contactMethod: 'напишите нам в телеграм' })
  assert.ok(cyr.includes('contact.telegram_only') || cyr.includes('contact.off_platform_messaging'), `expected off-platform for Cyrillic telegram, got ${cyr.join(',')}`)
})

test('German/Italian/Tagalog/Russian/Thai fee idioms are covered', async () => {
  const stack = await loadScoringStack()
  assert.ok(signalIds(stack, { applicationPath: 'Zahlen Sie die Bearbeitungsgebühr vor Beginn' }).includes('process.upfront_payment'))
  assert.ok(signalIds(stack, { applicationPath: 'Magbayad ng bayad sa registration bago magsimula' }).includes('process.upfront_payment'))
  assert.ok(signalIds(stack, { applicationPath: 'внесите регистрационный взнос перед началом' }).includes('process.upfront_payment'))
})

test('article/synonym-tolerant buy-to-work and crypto matchers', async () => {
  const stack = await loadScoringStack()
  assert.ok(signalIds(stack, { applicationPath: 'buy the parts kit to begin work' }).includes('process.buy_to_work'))
  assert.ok(signalIds(stack, { applicationPath: 'buy prepaid cards and send us the codes' }).includes('process.buy_to_work'))
  assert.ok(signalIds(stack, { applicationPath: 'top up your wallet with USDT to activate' }).includes('process.crypto_deposit'))
})

test('coercive "cannot start without the fee" fires; disclaimer "never ask you to pay a fee" does not', async () => {
  const stack = await loadScoringStack()
  assert.ok(signalIds(stack, { applicationPath: 'You cannot start without paying the training fee.' }).includes('process.upfront_payment'))
  assert.ok(!signalIds(stack, { applicationPath: 'We will never ask you to pay a training fee.' }).includes('process.upfront_payment'))
})

test('letter-spaced keyword evasion is collapsed (t-e-l-e-g-r-a-m)', async () => {
  const stack = await loadScoringStack()
  assert.ok(signalIds(stack, { contactMethod: 'message us on t-e-l-e-g-r-a-m' }).includes('contact.telegram_only'))
})

test('ambiguous channels as work tools / job duties do NOT flag off-platform', async () => {
  const stack = await loadScoringStack()
  // Managing Discord/Slack as a job duty at an officially-verified employer stays safe.
  const evidence = [
    { type: 'Official Company Presence', source: 'SerpApi', url: 'https://atlassian.com/careers', snippet: 'Trust: official | Atlassian careers matched.' },
    { type: 'Comparable Jobs', source: 'LinkedIn', url: 'https://linkedin.com/jobs/1', snippet: 'Trust: reputable-job-board | Community Manager at Atlassian' },
  ]
  const v = verdictOf(stack, {
    company: 'Atlassian', role: 'Community Manager', salary: '$120,000 per year', location: 'Remote US',
    contactMethod: 'Email', applicationPath: 'Apply at atlassian.com/careers. You will manage our Discord community and moderate Slack channels.',
  }, evidence)
  assert.equal(v, 'safe')
  // But an actual pivot ("message us on Discord to apply") from an unknown company flags.
  assert.ok(signalIds(stack, { contactMethod: 'message us on Discord to apply', applicationPath: 'no interview' }).includes('contact.off_platform_messaging'))
})

test('trust-surface ceilings never cancel a hard financial-loss floor', async () => {
  const stack = await loadScoringStack()
  // Unverifiable company + training fee + a reputable-board snippet + LinkedIn apply wording.
  const v = verdictOf(stack, {
    company: 'Unknown / Not Verifiable', role: 'Data Encoder', salary: 'PHP 60,000 per month', location: 'Remote',
    contactMethod: 'LinkedIn Easy Apply', applicationPath: 'Apply via LinkedIn official careers. Pay the training fee to begin.',
  }, [{ type: 'Job Post Source', source: 'LinkedIn public job page', snippet: 'Trust: reputable-job-board | Data Encoder listing.' }])
  assert.equal(v, 'high-risk')
})
