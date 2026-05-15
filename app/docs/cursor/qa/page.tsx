import { Metadata } from 'next'
import Link from 'next/link'
import { FlaskConical } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cursor QA checklist | HireProof Docs',
  description: 'Release checklist for Cursor exploratory QA and Playwright as the blocker.',
}

export default function CursorQaPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-safe" />
          <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Cursor QA checklist</h1>
        </div>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Cursor cloud agents produce <strong className="text-foreground">exploratory evidence</strong> (screenshots, logs).
          <strong className="text-foreground"> Playwright</strong> and CI tests remain the release blocker.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Release order</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm font-medium text-muted">
          <li>
            <code className="rounded bg-surface px-1 py-0.5">npm run lint</code>,{' '}
            <code className="rounded bg-surface px-1 py-0.5">npm run build</code>,{' '}
            <code className="rounded bg-surface px-1 py-0.5">node --test test/runtime-wiring.test.mjs</code>
          </li>
          <li>Bugbot on PRs (when enabled)</li>
          <li>Optional Cursor UI walkthrough on preview (Phase 3)</li>
          <li>Playwright green + human approval</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Preview checklist</h2>
        <ul className="space-y-2 text-sm font-medium text-muted">
          <li>/audit — input, demo honesty, loading and error states</li>
          <li>/developer — credentials UI, usage cards (no secrets in UI)</li>
          <li>/docs — nav, API playground, copy-for-AI</li>
          <li>README, DEPLOYMENT.md, .env.example aligned with routes</li>
        </ul>
      </section>

      <p className="text-sm font-medium text-muted">
        <Link href="/docs/cursor" className="text-safe underline">Back to Cursor integration</Link>
      </p>
    </div>
  )
}
