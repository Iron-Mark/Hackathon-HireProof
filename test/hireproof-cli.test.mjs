import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { render } from 'ink-testing-library'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const cliPath = fileURLToPath(new URL('../packages/hireproof-cli/bin/hireproof.mjs', import.meta.url))
const ansiPattern = /\u001b\[[0-9;]*m/g

function stripAnsi(value) {
  return String(value || '').replace(ansiPattern, '')
}

function waitForInk() {
  return new Promise(resolve => setTimeout(resolve, 25))
}

function sampleReport(overrides = {}) {
  return {
    id: 'report_test',
    mode: 'demo',
    verdict: 'high-risk',
    riskScore: 92,
    confidence: 'high',
    summary: 'High-risk offer.',
    extractedClaims: {
      company: 'Unknown',
      role: 'Remote job',
      salary: 'Huge pay',
      location: 'Remote',
      contactMethod: 'Telegram',
      applicationPath: 'Direct message',
    },
    redFlags: ['Telegram-only contact'],
    greenFlags: ['Official-looking company name'],
    evidence: [
      { source: 'Demo', snippet: 'No interview.', type: 'Pattern', url: 'https://example.test/one' },
      { source: 'Search', snippet: 'Telegram scam pattern.', type: 'Reputation', url: 'https://example.test/two' },
      { source: 'Jobs', snippet: 'Comparable internship pays far less.', type: 'Comparable Jobs', url: 'https://example.test/three' },
      { source: 'Local', snippet: 'No local footprint found.', type: 'Local Presence', url: 'https://example.test/four' },
    ],
    alternatives: [],
    nextSteps: ['Do not send money.'],
    ...overrides,
  }
}

function runCli(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HIREPROOF_CONFIG_HOME: options.configHome || '',
        ...options.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('close', code => resolve({ code, stdout, stderr }))
  })
}

async function withMockHireProofApi(handler, fn) {
  const server = createServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString('utf8')
    await handler(request, response, body)
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  try {
    await fn(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

test('HireProof CLI prints command help', async () => {
  const result = await runCli(['--help'])

  assert.equal(result.code, 0)
  assert.match(result.stdout, /hireproof audit/)
  assert.match(result.stdout, /hireproof health/)
  assert.match(result.stdout, /hireproof config/)
})

test('HireProof CLI checks API health', async () => {
  await withMockHireProofApi((request, response) => {
    assert.equal(request.method, 'GET')
    assert.equal(request.url, '/api/health')
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      status: 'ok',
      readiness: { state: 'ready' },
      costPosture: { publicLiveEvidence: false, publicOcr: false, byokRequiredForApiLive: true },
    }))
  }, async (baseUrl) => {
    const result = await runCli(['health', '--base-url', baseUrl])

    assert.equal(result.code, 0)
    assert.match(result.stdout, /HireProof API: ok/)
    assert.match(result.stdout, /Readiness\s+ready/)
    assert.match(result.stdout, /Live evidence\s+cost-guarded/)
  })
})

test('HireProof CLI audits inline text and can print JSON', async () => {
  await withMockHireProofApi((request, response, body) => {
    assert.equal(request.method, 'POST')
    assert.equal(request.url, '/api/v1/audit')
    assert.equal(request.headers['x-api-key'], 'test_key')
    const payload = JSON.parse(body)
    assert.equal(payload.text, 'Remote job. Huge pay. Telegram only.')
    assert.equal(payload.mode, 'demo')

    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify(sampleReport()))
  }, async (baseUrl) => {
    const result = await runCli([
      'audit',
      '--text',
      'Remote job. Huge pay. Telegram only.',
      '--mode',
      'demo',
      '--api-key',
      'test_key',
      '--base-url',
      baseUrl,
      '--json',
    ])

    assert.equal(result.code, 0)
    const report = JSON.parse(result.stdout)
    assert.equal(report.verdict, 'high-risk')
    assert.equal(report.riskScore, 92)
    assert.doesNotMatch(result.stdout, ansiPattern)
    assert.doesNotMatch(result.stdout, /HIREPROOF TERMINAL REPORT/)
  })
})

