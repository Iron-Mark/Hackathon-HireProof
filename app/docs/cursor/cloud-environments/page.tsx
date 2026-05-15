import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cursor Cloud Environments | HireProof Docs',
  description:
    'Cloud Agent environment setup, scoped secrets, and governance checklist for HireProof.',
}

const baseline = [
  ['Install command', 'npm ci'],
  ['Dev server terminal', 'npm run dev on port 3002'],
  ['Verification commands', 'npm run lint, npm run build, node --test test/cursor*.test.mjs'],
  ['Repo scope', 'Single repo by default through CURSOR_ALLOWED_REPO_URL'],
  ['Secrets', 'Store in Cursor or Vercel dashboards only'],
  ['Network', 'Prefer Preview URLs for UI QA'],
]

const governance = [
  'Scope secrets to the specific Cursor environment.',
  'Attach only required repos; use multi-repo environments only when a task needs them.',
  'Confirm environment version history and audit logs are visible to the team owner.',
  'Keep rollback permissions limited to admins when available.',
  'Record the environment version used when accepting Cloud Agent output.',
  'Run normal repo gates after Cloud Agent work: lint, build, targeted tests, and review.',
]

export default function CursorCloudEnvironmentsPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Cursor Cloud environments</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Cloud Agents should run in a reviewed development environment with predictable install commands,
          scoped secrets, and normal HireProof verification gates.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Baseline</h2>
        <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface">
          {baseline.map(([label, value]) => (
            <div key={label} className="grid gap-2 border-b border-border-soft p-4 last:border-b-0 sm:grid-cols-[180px_1fr]">
              <div className="text-xs font-black uppercase tracking-widest text-muted">{label}</div>
              <div className="text-sm font-semibold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Environment file stance</h2>
        <p className="text-sm font-medium leading-relaxed text-muted">
          HireProof keeps <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">.cursor/environment.json</code>{' '}
          minimal: install dependencies with <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">npm ci</code>{' '}
          and keep the dev server available with <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">npm run dev</code>.
          Do not copy the repo into a Dockerfile; Cursor checks out the workspace.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Governance checklist</h2>
        <ul className="space-y-3 text-sm font-medium leading-relaxed text-muted">
          {governance.map((item) => (
            <li key={item} className="rounded-2xl border border-border-soft bg-surface p-4">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm font-medium text-muted">
        Related: <Link href="/docs/cursor/sdk" className="text-safe underline">SDK</Link>,{' '}
        <Link href="/docs/cursor/qa" className="text-safe underline">QA checklist</Link>, and{' '}
        <Link href="/docs/cursor" className="text-safe underline">Cursor integration</Link>.
      </p>
    </div>
  )
}
