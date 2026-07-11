# Honest, Legible Core Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the default `/audit` submission run a real, zero-cost deterministic analysis of the user's pasted text, stop shipping the scoring engine to the browser, and lead the result with a plain-language answer.

**Architecture:** The server already exposes a zero-spend deterministic path at `POST /api/audit` with `mode:'demo'` (no model, no live search, no external evidence). The client's default path currently short-circuits into a fabricated fixture instead of calling it. We remove that short-circuit so all submissions stream from the server; move the three sample-report objects to server-computed props so the engine leaves the client bundle; and reorder the result screen to lead with the generated summary + next steps.

**Tech Stack:** Next.js App Router (server + client components), React, TypeScript, framer-motion, `node:test`.

## Global Constraints

- **No AI attribution** in commits/PRs (project rule).
- **Cost posture unchanged:** default path must be `mode:'demo'` (zero paid-provider spend). Live provider runs stay opt-in and gated. Verified in `app/api/audit/route.ts`: `demoMode` forces `modelAllowed=false` (300), `liveSearchAllowed=false` (435), `externalEvidenceAllowed=false` (436).
- **Honest boundaries:** the deterministic result must disclose that live checks did not run (keep the Evidence Provider Status panel; relabel "Demo fixture" as an instant offline check, not fake data).
- **No engine in the client bundle:** `app/audit/audit-client.tsx` must not import `@/lib/intelligence-v2`, `@/lib/risk-scorer`, or `@/lib/audit-signals`.
- **Determinism preserved:** no changes to scoring logic; `scoring-determinism`, `adversarial-matchers`, `scoring-dataset-accuracy` suites must stay green.

---

### Task 1: Move demo-report construction to the server (close the ruleset leak)

**Files:**
- Create: `lib/demo-reports.ts`
- Modify: `app/audit/page.tsx`
- Modify: `app/audit/audit-client.tsx` (imports 15-16; `buildDemoReport` 125-145; `AuditClient`/`AuditContent` signatures 233, 499-507; `?demo=` effect 261-276)
- Test: `test/audit-client-no-engine-import.test.mjs` (create)

**Interfaces:**
- Produces: `DEMO_REPORTS: Record<'safe'|'caution'|'high-risk', AuditReport>` from `lib/demo-reports.ts`.
- Consumes: `getFixtureByVerdict` (`lib/fixtures`), `buildAuditReportV2` (`lib/intelligence-v2`) — server side only.

- [ ] **Step 1: Write the failing leak-guard test**

```js
// test/audit-client-no-engine-import.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('audit client does not import the scoring engine into the browser bundle', async () => {
  const source = await fs.readFile(new URL('../app/audit/audit-client.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /from '@\/lib\/intelligence-v2'/)
  assert.doesNotMatch(source, /from '@\/lib\/risk-scorer'/)
  assert.doesNotMatch(source, /from '@\/lib\/audit-signals'/)
})
```

- [ ] **Step 2: Run it — expect FAIL** (`node --test test/audit-client-no-engine-import.test.mjs`) because line 16 imports `buildAuditReportV2`.

- [ ] **Step 3: Create `lib/demo-reports.ts`** — replicate the exact object `buildDemoReport` produces today, with a stable id:

```ts
import { getFixtureByVerdict } from '@/lib/fixtures'
import { buildAuditReportV2 } from '@/lib/intelligence-v2'
import type { AuditReport } from '@/lib/schemas'

export type DemoVerdict = 'safe' | 'caution' | 'high-risk'
export const DEMO_VERDICTS: DemoVerdict[] = ['high-risk', 'caution', 'safe']

function buildDemoReport(verdict: DemoVerdict): AuditReport {
  const fixture = getFixtureByVerdict(verdict)
  const report = buildAuditReportV2({
    id: `demo_${verdict}`,
    extractedClaims: fixture.extractedClaims,
    evidence: fixture.evidence,
    ownerId: 'demo',
    source: 'demo',
  })
  return {
    ...report,
    ...fixture,
    version: '2',
    intelligence: report.intelligence,
    mode: 'demo',
    credentialMode: 'demo',
    source: 'demo',
    publiclyListed: true,
  }
}

export const DEMO_REPORTS: Record<DemoVerdict, AuditReport> = {
  'high-risk': buildDemoReport('high-risk'),
  caution: buildDemoReport('caution'),
  safe: buildDemoReport('safe'),
}
```

- [ ] **Step 4: Wire the prop through the server page** — `app/audit/page.tsx`:

```tsx
import { DEMO_REPORTS } from '@/lib/demo-reports'
// ...
        <AuditClient demoReports={DEMO_REPORTS} />
```

- [ ] **Step 5: Consume the prop in the client, drop engine imports** — `app/audit/audit-client.tsx`:
  - Delete imports `getFixtureByVerdict` (15) and `buildAuditReportV2` (16).
  - **Keep `DemoVerdict` (25) and `DEMO_VERDICTS` (31) defined locally in the client.** Do NOT import them (or anything else) from `@/lib/demo-reports` — that module pulls in the engine, and importing a runtime value from it would re-bundle the engine into the client, undoing the leak fix. `DemoVerdict` is structurally `'safe'|'caution'|'high-risk'`, so it matches `demo-reports.ts`'s own type when the prop is passed. `import type { AuditReport }` stays.
  - Delete the `buildDemoReport` function (125-145).
  - `AuditClient` takes and forwards the prop:

