import { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/ui/code-block'
import { Code2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cursor SDK (developer portal) | HireProof Docs',
  description: '@cursor/sdk integration for the HireProof developer portal with server-side keys and example prompts.',
}

export default function CursorSdkPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Code2 className="h-8 w-8 text-safe" />
          <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Cursor SDK (developer portal)</h1>
        </div>
        <p className="text-xl font-medium leading-relaxed text-muted">
          <strong className="text-foreground">Implemented behind a feature flag.</strong> Cursor runs are optional developer
          and ops helpers, not part of HireProof audit verdicts.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Target flow</h2>
        <p className="text-sm font-medium text-muted">
          Secured <code className="rounded bg-surface px-1.5 py-0.5">POST /api/developer/cursor/runs</code> →{' '}
          <code className="rounded bg-surface px-1.5 py-0.5">lib/cursor</code> via{' '}
          <code className="rounded bg-surface px-1.5 py-0.5">@cursor/sdk</code> → run metadata in{' '}
          <code className="rounded bg-surface px-1.5 py-0.5">/developer</code>.
        </p>
        <p className="text-sm font-medium text-muted">
          Reuse authenticated sessions, mutation-origin checks, and rate limits from developer routes. Gate with{' '}
          <code className="rounded bg-surface px-1.5 py-0.5">CURSOR_INTEGRATION_ENABLED=false</code> until QA passes. The
          current key model uses server-side <code className="rounded bg-surface px-1.5 py-0.5">CURSOR_API_KEY</code>;
          per-user Cursor key storage and streaming logs remain future work.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Example prompts</h2>
        <CodeBlock
          title="Generate Next.js integration"
          language="text"
          code={`Read app/docs/headless-api and lib/schemas.ts. Propose a minimal Next.js App Router example that calls POST /api/v1/audit with x-api-key from env. Do not weaken origin or SSRF patterns from existing routes.`}
        />
        <CodeBlock
          title="Docs / env drift review"
          language="text"
          code={`Compare README.md, DEPLOYMENT.md, .env.example, and docs/automation-integrations.md for stale routes, env vars, or API examples. List mismatches only; propose minimal doc fixes in a separate branch.`}
        />
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-6 text-sm font-medium text-muted">
        When the SDK is unavailable, use the <Link href="/docs/api-reference" className="text-safe underline">API playground</Link> and{' '}
        <Link href="/developer" className="text-safe underline">developer portal</Link> keys as today.
      </section>
    </div>
  )
}
