# Final Live vs Pending Status

Last checked: 2026-06-20

This is the concise status boundary for submission, demos, and reviewer conversations.

## Production Live / Local Repo-Controlled

Rows marked `Live`, `Screenshot-proven`, `Published`, or `Production accepted-run proven`
have production or external evidence. Rows marked `Implemented locally` are current
checkout proof only and still need checkpoint, push, deployment, and live rerun before
they can be described as production-live.

| Area | Status | Evidence path |
| --- | --- | --- |
| Stable production site | Live | `https://hireproof.tech` |
| Web audit flow | Implemented | `/audit` and demo scenarios |
| Screenshot OCR audit path | Implemented and production-smoke-proven | Google Vision OCR evidence receipt, Tesseract fallback in repo |
| Screenshot privacy default | Implemented | Screenshot reports are excluded from Explore/Trends by default |
| Public job URL enrichment | Implemented | Supported job URLs are resolved before claim extraction |
| Demo audit API | Live | `POST /api/v1/audit` with a configured API key and `mode=demo` |
| Live SerpApi audit path | Live and smoke-proven | `POST /api/v1/audit` with `mode=live`, clean Canva extraction, and live evidence |
| MCP investigation tools | Implemented | `/api/mcp` and docs |
| ChatSDK shared bot path | Implemented | `/api/chat/hireproof`, `/api/webhooks/*` |
| Slack proof | Screenshot-proven | `docs/demo/Screenshot 2026-04-30 024756.jpg` |
| Telegram proof | Live delivery proven | `docs/platform-proof-status.md` |
| Discord/Telegram controlled proof gates | Ready in strict proof snapshot | `docs/demo/live-chat-proof-check-strict-latest.json` |
| WDK route | Production accepted-run proven | run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5` |
| Native automation packs | Repo-shipped and validated | `integrations/`, `packages/hireproof-langchain`, `/docs/automations` |
| npm packages | Published and package-proofed | `@hireproof/cli`, `@hireproof/langchain`, `hireproof-sdk`, `n8n-nodes-hireproof` |
| HireProof CLI | npm-published, tested, and screenshot-proven | `@hireproof/cli@1.0.1`, `/docs/cli`, `public/cli-tui-screenshot*.png` |
| Native integrations ZIP | Live download | `/downloads/hireproof-native-integrations.zip` |
| Chrome extension ZIP | Live download fallback | `/downloads/hireproof-extension.zip` |
| Docker packaging | Implemented | `Dockerfile`, `docker-compose.yml`, `npm run docker:*` |
| PDF/PNG/CSV exports | Implemented | result screen and trends dashboard |
| Verified-only safer alternatives | Implemented | Alternatives require sourced comparable-job evidence |
| Demo fixture labeling | Implemented | Fixture snackbar, visible result warning, fixture evidence wording |
| Live audit guardrails | Implemented | Queue throttling, SerpApi circuit breaker, cache telemetry |
| Evidence provider status UI | Implemented locally | Audit report panel for SerpApi, RDAP, DNS, Safe Browsing, CT, threat-intel, registry, and urlscan statuses |
| Pro-research SEO/Web Vitals local proof | Implemented locally | `docs/spec/hireproof`, `npm run proof:crawl-social`, `npm run proof:web-vitals` |
| Workflow transitive dependency audit fix | Implemented locally | `esbuild@0.28.1` override, `npm run audit:security`, `npm run test:security` |

## Pending External Proof

| Area | Pending item | Why it is pending |
| --- | --- | --- |
| Chrome Web Store | Public listing approval | Requires developer-dashboard submission and Google review |
| WhatsApp/Zernio | Credentials plus real event proof, or approved deferral | Current strict proof reports `whatsapp` as `credential-gated` |
| Additional chat providers | Credentials plus real event proof | Requires provider account credentials and real event capture if kept in scope |
| npm package version bumps | Future package releases after the current published versions | Requires version bump and owner publish action |
| n8n community node | Directory/community verification beyond npm package | Requires n8n review after local install screenshots |
| Make Custom App | Make review approval | Requires Make developer account and review flow |
| WDK completed transcript | Completed durable run with callback proof | Current proof is accepted-run only |
| June 15 pro-research deploy proof | Checkpoint, push, deploy, and live route proof | Current June 15 proof is local production-build and security-audit evidence only |

## Latest Live SerpApi Smoke

Checked after checkpoint `0b83430`:

- Route: `POST https://hireproof.tech/api/v1/audit`
- Mode: `live`
- Credential mode: `platform-env`
- Input claim: `Company: Canva. Role: Product Designer.`
- Extracted company: `Canva`
- Extracted role: `Product Designer`
- Verdict: `safe`
- Risk score: `17`
- Evidence count: `6`
- Evidence types: `Company Check`, `Local Presence`, `Reputation`

