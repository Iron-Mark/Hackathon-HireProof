#!/usr/bin/env node
/**
 * Real-pasted-text accuracy harness for HireProof's OFFLINE scoring path.
 *
 * For each raw post in test/fixtures/real-text-cases.mjs it runs the FULL offline pipeline:
 *   extractClaimsFromText(rawText)  ->  buildAuditReportV2(claims, evidence: [], fixed now)  ->  verdict
 * and reports:
 *   - confusion matrix + per-class precision/recall/F1 + macro-F1 (verdict accuracy)
 *   - EXTRACTION QUALITY: count of "run-on" company extractions (a proxy for the misfire class)
 *   - every misclassification and every run-on company, for inspection
 *
 * Unlike scripts/score-accuracy.mjs (which feeds pre-extracted claims), this exercises claim
 * extraction — the real failure surface — end to end.
 *
 * Usage:
 *   node scripts/eval-real-text.mjs                 # human-readable report
 *   node scripts/eval-real-text.mjs --json          # machine-readable metrics
 *   node scripts/eval-real-text.mjs --update-baseline
 *
 * Gate: exits non-zero if macro-F1 drops below, or run-on company count rises above, the recorded
 * baseline (test/fixtures/real-text-baseline.json). Intended for CI use.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { loadScoringStack } from '../test/helpers/load-scoring-stack.mjs'
import { FIXED_NOW } from '../test/fixtures/scoring-dataset.mjs'
import { REAL_TEXT_CASES } from '../test/fixtures/real-text-cases.mjs'
import { extractClaimsFromText } from '../lib/claim-extraction.mjs'

const VERDICTS = ['safe', 'caution', 'high-risk']
const BASELINE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'test', 'fixtures', 'real-text-baseline.json')

function pct(value) {
  return `${(value * 100).toFixed(1)}%`
}

function emptyMatrix() {
  const matrix = {}
  for (const expected of VERDICTS) {
    matrix[expected] = {}
    for (const predicted of VERDICTS) matrix[expected][predicted] = 0
  }
  return matrix
}

function classMetrics(matrix) {
  const perClass = {}
  let f1Sum = 0
  for (const cls of VERDICTS) {
    const tp = matrix[cls][cls]
    let fp = 0
    let fn = 0
    for (const other of VERDICTS) {
      if (other !== cls) {
        fp += matrix[other][cls]
        fn += matrix[cls][other]
      }
    }
    const support = VERDICTS.reduce((sum, predicted) => sum + matrix[cls][predicted], 0)
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
    perClass[cls] = { precision, recall, f1, support }
    f1Sum += f1
  }
  return { perClass, macroF1: f1Sum / VERDICTS.length }
}

/** A company extraction is "run-on" when it swallowed a clause instead of a proper-noun name. */
export function isRunOnCompany(company) {
  const value = String(company || '').trim()
  if (!value) return false
  if (/^unknown/i.test(value) || /not verifiable/i.test(value) || /not specified/i.test(value)) return false
  return value.split(/\s+/).filter(Boolean).length > 4
}

export function evaluate(stack) {
  const results = []
  for (const item of REAL_TEXT_CASES) {
    const claims = extractClaimsFromText({ text: item.text, url: item.url, location: item.location })
    const report = stack.buildAuditReportV2({
      id: `realtext_${item.id}`,
      extractedClaims: claims,
      evidence: [],
      rawText: item.text,
      now: FIXED_NOW,
    })
    results.push({
      id: item.id,
      archetype: item.archetype,
      expected: item.expected,
      predicted: report.verdict,
      score: report.riskScore,
      correct: report.verdict === item.expected,
      company: claims.company,
      runOn: isRunOnCompany(claims.company),
      rationale: item.rationale,
    })
  }
  return results
}

export function computeMetrics(results) {
  const matrix = emptyMatrix()
  for (const item of results) matrix[item.expected][item.predicted] += 1
  const { perClass, macroF1 } = classMetrics(matrix)
  const accuracy = results.length === 0 ? 0 : results.filter((item) => item.correct).length / results.length
  const runOnCompanyCount = results.filter((item) => item.runOn).length
  return { count: results.length, accuracy, macroF1, runOnCompanyCount, matrix, perClass }
}

function printReport(metrics, results) {
  console.log(`\n=== REAL-TEXT OFFLINE (n=${metrics.count}) — accuracy ${pct(metrics.accuracy)}, macro-F1 ${pct(metrics.macroF1)} ===`)
  const header = ['expected \\ got', ...VERDICTS].map((cell) => cell.padEnd(14)).join('')
  console.log(`  ${header}`)
  for (const expected of VERDICTS) {
    const row = [expected, ...VERDICTS.map((predicted) => String(metrics.matrix[expected][predicted]))]
      .map((cell) => cell.padEnd(14)).join('')
    console.log(`  ${row}`)
  }
  for (const cls of VERDICTS) {
    const { precision, recall, f1, support } = metrics.perClass[cls]
    console.log(`  ${cls.padEnd(10)} P ${pct(precision).padStart(6)}  R ${pct(recall).padStart(6)}  F1 ${pct(f1).padStart(6)}  (n=${support})`)
  }

  console.log(`\n=== EXTRACTION QUALITY — run-on company extractions: ${metrics.runOnCompanyCount} ===`)
  for (const item of results.filter((r) => r.runOn)) {
    console.log(`  [${item.id}] company="${item.company}"`)
  }

  const misses = results.filter((item) => !item.correct)
  console.log(`\n=== MISCLASSIFICATIONS (${misses.length}) ===`)
  for (const miss of misses) {
    console.log(`  [${miss.id}] expected ${miss.expected}, got ${miss.predicted} (score ${miss.score}) — company="${miss.company}"`)
    console.log(`    ${miss.rationale}`)
  }
}

async function readBaseline() {
  try {
    return JSON.parse(await fs.readFile(BASELINE_PATH, 'utf8'))
  } catch {
    return null
  }
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const stack = await loadScoringStack()
  const results = evaluate(stack)
  const metrics = computeMetrics(results)
  const summary = {
    count: metrics.count,
    accuracy: Number(metrics.accuracy.toFixed(4)),
    macroF1: Number(metrics.macroF1.toFixed(4)),
    runOnCompanyCount: metrics.runOnCompanyCount,
  }

  if (args.has('--update-baseline')) {
    await fs.writeFile(BASELINE_PATH, `${JSON.stringify(summary, null, 2)}\n`)
    console.log(`Baseline updated: ${JSON.stringify(summary)}`)
    return
  }

  if (args.has('--json')) {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    printReport(metrics, results)
    console.log(`\nSummary: ${JSON.stringify(summary)}`)
  }

  const baseline = await readBaseline()
  if (baseline) {
    const macroDrop = summary.macroF1 < baseline.macroF1 - 1e-9
    const runOnRose = summary.runOnCompanyCount > baseline.runOnCompanyCount
    if (macroDrop || runOnRose) {
      console.error(`\nGATE FAILED vs baseline ${JSON.stringify(baseline)}: ${macroDrop ? 'macro-F1 dropped ' : ''}${runOnRose ? 'run-on company count rose' : ''}`)
      process.exitCode = 1
    }
  }
}

// Only run the CLI when invoked directly, so the metric functions can be imported by the gate test.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
