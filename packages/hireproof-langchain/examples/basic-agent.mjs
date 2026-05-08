import { createHireProofAuditTool } from '../dist/index.js'

const hireProofTool = createHireProofAuditTool({
  apiKey: process.env.HIREPROOF_API_KEY || 'hireproof_agent_demo_key',
  baseUrl: process.env.HIREPROOF_URL || 'https://hireproof.tech',
})

const result = await hireProofTool.func({
  text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
  location: 'Philippines',
  mode: 'demo',
})

console.log(result)
