# @hireproof/langchain

LangChain tool package for gating job-application agents with HireProof audits.

## Install

```bash
npm install @hireproof/langchain @langchain/core zod
```

## Usage

```ts
import { createHireProofAuditTool } from '@hireproof/langchain'

const hireProofTool = createHireProofAuditTool({
  apiKey: process.env.HIREPROOF_API_KEY,
  baseUrl: 'https://hireproof.tech',
  safeRiskThreshold: 40,
})

const result = await hireProofTool.func({
  text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
  location: 'Philippines',
  mode: 'demo',
})
```

## Webhook callbacks

Webhook callback URLs are trusted developer configuration, not model-generated tool input. If you need async delivery, pass `webhookUrl` in the tool options:

```ts
const hireProofTool = createHireProofAuditTool({
  apiKey: process.env.HIREPROOF_API_KEY,
  webhookUrl: process.env.HIREPROOF_WEBHOOK_URL,
})
```

Do not place callback URLs in the job post, prompt, or tool-call arguments.

## Response bounds

The helper rejects audit API responses larger than 256 KB before parsing JSON. HireProof reports are expected to be compact; a larger response is treated as a failed or unsafe upstream response.

## Exports

- `createHireProofAuditTool`
- `HireProofAuditTool`
- `HireProofAuditInputSchema`
- `TrustedWebhookUrlSchema`
- `runHireProofAudit`
- `isSafeEnough`

## Publishing Boundary

This package is published on npm as `@hireproof/langchain`. The source remains repo-shipped and testable.
