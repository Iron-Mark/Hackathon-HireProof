import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = (process.env.HIREPROOF_PROOF_BASE_URL || 'http://127.0.0.1:3002').replace(/\/$/, '')
const outputDir = process.env.HIREPROOF_PROOF_OUTPUT_DIR || path.join('artifacts', 'web-vitals')
const routes = (process.env.HIREPROOF_PROOF_ROUTES || '/,/audit,/demo/linkedin,/docs,/lab')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean)
const prewarmEnabled = process.env.HIREPROOF_PROOF_PREWARM !== '0' && /^https?:\/\//.test(baseUrl)
const prewarmRoute = process.env.HIREPROOF_PROOF_PREWARM_ROUTE || '/robots.txt'

const budgets = {
  lcpMs: Number(process.env.HIREPROOF_BUDGET_LCP_MS || 2500),
  cls: Number(process.env.HIREPROOF_BUDGET_CLS || 0.1),
  longTaskTotalMs: Number(process.env.HIREPROOF_BUDGET_LONG_TASK_TOTAL_MS || 300),
  longTaskMaxMs: Number(process.env.HIREPROOF_BUDGET_LONG_TASK_MAX_MS || 200),
}

function routeUrl(route) {
  return `${baseUrl}${route.startsWith('/') ? route : `/${route}`}`
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function collectRoute(page, route) {
  const url = routeUrl(route)
  await page.addInitScript(() => {
    window.__hireproofVitals = {
      cls: 0,
      lcp: 0,
      lcpElement: null,
      longTasks: [],
    }

    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) window.__hireproofVitals.cls += entry.value || 0
        }
      }).observe({ type: 'layout-shift', buffered: true })
    } catch {}

    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const latest = entries[entries.length - 1]
        if (latest) {
          window.__hireproofVitals.lcp = latest.startTime || latest.renderTime || latest.loadTime || 0
          const element = latest.element
          window.__hireproofVitals.lcpElement = element
            ? {
                tagName: element.tagName,
                id: element.id || '',
                className:
                  typeof element.className === 'string'
                    ? element.className
                    : '',
                text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 140),
                source: element.currentSrc || element.src || '',
              }
            : null
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {}

    try {
      new PerformanceObserver((entryList) => {
        window.__hireproofVitals.longTasks.push(
          ...entryList.getEntries().map((entry) => ({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
          })),
        )
      }).observe({ type: 'longtask', buffered: true })
    } catch {}
  })

  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(1200)

  const metrics = await page.evaluate(() => {
    const paints = performance.getEntriesByType('paint')
    const nav = performance.getEntriesByType('navigation')[0]
    const fcp = paints.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0
    const vitals = window.__hireproofVitals || { cls: 0, lcp: 0, longTasks: [] }
    const longTaskTotal = vitals.longTasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0)
    const longTaskMax = vitals.longTasks.reduce((max, task) => Math.max(max, task.duration), 0)

    return {
      fcpMs: Math.round(fcp),
      lcpMs: Math.round(vitals.lcp),
      lcpElement: vitals.lcpElement,
      cls: Number(vitals.cls.toFixed(4)),
      longTaskCount: vitals.longTasks.length,
      longTaskTotalMs: Math.round(longTaskTotal),
      longTaskMaxMs: Math.round(longTaskMax),
      domContentLoadedMs: Math.round(nav?.domContentLoadedEventEnd || 0),
      loadEventMs: Math.round(nav?.loadEventEnd || 0),
    }
  })

  const result = {
    route,
    url,
    status: response?.status() || 0,
    metrics,
    budgets,
    pass:
      (response?.ok() || false) &&
      metrics.lcpMs > 0 &&
      metrics.lcpMs <= budgets.lcpMs &&
      metrics.cls <= budgets.cls &&
      metrics.longTaskTotalMs <= budgets.longTaskTotalMs &&
      metrics.longTaskMaxMs <= budgets.longTaskMaxMs,
  }

  return result
}

async function prewarmContext(context) {
  if (!prewarmEnabled) {
    return {
      enabled: false,
      route: prewarmRoute,
      status: null,
      ok: null,
      error: null,
    }
  }

  const page = await context.newPage()
  try {
    const response = await page.goto(routeUrl(prewarmRoute), { waitUntil: 'domcontentloaded', timeout: 30000 })
    return {
      enabled: true,
      route: prewarmRoute,
      status: response?.status() || 0,
      ok: response?.ok() || false,
      error: null,
    }
  } catch (error) {
    return {
      enabled: true,
      route: prewarmRoute,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    await page.close()
  }
}

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})

const results = []
let prewarm = {
  enabled: false,
  route: prewarmRoute,
  status: null,
  ok: null,
  error: null,
}
try {
  prewarm = await prewarmContext(context)
  for (const route of routes) {
    const page = await context.newPage()
    try {
      results.push(await collectRoute(page, route))
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  device: 'mobile-390x844',
  prewarm,
  budgets,
  results,
  pass: results.every((result) => result.pass),
}

await mkdir(outputDir, { recursive: true })
const outputPath = path.join(outputDir, `hireproof-web-vitals-${stamp()}.json`)
const latestOutputPath = path.join(outputDir, 'hireproof-web-vitals-latest.json')
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(latestOutputPath, `${JSON.stringify(summary, null, 2)}\n`)

for (const result of results) {
  const status = result.pass ? 'PASS' : 'FAIL'
  console.log(
    `${status} ${result.route} status=${result.status} lcp=${result.metrics.lcpMs}ms lcpElement=${result.metrics.lcpElement?.tagName || 'unknown'} cls=${result.metrics.cls} longTaskTotal=${result.metrics.longTaskTotalMs}ms longTaskMax=${result.metrics.longTaskMaxMs}ms`,
  )
}
console.log(`Report: ${outputPath}`)
console.log(`Latest: ${latestOutputPath}`)

if (!summary.pass) {
  process.exitCode = 1
}
