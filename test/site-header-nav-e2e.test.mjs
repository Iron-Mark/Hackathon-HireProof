import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { request as httpRequest } from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const BASE_URL = process.env.HIREPROOF_E2E_URL || 'http://localhost:3002'

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

test('mobile hamburger opens a full-screen navigation menu and opens pages from it', { timeout: 90_000 }, async () => {
  const server = await ensureServer()
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 640 } })
    await page.goto(BASE_URL, { waitUntil: 'load' })

    const header = page.locator('header')
    assert.equal(await header.getByRole('button', { name: 'Toggle theme' }).count(), 0)
    assert.equal(await header.getByRole('button', { name: /^Search site/ }).count(), 0)

    await page.getByRole('button', { name: 'Open site navigation' }).click()
    const visibleMenus = await page.locator('[role="menu"]').evaluateAll((menus) =>
      menus
        .map((menu) => {
          const box = menu.getBoundingClientRect()
          return {
            text: menu.textContent || '',
            visible: box.width > 0 && box.height > 0,
            left: box.left,
            right: box.right,
          }
        })
        .filter((menu) => menu.visible),
    )

    assert.equal(visibleMenus.length, 1)
    assert.ok(visibleMenus[0].text.includes('Start here'))
    assert.equal(visibleMenus[0].left, 0)
    assert.equal(visibleMenus[0].right, 320)
    assert.ok(await page.getByRole('button', { name: 'Close site navigation' }).isVisible())
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Close site navigation')

    const mobileMenu = page.locator('[role="menu"]').filter({ hasText: 'Start here' })
    await page.keyboard.press('Shift+Tab')
    assert.ok(await mobileMenu.evaluate((menu) => menu.contains(document.activeElement)))
    await page.keyboard.press('Tab')
    assert.ok(await mobileMenu.evaluate((menu) => menu.contains(document.activeElement)))

    assert.ok(await page.getByRole('menuitem', { name: /^Search/ }).isVisible())
    assert.ok(await page.getByRole('button', { name: 'Toggle theme' }).isVisible())

    await page.getByRole('menuitem', { name: /Explore/ }).click()
    await page.waitForURL(/\/explore$/, { timeout: 10_000 })
  } finally {
    await browser.close()
    server?.kill()
  }
})

test('desktop resources dropdown exposes one clickable menu', { timeout: 90_000 }, async () => {
  const server = await ensureServer()
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } })
    await page.goto(BASE_URL, { waitUntil: 'load' })

    await page.getByRole('button', { name: 'Resources' }).click()
    const visibleMenus = await page.locator('[role="menu"]').evaluateAll((menus) =>
      menus
        .map((menu) => {
          const box = menu.getBoundingClientRect()
          return {
            text: menu.textContent || '',
            visible: box.width > 0 && box.height > 0,
          }
        })
        .filter((menu) => menu.visible),
    )

    assert.equal(visibleMenus.length, 1)
    assert.ok(!visibleMenus[0].text.includes('Start here'))

    await page.getByRole('menuitem', { name: /Agent Lab/ }).click()
    await page.waitForURL(/\/lab$/, { timeout: 10_000 })
  } finally {
    await browser.close()
    server?.kill()
  }
})
