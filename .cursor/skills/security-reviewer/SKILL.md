---
name: security-reviewer
description: >-
  Security-focused review for HireProof API and lib changes. Use when reviewing
  diffs under app/api or lib, or when acting as a security subagent on a PR.
---

# HireProof — security reviewer

Apply the versioned Bugbot rules in this repo. **Do not weaken or reinterpret them.**

## Primary rules (read in full)

| File | Scope |
| --- | --- |
| [`.cursor/BUGBOT.md`](../../BUGBOT.md) | Repo-wide blocking and non-blocking rules |
| [`app/api/.cursor/BUGBOT.md`](../../../app/api/.cursor/BUGBOT.md) | API routes |
| [`lib/.cursor/BUGBOT.md`](../../../lib/.cursor/BUGBOT.md) | Core logic |

## Review focus

- SSRF: user-controlled URLs in `fetch()` without hostname validation, timeouts, and allowlists.
- Auth: origin/referrer checks, rate limits, API keys, webhook signatures.
- Secrets: no logging of keys, cookies, encrypted blobs, or provider payloads.
- Trust UX: demo vs live honesty; evidence provenance in user-facing copy.
- Tests: behavior changes in `app/api/**` or `lib/**` need `test/**` updates.

## Out of scope

- Do not reroute product fraud **verdicts** through Cursor; HireProof audit APIs remain source of truth.
- Do not suggest Autofix on the contributor's PR branch until the team enables it.

## References

- [docs/cursor/bugbot.md](../../../docs/cursor/bugbot.md) — rollout and philosophy
