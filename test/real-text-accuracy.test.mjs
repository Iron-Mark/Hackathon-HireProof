import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { loadScoringStack } from './helpers/load-scoring-stack.mjs'
import { evaluate, computeMetrics, isRunOnCompany } from '../scripts/eval-real-text.mjs'
import { extractClaimsFromText } from '../lib/claim-extraction.mjs'

const baseline = JSON.parse(
  await fs.readFile(new URL('./fixtures/real-text-baseline.json', import.meta.url), 'utf8'),
)

test('real-text offline verdict accuracy does not regress below the recorded baseline', async () => {
  const stack = await loadScoringStack()
  const metrics = computeMetrics(evaluate(stack))
  // Compare at the baseline's recorded precision (4 dp) so rounding can't trip the gate.
  const macroF1 = Number(metrics.macroF1.toFixed(4))
  assert.ok(
    macroF1 >= baseline.macroF1 - 1e-9,
    `macro-F1 ${macroF1} regressed below baseline ${baseline.macroF1}`,
  )
  assert.ok(metrics.count >= 24, 'real-text corpus should have at least 24 cases')
})

test('claim extraction produces no run-on company names across the real-text corpus', async () => {
  const stack = await loadScoringStack()
  const results = evaluate(stack)
  const runOns = results.filter((r) => r.runOn)
  assert.equal(runOns.length, 0, `run-on company extractions: ${runOns.map((r) => `${r.id}="${r.company}"`).join(', ')}`)
  assert.equal(baseline.runOnCompanyCount, 0)
})

test('the reproduced production misfire extracts a bounded company, not a run-on clause', () => {
  // The exact production case: a scam clause after "with" must not be swallowed as a company.
  const scam = extractClaimsFromText({
    text: 'Buy a $200 starter kit with Google Play gift cards and message us on WhatsApp.',
  })
  assert.ok(!isRunOnCompany(scam.company), `still a run-on company: "${scam.company}"`)
  assert.ok(scam.company.split(/\s+/).filter(Boolean).length <= 4)

  // A legit multi-word company name still extracts correctly.
  const legit = extractClaimsFromText({
    text: 'This role is with Bright Path Staffing and applications are reviewed weekly.',
  })
  assert.equal(legit.company, 'Bright Path Staffing')

  // A single-word company followed by a sentence boundary is unaffected.
  const single = extractClaimsFromText({ text: 'Frontend Engineer at Vercel. Apply now.' })
  assert.equal(single.company, 'Vercel')

  // A connector-joined name ("Bank of America") is preserved.
  const connector = extractClaimsFromText({ text: 'Great role with Bank of America is hiring analysts.' })
  assert.equal(connector.company, 'Bank Of America')
})
