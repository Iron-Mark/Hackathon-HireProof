import test from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { BASE_URL, ensureE2eServer } from './helpers/e2e-server.mjs'

test('demo audit path auto-fills URL and location then renders a verdict', { timeout: 90_000 }, async () => {
  const server = await ensureE2eServer('/audit')
  const browser = await chromium.launch()

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    const page = await context.newPage()
    const sample = [
      'Company: Urgent Remote Hiring Team',
      'Role: Frontend Intern',
      'Salary: PHP 80,000 per week',
      'Work setup: hybrid - BGC',
      'Contact: Telegram only',
      'Apply: linkedin.com/jobs/view/full-flow-demo',
    ].join('\n')

    await page.goto(`${BASE_URL}/audit`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /^Check my post\./ }).click()
    await page.getByTestId('demo-cost-snackbar').waitFor({ timeout: 5_000 })
    assert.match(await page.getByTestId('demo-cost-snackbar').innerText(), /Live evidence is capped/i)
    await page.getByTestId('job-input-text').fill(sample)

    assert.equal(await page.getByTestId('job-input-url').inputValue(), 'https://linkedin.com/jobs/view/full-flow-demo')
    assert.equal(await page.getByTestId('job-input-location').inputValue(), 'Hybrid - BGC')

    await page.getByRole('button', { name: 'Investigate Job Post' }).click()
    await page.getByTestId('audit-result-verdict').waitFor({ timeout: 10_000 })

    const verdictText = await page.getByTestId('audit-result-verdict').innerText()
    assert.match(verdictText, /High-Risk/i)
    assert.match(await page.getByText('Evidence receipts', { exact: true }).first().innerText(), /Evidence receipts/i)
  } finally {
    await browser.close()
    await server.release()
  }
})

test('local history card opens the archived browser-stored report', { timeout: 90_000 }, async () => {
  const server = await ensureE2eServer('/audit')
  const browser = await chromium.launch()

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    await context.addInitScript(() => {
      localStorage.setItem('hireproof_audit_history', JSON.stringify([{
        id: 'demo_high-risk_local_history',
        verdict: 'high-risk',
        riskScore: 92,
        confidence: 'Very High',
        summary: 'Local history report.',
        extractedClaims: {
          company: 'Local Archive QA',
          role: 'Remote Fraud Analyst',
          salary: 'PHP 80,000 per week',
          location: 'Hybrid - BGC',
          contactMethod: 'Telegram',
          applicationPath: 'linkedin.com/jobs/view/local-history',
        },
        redFlags: ['Telegram-only contact'],
        greenFlags: [],
        evidence: [{ source: 'Company Verification', snippet: 'No official hiring page found.', type: 'Company Check' }],
        alternatives: [],
        nextSteps: ['Do not send personal documents'],
        timestamp: new Date().toISOString(),
        mode: 'demo',
        credentialMode: 'demo',
        source: 'demo',
      }]))
    })

    const page = await context.newPage()
    await page.goto(`${BASE_URL}/history`, { waitUntil: 'networkidle' })
    await page.getByTestId('history-report-card').click()
    await page.getByTestId('audit-result-verdict').waitFor({ timeout: 10_000 })

    assert.match(page.url(), /\/history\/demo_high-risk_local_history/)
    assert.match(await page.getByTestId('audit-result-verdict').innerText(), /High-Risk/i)
    assert.match(await page.getByText('Local Archive QA').first().innerText(), /Local Archive QA/)
  } finally {
    await browser.close()
    await server.release()
  }
})
