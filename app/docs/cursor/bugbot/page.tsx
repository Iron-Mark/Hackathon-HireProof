import { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cursor Bugbot | HireProof Docs',
  description: 'Versioned BUGBOT rules for HireProof pull request review.',
}

export default function CursorBugbotPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-safe" />
          <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Cursor Bugbot</h1>
        </div>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Phase 1 ships versioned rules in the repository. Enable Bugbot and branch protection in GitHub when ready.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Rule files</h2>
        <ul className="space-y-2 text-sm font-medium text-muted">
          <li>
            <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">.cursor/BUGBOT.md</code> — repo-wide
          </li>
          <li>
            <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">app/api/.cursor/BUGBOT.md</code> — API routes
          </li>
          <li>
            <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">lib/.cursor/BUGBOT.md</code> — core logic
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Rollout</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm font-medium text-muted">
          <li>Review-only Bugbot baseline</li>
          <li>Merge committed BUGBOT.md files</li>
          <li>Require <code className="rounded bg-surface px-1 py-0.5">Cursor Bugbot</code> check on protected branches</li>
          <li>Autofix on new branch only after false-positive rate is acceptable</li>
        </ol>
      </section>

      <p className="text-sm font-medium text-muted">
        See also <Link href="/docs/security" className="text-safe underline">Security whitepaper</Link> and{' '}
        <Link href="/docs/cursor" className="text-safe underline">Cursor overview</Link>.
      </p>
    </div>
  )
}
