# Production Hardening Proof - 2026-05-20

This report records the verified state after consolidating HireProof onto `main`, clearing Dependabot security alerts, hardening GitHub settings, and checking the live production app.

## Repository State

| Check | Result |
| --- | --- |
| Repository | `Iron-Mark/Hackathon-HireProof` |
| Default branch | `main` |
| GitHub branches | `main` only |
| Local branch | `main` synced with `origin/main` |
| Open pull requests | `0` |
| Open Dependabot alerts | `0` |

Recent consolidation commits:

- `6b4343e` - `chore(repo): consolidate branches and clear security audit`
- `08ba6ea` - `chore(ci): fold dependabot action bumps into main`
- `1224f7b` - `chore(deps): fold dependabot npm updates into main`

## Vercel Production

| Check | Result |
| --- | --- |
| Project | `hireproof` |
| Project ID | `prj_mV18ExyZQFEEDTpmUWUPyxKHbnnu` |
| Latest production deployment | `dpl_B4dKc45tnLR4abgB949rMaNxg4fq` |
| Deployment state | `READY` |
| Deployment commit | `1224f7b8d5902703b19e6961d5f3663ddc51c087` |
| Public alias | `https://hireproof.tech` |
| Vercel framework | `nextjs` |
| Vercel project Node setting | `20.x` |
| Repo Node pin | `package.json` `engines.node = 20.x`; `.node-version = 20` |

The Vercel project-level `nodeVersion` setting, `package.json` `engines.node`, `.node-version`, and GitHub Actions workflow now all point at Node 20.

## Production Environment Presence

Checked with `npx vercel env ls production`. Values were not printed or recorded, only encrypted key presence.

Present production groups:

