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