test('HireProof CLI rejects oversized audit API responses before rendering', async () => {
  const oversizedReport = JSON.stringify({
    ...sampleReport({ verdict: 'safe', riskScore: 1 }),
    summary: 'x'.repeat((256 * 1024) + 1),
  })

  await withMockHireProofApi((request, response) => {
    assert.equal(request.method, 'POST')
    assert.equal(request.url, '/api/v1/audit')
    response.setHeader('content-type', 'application/json')
    response.setHeader('content-length', String(Buffer.byteLength(oversizedReport)))
    response.end(oversizedReport)
  }, async (baseUrl) => {
    const result = await runCli([
      'audit',
      '--text',
      'Remote job. Huge pay. Telegram only.',
      '--api-key',
      'test_key',
      '--base-url',
      baseUrl,
      '--json',
    ])

    assert.equal(result.code, 1)
    assert.match(result.stderr, /HireProof API response too large/)
    assert.equal(result.stdout, '')
  })
})

test('HireProof TUI default API clients use bounded response parsing', async () => {
  const source = await readFile(new URL('../packages/hireproof-cli/lib/tui-app.mjs', import.meta.url), 'utf8')

  assert.match(source, /MAX_API_RESPONSE_BYTES\s*=\s*256\s*\*\s*1024/)
  assert.match(source, /readBoundedJsonResponse/)
  assert.match(source, /reader\.cancel\(\)\.catch\(\(\) => undefined\)/)
  assert.doesNotMatch(source, /return response\.json\(\)/)
})

test('HireProof CLI default API client cancels oversized streaming responses', async () => {
  const source = await readFile(new URL('../packages/hireproof-cli/bin/hireproof.mjs', import.meta.url), 'utf8')

  assert.match(source, /readBoundedJsonResponse/)
  assert.match(source, /reader\.cancel\(\)\.catch\(\(\) => undefined\)/)
  assert.doesNotMatch(source, /return response\.json\(\)/)
})

test('HireProof CLI audits a text file with rich branded output', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'hireproof-cli-'))
  const inputPath = path.join(tempDir, 'job.txt')
  await writeFile(inputPath, 'Company: Example. Role: Assistant.')

  try {
    await withMockHireProofApi((request, response, body) => {
      const payload = JSON.parse(body)
      assert.equal(payload.text, 'Company: Example. Role: Assistant.')
      assert.equal(payload.location, 'Philippines')

      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify(sampleReport({
        verdict: 'caution',
        riskScore: 47,
        confidence: 'medium',
        summary: 'Some details need checking.',
        extractedClaims: { company: 'Example', role: 'Assistant', salary: 'Not specified', location: 'Philippines', contactMethod: 'Not specified', applicationPath: 'Not specified' },
        redFlags: ['Missing salary'],
        greenFlags: ['Company named'],
        nextSteps: ['Ask for official posting.'],
      })))
    }, async (baseUrl) => {
      const result = await runCli(['audit', '--file', inputPath, '--location', 'Philippines', '--base-url', baseUrl, '--api-key', 'test_key'])

      assert.equal(result.code, 0)
      assert.match(result.stdout, /HIREPROOF TERMINAL REPORT/)
      assert.match(result.stdout, /\+[-]+\+/)
      assert.match(result.stdout, /Verdict\s+Caution/)
      assert.match(result.stdout, /Score: 47\/100/)
      assert.match(result.stdout, /\[[#-]+\]/)
      assert.match(result.stdout, /Claims/)
      assert.match(result.stdout, /Company\s+Example/)
      assert.match(result.stdout, /Evidence/)
      assert.match(result.stdout, /Ask for official posting/)
    })
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
})

test('HireProof CLI plain mode keeps non-boxed readable output', async () => {
  await withMockHireProofApi((request, response) => {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify(sampleReport()))
  }, async (baseUrl) => {
    const result = await runCli(['audit', '--text', 'Remote job', '--base-url', baseUrl, '--api-key', 'test_key', '--plain'])

    assert.equal(result.code, 0)
    assert.match(result.stdout, /Verdict: High-Risk/)
    assert.doesNotMatch(result.stdout, /HIREPROOF TERMINAL REPORT/)
    assert.doesNotMatch(result.stdout, /\+[-]+\+/)
  })
})

