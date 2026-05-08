import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const root = process.cwd()
const require = createRequire(import.meta.url)
const mode = process.argv.includes('--test') ? 'test' : 'build'

async function readJson(file) {
  return JSON.parse(await readFile(path.join(root, file), 'utf8'))
}

async function listJsonFiles(dir) {
  const absolute = path.join(root, dir)
  const entries = await readdir(absolute)
  const files = []
  for (const entry of entries) {
    const full = path.join(absolute, entry)
    const itemStat = await stat(full)
    if (itemStat.isDirectory()) {
      files.push(...await listJsonFiles(path.relative(root, full)))
    } else if (entry.endsWith('.json')) {
      files.push(path.relative(root, full))
    }
  }
  return files
}

async function validateN8n() {
  const pkg = await readJson('integrations/n8n-nodes-hireproof/package.json')
  assert.equal(pkg.name, 'n8n-nodes-hireproof')
  assert.ok(pkg.keywords.includes('n8n-community-node-package'))
  assert.deepEqual(pkg.n8n.credentials, ['credentials/HireProofApi.credentials.js'])
  assert.deepEqual(pkg.n8n.nodes, ['nodes/HireProof/HireProof.node.js'])

  for (const file of [...pkg.n8n.credentials, ...pkg.n8n.nodes]) {
    assert.ok(existsSync(path.join(root, 'integrations/n8n-nodes-hireproof', file)), `Missing n8n file: ${file}`)
  }

  const { buildAuditRequestOptions } = require('../integrations/n8n-nodes-hireproof/lib/hireproof-request.js')
  const syncOptions = buildAuditRequestOptions({
    baseUrl: 'https://hireproof.tech/',
    apiKey: 'hireproof_agent_demo_key',
    text: 'Remote frontend intern. PHP 80,000/week.',
    mode: 'demo',
  })
  assert.equal(syncOptions.url, 'https://hireproof.tech/api/v1/audit')
  assert.equal(syncOptions.body.mode, 'demo')

  const { HireProofApi } = require('../integrations/n8n-nodes-hireproof/credentials/HireProofApi.credentials.js')
  const { HireProof } = require('../integrations/n8n-nodes-hireproof/nodes/HireProof/HireProof.node.js')
  assert.equal(new HireProofApi().name, 'hireProofApi')
  assert.equal(new HireProof().description.name, 'hireProof')

  console.log('n8n package validated')
}

async function validateMake() {
  const files = await listJsonFiles('integrations/make-hireproof')
  assert.ok(files.length >= 5, 'Make source pack should include app, connection, modules, and tests')
  for (const file of files) await readJson(file)

  const app = await readJson('integrations/make-hireproof/app.json')
  const connection = await readJson('integrations/make-hireproof/connections/hireproof-api.json')
  const sync = await readJson('integrations/make-hireproof/modules/audit-job-post.json')
  const asyncModule = await readJson('integrations/make-hireproof/modules/audit-job-post-async.json')
  const health = await readJson('integrations/make-hireproof/modules/get-api-health.json')

  assert.equal(app.name, 'hireproof')
  assert.equal(connection.headers['x-api-key'], '{{connection.apiKey}}')
  assert.equal(sync.request.url, '{{connection.baseUrl}}/api/v1/audit')
  assert.equal(asyncModule.request.body.webhook_url, '{{parameters.webhookUrl}}')
  assert.equal(health.request.url, '{{connection.baseUrl}}/api/health')
  for (const field of ['id', 'verdict', 'riskScore', 'confidence', 'summary', 'redFlags', 'greenFlags', 'evidence', 'nextSteps']) {
    assert.ok(sync.output.includes(field), `Make sync output missing ${field}`)
  }

  console.log('Make source pack validated')
}

async function validateLangChain() {
  const pkg = await readJson('packages/hireproof-langchain/package.json')
  assert.equal(pkg.name, '@hireproof/langchain')
  assert.ok(pkg.peerDependencies['@langchain/core'])

  const langchain = require('../packages/hireproof-langchain/dist/index.js')
  assert.equal(typeof langchain.createHireProofAuditTool, 'function')
  assert.equal(typeof langchain.runHireProofAudit, 'function')
  assert.equal(langchain.isSafeEnough({ verdict: 'safe', riskScore: 10 }), true)

  class FakeDynamicStructuredTool {
    constructor(config) {
      Object.assign(this, config)
    }
  }
  const tool = langchain.createHireProofAuditTool({ DynamicStructuredTool: FakeDynamicStructuredTool })
  assert.equal(tool.name, 'hireproof_job_safety_audit')
  assert.ok(tool.schema.parse({ text: 'Remote frontend intern. PHP 80,000/week.' }))

  if (mode === 'test') {
    const report = await langchain.runHireProofAudit({
      text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
      location: 'Philippines',
      mode: 'demo',
    })
    assert.equal(report.verdict, 'high-risk')
    assert.ok(Number(report.riskScore) >= 80)
  }

  console.log('LangChain package validated')
}

async function validateDownloads() {
  const downloadFiles = [
    'public/downloads/hireproof-n8n-workflow.json',
    'public/downloads/hireproof-make-http-config.json',
    'public/downloads/hireproof-langchain-tool.ts',
    'public/downloads/hireproof-automation-curl.sh',
  ]
  for (const file of downloadFiles) {
    assert.ok(existsSync(path.join(root, file)), `Missing download template: ${file}`)
  }
  await readJson('public/downloads/hireproof-n8n-workflow.json')
  await readJson('public/downloads/hireproof-make-http-config.json')

  console.log('download templates validated')
}

await validateN8n()
await validateMake()
await validateLangChain()
await validateDownloads()

console.log(`Integration ${mode} validation passed.`)
