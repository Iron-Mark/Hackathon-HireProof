import { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/ui/code-block'
import { Network } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cursor + MCP | HireProof Docs',
  description: 'Ground Cursor agents on HireProof MCP investigation tools.',
}

export default function CursorMcpPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Network className="h-8 w-8 text-safe" />
          <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Cursor + MCP</h1>
        </div>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Prefer HireProof MCP tools over ad-hoc web search when agents validate companies, salaries, or local footprint.
          Full tool reference: <Link href="/docs/mcp" className="text-safe underline">MCP Server</Link>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Cursor MCP config</h2>
        <CodeBlock
          language="json"
          code={`{
  "mcpServers": {
    "hireproof": {
      "url": "https://hireproof.tech/api/mcp",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}`}
        />
        <p className="text-sm font-medium text-muted">Never commit real API keys. Use your developer key or self-hosted URL.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Contributor vs investigation skills</h2>
        <ul className="space-y-2 text-sm font-medium text-muted">
          <li>
            <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">.agents/skills/hireproof/</code> — job investigation
            in any IDE
          </li>
          <li>
            <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">.cursor/skills/hireproof-architecture/</code> — safe
            edits to this repo
          </li>
        </ul>
      </section>
    </div>
  )
}
