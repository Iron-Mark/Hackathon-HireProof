# AGENTS.md

Project instructions for Codex agents working in HireProof.

## Project Context

HireProof is a Next.js app for checking suspicious job posts, recruiter messages, and job URLs with visible evidence before returning a safety verdict.

Keep the product story centered on employment fraud and job scams. Do not broaden it into a generic fraud or security platform unless the user explicitly asks.

## Core Commands

- `npm run dev` starts the app on port `3002`.
- `npm run lint` runs the TypeScript lint/typecheck path.
- `npm run build` verifies the Next.js production build.
- `node --test test/runtime-wiring.test.mjs` is a key runtime wiring regression check.
- `npm run proof:chat-live` checks live chat proof behavior.
- `npm run discord:commands` registers Discord slash commands.

Use targeted checks when the change is narrow, but do not claim broad E2E readiness without a matching live/browser/API verification pass.

## Deployment and Live Verification

- Canonical public URL: `https://hireproof.tech`.
- The public alias can be healthy while raw Vercel deployment URLs or `git-main` URLs return `401 Unauthorized` because of deployment protection.
- When dashboard preview links disagree with the public alias, use `npx vercel inspect <deployment-url>` and direct HTTP checks before deciding whether production is actually broken.
- When the user asks to check env or Vercel, verify live environment/deployment behavior directly instead of inferring from code.
- Do not call authenticated flows proven unless a real logged-in flow was exercised.

## Product Truthfulness

- Prefer explicit evidence-weighted safety-policy wording.
- Do not claim ML, continuous learning, in-house deepfake detection, or broad fraud-platform coverage unless the implementation is verified.
- Public `/trends` and `/explore` surfaces should show sample-size and quality caveats when data is limited.
- Keep sample/demo warnings visible when outputs are deterministic or seeded for judge/demo use.

## Discord and Integrations

- Discord `commands` means slash commands, not mention-only behavior.
- Default to global Discord command registration when commands must work in any installed server.
- Treat hosted BYOK/provider credential storage as security-sensitive; verify same-origin, session, rate-limit, and redaction behavior when touching those flows.

## Verification Expectations

Before reporting completion for non-trivial changes, prefer:

1. `npm run lint`
2. Relevant `node --test ...` regression checks
3. `npm run build`
4. Browser or live URL verification for user-facing flows

If any step is skipped, say exactly what was not verified and why.