- App and public base URL: `APP_BASE_URL`
- Cursor integration: `CURSOR_API_KEY`, `CURSOR_WEBHOOK_SECRET`, `CURSOR_INTEGRATION_ENABLED`, `CURSOR_MAX_CONCURRENT_RUNS`, `CURSOR_RUNTIME_DEFAULT`, `CURSOR_MODEL_ID`, `CURSOR_ALLOWED_REPO_URL`
- Cost guards and feature flags: `HIREPROOF_COST_GUARD_*`, `PUBLIC_*`, `REQUIRE_BYOK_FOR_LIVE_API`
- Model and evidence providers: `AI_GATEWAY_API_KEY`, `VERCEL_AI_GATEWAY_API_KEY`, `MODEL_PROVIDER_KEY`, `GROQ_API_KEY`, `HIREPROOF_MODEL`, `SERPAPI_API_KEY`, `GOOGLE_CLOUD_VISION_API_KEY`
- Storage: `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Chat and workflow integrations: `SLACK_*`, `DISCORD_*`, `TELEGRAM_*`, `WORKFLOW_SECRET`

## Live API Checks

Public route probe:

| Route | Status |
| --- | --- |
| `/` | `200` |
| `/audit` | `200` |
| `/docs` | `200` |
| `/developer` | `200` |
| `/explore` | `200` |
| `/trends` | `200` |
| `/api/health` | `200` |

Production API smoke:

```json
{
  "homeStatus": 200,
  "healthStatus": "ok",
  "healthStorage": "redis",
  "auditVerdict": "high-risk",
  "auditRiskScore": 92,
  "auditMode": "demo",
  "evidenceCount": 3
}
```

## GitHub Actions

Latest verified run:

| Check | Result |
| --- | --- |
| Workflow | `Cursor Integration` |
| Run | `26159889796` |
| Commit | `1224f7b8d5902703b19e6961d5f3663ddc51c087` |
| Job | `lint-build-cursor-tests` |
| Conclusion | `success` |

The workflow now uses Node `20` to match the repo runtime pin.
The Cursor route tests were also made Node 20-compatible by removing the prior dependency on Node 22's `--experimental-strip-types` runtime flag.

## GitHub Security Settings

Verified through GitHub API:

| Setting | Result |
| --- | --- |
| Secret scanning | `enabled` |
| Secret scanning push protection | `enabled` |
| Dependabot security updates | `enabled` |
| Delete branch on merge | `enabled` |
| Branch protection for `main` | `enabled` |
| Required status check | `lint-build-cursor-tests` |
| Require branches up to date before merge | `enabled` |
| Require conversation resolution | `enabled` |
| Force pushes to `main` | `disabled` |
| Deleting `main` | `disabled` |

`secret_scanning_non_provider_patterns` and `secret_scanning_validity_checks` remain disabled by GitHub plan or repository capability. They were not required to reach the requested hardening baseline.

## Dependabot Configuration

`.github/dependabot.yml` is present and configured for:

- Weekly npm updates on Monday at 09:00 Asia/Manila.
- Weekly GitHub Actions updates on Monday at 09:30 Asia/Manila.
- Grouped Next runtime updates.
- Grouped security override updates.
- Open PR limits for npm and GitHub Actions.

## Package Metadata

Verified package metadata:

- Root package repository, homepage, bugs, and `engines.node = 20.x` point to `Iron-Mark/Hackathon-HireProof`.
- `@hireproof/cli` repository points to `Iron-Mark/Hackathon-HireProof` with package directory `packages/hireproof-cli`.
- `hireproof-sdk` repository, homepage, and bug tracker point to `Iron-Mark/Hackathon-HireProof`.

## Browser QA

Playwright Chromium checked the live site on desktop `1440x1000` and mobile `iPhone 13`.

| Route | Desktop | Mobile |
| --- | --- | --- |
| `/` | Pass | Pass |
| `/audit` | Pass | Pass |
| `/docs` | Pass | Pass |
| `/developer` | Pass | Pass |
| `/explore` | Pass | Pass |
| `/trends` | Pass | Pass |

Assertions:

- HTTP status was `2xx` or `3xx`.
- Visible body text rendered.
- Page text included `HireProof`.
- No browser console errors were emitted.

Note: desktop `/explore` had a few aborted React Server Component prefetch requests for report links. The page itself loaded, rendered, and passed with no console errors.

## Deeper App QA Follow-Up

Additional production Playwright checks covered auth boundaries, developer/API-key surfaces, report history, export controls, and mobile navigation.

| Check | Result |
| --- | --- |
| `/api/auth/me` anonymous boundary | `200` with `user: null`, no private user object |
| `/api/auth/demo-login` cross-origin guard | `403`, expected for direct cross-origin-style request |
| `/developer` | Pass; developer/API/key/credential surface rendered |
| `/settings` | Pass; settings/API-key surface rendered without auth crash |
| `/history` | Pass; report history route rendered |
| `/audit?demo=high-risk` | Pass; export/share controls visible, including PDF/share actions |
| Mobile navigation | Pass; menu opens and key routes remain reachable |
| Mobile `/audit`, `/developer`, `/history` | Pass |

## Production Log Review

Checked Vercel production logs for the last 2 hours after the hardening deployment.

| Pattern | Result |
| --- | --- |
| Parsed log rows | `200` |
| `5xx` or error/fatal logs | `0` |
| `4xx` logs | `28` |
| Observed `4xx` paths | `/reach-us`, `/get-in-touch`, `/team`, `/help`, `/support`, `/about-us`, `/about` |

The `4xx` entries are predictable informational/support routes, not server failures. `next.config.js` now redirects these paths to existing pages:

- `/about`, `/about-us`, `/team` -> `/portfolio`
- `/help`, `/support` -> `/docs`
- `/contact`, `/contact-us`, `/reach-us`, `/get-in-touch` -> `/pilot`

## Local Verification Commands

These checks were run during the consolidation and hardening work:

```bash
npm audit --audit-level=low
npm run lint
node --test test/runtime-wiring.test.mjs test/research-agent.test.mjs test/cursor-pretool-guard.test.mjs test/hireproof-cli.test.mjs
npm run build
```

Result summary:

- `npm audit --audit-level=low`: `0 vulnerabilities`
- Targeted Node test suite: `83` passing after including the Cursor route wiring tests
- Production build: passed
- Local production smoke on `127.0.0.1:3002`: health `ok`, demo audit `high-risk`, score `92`

## Release Recommendation

This state is suitable for tagging as:

```text
v1-main-consolidated
```

The tag should point at the commit that includes this proof report and the Node 20 workflow alignment.
