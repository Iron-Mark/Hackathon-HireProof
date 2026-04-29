import { Metadata } from 'next'
import { CodeBlock } from '@/components/ui/code-block'
import { Code2, FolderTree, Terminal } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cursor & IDE Skills | HireProof Docs',
  description: 'Add the HireProof agent skill to your local development environment (Cursor, Windsurf, Claude Code).',
}

export default function IDESkillsPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Cursor & IDE Skills</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Did you know HireProof is compatible with local AI coding assistants like <strong className="text-foreground">Cursor</strong>, <strong className="text-foreground">Windsurf</strong>, and <strong className="text-foreground">GitHub Copilot</strong>? You can add HireProof directly into your IDE.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <FolderTree className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">The .agents Folder Standard</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          Modern AI IDEs support the <code className="rounded bg-surface px-1.5 py-0.5 text-sm text-foreground">.agents/skills</code> standard. This allows you to define custom system instructions that your IDE's agent can read and execute. We have built an official HireProof <code className="rounded bg-surface px-1.5 py-0.5 text-sm text-foreground">SKILL.md</code> file that teaches your local IDE how to use the HireProof REST API.
        </p>

        <div className="hireproof-card space-y-6 rounded-3xl border border-border-soft p-8">
          <h3 className="flex items-center gap-3 text-lg font-black">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm text-background">1</span>
            Create the Skills Directory
          </h3>
          <div className="ml-11">
            <p className="mb-4 text-sm font-medium text-muted">In the root of your project workspace, create the following directory structure:</p>
            <div className="rounded-xl border border-border-soft bg-[#0d1117] p-4 text-sm font-mono text-zinc-400">
              your-project/<br />
              └── .agents/<br />
              &nbsp;&nbsp;&nbsp;&nbsp;└── skills/<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── hireproof/<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── SKILL.md
            </div>
          </div>
        </div>

        <div className="hireproof-card space-y-6 rounded-3xl border border-border-soft p-8">
          <h3 className="flex items-center gap-3 text-lg font-black">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm text-background">2</span>
            Add the SKILL.md Content
          </h3>
          <div className="ml-11">
            <p className="mb-4 text-sm font-medium text-muted">Paste the following into your <code className="rounded bg-surface px-1.5 py-0.5">SKILL.md</code> file:</p>
            <CodeBlock
              language="markdown"
              code={`---
name: hireproof
description: Investigate suspicious job postings using HireProof's live AI agent tools.
---

# HireProof Job Verification Skill

When the user asks you to verify a job listing, check if a company is legitimate, or detect recruitment scams, you MUST use the HireProof Headless API.

## API Usage

Make a POST request to the HireProof API.

Endpoint: \`https://hireproof.vercel.app/api/v1/audit\`
Headers:
  - \`Content-Type: application/json\`
Body:
  - \`text\`: The job description or recruiter message string.

\`\`\`bash
curl -X POST https://hireproof.vercel.app/api/v1/audit \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Remote frontend intern. PHP 80,000/week."}'
\`\`\`

## Interpreting Results

The API will return a JSON object with a \`verdict\` (safe, caution, high-risk), a \`riskScore\` (0-100), and an array of \`redFlags\`.
You must present this information clearly to the user. If the verdict is high-risk, strongly advise the user NOT to send any personal information.
`}
            />
          </div>
        </div>

        <div className="hireproof-card space-y-6 rounded-3xl border border-border-soft p-8">
          <h3 className="flex items-center gap-3 text-lg font-black">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm text-background">3</span>
            Invoke the Agent
          </h3>
          <div className="ml-11">
            <p className="mb-4 text-sm font-medium text-muted">Open your IDE's Agent Chat (e.g., Composer in Cursor) and type:</p>
            <div className="rounded-xl border border-safe/30 bg-safe/5 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Terminal className="mt-0.5 h-5 w-5 text-safe" />
                <p className="font-medium text-safe-text">
                  "Use the hireproof skill to verify this job post: [Paste Job Post Here]"
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-muted">Your IDE will automatically read the skill instructions, execute the curl command in the background, and present the HireProof report directly in your editor!</p>
          </div>
        </div>
      </section>
    </div>
  )
}
