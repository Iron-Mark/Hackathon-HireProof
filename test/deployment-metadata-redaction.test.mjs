import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = new URL('..', import.meta.url)
const testDir = path.dirname(fileURLToPath(import.meta.url))
const pathsToScan = [
  'DEPLOYMENT.md',
  'README.md',
  'docs',
  'scripts',
  '.github',
]

async function collectTextFiles(entry) {
  const absolute = new URL(entry, root)
  const stat = await fs.stat(absolute)

  if (stat.isFile()) {
    return [absolute]
  }

  const files = []
  for (const child of await fs.readdir(absolute, { withFileTypes: true })) {
    if (child.name === 'node_modules' || child.name === '.git') continue
    const childEntry = path.posix.join(entry, child.name)
    if (child.isDirectory()) {
      files.push(...await collectTextFiles(childEntry))
      continue
    }
    if (/\.(md|mdx|txt|json|ya?ml|example|ps1|sh)$/i.test(child.name)) {
      files.push(new URL(childEntry, root))
    }
  }
  return files
}

test('repository docs do not publish Vercel project identifiers', async () => {
  const files = (await Promise.all(pathsToScan.map(collectTextFiles))).flat()
  const violations = []

  for (const file of files) {
    const source = await fs.readFile(file, 'utf8')
    const relative = path.relative(testDir, fileURLToPath(file))

    if (/prj_[A-Za-z0-9]+/.test(source)) {
      violations.push(`${relative}: contains Vercel project ID`)
    }
    if (/\biron-marks-projects\/hireproof\b/.test(source)) {
      violations.push(`${relative}: contains concrete Vercel project namespace`)
    }
  }

  assert.deepEqual(violations, [])
})