```tsx
export function AuditClient({ demoReports }: { demoReports: Record<DemoVerdict, AuditReport> }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<AuditSkeleton />}>
        <AuditContent demoReports={demoReports} />
      </Suspense>
    </ErrorBoundary>
  )
}
```
  - `function AuditContent({ demoReports }: { demoReports: Record<DemoVerdict, AuditReport> }) {` and in the `?demo=` effect replace `const demoReport = buildDemoReport(demo)` with `const demoReport = demoReports[demo]`.

- [ ] **Step 6: Run the leak-guard test — expect PASS.** Run: `node --test test/audit-client-no-engine-import.test.mjs`.

- [ ] **Step 7: Typecheck.** Run: `npm run lint` → expect no errors.

- [ ] **Step 8: Commit.**

```bash
git add lib/demo-reports.ts app/audit/page.tsx app/audit/audit-client.tsx test/audit-client-no-engine-import.test.mjs
git commit -m "refactor(audit): compute demo reports on the server, keep the scoring engine out of the client bundle"
```

---

### Task 2: Default submission analyzes the user's real text

**Files:**
- Modify: `app/audit/audit-client.tsx` (`chooseDemoVerdict` 147-152; `handleAudit` intake event 283; `!liveMode` short-circuit 288-296)
- Test: `test/public-audit-live-default-safety.test.mjs` (rewrite)

**Interfaces:**
- Consumes: existing streaming fetch (298-317) and `readAuditStream`.

- [ ] **Step 1: Rewrite the safety test to pin the NEW guarantee** — `test/public-audit-live-default-safety.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('public audit default runs the zero-spend server demo path, not a client-side fixture', async () => {
  const source = await fs.readFile(new URL('../app/audit/audit-client.tsx', import.meta.url), 'utf8')

  // Default mode is the free deterministic path.
  assert.match(source, /const \[liveMode, setLiveMode\] = useState\(false\)/)
  // Every submission posts to the server; default (liveMode=false) => mode:'demo' (no paid providers).
  assert.match(source, /body: JSON\.stringify\(\{ \.\.\.request, mode: liveMode \? 'live' : 'demo' \}\)/)
  // The fabricated client-side fixture short-circuit is gone.
  assert.doesNotMatch(source, /if \(!liveMode\) \{/)
  assert.doesNotMatch(source, /chooseDemoVerdict/)
})

test('public lab stream uses demo mode by default to avoid paid provider work', async () => {
  const source = await fs.readFile(new URL('../app/lab/lab-client.tsx', import.meta.url), 'utf8')
  assert.match(source, /Starting demo audit stream\./)
  assert.match(source, /const request: AuditRequest = \{ text: trimmed, mode: 'demo' \}/)
  assert.match(source, /titleCase\('demo'\)/)
  assert.doesNotMatch(source, /const request: AuditRequest = \{ text: trimmed, mode: 'live' \}/)
})
```

- [ ] **Step 2: Run it — expect FAIL** on the two `doesNotMatch` lines (short-circuit still present). Run: `node --test test/public-audit-live-default-safety.test.mjs`.

- [ ] **Step 3: Remove the short-circuit + keyword hack** — `app/audit/audit-client.tsx`:
  - Delete `chooseDemoVerdict` (147-152).
  - Delete the whole `if (!liveMode) { … return }` block (288-296) so execution falls through to the existing `POST /api/audit` fetch (298-317). Do not touch the fetch/body lines.
  - Make the intake event honest — line 283:

```tsx
    setStreamEvents([{ type: 'log', message: liveMode ? 'Opening live evidence stream…' : 'Running an instant offline check of your post…', phase: 'intake', status: 'active', label: 'Intake' }])
```

- [ ] **Step 4: Run the safety test — expect PASS.** Run: `node --test test/public-audit-live-default-safety.test.mjs`.

- [ ] **Step 5: Typecheck.** Run: `npm run lint`.

- [ ] **Step 6: Commit.**

```bash
git add app/audit/audit-client.tsx test/public-audit-live-default-safety.test.mjs
git commit -m "fix(audit): analyze the user's real pasted text by default via the zero-cost server demo path"
```

---

### Task 3: Relabel the mode UX and result banner honestly

**Files:**
- Modify: `app/audit/audit-client.tsx` (toggle 401-430; snackbar copy 206, 225; sample-card intro copy)
- Modify: `components/audit/result-screen.tsx` (demo banner 783-797)

- [ ] **Step 1: Relabel the toggle** (audit-client.tsx 408-428): keep two buttons but change the labels/tooltips so the free path is the plain-language default. `setLiveMode(false)` button → label **"Check my post"**, tooltip *"Runs an instant, offline check of your pasted text. No external sources are contacted and nothing is charged."*; `setLiveMode(true)` button → label **"Live evidence (advanced)"**, tooltip *"Also cross-checks live sources (search, OCR, model providers). BYOK / API-key gated and cost-capped."* Update each `aria-label` to match.

