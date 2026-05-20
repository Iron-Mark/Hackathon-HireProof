import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildResearchPrompt,
  formatResearchMarkdown,
  parseCursorOutput,
  runResearchAgent,
} from '../lib/research-agent.mjs'

function agentPayload(summary = 'Research complete.') {
  return JSON.stringify({
    summary,
    findings: ['Telegram-only contact is a job-scam risk signal.'],
    evidence: ['User-provided recruiter message mentions Telegram.'],
    commands: ['cursor-agent -p ... --output-format json'],
    nextSteps: ['Ask for an official company careers-page link.'],
  })
}

test('research prompt keeps agent scope on employment fraud and read-only research', () => {
  const prompt = buildResearchPrompt('Investigate this recruiter message.')

  assert.match(prompt, /employment-fraud and job-scam/i)
  assert.match(prompt, /Do not broaden/i)
  assert.match(prompt, /Do not edit files/i)
  assert.match(prompt, /Return only JSON/i)
})

test('research agent uses Cursor first and does not force file modifications', async () => {
  const calls = []
  const result = await runResearchAgent({
    prompt: 'Check this suspicious job post.',
    env: {
      RESEARCH_AGENT_PRIMARY: 'cursor',
      RESEARCH_AGENT_FALLBACK: 'codex',
    },
  }, {
    runProcess: async (command, args) => {
      calls.push({ command, args })
      return {
        code: 0,
        stdout: JSON.stringify({ type: 'result', result: agentPayload('Cursor handled the research.') }),
        stderr: '',
      }
    },
  })

  assert.equal(result.provider, 'cursor')
  assert.equal(result.status, 'ok')
  assert.equal(result.summary, 'Cursor handled the research.')
  assert.equal(calls[0].command, 'cursor-agent')
  assert.deepEqual(calls[0].args.slice(0, 2), ['-p', calls[0].args[1]])
  assert.ok(calls[0].args.includes('--output-format'))
  assert.ok(!calls[0].args.includes('--force'))
  assert.equal(result.attempts.length, 1)
})

test('research agent falls back to Codex SDK when Cursor is unavailable and Codex is enabled', async () => {
  const result = await runResearchAgent({
    prompt: 'Investigate a suspicious remote internship.',
    enableCodex: true,
    env: {
      RESEARCH_AGENT_PRIMARY: 'cursor',
      RESEARCH_AGENT_FALLBACK: 'codex',
      CODEX_MODEL: 'gpt-5.2-codex',
    },
  }, {
    runProcess: async () => ({
      code: null,
      stdout: '',
      stderr: '',
      error: Object.assign(new Error('not found'), { code: 'ENOENT' }),
    }),
    loadCodexSdk: async () => ({
      Codex: class FakeCodex {
        constructor(options) {
          assert.equal(options.config.model, 'gpt-5.2-codex')
        }

        startThread(options) {
          assert.equal(options.skipGitRepoCheck, true)
          assert.equal(options.sandboxMode, 'read-only')
          assert.equal(options.approvalPolicy, 'never')
          assert.equal(options.networkAccessEnabled, false)
          return {
            run: async (_prompt, runOptions) => {
              assert.equal(runOptions.outputSchema.required.includes('summary'), true)
              return { finalResponse: agentPayload('Codex handled the fallback research.') }
            },
          }
        }
      },
    }),
  })

  assert.equal(result.provider, 'codex')
  assert.equal(result.status, 'ok')
  assert.equal(result.summary, 'Codex handled the fallback research.')
  assert.deepEqual(result.attempts.map((attempt) => attempt.provider), ['cursor', 'codex'])
  assert.deepEqual(result.attempts.map((attempt) => attempt.status), ['unavailable', 'ok'])
})

test('Codex fallback stays opt-in by default', async () => {
  const result = await runResearchAgent({
    prompt: 'Investigate a suspicious recruiter message.',
    env: {
      RESEARCH_AGENT_PRIMARY: 'cursor',
      RESEARCH_AGENT_FALLBACK: 'codex',
      CODEX_SDK_ENABLED: 'false',
    },
  }, {
    runProcess: async () => ({
      code: null,
      stdout: '',
      stderr: '',
      error: Object.assign(new Error('not found'), { code: 'ENOENT' }),
    }),
  })

  assert.equal(result.provider, 'codex')
  assert.equal(result.status, 'unavailable')
  assert.match(result.summary, /Codex SDK fallback is disabled/)
  assert.equal(result.attempts.length, 2)
})

test('Cursor text output is accepted when nested JSON is absent', () => {
  const result = parseCursorOutput(JSON.stringify({ type: 'result', result: 'Plain research summary.' }))

  assert.equal(result.provider, 'cursor')
  assert.equal(result.status, 'ok')
  assert.equal(result.summary, 'Plain research summary.')
  assert.deepEqual(result.findings, ['Plain research summary.'])
})

test('research markdown artifacts include summary, evidence, and provider attempts', () => {
  const markdown = formatResearchMarkdown({
    provider: 'codex',
    status: 'ok',
    summary: 'Codex fallback completed.',
    findings: ['Suspicious salary claim.'],
    evidence: ['Telegram-only handoff.'],
    commands: ['npm run research:agent -- --enable-codex'],
    nextSteps: ['Verify official careers page.'],
    attempts: [
      { provider: 'cursor', status: 'unavailable' },
      { provider: 'codex', status: 'ok' },
    ],
  })

  assert.match(markdown, /# HireProof Research Agent Report/)
  assert.match(markdown, /Provider: codex/)
  assert.match(markdown, /Codex fallback completed/)
  assert.match(markdown, /Telegram-only handoff/)
  assert.match(markdown, /cursor: unavailable/)
})

test('Cursor output accepts object and fenced JSON result payloads', () => {
  const objectResult = parseCursorOutput(JSON.stringify({
    type: 'result',
    result: JSON.parse(agentPayload('Object payload handled.')),
  }))

  assert.equal(objectResult.provider, 'cursor')
  assert.equal(objectResult.status, 'ok')
  assert.equal(objectResult.summary, 'Object payload handled.')
  assert.deepEqual(objectResult.nextSteps, ['Ask for an official company careers-page link.'])

  const fencedResult = parseCursorOutput(JSON.stringify({
    type: 'result',
    result: `\`\`\`json\n${agentPayload('Fenced payload handled.')}\n\`\`\``,
  }))

  assert.equal(fencedResult.provider, 'cursor')
  assert.equal(fencedResult.status, 'ok')
  assert.equal(fencedResult.summary, 'Fenced payload handled.')
  assert.deepEqual(fencedResult.findings, ['Telegram-only contact is a job-scam risk signal.'])
})
