# n8n-nodes-hireproof

`n8n-nodes-hireproof` is a community-node package for running HireProof job-safety audits inside n8n workflows.

## What It Ships

- Credential: `HireProof API`
- Node: `HireProof`
- Operations:
  - `Run Audit`
  - `Run Async Audit`
- Backend endpoint: `POST /api/v1/audit`

## Local Install

```bash
npm pack
```

Then install the generated package in a self-hosted n8n instance through community nodes or by using npm in the n8n custom extensions path.

## Credentials

- API key: use `hireproof_agent_demo_key` for deterministic demo fixtures, or a real HireProof API key for live/provider-backed audits.
- Base URL: defaults to `https://hireproof.tech`.

## Submission Boundary

The package source is ready for npm/community-node review, but publishing to npm and n8n community verification requires account access and external approval.
