#!/usr/bin/env node
/**
 * Accuracy harness for HireProof's local scoring engine.
 *
 * Runs the labeled dataset (test/fixtures/scoring-dataset.mjs) through the REAL
 * production scoring path (buildAuditReportV2, fixed `now`) and reports:
 *   - confusion matrix (overall + per split)
 *   - per-class precision / recall / F1 and macro-F1
 *   - every misclassification with its strongest trace steps
 *
 * Usage:
 *   node scripts/score-accuracy.mjs                  # human-readable report
 *   node scripts/score-accuracy.mjs --json           # machine-readable metrics
 *   node scripts/score-accuracy.mjs --update-baseline# record current metrics as the gate
 *
 * Gate: exits non-zero if the test-split macro-F1 drops below the recorded
 * baseline (test/fixtures/accuracy-baseline.json). Intended for CI use.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { loadScoringStack } from '../test/helpers/load-scoring-stack.mjs'
import { SCORING_DATASET, FIXED_NOW } from '../test/fixtures/scoring-dataset.mjs'

const VERDICTS = ['safe', 'caution', 'high-risk']
const SPLITS = ['train', 'validation', 'test']
const BASELINE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'test', 'fixtures', 'accuracy-baseline.json')

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
  for (const cls of VERDICTS) {
    const tp = matrix[cls][cls]
    let fp = 0
    let fn = 0
    for (const other of VERDICTS) {
      if (other === cls) continue
      fp += matrix[other][cls]
      fn += matrix[cls][other]
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
    perClass[cls] = { precision, recall, f1, support: tp + fn }
  }
  const macroF1 = VERDICTS.reduce((total, cls) => total + perClass[cls].f1, 0) / VERDICTS.length
  return { perClass, macroF1 }
}

function pct(value) {
  return `${(value * 100).toFixed(1)}%`
}

function evaluate(stack) {
  const results = []
  for (const item of SCORING_DATASET) {
    const report = stack.buildAuditReportV2({
      id: `harness_${item.id}`,
      extractedClaims: item.input.extractedClaims,
      evidence: item.input.evidence,
      enrichmentRedFlags: item.input.enrichmentRedFlags,
      now: FIXED_NOW,
    })
    results.push({
      id: item.id,
      archetype: item.archetype,
      split: item.split,
      expected: item.expected,
      predicted: report.verdict,
      score: report.riskScore,
      correct: report.verdict === item.expected,
      trace: report.intelligence?.scoreTrace || [],
      rationale: item.rationale,
    })
  }
  return results
}

function metricsForSubset(results) {
  const matrix = emptyMatrix()
  for (const item of results) matrix[item.expected][item.predicted] += 1
  const { perClass, macroF1 } = classMetrics(matrix)
  const accuracy = results.length === 0 ? 0 : results.filter((item) => item.correct).length / results.length
  return { count: results.length, accuracy, matrix, perClass, macroF1 }
}

function printMatrix(matrix) {
  const header = ['expected \\ got', ...VERDICTS].map((cell) => cell.padEnd(14)).join('')
  console.log(`  ${header}`)
  for (const expected of VERDICTS) {
    const row = [expected, ...VERDICTS.map((predicted) => String(matrix[expected][predicted]))]
      .map((cell) => cell.padEnd(14)).join('')
    console.log(`  ${row}`)
  }
}

function printReport(allMetrics, results) {
  for (const split of ['overall', ...SPLITS]) {
    const metric = allMetrics[split]
    console.log(`\n=== ${split.toUpperCase()} (n=${metric.count}) — accuracy ${pct(metric.accuracy)}, macro-F1 ${pct(metric.macroF1)} ===`)
    printMatrix(metric.matrix)
    for (const cls of VERDICTS) {
      const { precision, recall, f1, support } = metric.perClass[cls]
      console.log(`  ${cls.padEnd(10)} P ${pct(precision).padStart(6)}  R ${pct(recall).padStart(6)}  F1 ${pct(f1).padStart(6)}  (n=${support})`)
    }
  }

  const misses = results.filter((item) => !item.correct)
  console.log(`\n=== MISCLASSIFICATIONS (${misses.length}) ===`)
  for (const miss of misses) {
    console.log(`\n  [${miss.split}] ${miss.id}`)
    console.log(`    expected ${miss.expected}, got ${miss.predicted} (score ${miss.score})`)
    console.log(`    label rationale: ${miss.rationale}`)
    const strongest = [...miss.trace]
      .filter((step) => Math.abs(step.delta) > 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 4)
    for (const step of strongest) {
      console.log(`    trace: ${step.step} ${step.delta >= 0 ? '+' : ''}${step.delta} -> ${step.scoreAfter} (${step.reason})`)
    }
  }
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const stack = await loadScoringStack()
  const results = evaluate(stack)

  const allMetrics = { overall: metricsForSubset(results) }
  for (const split of SPLITS) {
    allMetrics[split] = metricsForSubset(results.filter((item) => item.split === split))
  }

  const summary = {
    generatedFrom: 'scripts/score-accuracy.mjs',
    datasetSize: results.length,
    fixedNow: new Date(FIXED_NOW).toISOString(),
    splits: Object.fromEntries(
      ['overall', ...SPLITS].map((split) => [split, {
        count: allMetrics[split].count,
        accuracy: Number(allMetrics[split].accuracy.toFixed(4)),
        macroF1: Number(allMetrics[split].macroF1.toFixed(4)),
        perClass: Object.fromEntries(VERDICTS.map((cls) => [cls, {
          precision: Number(allMetrics[split].perClass[cls].precision.toFixed(4)),
          recall: Number(allMetrics[split].perClass[cls].recall.toFixed(4)),
          f1: Number(allMetrics[split].perClass[cls].f1.toFixed(4)),
          support: allMetrics[split].perClass[cls].support,
        }])),
      }]),
    ),
    misclassifications: results.filter((item) => !item.correct).map((item) => ({
      id: item.id,
      split: item.split,
      expected: item.expected,
      predicted: item.predicted,
      score: item.score,
    })),
  }

  if (args.has('--json')) {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    printReport(allMetrics, results)
  }

  if (args.has('--update-baseline')) {
    await fs.writeFile(BASELINE_PATH, `${JSON.stringify(summary, null, 2)}\n`)
    console.log(`\nBaseline written to ${BASELINE_PATH}`)
    return
  }

  // Gate against the recorded baseline (if present).
  try {
    const baseline = JSON.parse(await fs.readFile(BASELINE_PATH, 'utf8'))
    const baselineTestF1 = baseline?.splits?.test?.macroF1
    const currentTestF1 = summary.splits.test.macroF1
    if (typeof baselineTestF1 === 'number' && currentTestF1 < baselineTestF1 - 0.001) {
      console.error(`\nFAIL: test-split macro-F1 ${currentTestF1} dropped below baseline ${baselineTestF1}`)
      process.exitCode = 1
    } else if (typeof baselineTestF1 === 'number') {
      console.log(`\nGate OK: test-split macro-F1 ${currentTestF1} vs baseline ${baselineTestF1}`)
    }
  } catch {
    console.log('\n(no baseline recorded yet — run with --update-baseline to record one)')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
