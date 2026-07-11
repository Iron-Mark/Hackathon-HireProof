import fs from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

/**
 * Loads the REAL local scoring stack (no mocks) for tests and offline tooling:
 *
 *   lib/audit-signals.mjs  ->  lib/risk-scorer.ts  ->  lib/intelligence-v2.ts
 *                              lib/salary-benchmarks.ts / lib/alternative-jobs.ts
 *
 * All `@/lib/schemas` imports in these modules are type-only, so they erase at transpile
 * time and need no runtime stub. Returns the merged exports of every layer so callers can
 * exercise any level of the stack against the same loaded code.
 */

function transpile(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
}

function runCommonJs(compiled, requireImpl) {
  const context = {
    exports: {},
    console,
    require: requireImpl,
    Date,
    URL,
    Number,
    Math,
    JSON,
    RegExp,
    Array,
    Set,
    Map,
    String,
    Object,
  }
  context.module = { exports: context.exports }
  vm.runInNewContext(compiled, context)
  return context.module.exports
}

let cachedStack = null

export async function loadScoringStack() {
  if (cachedStack) return cachedStack

  const read = (relative) => fs.readFile(new URL(relative, import.meta.url), 'utf8')

  // Shared scam vocabulary + normalization/matcher primitives, imported by both
  // audit-signals.mjs and intelligence-v2.ts. Self-contained (no requires of its own).
  const scamVocabulary = runCommonJs(transpile(await read('../../lib/scam-vocabulary.mjs')), () => ({}))

  const auditSignals = runCommonJs(transpile(await read('../../lib/audit-signals.mjs')), (id) => {
    if (id === './scam-vocabulary.mjs') return scamVocabulary
    throw new Error(`Unexpected require in audit-signals.mjs: ${id}`)
  })

  const riskScorer = runCommonJs(transpile(await read('../../lib/risk-scorer.ts')), (id) => {
    if (id === '@/lib/audit-signals.mjs') return auditSignals
    throw new Error(`Unexpected require in risk-scorer.ts: ${id}`)
  })

  const salaryBenchmarks = runCommonJs(transpile(await read('../../lib/salary-benchmarks.ts')), (id) => {
    throw new Error(`Unexpected require in salary-benchmarks.ts: ${id}`)
  })

  const alternativeJobs = runCommonJs(transpile(await read('../../lib/alternative-jobs.ts')), (id) => {
    throw new Error(`Unexpected require in alternative-jobs.ts: ${id}`)
  })

  const intelligence = runCommonJs(transpile(await read('../../lib/intelligence-v2.ts')), (id) => {
    if (id === '@/lib/risk-scorer') return riskScorer
    if (id === '@/lib/salary-benchmarks') return salaryBenchmarks
    if (id === '@/lib/alternative-jobs') return alternativeJobs
    if (id === '@/lib/scam-vocabulary.mjs') return scamVocabulary
    throw new Error(`Unexpected require in intelligence-v2.ts: ${id}`)
  })

  cachedStack = {
    ...auditSignals,
    ...riskScorer,
    ...salaryBenchmarks,
    ...alternativeJobs,
    ...intelligence,
  }
  return cachedStack
}