This proves the live search/model path is production-wired. It does not guarantee every audit will return every possible evidence class; comparable jobs and local/search coverage still depend on provider result availability.

## Latest Evidence Funnel Smoke

Checked on 2026-05-04 against `https://hireproof.tech/api/audit` with production `Origin` / `Referer` headers:

- Input claim: Vercel role with `https://vercel.com/careers` and `recruiting@vercel.com`
- Mode: `live`
- Verdict: `caution`
- Risk score: `45`
- Evidence count: `11`
- Green flags: `6`
- Red flags: `4`
- Provider statuses:
  - SerpApi: `ok`
  - DNS: `ok`
  - RDAP: `degraded`
  - Certificate Transparency: `degraded`
  - Google Safe Browsing: `not-live`

This proves the evidence broker status object is returned in live SSE results. It also shows the current production boundary: Safe Browsing is not live until `GOOGLE_SAFE_BROWSING_API_KEY` is configured, and RDAP/Certificate Transparency can degrade without blocking the audit.

## Latest Provider Status UI Smoke

Checked locally on 2026-05-04 after Phase 3:

- Local report: generated pre-UUID local report permalink. Current report links use UUID-backed IDs.
- Input: Vercel role with `https://vercel.com/careers` and `recruiting@vercel.com`
- Provider keys present: SerpApi, RDAP, DNS, Safe Browsing, Certificate Transparency, Threat Intel, Company Registry, urlscan
- Browser check: provider-status panel rendered at `375px` and `1280px`
- Overflow check: no horizontal overflow at either viewport

This proves the UI can surface the provider-status object returned by live audit results. The current June 15 proof set is a separate local production-build checkpoint candidate and still needs commit, push, deploy, and live rerun before production closure is claimed.

## Latest Package Proof

Checked on 2026-05-04 from clean temporary npm projects:

- `npx @hireproof/cli --help`: passed.
- `npx @hireproof/cli audit --mode demo --json`: passed, returned High-Risk, score `92`.
- `@hireproof/langchain@1.0.0` with `@langchain/core`: passed, returned High-Risk and `shouldContinue: false`.
- `n8n-nodes-hireproof@1.0.0`: passed metadata check for credentials and node registration.
- `hireproof-sdk@1.0.0`: published package had a native ESM default-import mismatch.
- `hireproof-sdk@1.0.1`: published and verified from a clean npm install. ESM default import, ESM named import, CommonJS named export, and demo audit all pass.

CLI refresh checked on 2026-06-11 from a clean temporary folder:

- `npx @hireproof/cli@latest --help`: passed with `@hireproof/cli@1.0.1`.
- npm registry metadata reports `engines.node` as `>=22.0.0`.

## Latest Pro-Research SEO/Web Vitals Proof

Checked on 2026-06-15 from a local production build at `http://127.0.0.1:3029`, then refreshed during the checkpoint-manifest pre-check.

- `npm run proof:crawl-social -- --url http://127.0.0.1:3029`: passed.
- Crawl/social artifact: `artifacts/seo-crawl-preview/hireproof-crawl-social-2026-06-15T06-18-30-825Z.json`.
- `HIREPROOF_PROOF_BASE_URL=http://127.0.0.1:3029 npm run proof:web-vitals`: passed.
- Web Vitals artifact: `artifacts/web-vitals/hireproof-web-vitals-2026-06-15T06-18-56-383Z.json`.
- Routes covered: `/`, `/audit`, `/demo/linkedin`, `/docs`, and `/lab`.
- Budget result: every route returned `200`, CLS `0`, LCP under `2500ms`, long-task total under `300ms`, and max long task under `200ms`.

