# Bugbot rules (Cursor PR review)

**Status:** Phase 1 — versioned rules in `.cursor/BUGBOT.md` (enable Bugbot + GitHub branch protection in repo settings).

Bugbot reviews pull requests using project rules, learned rules, and optional Autofix. HireProof uses it for **security and trust regressions**, not for replacing tests or human judgment on verdict logic.

## Philosophy

1. **Blocking rules** — SSRF, auth, secrets, demo honesty, missing tests on API changes.
2. **Non-blocking rules** — docs drift, UX certainty copy.
3. **Autofix last** — only on **new branch**, never direct writes to contributor PR branches until false-positive rate is acceptable.

## File layout

| Path | Scope |
| --- | --- |
| `.cursor/BUGBOT.md` | Repo-wide priorities and blocking rules |
| `app/api/.cursor/BUGBOT.md` | API routes: audit, MCP, developer, webhooks |
| `lib/.cursor/BUGBOT.md` | Core logic: auth, MCP tools, scoring, providers |

Nested files **extend** root rules; they do not weaken them.

## Rollout

1. Enable review-only Bugbot; collect a short baseline.
2. Merge versioned `BUGBOT.md` files (this phase).
3. Require `Cursor Bugbot` check on protected branches.
4. Enable learned rules; then Autofix-on-new-branch if signal is good.

## Root rules (summary)

See the committed files for the full text. Highlights:

- Flag `fetch()` to user URLs without hostname validation, timeouts, SSRF controls.
- Flag weakened origin/referrer checks, rate limits, API-key checks, webhook signatures.
- Flag logging of secrets, raw provider keys, cookies, encrypted blobs.
- Flag demo mode presented as live or weaker evidence provenance in UI.
- Flag `app/api/**` or `lib/**` changes without `test/**` updates when behavior changes.

## Fallback

If Bugbot is unavailable: human review plus `npm run lint`, `npm run build`, and `node --test test/runtime-wiring.test.mjs`.

## References

- Cursor Bugbot docs: [cursor.com/docs](https://cursor.com/docs) (Bugbot section in product docs)
- HireProof security whitepaper: [/docs/security](https://hireproof.tech/docs/security)