test('HireProof CLI no-color removes ANSI escapes from rich output', async () => {
  await withMockHireProofApi((request, response) => {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify(sampleReport()))
  }, async (baseUrl) => {
    const result = await runCli(['audit', '--text', 'Remote job', '--base-url', baseUrl, '--api-key', 'test_key', '--no-color'])

    assert.equal(result.code, 0)
    assert.match(result.stdout, /HIREPROOF TERMINAL REPORT/)
    assert.doesNotMatch(result.stdout, ansiPattern)
  })
})

test('HireProof CLI verbose mode shows more evidence items', async () => {
  await withMockHireProofApi((request, response) => {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify(sampleReport()))
  }, async (baseUrl) => {
    const compact = await runCli(['audit', '--text', 'Remote job', '--base-url', baseUrl, '--api-key', 'test_key', '--no-color'])
    const verbose = await runCli(['audit', '--text', 'Remote job', '--base-url', baseUrl, '--api-key', 'test_key', '--no-color', '--verbose'])

    assert.equal(compact.code, 0)
    assert.equal(verbose.code, 0)
    assert.doesNotMatch(compact.stdout, /No local footprint found/)
    assert.match(verbose.stdout, /No local footprint found/)
  })
})

test('HireProof CLI health output uses branded readiness card', async () => {
  await withMockHireProofApi((request, response) => {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      status: 'ok',
      readiness: { state: 'ready' },
      costPosture: { publicLiveEvidence: true, publicOcr: false, byokRequiredForApiLive: true },
    }))
  }, async (baseUrl) => {
    const result = await runCli(['health', '--base-url', baseUrl, '--no-color'])

    assert.equal(result.code, 0)
    assert.match(result.stdout, /HIREPROOF HEALTH CHECK/)
    assert.match(result.stdout, /API\s+ok/)
    assert.match(result.stdout, /Readiness\s+ready/)
    assert.match(result.stdout, /Live evidence\s+public-enabled/)
  })
})

test('HireProof CLI stores and reads local config', async () => {
  const configHome = await mkdtemp(path.join(os.tmpdir(), 'hireproof-config-'))

  try {
    const setUrl = await runCli(['config', 'set', 'baseUrl', 'https://example.test'], { configHome })
    const setKey = await runCli(['config', 'set', 'apiKey', 'local_key'], { configHome })
    const list = await runCli(['config', 'list'], { configHome })
    const getKey = await runCli(['config', 'get', 'apiKey'], { configHome })

    assert.equal(setUrl.code, 0)
    assert.equal(setKey.code, 0)
    assert.match(list.stdout, /baseUrl: https:\/\/example\.test/)
    assert.match(list.stdout, /apiKey: \[redacted\]/)
    assert.doesNotMatch(list.stdout, /local_key/)
    assert.equal(getKey.code, 0)
    assert.match(getKey.stdout, /\[redacted\]/)
    assert.doesNotMatch(getKey.stdout, /local_key/)
  } finally {
    await rm(configHome, { recursive: true, force: true })
  }
})

test('HireProof CLI opens help instead of interactive TUI for non-TTY default launch', async () => {
  const result = await runCli([])

  assert.equal(result.code, 0)
  assert.match(result.stdout, /HireProof CLI/)
  assert.match(result.stdout, /hireproof audit/)
  assert.doesNotMatch(result.stdout, /Shield Sentinel/)
})

