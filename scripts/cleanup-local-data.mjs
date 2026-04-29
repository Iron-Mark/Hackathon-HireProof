import fs from 'node:fs/promises'
import path from 'node:path'
import { pruneRecordMapByTimestamp, pruneRecordsByTimestamp } from '../lib/local-data-retention.mjs'

const dataDir = path.join(process.cwd(), 'data')

async function readJson(name, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(dataDir, `${name}.json`), 'utf8'))
  } catch {
    return fallback
  }
}

async function writeJson(name, value) {
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(path.join(dataDir, `${name}.json`), JSON.stringify(value, null, 2))
}

async function cleanup() {
  const now = new Date()
  const reports = pruneRecordMapByTimestamp(await readJson('reports', {}), {
    now,
    maxAgeDays: 30,
    maxRecords: 500,
    timestampKey: 'timestamp',
  })
  const usage = pruneRecordsByTimestamp(await readJson('usage', []), {
    now,
    maxAgeDays: 30,
    maxRecords: 2000,
    timestampKey: 'createdAt',
  })

  await writeJson('reports', reports)
  await writeJson('usage', usage)

  console.log(`Local JSON cleanup complete: ${Object.keys(reports).length} reports, ${usage.length} usage events retained.`)
}

cleanup().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
