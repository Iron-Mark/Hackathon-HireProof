import { buildHireProofQaPrompt } from './qa-prompt'

export const CURSOR_DEVELOPER_PRESETS = {
  'docs-drift': {
    label: 'Docs drift review',
    description: 'Compare README, deployment notes, and env template for stale routes.',
    buildPrompt: () => `
Review HireProof documentation drift only.
Compare README.md, DEPLOYMENT.md, .env.example, and docs/automation-integrations.md.
Flag stale API routes, env vars, or examples. Do not change product behavior unless a doc is objectively wrong.
Summarize findings in bullet points.
`.trim(),
  },
  'repo-health': {
    label: 'Repo health check',
    description: 'Run lint, build, and runtime-wiring tests; summarize failures.',
    buildPrompt: () => `
You are performing HireProof repo health.
Tasks:
1. Run: npm run lint
2. Run: npm run build
3. Run: node --test test/runtime-wiring.test.mjs
4. Summarize pass/fail only. Do not change product behavior unless a test fails.
`.trim(),
  },
  'qa-walkthrough': {
    label: 'UI QA walkthrough',
    description: 'Exploratory browser QA on audit, developer, and docs surfaces.',
    buildPrompt: (baseUrl: string) => buildHireProofQaPrompt(baseUrl),
  },
} as const

export type CursorDeveloperPresetId = keyof typeof CURSOR_DEVELOPER_PRESETS

export function resolveDeveloperPresetPrompt(
  preset: string,
  options: { baseUrl: string; customPrompt?: string },
) {
  if (preset === 'custom') {
    const custom = options.customPrompt?.trim()
    if (!custom) throw new Error('Custom prompt is required.')
    return custom
  }

  const definition = CURSOR_DEVELOPER_PRESETS[preset as CursorDeveloperPresetId]
  if (!definition) throw new Error('Unsupported Cursor preset.')

  if (preset === 'qa-walkthrough') {
    return CURSOR_DEVELOPER_PRESETS['qa-walkthrough'].buildPrompt(options.baseUrl)
  }

  if (preset === 'docs-drift') {
    return CURSOR_DEVELOPER_PRESETS['docs-drift'].buildPrompt()
  }

  return CURSOR_DEVELOPER_PRESETS['repo-health'].buildPrompt()
}
