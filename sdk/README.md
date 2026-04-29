# HireProof SDK

TypeScript client for the HireProof Job Verification API.

Perfect for building **Security Middleware** into your automated job-hunting pipelines (n8n, Make.com, LangChain). HireProof prevents your AI agents from carelessly submitting your resume and PII to phishing scams.

## Install

```bash
npm install hireproof-sdk
```

## Quick Start

```typescript
import HireProof from 'hireproof-sdk'

const client = new HireProof({
  apiKey: 'your_api_key',
  baseUrl: 'https://yourapp.vercel.app',
})

// Investigate a job post
const report = await client.audit.investigate({
  text: 'Remote frontend intern. PHP 80,000/week. No interview.',
  location: 'Philippines',
})

console.log(report.verdict)    // 'high-risk'
console.log(report.riskScore)  // 85
console.log(report.redFlags)   // ['Unrealistically high salary...', ...]
```

## API

### `client.audit.investigate(request)` — Synchronous investigation
### `client.audit.investigateAsync(request)` — Async with webhook
### `client.mcp.listTools()` — List available MCP tools
### `client.mcp.callTool(name, args)` — Call a specific MCP tool

## License

MIT
