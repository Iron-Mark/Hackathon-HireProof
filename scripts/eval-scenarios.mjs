#!/usr/bin/env node
/**
 * Batch scenario evaluator — ground truth for red-team candidates.
 *
 * Reads a JSON array of scenarios and runs each through the REAL scoring engine
 * (buildAuditReportV2, fixed now), printing the engine verdict vs the claimed
 * expected verdict. Used to confirm whether a red-team candidate is a genuine
 * engine gap (engine != expected) before anything is added to the dataset.
 *
 * Scenario shape:
 *   { id, expected: 'safe'|'caution'|'high-risk', claims: {...}, evidence?: [...],
 *     enrichmentRedFlags?: [...], note?: string }
 *
 * Usage:
 *   node scripts/eval-scenarios.mjs path/to/scenarios.json          # table + mismatch list
 *   node scripts/eval-scenarios.mjs path/to/scenarios.json --json   # machine output
 *   node scripts/eval-scenarios.mjs path/to/scenarios.json --mismatches-only
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import { loadScoringStack } from '../test/helpers/load-scoring-stack.mjs'
import { FIXED_NOW } from '../test/fixtures/scoring-dataset.mjs'

const VERDICTS = new Set(['safe', 'caution', 'high-risk'])

function normalizeScenario(raw, index) {
  const claims = raw.claims || raw.extractedClaims || {}
  return {
    id: raw.id || `scenario_${index + 1}`,
    expected: raw.expected,
    note: raw.note || raw.rationale || '',
    dimension: raw.dimension || raw.attack || '',
    claims: {
      company: claims.company ?? 'Unknown / Not Verifiable',
      role: claims.role ?? '',
      salary: claims.salary ?? '',
      location: claims.location ?? '',
      contactMethod: claims.contactMethod ?? '',
      applicationPath: claims.applicationPath ?? '',
      ...claims,
    },
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
    enrichmentRedFlags: Array.isArray(raw.enrichmentRedFlags) ? raw.enrichmentRedFlags : undefined,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const file = args.find((arg) => !arg.startsWith('--'))
  if (!file) {
    console.error('usage: node scripts/eval-scenarios.mjs <scenarios.json> [--json] [--mismatches-only]')
    process.exitCode = 1
    return
  }
  const asJson = args.includes('--json')
  const mismatchesOnly = args.includes('--mismatches-only')

  const raw = JSON.parse(await fs.readFile(file, 'utf8'))
  const scenarios = (Array.isArray(raw) ? raw : raw.scenarios || []).map(normalizeScenario)
  const stack = await loadScoringStack()

  const rows = scenarios.map((scenario) => {
    let report
    let error
    try {
      report = stack.buildAuditReportV2({
        id: `eval_${scenario.id}`,
        extractedClaims: scenario.claims,
        evidence: scenario.evidence,
        enrichmentRedFlags: scenario.enrichmentRedFlags,
        now: FIXED_NOW,
      })
    } catch (err) {
      error = String(err && err.message ? err.message : err)
    }
    const engineVerdict = report ? report.verdict : 'ERROR'
    const validExpected = VERDICTS.has(scenario.expected)
    return {
      id: scenario.id,
      dimension: scenario.dimension,
      expected: scenario.expected,
      engineVerdict,
      score: report ? report.riskScore : null,
      mismatch: validExpected && engineVerdict !== scenario.expected,
      invalidExpected: !validExpected,
      error,
      note: scenario.note,
    }
  })

  const mismatches = rows.filter((row) => row.mismatch || row.error || row.invalidExpected)

  if (asJson) {
    console.log(JSON.stringify({ total: rows.length, mismatches: mismatches.length, rows }, null, 2))
    return
  }

  const shown = mismatchesOnly ? mismatches : rows
  for (const row of shown) {
    const flag = row.error ? '⚠ ERROR' : row.invalidExpected ? '⚠ BADLABEL' : row.mismatch ? '✗ GAP' : '✓ ok'
    console.log(`${flag}  ${row.id.padEnd(38)} expected ${String(row.expected).padEnd(10)} engine ${String(row.engineVerdict).padEnd(10)} score ${row.score ?? '-'}`)
    if (row.error) console.log(`         error: ${row.error}`)
    if ((row.mismatch || row.invalidExpected) && row.note) console.log(`         ${row.dimension ? `[${row.dimension}] ` : ''}${row.note}`)
  }
  console.log(`\n${rows.length} scenarios | ${mismatches.length} gaps/errors | ${rows.length - mismatches.length} handled correctly`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
