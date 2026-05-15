# Cursor QA and release checklist

Cursor cloud agents are for **exploratory, artifact-rich QA** (screenshots, videos, logs). **Playwright** and deterministic CI remain the **release blockers**.

## Principle

| Layer | Role |
| --- | --- |
| `lint` / `build` / `node --test` | Non-negotiable baseline |
| Bugbot | PR security and consistency |
| Cursor UI walkthrough (Phase 3) | Preview/staging evidence, advisory until stable |
| Playwright | Deterministic pass/fail on critical paths |
| Human approval | Final merge / release |

Do **not** invert this: Cursor QA must not block shipping if Playwright and unit tests pass.

## Release checklist (preview or staging)

- [ ] `npm run lint` and `npm run build` clean
- [ ] `node --test test/runtime-wiring.test.mjs` passes
- [ ] `CURSOR_WEBHOOK_SECRET` / internal routes not exposed publicly (when Phase 3 exists)
- [ ] `/audit` — input, demo controls, loading/error states, verdict copy honest (live vs demo)
- [ ] `/developer` — credentials UI, usage cards (no secrets in UI or logs)
- [ ] `/docs` — nav, API playground, copy-for-AI control
- [ ] Docs match routes/env: `README.md`, `DEPLOYMENT.md`, `.env.example`
- [ ] Optional: Cursor walkthrough run id + summary linked from developer portal (Phase 3)
- [ ] Playwright suite green on target environment

## Cursor QA walkthrough script (Phase 3 spec)

Target URL: preview `APP_BASE_URL` only—not production user traffic.

```text
Open {baseUrl}/audit and verify: textarea, demo buttons, submit flow, clear loading/error states.

Open {baseUrl}/developer and verify: provider credentials UI, usage cards (no secrets displayed).

Open {baseUrl}/docs and verify: sidebar nav, API playground, response pane.

Record screenshots/logs for failures. Do not modify production data.
```

Store **run id + summary** in telemetry first; ingest raw artifacts only when API contracts are stable.

## Playwright fallback

`package.json` includes Playwright as a dev dependency. Use it for:

- Stable selectors on `/audit`, `/docs`, auth-gated `/developer` flows
- CI on protected branches

When Cursor QA is unavailable: Playwright + manual screenshots from [docs/demo/proof-archive.md](../demo/proof-archive.md) patterns.

## Cost discipline

- No Cursor runs on every end-user audit or page view.
- Gate cloud agents behind auth, explicit button clicks, or secured cron.
- Cap concurrency (`CURSOR_MAX_CONCURRENT_RUNS` when implemented).

See [overview.md](./overview.md) for phase boundaries.