- [ ] **Step 2: Reframe the sample cards intro** — the subtitle at 367-369 currently reads "Start with a sample report or paste a real job post…"; keep the three cards but add a short "Try an example" label above the grid (381) so they read as samples, not the primary action.

- [ ] **Step 3: Honest snackbar copy** (audit-client.tsx 206 / 224-226): the snackbar already says "Public audits stay available with deterministic checks…" — keep, no fabricated-data implication. No change required beyond confirming wording; leave as-is if already honest.

- [ ] **Step 4: Relabel the result banner** (result-screen.tsx 783-797): change heading "Demo fixture" → **"Instant offline check"**, and body to: *"This verdict was scored offline from your text. No external sources were contacted. Turn on Live evidence (advanced) for fresh source checks."* Keep the "Not live verified" pill.

- [ ] **Step 5: Typecheck + build.** Run: `npm run lint` then `npm run build`.

- [ ] **Step 6: Commit.**

```bash
git add app/audit/audit-client.tsx components/audit/result-screen.tsx
git commit -m "feat(audit): relabel mode UX and result banner as an honest instant offline check"
```

---

### Task 4: Lead the result with the answer (render summary + next steps)

**Files:**
- Modify: `components/audit/result-screen.tsx` (hero paragraph 734-737; insert lead block after verdict section ~781; add "How we checked" label before the analyst grouping ~851)

**Interfaces:**
- Consumes: `result.summary: string`, `result.nextSteps: string[]` (both already on the `Result` type).

- [ ] **Step 1: Render the generated summary in the hero** — replace the hard-coded paragraph (734-737) with:

```tsx
              <p className="max-w-md text-base font-semibold leading-relaxed text-muted">
                {result.summary}
                <span className="block mt-1 text-foreground">Confidence: {result.confidence}.</span>
              </p>
```

- [ ] **Step 2: Insert a "What to do right now" lead block** immediately after the verdict `</motion.section>` (~781, before the demo banner). It surfaces the top next steps as imperative lines so the answer + action lead:

```tsx
        {result.nextSteps.length > 0 && (
          <motion.section variants={itemVariants} data-testid="what-to-do-now" className="rounded-2xl border border-safe/25 bg-safe/5 p-6 shadow-sm sm:p-7">
            <h2 className="mb-3 text-lg font-black">What to do right now</h2>
            <ul className="space-y-2">
              {result.nextSteps.slice(0, 3).map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-semibold leading-6">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-safe" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}
```

- [ ] **Step 3: Frame the analyst grouping as "How we checked"** — add a section heading right before the Risk Breakdown section (~851) so the relocated detail reads as receipts, not the lead:

```tsx
        <motion.div variants={itemVariants} className="pt-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-muted">How we checked</h2>
        </motion.div>
```

- [ ] **Step 4: Build.** Run: `npm run build` → expect success (102 static pages).

- [ ] **Step 5: Commit.**

```bash
git add components/audit/result-screen.tsx
git commit -m "feat(audit): lead the result with the plain-language summary and next steps"
```

---

### Task 5: Full verification

- [ ] **Step 1: Lint + build.** `npm run lint` && `npm run build`.
- [ ] **Step 2: Targeted tests.** `node --test test/public-audit-live-default-safety.test.mjs test/audit-client-no-engine-import.test.mjs`.
- [ ] **Step 3: Security/regression suite.** `npm run test:security` (expect prior pass count, no regressions in determinism/adversarial/accuracy).
- [ ] **Step 4: Browser smoke** (`npm run dev`, port 3002): on `/audit`, (a) paste a keyword-less real scam → must NOT be "Safe" and the extracted company must match the pasted text (not "Microsoft"); (b) paste a legit post → reasonable verdict; (c) confirm the three sample cards still open real demo reports; (d) confirm the result leads with summary + "What to do right now"; (e) confirm the honest "Instant offline check" banner shows.
- [ ] **Step 5: Final commit** if any smoke fixes were needed.

---

## Self-Review

- **Spec coverage:** A1 → Task 2; A2 → Task 3; A3 → Task 1; C1 → Task 4 (Steps 1-2); C2 → Task 4 (Steps 2-3, intent via lead block + "How we checked" framing); tests → Tasks 1-2 + Task 5. Cost invariant → Global Constraints + Task 2. All spec §4 items mapped.
- **Placeholder scan:** none — every code step shows concrete code and commands.
- **Type consistency:** `DemoVerdict`/`DEMO_VERDICTS` now sourced from `lib/demo-reports.ts` and imported by the client (Task 1 Step 5); `DEMO_REPORTS: Record<DemoVerdict, AuditReport>` matches the prop type used in `AuditClient`/`AuditContent`; `result.summary`/`result.nextSteps` already exist on `Result`.
- **Note on C2:** the literal cut-paste reorder of large analyst JSX blocks is deliberately avoided (regression risk in a ~1,400-line file). Leading with the summary + "What to do right now" block after the hero achieves the approved intent — answer first, full evidence still visible below — with a smaller, safer diff. A full physical section reorder can be a follow-up if desired.
