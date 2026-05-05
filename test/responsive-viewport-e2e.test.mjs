import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { request as httpRequest } from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const BASE_URL = process.env.HIREPROOF_E2E_URL || 'http://localhost:3002'

const ROUTES = [
  '/',
  '/audit',
  '/demo/linkedin',
  '/developer',
  '/explore',
  '/history',
  '/lab',
  '/pricing',
  '/proof',
  '/settings',
  '/trends',
  '/docs',
  '/docs/api-reference',
  '/docs/architecture',
  '/docs/authentication',
  '/docs/automations',
  '/docs/chat-sdk-agents',
  '/docs/chrome-extension',
  '/docs/cli',
  '/docs/competitive-roadmap',
  '/docs/dead-internet',
  '/docs/discord-bot',
  '/docs/email-forwarding',
  '/docs/headless-api',
  '/docs/how-it-works',
  '/docs/ide-skills',
  '/docs/investigation-engine',
  '/docs/langchain',
  '/docs/legal',
  '/docs/mcp',
  '/docs/omni-modal',
  '/docs/quickstart',
  '/docs/rate-limiting',
  '/docs/risk-scoring',
  '/docs/sdk',
  '/docs/sdk-quickstart',
  '/docs/security',
  '/docs/self-hosting',
  '/docs/skills',
  '/docs/slack-bot',
  '/docs/streaming',
  '/docs/telegram-bot',
  '/docs/triple-track-coverage',
  '/docs/use-cases',
  '/docs/verified-badge',
  '/docs/webhooks',
]

const TABLE_ROUTES = [
  '/docs/api-reference',
  '/docs/architecture',
  '/docs/authentication',
  '/docs/omni-modal',
  '/docs/skills',
  '/docs/use-cases',
]

const ROUTE_GROUPS = [
  { name: 'core app routes', routes: ROUTES.slice(0, 11) },
  { name: 'docs routes A-M', routes: ROUTES.slice(11, 29) },
  { name: 'docs routes O-Z', routes: ROUTES.slice(29) },
]

const VIEWPORTS = [
  { name: 'small phone portrait', width: 320, height: 568 },
  { name: 'phone portrait', width: 390, height: 844 },
  { name: 'phone landscape', width: 568, height: 320 },
  { name: 'tablet portrait', width: 768, height: 1024 },
  { name: 'tablet landscape', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide desktop', width: 1920, height: 1080 },
]

function checkServer() {
  return new Promise((resolve) => {
    const req = httpRequest(`${BASE_URL}/`, { method: 'GET', timeout: 1500 }, (res) => {
      res.resume()
      resolve(Boolean(res.statusCode && res.statusCode < 500))
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    req.end()
  })
}

async function ensureServer() {
  if (await checkServer()) return null

  const child = spawn('npm', ['run', 'dev'], {
    cwd: new URL('..', import.meta.url),
    shell: true,
    stdio: 'ignore',
  })

  for (let attempt = 0; attempt < 60; attempt += 1) {
    await delay(1000)
    if (await checkServer()) return child
  }

  child.kill()
  throw new Error(`Timed out waiting for ${BASE_URL}`)
}

for (const routeGroup of ROUTE_GROUPS) {
  test(`${routeGroup.name} fit phone, tablet, desktop, and orientation viewports without page-level horizontal overflow`, { timeout: 300_000 }, async () => {
    const server = await ensureServer()
    const browser = await chromium.launch()
    const page = await browser.newPage()
    const failures = []

    try {
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })

        for (const route of routeGroup.routes) {
          const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load', timeout: 30_000 })
          assert.ok(response?.status() && response.status() < 400, `${route} returned ${response?.status()}`)

          await page.evaluate(() => window.scrollTo(0, 0))
          await page.waitForTimeout(100)

          const metrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }))

          if (metrics.scrollWidth > metrics.clientWidth + 2) {
            failures.push(`${route} at ${viewport.name}: ${metrics.scrollWidth}px > ${metrics.clientWidth}px`)
          }
        }
      }

      assert.deepEqual(failures, [])
    } finally {
      await browser.close()
      server?.kill()
    }
  })
}

test('docs tables scroll internally instead of clipping on narrow viewports', { timeout: 90_000 }, async () => {
  const server = await ensureServer()
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const failures = []
  const narrowViewports = VIEWPORTS.filter((viewport) => viewport.width <= 768)

  try {
    for (const viewport of narrowViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      for (const route of TABLE_ROUTES) {
        const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load', timeout: 30_000 })
        assert.ok(response?.status() && response.status() < 400, `${route} returned ${response?.status()}`)
        await page.waitForTimeout(100)

        const tableIssues = await page.evaluate(() =>
          Array.from(document.querySelectorAll('table')).flatMap((table, index) => {
            const wrapper = table.parentElement
            if (!wrapper || getComputedStyle(table).display === 'none') return []

            const tableBox = table.getBoundingClientRect()
            const wrapperBox = wrapper.getBoundingClientRect()
            if (tableBox.width === 0 || wrapperBox.width === 0) return []

            const overflowsWrapper = tableBox.width > wrapperBox.width + 2 || table.scrollWidth > wrapper.clientWidth + 2
            if (!overflowsWrapper) return []

            const overflowX = getComputedStyle(wrapper).overflowX
            const canScrollInternally = ['auto', 'scroll'].includes(overflowX) && wrapper.scrollWidth > wrapper.clientWidth + 2
            return canScrollInternally ? [] : [`table ${index + 1} is clipped in a non-scrollable wrapper (${overflowX})`]
          }),
        )

        for (const issue of tableIssues) {
          failures.push(`${route} at ${viewport.name}: ${issue}`)
        }
      }
    }

    assert.deepEqual(failures, [])
  } finally {
    await browser.close()
    server?.kill()
  }
})
