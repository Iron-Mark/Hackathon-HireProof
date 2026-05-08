# HireProof v1.0 Final Release Proof

Last verified: 2026-05-05, Asia/Manila

## Release Status

- Release: https://github.com/Iron-Mark/hackathon-v0-zero_to_agent/releases/tag/v1.0
- Title: `HireProof v1.0 - Proof-Backed Job Scam Verification Agent`
- State: public release, not draft, not prerelease
- Assets: 11 release assets attached
- Release body includes the refreshed hero graphic and GitHub Packages section
- `main`, `origin/main`, and `v1.0` all resolve to commit `37ec46bdd3914da87ac2a1985a4f2bda3e297b15`

## Live Site Checks

The following public URLs returned HTTP 200:

- https://hireproof.tech
- https://hireproof.tech/audit
- https://hireproof.tech/docs
- https://hireproof.tech/api/health
- https://hireproof.tech/api/integrations/proof
- https://github.com/Iron-Mark/hackathon-v0-zero_to_agent/releases/tag/v1.0

## Runtime Readiness

`/api/health` returned:

- `status`: `ok`
- `storage`: `redis`
- `liveSearch`: `true`
- `model`: `true`
- model provider: AI Gateway and OpenAI-compatible, model `openai/gpt-4o-mini`

`/api/integrations/proof` returned:

- `status`: `ready`
- `coreStatus`: `ready`
- `optionalStatus`: `credential-gated`
- Slack: `ready`
- Discord: `ready`
- Telegram: `ready`
- WhatsApp: `credential-gated`
- Vercel Workflow / WDK: `ready`
- AI Gateway: `ready`

## GitHub Packages

Workflow run:

- https://github.com/Iron-Mark/hackathon-v0-zero_to_agent/actions/runs/25360061938
- Status: completed
- Conclusion: success

Published package alias jobs:

- `@iron-mark/hireproof-sdk`: success
- `@iron-mark/hireproof-cli`: success
- `@iron-mark/hireproof-langchain`: success
- `@iron-mark/n8n-nodes-hireproof`: success

Direct package listing through the current CLI token is blocked by GitHub API permissions:

- `gh api /users/Iron-Mark/packages?package_type=npm`
- Result: HTTP 403, current token needs `read:packages`

Manual visual confirmation should be done from the logged-in GitHub Packages page:

- https://github.com/Iron-Mark?tab=packages&repo_name=hackathon-v0-zero_to_agent

## Local Verification

Commands run successfully:

- `npm run lint`
- `node --test test/runtime-wiring.test.mjs`
- `npm run build`

Runtime wiring test result:

- 43 tests
- 43 passing
- 0 failing

Production build result:

- Next.js 16.2.4
- Compiled successfully
- TypeScript completed
- 84 static pages generated

## Browser And Responsive Proof

Playwright checked the live site across these viewport sizes:

- `320x568`
- `390x844`
- `768x1024`
- `1024x768`
- `1366x768`
- `1440x900`

Routes checked:

- `/`
- `/audit`
- `/docs`

Interaction checks:

- Docs mobile menu clicked successfully
- Audit primary action clicked successfully
- Docs search control was hidden in the checked mobile state, not broken
- No horizontal overflow errors were detected

Generated proof artifacts:

- `artifacts/final-release-proof/playwright-live-summary.json`
- `artifacts/final-release-proof/home-small-mobile-320x568.png`
- `artifacts/final-release-proof/audit-small-mobile-320x568.png`
- `artifacts/final-release-proof/docs-small-mobile-320x568.png`
- `artifacts/final-release-proof/docs-mobile-interactions-390x844.png`
- `artifacts/final-release-proof/audit-mobile-interaction-390x844.png`

## Residual Risk

- GitHub Packages visibility still needs account-level visual confirmation because the current CLI token cannot list packages without `read:packages`.
- WhatsApp remains intentionally credential-gated because `ZERNIO_API_KEY` and `ZERNIO_WEBHOOK_SECRET` are not configured.
