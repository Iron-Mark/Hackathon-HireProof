import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { request as httpRequest } from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const BASE_URL = process.env.HIREPROOF_E2E_URL || 'http://localhost:3002'

const VIEWPORTS = [
  { name: 'small phone portrait', width: 320, height: 568 },
  { name: 'phone landscape', width: 568, height: 320 },
  { name: 'tablet portrait', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
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

async function assertNoPageOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollX: window.scrollX,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))

  assert.ok(Math.abs(metrics.scrollX) <= 1, `${label}: unexpected scrollX ${metrics.scrollX}`)
  assert.ok(metrics.scrollWidth <= metrics.clientWidth + 2, `${label}: html overflow ${metrics.scrollWidth} > ${metrics.clientWidth}`)
  assert.ok(metrics.bodyScrollWidth <= metrics.clientWidth + 2, `${label}: body overflow ${metrics.bodyScrollWidth} > ${metrics.clientWidth}`)
}

test('interactive drawers, command search, docs tabs, and wide tables stay viewport-safe', { timeout: 180_000 }, async () => {
  const server = await ensureServer()
  const browser = await chromium.launch()

  try {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
      })
      const prefix = viewport.name

      await page.goto(`${BASE_URL}/docs`, { waitUntil: 'networkidle' })
      await assertNoPageOverflow(page, `${prefix} docs initial`)

      if (viewport.width < 1024) {
        await page.getByRole('button', { name: 'Open documentation menu' }).click()
        await page.waitForTimeout(200)
        await assertNoPageOverflow(page, `${prefix} docs drawer open`)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        await assertNoPageOverflow(page, `${prefix} docs drawer closed`)
      }

      if (viewport.width >= 640) {
        const subnav = page.locator('div').filter({ has: page.getByRole('link', { name: 'API Reference', exact: true }) }).first()
        await subnav.evaluate((el) => {
          el.scrollLeft = el.scrollWidth
        })
        await page.getByRole('link', { name: 'SDK', exact: true }).click()
      } else {
        await page.getByRole('button', { name: 'Open documentation menu' }).click()
        await page.locator('aside.fixed a[href="/docs/sdk"]').first().click()
      }
      await page.waitForURL(/\/docs\/sdk$/, { timeout: 10_000 })
      await assertNoPageOverflow(page, `${prefix} docs subnav click`)

      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
      if (viewport.width < 1024) {
        await page.getByRole('button', { name: 'Open site navigation' }).click()
        await page.waitForTimeout(200)
        await assertNoPageOverflow(page, `${prefix} site nav open`)
        await page.getByRole('menuitem', { name: /^Search/ }).click()
      } else {
        await page.getByRole('button', { name: /Search site/ }).click()
      }

      await page.waitForTimeout(250)
      await assertNoPageOverflow(page, `${prefix} command search open`)
      await page.getByPlaceholder('Search pages, docs, APIs, workflows...').fill('pricing')
      await page.waitForTimeout(150)
      await assertNoPageOverflow(page, `${prefix} command search typed`)
      await page.getByRole('button').filter({ hasText: 'Pricing' }).first().click()
      await page.waitForURL(/\/pricing$/, { timeout: 10_000 })
      await assertNoPageOverflow(page, `${prefix} command search navigation`)

      const tableScroller = page.locator('table').locator('xpath=ancestor::div[contains(@class,"overflow-x-auto")][1]').first()
      assert.ok(await tableScroller.count(), `${prefix}: pricing table has an overflow wrapper`)
      await tableScroller.evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })
      await page.waitForTimeout(150)
      await assertNoPageOverflow(page, `${prefix} pricing table scrolled`)

      await page.close()
    }
  } finally {
    await browser.close()
    server?.kill()
  }
})
