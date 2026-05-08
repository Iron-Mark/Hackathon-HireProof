import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { buildAuditRequestBody, buildAuditRequestOptions } = require('../lib/hireproof-request.js')
const { HireProofApi } = require('../credentials/HireProofApi.credentials.js')
const { HireProof } = require('../nodes/HireProof/HireProof.node.js')

const body = buildAuditRequestBody({
  text: ' Remote frontend intern. PHP 80,000/week. ',
  location: 'Philippines',
  mode: 'demo',
})

assert.equal(body.text, 'Remote frontend intern. PHP 80,000/week.')
assert.equal(body.location, 'Philippines')
assert.equal(body.mode, 'demo')
assert.equal(body.webhook_url, undefined)

const asyncOptions = buildAuditRequestOptions({
  baseUrl: 'https://hireproof.tech/',
  apiKey: 'hireproof_agent_demo_key',
  text: body.text,
  mode: 'demo',
  webhookUrl: 'https://example.com/hireproof-callback',
})

assert.equal(asyncOptions.url, 'https://hireproof.tech/api/v1/audit')
assert.equal(asyncOptions.headers['x-api-key'], 'hireproof_agent_demo_key')
assert.equal(asyncOptions.body.webhook_url, 'https://example.com/hireproof-callback')

const credential = new HireProofApi()
assert.equal(credential.name, 'hireProofApi')
assert.ok(credential.properties.some((property) => property.name === 'apiKey'))
assert.ok(credential.properties.some((property) => property.name === 'baseUrl'))

const node = new HireProof()
assert.equal(node.description.name, 'hireProof')
assert.ok(node.description.properties.some((property) => property.name === 'operation'))

console.log('n8n HireProof node tests passed')
