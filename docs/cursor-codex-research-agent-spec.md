# Cursor-Primary Research With Codex SDK Fallback

## Summary

HireProof now has a local research-agent contract for development and investigation workflows. Cursor remains the primary operator path through `cursor-agent`; Codex SDK is the opt-in fallback when Cursor is unavailable or fails.

This is intentionally separate from the hosted audit flow. Production audits still use the existing Next.js routes, MCP tools, Vercel AI SDK, AI Gateway/OpenAI-compatible model fallback, evidence providers, and BYOK controls.

## Runtime Contract

Run local research with:

```bash
npm run research:agent -- --prompt "Check this suspicious recruiter message for job-scam signals"
node scripts/research-agent.mjs --prompt "Check this suspicious recruiter message for job-scam signals"
npm run research:agent -- --file ./job-post.txt --enable-codex
npm run research:agent -- --file ./job-post.txt --enable-codex --save
```

The result shape is stable:

```json
{
  "provider": "cursor",
  "status": "ok",
  "summary": "...",
  "findings": ["..."],
  "evidence": ["..."],
  "commands": ["..."],
  "nextSteps": ["..."]
}
```

Cursor is called with `cursor-agent -p ... --output-format json` and without `--force`, so the v1 path is research-only. Codex fallback uses `@openai/codex-sdk`, starts a thread in the current repository, and requests structured JSON output.

Use `--save` to write both `report.json` and `report.md` under `artifacts/research-agent/`. Use `--out ./path/report.json`, `--out ./path/report.md`, or `--out ./path/to/directory` to control where reports are written.

Use `--timeout-ms 30000` for quick smoke tests where a missing local agent should fail fast instead of blocking the terminal.

## Configuration

```env
RESEARCH_AGENT_PRIMARY=cursor
RESEARCH_AGENT_FALLBACK=codex
CURSOR_AGENT_BIN=cursor-agent
CURSOR_AGENT_MODEL=
CODEX_SDK_ENABLED=false
CODEX_MODEL=gpt-5.2-codex
CODEX_AGENT_TIMEOUT_MS=120000
```

`CODEX_SDK_ENABLED=false` is the default because Codex is a local coding agent with workspace permissions. Enable fallback for a single run with `--enable-codex`, or set `CODEX_SDK_ENABLED=true` in local development.

## Scope Rules

- Keep research centered on employment fraud, job scams, suspicious job posts, recruiter messages, job URLs, and HireProof provider wiring.
- Do not use this tooling as a generic fraud/security platform.
- Do not expose Cursor or Codex execution through a public API route.
- Do not add `--force` to Cursor unless a later implementation explicitly changes the tool from research-only to code modification.
- Keep saved reports out of git by default; `artifacts/research-agent/` is ignored because prompts may contain recruiter messages, URLs, or applicant-sensitive context.

## Verification

```bash
node test/research-agent.test.mjs
npm run lint
node test/runtime-wiring.test.mjs
npm run build
```

If `npm run build` fails in a restricted container with `listen EPERM 127.0.0.1`, rerun in an environment that allows Next.js to bind its local worker socket.

## References

- OpenAI Codex SDK TypeScript README: https://github.com/openai/codex/blob/main/sdk/typescript/README.md
- OpenAI Codex general availability note: https://openai.com/index/codex-now-generally-available/
- Cursor CLI overview: https://docs.cursor.com/en/cli/overview
- Cursor CLI output format: https://docs.cursor.com/en/cli/reference/output-format
- Cursor headless mode: https://docs.cursor.com/en/cli/headless