test('HireProof TUI renders branded mascot launcher and menu', async () => {
  const { HireProofTuiApp } = await import('../packages/hireproof-cli/lib/tui-app.mjs')
  const result = render(React.createElement(HireProofTuiApp, {
    baseUrl: 'https://hireproof.test',
    apiKey: 'test_key',
    color: false,
  }))

  const frame = stripAnsi(result.lastFrame())
  assert.match(frame, /HIREPROOF/)
  assert.match(frame, /Shield Sentinel/)
  assert.match(frame, /SENTINEL/)
  assert.match(frame, /HIREPROOF/)
  assert.match(frame, /Audit/)
  assert.match(frame, /Paste message/)
  assert.match(frame, /Audit file/)
  assert.match(frame, /Audit URL/)
  assert.match(frame, /Recent reports/)
  assert.match(frame, /Ask HireProof/)
  assert.match(frame, /Health/)
  assert.match(frame, /Config/)
  assert.match(frame, /Command console/)
  assert.match(frame, /Tab autocomplete/)
})

test('HireProof TUI arrow navigation changes the active menu item', async () => {
  const { HireProofTuiApp } = await import('../packages/hireproof-cli/lib/tui-app.mjs')
  const result = render(React.createElement(HireProofTuiApp, {
    baseUrl: 'https://hireproof.test',
    apiKey: 'test_key',
    color: false,
  }))

  assert.match(stripAnsi(result.lastFrame()), /> Audit/)
  result.stdin.write('\u001B[B')
  await waitForInk()
  assert.match(stripAnsi(result.lastFrame()), /> Paste message/)
})

test('HireProof TUI command console autocompletes with tab and opens a screen', async () => {
  const { HireProofTuiApp } = await import('../packages/hireproof-cli/lib/tui-app.mjs')
  const result = render(React.createElement(HireProofTuiApp, {
    baseUrl: 'https://hireproof.test',
    apiKey: 'test_key',
    color: false,
    healthClient: async () => ({
      status: 'ok',
      readiness: { state: 'ready' },
      costPosture: { publicLiveEvidence: true, publicOcr: false, byokRequiredForApiLive: true },
    }),
  }))

  result.stdin.write('hea')
  result.stdin.write('\t')
  await waitForInk()
  assert.match(stripAnsi(result.lastFrame()), /> health/)

  result.stdin.write('\r')
  await waitForInk()
  const frame = stripAnsi(result.lastFrame())
  assert.match(frame, /Health/)
  assert.match(frame, /API: ok/)
})

