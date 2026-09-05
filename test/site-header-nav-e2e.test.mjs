import test from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { BASE_URL, ensureE2eServer } from './helpers/e2e-server.mjs'

test('mobile hamburger opens a full-screen navigation menu and opens pages from it', { timeout: 90_000 }, async () => {
  const server = await ensureE2eServer('/')
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 640 } })
    await page.goto(BASE_URL, { waitUntil: 'load' })

    const header = page.locator('header')
    assert.equal(await header.getByRole('button', { name: 'Toggle theme' }).count(), 0)
    assert.equal(await header.getByRole('button', { name: /^Search site/ }).count(), 0)

    await page.getByRole('button', { name: 'Open site navigation' }).click()
    const mobileMenu = page.locator('[role="menu"]').filter({ hasText: 'Start here' })
    await mobileMenu.waitFor({ state: 'visible' })
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

    await page.keyboard.press('Shift+Tab')
    assert.ok(await mobileMenu.evaluate((menu) => menu.contains(document.activeElement)))
    await page.keyboard.press('Tab')
    assert.ok(await mobileMenu.evaluate((menu) => menu.contains(document.activeElement)))

    assert.ok(await mobileMenu.getByRole('menuitem', { name: /^Search/ }).isVisible())
    assert.ok(await page.getByRole('button', { name: 'Toggle theme' }).isVisible())

    await mobileMenu.getByRole('menuitem', { name: /Explore/ }).click()
    await page.waitForURL(/\/explore$/, { timeout: 10_000 })
  } finally {
    await browser.close()
    await server.release()
  }
})

test('desktop resources dropdown exposes one clickable menu', { timeout: 90_000 }, async () => {
  const server = await ensureE2eServer('/')
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
    await server.release()
  }
})