This is not live production proof. The working tree still needs an intentional checkpoint, push,
deployment, and live rerun before production closure is claimed.

## Latest Current-Production Baseline Proof

Checked on 2026-06-15 against `https://hireproof.tech`.

- `GET /api/health`: returned `status: ok` with `readiness.state: ready` and `readiness.scope: public`.
- `npm run proof:crawl-social -- --url https://hireproof.tech`: passed robots, sitemap, canonical-origin, private-route exclusion, home route, and social-tag checks.
- Live crawl/social artifact: `artifacts/seo-crawl-preview/hireproof-crawl-social-2026-06-15T08-01-26-809Z.json`.

This is a current-production baseline proof only. It does not prove the dirty checkpoint stack until
that stack is intentionally checkpointed, pushed, deployed, and rerun live.

## Latest Dependency Audit Proof

Checked on 2026-06-15 after overriding Workflow's transitive `esbuild` dependency to `0.28.1`.

- `npm run audit:security`: passed with `found 0 vulnerabilities`.
- `npm ls esbuild workflow @workflow/cli @workflow/builders --all`: resolved Workflow's `esbuild` chain to `0.28.1`.
- `npm run test:security`: passed with `337` tests.
- `npm run lint`: passed.
- `node --test test/download-hardening.test.mjs test/polish-hardening.test.mjs`: passed with `27` tests.
- `npm run build`: passed and generated `102` static pages.

This is local proof. It still needs checkpoint, push, deployment, and live route proof before production closure is claimed.

## Latest Screenshot OCR Smoke

Checked after the OCR/privacy checkpoint:

- Route: `POST https://hireproof.tech/api/audit`
- Input type: generated screenshot data URL
- OCR source: `Screenshot OCR: Google Vision`
- OCR type: `Screenshot OCR`
- Verdict: `high-risk`
- Risk score: `100`
- Public listing flag: `false`

This proves the production screenshot path can extract OCR evidence through Google Vision and that screenshot-derived reports are not publicly listed by default. It does not claim deepfake detection or specialist image forensics.

## Current Trust Controls

- Timeline uses captured stream events for live browser audits; demo fixture mode uses fixture events and does not claim fresh source checks.
- Safer alternatives are verified-only: sourced comparable-job evidence is required before an alternative is shown.
- Demo fixture mode uses seeded fixtures for deterministic demos and offline fallback. It should not be described as live evidence.
- Live SerpApi checks are protected by queue throttling, cache reuse, similarity cache, and a SerpApi circuit breaker.

## Safe Submission Wording

Use:

> HireProof is a production-deployed job-post verification agent with web, API, MCP, ChatSDK, WDK, Chrome extension package, and repo-shipped n8n, Make, and LangChain integration surfaces.

Avoid:

> HireProof is published on the Chrome Web Store, npm, n8n marketplace, and Make marketplace.

Avoid:

> The WDK workflow completed a full durable investigation transcript.

Use instead:

> The WDK route has production accepted-run proof; completed timeline and callback evidence are the next milestone.

Use for demo fixtures:

> Demo mode uses seeded fixtures for deterministic demos and offline fallback. Live evidence mode is separate.

Use for alternatives:

> Safer alternatives appear only when HireProof has sourced comparable-job evidence. If no sourced comparable jobs are available, the section is hidden.

## Final Pre-Submission Smoke

```powershell
$base='https://hireproof.tech'
Invoke-RestMethod -Uri "$base/api/health"
Invoke-RestMethod -Uri "$base/api/integrations/proof"
Invoke-RestMethod -Uri "$base/api/v1/audit" -Method Post -ContentType 'application/json' -Headers @{'x-api-key'=$env:HIREPROOF_API_KEY} -Body (@{text='Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.'; mode='demo'} | ConvertTo-Json)
Invoke-WebRequest -UseBasicParsing "$base/downloads/hireproof-native-integrations.zip"
Invoke-WebRequest -UseBasicParsing "$base/downloads/hireproof-extension.zip"
```