test('HireProof TUI slash focuses command palette and shortcuts open screens', async () => {
  const { HireProofTuiApp } = await import('../packages/hireproof-cli/lib/tui-app.mjs')
  const result = render(React.createElement(HireProofTuiApp, {
    baseUrl: 'https://hireproof.test',
    apiKey: 'test_key',
    color: false,
    healthClient: async () => ({
      status: 'ok',
      readiness: { state: 'ready' },
      costPosture: { publicLiveEvidence: true, publicOcr: false, byokRequiredForApiLive: true },
    }),
  }))

  result.stdin.write('/')
  await waitForInk()
  assert.match(stripAnsi(result.lastFrame()), /> \//)

  result.stdin.write('status')
  result.stdin.write('\r')
  await waitForInk()
  assert.match(stripAnsi(result.lastFrame()), /Health/)
  assert.match(stripAnsi(result.lastFrame()), /API: ok/)

  result.stdin.write('\u001B')
  await waitForInk()
  result.stdin.write('a')
  await waitForInk()
  assert.match(stripAnsi(result.lastFrame()), /Audit/)
  assert.match(stripAnsi(result.lastFrame()), /Job text:/)
})

test('HireProof TUI renders persistent status bar and richer help shortcuts', async () => {
  const { HireProofTuiApp } = await import('../packages/hireproof-cli/lib/tui-app.mjs')
  const result = render(React.createElement(HireProofTuiApp, {
    baseUrl: 'https://hireproof.test',
    apiKey: 'test_key',
    color: false,
    initialReport: sampleReport({ verdict: 'caution', riskScore: 44 }),
  }))

  assert.match(stripAnsi(result.lastFrame()), /API not checked \| mode demo \| key configured \| latest Caution 44\/100/)

  result.stdin.write('?')
  await waitForInk()
  const frame = stripAnsi(result.lastFrame())
  assert.match(frame, /Keyboard shortcuts/)
  assert.match(frame, /\/ focus command palette/)
  assert.match(frame, /a audit/)
  assert.match(frame, /h health/)
})

test('HireProof TUI command console understands report and ask aliases', async () => {
  const { HireProofTuiApp } = await import('../packages/hireproof-cli/lib/tui-app.mjs')
  const result = render(React.createElement(HireProofTuiApp, {
    baseUrl: 'https://hireproof.test',
    apiKey: 'test_key',
    color: false,
    readReports: async () => [{
      id: 'report_saved',
      verdict: 'safe',
      riskScore: 18,
      summary: 'Looks normal.',
    }],
  }))

  result.stdin.write('history')
  result.stdin.write('\r')
  await waitForInk()
  assert.match(stripAnsi(result.lastFrame()), /report_saved/)

  result.stdin.write('\u001B')
  await waitForInk()
  result.stdin.write('chat')
  result.stdin.write('\r')
  await waitForInk()
  assert.match(stripAnsi(result.lastFrame()), /Ask HireProof/)
})

test('HireProof TUI renders local Ask HireProof answers from selected report', async () => {
  const { HireProofTuiApp } = await import('../packages/hireproof-cli/lib/tui-app.mjs')
  const result = render(React.createElement(HireProofTuiApp, {
    baseUrl: 'https://hireproof.test',
    apiKey: 'test_key',
    color: false,
    initialScreen: 'ask',
    initialReport: sampleReport({
      summary: 'High-risk because the recruiter requires Telegram and no interview.',
    }),
  }))

  result.stdin.write('why')
  result.stdin.write('\r')
  await waitForInk()

  const frame = stripAnsi(result.lastFrame())
  assert.match(frame, /Ask HireProof/)
  assert.match(frame, /High-risk because the recruiter requires Telegram/)
})

test('HireProof TUI report history stores sanitized summaries only', async () => {
  const { saveReportSummary, readReportSummaries } = await import('../packages/hireproof-cli/lib/report-history.mjs')
  const historyHome = await mkdtemp(path.join(os.tmpdir(), 'hireproof-history-'))
  const sensitiveReport = sampleReport({
    summary: 'OCR found recruiter jane.private@example.test, phone +1 (415) 555-1212, passcode 918273, and https://private.example.test/apply.',
    extractedClaims: {
      company: 'PrivateCo jane.private@example.test',
      role: 'Assistant passcode 918273',
      salary: 'Huge pay',
      location: 'Remote',
      contactMethod: 'Call +1 (415) 555-1212',
      applicationPath: 'https://private.example.test/apply',
    },
    redFlags: ['Contact jane.private@example.test directly'],
    greenFlags: ['Mentions a company'],
    evidence: [
      {
        source: 'Screenshot OCR',
        type: 'OCR',
        snippet: 'Extracted screenshot text: jane.private@example.test +1 (415) 555-1212 passcode 918273 https://private.example.test/apply',
      },
    ],
    nextSteps: ['Do not send passcode 918273 to jane.private@example.test'],
  })

  try {
    await saveReportSummary(sensitiveReport, {
      configHome: historyHome,
      inputText: 'PRIVATE recruiter text should not be stored',
    })
    const reports = await readReportSummaries({ configHome: historyHome })
    const historyFile = path.join(historyHome, 'reports.jsonl')
    const raw = await readFile(historyFile, 'utf8')
    const dirMode = (await stat(historyHome)).mode & 0o777
    const fileMode = (await stat(historyFile)).mode & 0o777

    assert.equal(reports.length, 1)
    assert.equal(reports[0].id, 'report_test')
    assert.equal(reports[0].verdict, 'high-risk')
    assert.doesNotMatch(raw, /PRIVATE recruiter text/)
    assert.doesNotMatch(raw, /test_key/)
    assert.doesNotMatch(raw, /jane\.private@example\.test/)
    assert.doesNotMatch(raw, /\+1 \(415\) 555-1212/)
    assert.doesNotMatch(raw, /918273/)
    assert.doesNotMatch(raw, /private\.example\.test/)
    assert.match(raw, /\[redacted email\]/)
    assert.match(raw, /\[redacted phone\]/)
    assert.match(raw, /\[redacted code\]/)
    assert.match(raw, /\[redacted url\]/)
    if (process.platform !== 'win32') {
      assert.equal(dirMode, 0o700)
      assert.equal(fileMode, 0o600)
    }
  } finally {
    await rm(historyHome, { recursive: true, force: true })
  }
})

test('HireProof TUI paste audit flow runs audit client and shows report details', async () => {
  const { HireProofTuiApp } = await import('../packages/hireproof-cli/lib/tui-app.mjs')
  let receivedPayload = null
  let savedReport = null
  const result = render(React.createElement(HireProofTuiApp, {
    baseUrl: 'https://hireproof.test',
    apiKey: 'test_key',
    color: false,
    initialScreen: 'paste',
    auditClient: async (payload) => {
      receivedPayload = payload
      return sampleReport()
    },
    saveReport: async (report) => {
      savedReport = report
    },
  }))

  result.stdin.write('Remote job. Telegram only.')
  result.stdin.write('\r')
  await waitForInk()
  assert.match(stripAnsi(result.lastFrame()), /Reading input/)
  assert.match(stripAnsi(result.lastFrame()), /Calling HireProof API/)
  await waitForInk()

  const frame = stripAnsi(result.lastFrame())
  assert.equal(receivedPayload.text, 'Remote job. Telegram only.')
  assert.equal(receivedPayload.mode, 'demo')
  assert.equal(savedReport.id, 'report_test')
  assert.match(frame, /Verdict: High-Risk/)
  assert.match(frame, /Telegram-only contact/)
  assert.match(frame, /Evidence/)
})

test('HireProof TUI health screen loads live readiness data', async () => {
  const { HireProofTuiApp } = await import('../packages/hireproof-cli/lib/tui-app.mjs')
  const result = render(React.createElement(HireProofTuiApp, {
    baseUrl: 'https://hireproof.test',
    apiKey: 'test_key',
    color: false,
    initialScreen: 'health',
    healthClient: async () => ({
      status: 'ok',
      readiness: { state: 'ready' },
      costPosture: { publicLiveEvidence: true, publicOcr: false, byokRequiredForApiLive: true },
    }),
  }))

  await waitForInk()

  const frame = stripAnsi(result.lastFrame())
  assert.match(frame, /Health/)
  assert.match(frame, /API: ok/)
  assert.match(frame, /Readiness: ready/)
  assert.match(frame, /Live evidence\s+public-enabled/)
})

test('HireProof TUI recent reports screen loads saved summaries', async () => {
  const { HireProofTuiApp } = await import('../packages/hireproof-cli/lib/tui-app.mjs')
  const result = render(React.createElement(HireProofTuiApp, {
    baseUrl: 'https://hireproof.test',
    apiKey: 'test_key',
    color: false,
    initialScreen: 'reports',
    readReports: async () => [{
      id: 'report_saved',
      verdict: 'caution',
      riskScore: 44,
      summary: 'Saved report summary.',
      company: 'Example Co',
      role: 'Assistant',
    }],
  }))

  await waitForInk()

  const frame = stripAnsi(result.lastFrame())
  assert.match(frame, /Recent reports/)
  assert.match(frame, /report_saved/)
  assert.match(frame, /Caution/)
  assert.match(frame, /Saved report summary/)
})
