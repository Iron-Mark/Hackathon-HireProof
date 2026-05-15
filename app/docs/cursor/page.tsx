import { Metadata } from 'next'
import Link from 'next/link'
import { Code2, Network, ShieldCheck, FlaskConical, FileText, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cursor Integration | HireProof Docs',
  description:
    'Use Cursor to accelerate HireProof development without delegating fraud verdicts to agents.',
}

const pages = [
  {
    href: '/docs/cursor/sdk',
    title: 'SDK (developer portal)',
    desc: 'Planned @cursor/sdk flow, BYOK, and example prompts for /developer (Phase 2).',
    icon: Code2,
  },
  {
    href: '/docs/cursor/mcp',
    title: 'MCP grounding',
    desc: 'Connect Cursor to HireProof investigation tools instead of ad-hoc browsing.',
    icon: Network,
  },
  {
    href: '/docs/cursor/bugbot',
    title: 'Bugbot rules',
    desc: 'Versioned .cursor/BUGBOT.md for PR review on API, lib, and trust paths.',
    icon: ShieldCheck,
  },
  {
    href: '/docs/cursor/qa',
    title: 'QA checklist',
    desc: 'Exploratory Cursor QA vs Playwright as the deterministic release blocker.',
    icon: FlaskConical,
  },
]

export default function CursorIntegrationPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Cursor integration</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          HireProof uses Cursor to improve <strong className="text-foreground">developer experience and repo quality</strong>.
          Cursor must <strong className="text-foreground">not</strong> become the source of truth for audit verdicts or public API correctness.
        </p>
      </section>

      <section className="hireproof-card rounded-3xl border border-caution/30 bg-caution/5 p-8">
        <h2 className="text-lg font-black text-foreground">Architecture boundary</h2>
        <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
          Product truth stays on <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">/api/audit</code>,{' '}
          <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">/api/v1/audit</code>, and{' '}
          <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">/api/mcp</code>. Cursor handles skills, hooks,
          Bugbot, and (later) optional developer-portal agent runs—not end-user fraud decisions.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="hireproof-focus group flex flex-col rounded-2xl border border-border-soft bg-surface p-6 transition-colors hover:border-safe/40"
            >
              <page.icon className="h-6 w-6 text-safe" />
              <h3 className="mt-4 flex items-center justify-between text-lg font-black">
                {page.title}
                <ChevronRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-safe" />
              </h3>
              <p className="mt-2 text-sm font-medium text-muted">{page.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Two skill scopes</h2>
        <ul className="space-y-3 text-sm font-medium text-muted">
          <li>
            <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">.agents/skills/hireproof/</code> — investigate job
            posts in any IDE (see also <Link href="/docs/ide-skills" className="text-safe underline">Cursor & IDE Skills</Link>).
          </li>
          <li>
            <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">.cursor/skills/hireproof-architecture/</code> —
            contributor constraints for this repository (live-vs-demo, SSRF, secrets).
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-6">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
          <div>
            <p className="text-sm font-medium text-muted">
              Full strategic research export (cleaned):{' '}
              <code className="text-foreground">docs/cursor/deep-research-report-HPROOF.md</code> in the repository.
            </p>
            <p className="mt-2 text-sm font-medium text-muted">
              Phase 1 in repo today: <code className="text-foreground">.cursor/BUGBOT.md</code>, architecture skill,{' '}
              <code className="text-foreground">scripts/cursor-pretool-guard.mjs</code>, and{' '}
              <code className="text-foreground">.cursor/hooks.json</code>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
