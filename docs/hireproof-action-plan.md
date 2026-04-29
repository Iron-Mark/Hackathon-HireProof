# HireProof Action Plan

Last checked: 2026-04-30

## P0 - Demo Credibility Cleanup

- Keep the public demo centered on `/audit`, `/lab`, `/trends`, `/developer`, and `/docs/triple-track-coverage`.
- Describe ChatSDK as live-tested in Slack with screenshot evidence. Describe WDK as production-accepted with run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- Use `/api/integrations/proof` as the E2E readiness endpoint for Slack, Workflow, and AI Gateway status.
- Keep the verified badge demo honest: DNS TXT ownership first, public token embed second, no API keys in browser embeds.
- Use `docs/demo/Screenshot 2026-04-30 024756.jpg` as the Slack proof screenshot.

## P1 - Remaining Product Gaps

- Finish hybrid BYOK so verified user-provided keys can actually power server-side audits, or relabel the current BYOK panel as local verification only.
- Bring webhook sandbox signatures into parity with `/api/v1/audit` production webhook delivery.

## P2 - Submission Readiness

- Re-run `node --test test/auth-core.test.mjs test/runtime-wiring.test.mjs test/polish-hardening.test.mjs`.
- Re-run `npm run lint` and `npm run build`.
- Smoke local and production endpoints before claiming the app is ready.

## P3 - Sync Boundary

- Do not commit or push without the exact trigger phrase `create checkpoint commit`.
- After a checkpoint commit, push only when explicitly asked, then verify the deployed URL and production smoke tests.
