#!/usr/bin/env node
/**
 * Offline trainer for the base scoring engine's signal weights.
 *
 * Model: the SAME arithmetic the runtime uses — score = 25 + Σ w_i · x_i, where
 * x_i is the signal's confidence multiplier (1 / 0.85 / 0.6) when present, 0
 * otherwise. Only w_i is learned; runtime floors/ceilings remain hand-authored
 * guardrails ABOVE the model and are not trained.
 *
 * Objective (ordinal band hinge, matching the 35/65 verdict cutoffs with margin):
 *   safe      -> score <= 30
 *   caution   -> 40 <= score <= 60
 *   high-risk -> score >= 70
 * plus an L2 pull toward the hand-tuned weights (keeps coefficients close to the
 * documented priors unless the data demands otherwise) and a sign constraint:
 * risk signals stay >= 0, trust signals stay <= 0 — every learned coefficient
 * remains individually explainable.
 *
 * Determinism: full-batch gradient descent, fixed initialization (hand-tuned
 * weights), fixed learning rate and epoch count, no randomness anywhere. The
 * same dataset always produces byte-identical artifacts.
 *
 * Data policy: trains on train+validation ONLY. The held-out test split is never
 * touched here; end-to-end comparison numbers on validation decide shipping.
 *
 * Output: lib/risk-weights.generated.mjs (static artifact; no runtime fs access).
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadScoringStack } from '../test/helpers/load-scoring-stack.mjs'
import { SCORING_DATASET, FIXED_NOW } from '../test/fixtures/scoring-dataset.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ARTIFACT_PATH = path.join(ROOT, 'lib', 'risk-weights.generated.mjs')

const CONFIDENCE_MULTIPLIER = { high: 1, medium: 0.85, low: 0.6 }
const BASELINE = 25
const LEARNING_RATE = 0.05
const EPOCHS = 2000
const L2_TOWARD_PRIOR = 0.01

const BANDS = {
  safe: { max: 30 },
  caution: { min: 40, max: 60 },
  'high-risk': { min: 70 },
}

function featurize(stack, item) {
  const signals = stack.buildAuditSignals(item.input.extractedClaims, [], [], item.input.evidence)
  const features = new Map()
  const priors = new Map()
  const directions = new Map()
  for (const signal of signals) {
    const multiplier = CONFIDENCE_MULTIPLIER[signal.confidence] ?? CONFIDENCE_MULTIPLIER.medium
    // addUnique de-duplicates identical ids upstream; keep max multiplier if repeated.
    features.set(signal.id, Math.max(features.get(signal.id) || 0, multiplier))
    priors.set(signal.id, Number(signal.weight || 0))
    directions.set(signal.id, signal.direction)
  }
  return { features, priors, directions }
}

function trainWeights(examples) {
  // Collect the full feature space with hand-tuned priors and directions.
  const priorWeights = new Map()
  const signalDirections = new Map()
  for (const example of examples) {
    for (const [id, prior] of example.priors) {
      if (!priorWeights.has(id)) priorWeights.set(id, prior)
    }
    for (const [id, direction] of example.directions) {
      if (!signalDirections.has(id)) signalDirections.set(id, direction)
    }
  }

  const weights = new Map(priorWeights)

  for (let epoch = 0; epoch < EPOCHS; epoch += 1) {
    const gradient = new Map()
    for (const example of examples) {
      let score = BASELINE
      for (const [id, x] of example.features) score += (weights.get(id) || 0) * x

      const band = BANDS[example.expected]
      let errorDirection = 0
      if (typeof band.max === 'number' && score > band.max) errorDirection = 1   // too high -> push down
      if (typeof band.min === 'number' && score < band.min) errorDirection = -1 // too low -> push up

      if (errorDirection !== 0) {
        for (const [id, x] of example.features) {
          gradient.set(id, (gradient.get(id) || 0) + errorDirection * x)
        }
      }
    }

    for (const [id, weight] of weights) {
      const g = (gradient.get(id) || 0) / examples.length
      const prior = priorWeights.get(id) || 0
      // errorDirection=+1 accumulated +x when the score was too high, so standard
      // descent (subtract lr*g) pushes active weights down; -1 pushes them up.
      let next = weight - LEARNING_RATE * g - LEARNING_RATE * L2_TOWARD_PRIOR * (weight - prior)
      // Sign constraints keep every coefficient explainable.
      const direction = signalDirections.get(id)
      if (direction === 'risk') next = Math.max(0, next)
      if (direction === 'trust') next = Math.min(0, next)
      weights.set(id, Number(next.toFixed(4)))
    }
  }

  return { weights, priorWeights, signalDirections }
}

async function evaluateEndToEnd(stack, cases, overrides) {
  let correct = 0
  for (const item of cases) {
    const report = stack.buildAuditReportV2({
      id: `trainer_${item.id}`,
      extractedClaims: item.input.extractedClaims,
      evidence: item.input.evidence,
      enrichmentRedFlags: item.input.enrichmentRedFlags,
      now: FIXED_NOW,
      signalWeightOverrides: overrides,
    })
    if (report.verdict === item.expected) correct += 1
  }
  return cases.length === 0 ? 0 : correct / cases.length
}

async function main() {
  const stack = await loadScoringStack()

  const trainCases = SCORING_DATASET.filter((item) => item.split === 'train' || item.split === 'validation')
  const validationCases = SCORING_DATASET.filter((item) => item.split === 'validation')

  const examples = trainCases.map((item) => ({ ...featurize(stack, item), expected: item.expected }))
  const { weights, priorWeights } = trainWeights(examples)

  const trainedOverrides = Object.fromEntries(weights)
  const handTunedValidation = await evaluateEndToEnd(stack, validationCases, undefined)
  const trainedValidation = await evaluateEndToEnd(stack, validationCases, trainedOverrides)

  const changed = [...weights.entries()]
    .map(([id, weight]) => ({ id, prior: priorWeights.get(id) || 0, trained: weight }))
    .filter((entry) => Math.abs(entry.trained - entry.prior) > 0.05)
    .sort((a, b) => Math.abs(b.trained - b.prior) - Math.abs(a.trained - a.prior))

  const artifact = `// AUTO-GENERATED by scripts/train-risk-weights.mjs — do not edit by hand.
// Deterministic fit (full-batch GD, ${EPOCHS} epochs, lr ${LEARNING_RATE}, L2->prior ${L2_TOWARD_PRIOR})
// on the train+validation splits of test/fixtures/scoring-dataset.mjs.
// Validation accuracy (end-to-end): hand-tuned ${(handTunedValidation * 100).toFixed(1)}% vs trained ${(trainedValidation * 100).toFixed(1)}%.
// Shipping decision: trained weights are wired into production ONLY if they beat
// hand-tuned on validation; otherwise this artifact is reference/comparison output.

export const TRAINED_SIGNAL_WEIGHTS = ${JSON.stringify(trainedOverrides, null, 2)}

export const TRAINING_METADATA = ${JSON.stringify({
    trainedOn: 'train+validation',
    datasetSize: trainCases.length,
    epochs: EPOCHS,
    learningRate: LEARNING_RATE,
    l2TowardPrior: L2_TOWARD_PRIOR,
    validationAccuracy: { handTuned: handTunedValidation, trained: trainedValidation },
  }, null, 2)}
`
  await fs.writeFile(ARTIFACT_PATH, artifact)

  console.log(`Trained ${weights.size} signal weights on ${trainCases.length} cases (train+validation).`)
  console.log(`Validation accuracy end-to-end: hand-tuned ${(handTunedValidation * 100).toFixed(1)}% | trained ${(trainedValidation * 100).toFixed(1)}%`)
  console.log(`Artifact written to ${ARTIFACT_PATH}`)
  if (changed.length > 0) {
    console.log('\nLargest weight movements vs hand-tuned priors:')
    for (const entry of changed.slice(0, 12)) {
      console.log(`  ${entry.id}: ${entry.prior} -> ${entry.trained}`)
    }
  } else {
    console.log('\nNo weight moved more than 0.05 from its hand-tuned prior.')
  }
  console.log(`\nShipping recommendation: ${trainedValidation > handTunedValidation
    ? 'WIRE TRAINED WEIGHTS (beats hand-tuned on validation)'
    : 'KEEP HAND-TUNED WEIGHTS (trained does not beat hand-tuned on validation)'}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
