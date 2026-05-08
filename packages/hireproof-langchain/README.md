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

## Exports

- `createHireProofAuditTool`
- `HireProofAuditTool`
- `HireProofAuditInputSchema`
- `runHireProofAudit`
- `isSafeEnough`

## Publishing Boundary

This package is published on npm as `@hireproof/langchain`. The source remains repo-shipped and testable.
