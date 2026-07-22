# AGENTS.md

## Scope

HireProof (hireproof.tech) — Next.js app that audits suspicious job posts, recruiter messages, and job URLs and returns a Safe / Caution / High-Risk verdict with visible evidence. Solo Cursor-hackathon project, archived under `zStale-Projects`. Current branch: `dev` (in sync with `origin/dev`).

Keep the product story centered on employment fraud and job scams. Do not broaden it into a generic fraud/security platform, and do not claim ML, continuous learning, or in-house deepfake detection — none of that is implemented.

## Environment / Stack

- Node 24.x (`engines` in `package.json` and `.node-version`); npm with workspaces (`package-lock.json` is the only lockfile — a `pnpm-workspace.yaml` exists but there is no pnpm lockfile, so use npm).
- Next.js 16.2.9, React 19, TypeScript 6, Tailwind CSS 4.
- Workspaces: `sdk`, `integrations/n8n-nodes-hireproof`, `packages/hireproof-langchain`, `packages/hireproof-cli`.

## Key commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev server (port 3002) | `npm run dev` |
| Lint / typecheck (`tsc --noEmit`) | `npm run lint` |
| Build (postbuild patches SWC trace) | `npm run build` |
| Full regression suite | `npm run test:security` |
| Key wiring check | `node --test test/runtime-wiring.test.mjs` |
| Live chat proof | `npm run proof:chat-live` |
| Register Discord slash commands | `npm run discord:commands` |
| CLI | `npm run cli` |

Discord "commands" means slash commands; default to global registration so they work in any installed server.

## Secrets / env

- `.env.example` is the canonical key list; local values load from `.env.local` (gitignored). Never print values.
- Sensitive key names include `AGENT_API_KEY`, `SESSION_SECRET`, `BYOK_ENCRYPTION_KEY`, `API_KEY_HASH_PEPPER`, `AI_GATEWAY_API_KEY`, `SERPAPI_API_KEY`, `UPSTASH_REDIS_REST_URL`/`_TOKEN`, plus Slack/Discord/Telegram bot tokens and signing/webhook secrets, `ZERNIO_*` keys, and `CURSOR_*` keys.
- Hosted BYOK/provider-credential flows are security-sensitive: verify same-origin, session, rate-limit, and redaction behavior when touching them.

## Deployment notes

- Canonical public URL: `https://hireproof.tech` (Vercel; `.vercel/` and `vercel.json` present).
- Raw Vercel deployment or `git-main` URLs can return `401 Unauthorized` from deployment protection while the public alias is healthy — check the alias and `npx vercel inspect <deployment-url>` before declaring production broken.

## Current status

- Archived/stale: last commit 2026-07-12 (merge of PR #66, scam-vocabulary dedup, on `dev`). Remote: `github.com/Iron-Mark/Hackathon-HireProof` (default branch `main`).
- Working tree: this AGENTS.md refresh is uncommitted (modified), plus untracked `.claude/`; nothing else changed. Local `feat/*` branches are all merged into `dev` (safe to delete); five remote `dependabot/*` branches remain unmerged.
- No known build blockers recorded; run `npm run lint` and `npm run build` fresh before reporting pass/fail.

Last verified: 2026-07-22 (workspace AGENTS.md refresh pass)
