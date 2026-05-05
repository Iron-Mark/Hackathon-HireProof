'use client'

import { useState } from 'react'
import { ArrowRight, Bot, Check, Copy, Download, FileCode2, Plug, Server } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CodeBlock } from '@/components/ui/code-block'

interface Skill {
  name: string
  tag: string
  description: string
  useWhen: string
  params: Array<{ name: string; type: string; required: boolean; desc: string }>
  example: string
  color: string
  tagColor: string
}

const SKILLS: Skill[] = [
  {
    name: 'search_company',
    tag: 'Web Presence',
    description: 'Searches Google for a company\'s official website, LinkedIn page, domain registration, and overall web presence. Returns evidence items with source URLs and snippets.',
    useWhen: 'You need to verify whether a company legitimately exists on the web and has a credible online footprint.',
    params: [
      { name: 'company_name', type: 'string', required: true, desc: 'The company name to investigate' },
      { name: 'role', type: 'string', required: false, desc: 'Role title for context-aware search' },
    ],
    example: `curl -X POST https://hireproof-sigma.vercel.app/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{"method":"tools/call","name":"search_company","arguments":{"company_name":"Accenture","role":"Frontend Developer"}}'`,
    color: 'border-safe/30 bg-safe/5',
    tagColor: 'bg-safe/10 text-safe',
  },
  {
    name: 'news_check',
    tag: 'Reputation',
    description: 'Searches Google News for scam reports, fraud warnings, negative press, and reputation signals about a company. Returns news articles with publication dates and URLs.',
    useWhen: 'You need to check whether a company has been flagged for fraud, scams, or deceptive practices in the public press.',
    params: [
      { name: 'company_name', type: 'string', required: true, desc: 'The company name to search news for' },
      { name: 'keywords', type: 'string[]', required: false, desc: 'Additional keywords e.g. ["scam", "fraud"]' },
    ],
    example: `curl -X POST https://hireproof-sigma.vercel.app/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{"method":"tools/call","name":"news_check","arguments":{"company_name":"TechStart Solutions","keywords":["scam","fraud"]}}'`,
    color: 'border-evidence/30 bg-evidence/5',
    tagColor: 'bg-evidence/10 text-evidence',
  },
  {
    name: 'jobs_compare',
    tag: 'Salary Intelligence',
    description: 'Searches active job boards for comparable roles to benchmark the offered salary and requirements against the current market. Detects inflated "too good to be true" salary bait.',
    useWhen: 'You need to verify whether an offered salary is realistic for a given role and location.',
    params: [
      { name: 'role', type: 'string', required: true, desc: 'The job title to compare' },
      { name: 'location', type: 'string', required: false, desc: 'Geographic location for market context' },
      { name: 'level', type: 'string', required: false, desc: 'Experience level e.g. "Entry Level", "Senior"' },
    ],
    example: `curl -X POST https://hireproof-sigma.vercel.app/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{"method":"tools/call","name":"jobs_compare","arguments":{"role":"Frontend Intern","location":"Philippines","level":"Entry Level"}}'`,
    color: 'border-caution/30 bg-caution/5',
    tagColor: 'bg-caution/10 text-caution',
  },
  {
    name: 'local_presence',
    tag: 'Local Footprint',
    description: 'Searches Google Maps and business directories for a company\'s physical office address and local business footprint. Ghost companies often have no verifiable local presence.',
    useWhen: 'You need to verify whether a company has a real physical address or is operating as a shell entity.',
    params: [
      { name: 'company_name', type: 'string', required: true, desc: 'The company name to look up locally' },
      { name: 'location', type: 'string', required: false, desc: 'City or region to search within' },
    ],
    example: `curl -X POST https://hireproof-sigma.vercel.app/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{"method":"tools/call","name":"local_presence","arguments":{"company_name":"Accenture","location":"Philippines"}}'`,
    color: 'border-risk-bg bg-risk-bg/10',
    tagColor: 'bg-risk-bg/30 text-risk-text',
  },
]

const MCP_CONFIG = `{
  "mcpServers": {
    "hireproof": {
      "url": "https://hireproof-sigma.vercel.app/api/mcp",
      "headers": {
        "x-api-key": "hireproof_agent_demo_key"
      }
    }
  }
}`

const SDK_EXAMPLE = `import HireProof from 'hireproof-sdk'

const client = new HireProof({
  apiKey: 'hireproof_agent_demo_key',
  baseUrl: 'https://hireproof-sigma.vercel.app',
})

// Call any individual skill
const result = await client.mcp.callTool('search_company', {
  company_name: 'Accenture',
  role: 'Frontend Developer',
})
console.log(result.content[0].text)`

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-border-soft bg-surface px-3 py-1.5 text-xs font-black text-muted transition-colors hover:bg-background hover:text-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-safe">
            <Check className="h-3 w-3" /> Copied
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
            <Copy className="h-3 w-3" /> {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export default function SkillsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-10 grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(25rem,0.8fr)] xl:items-center">
        <div>
          <div className="mb-3 text-xs font-black uppercase tracking-wider text-safe">Open agent surface</div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Agent Skills</h1>
          <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-muted">
            HireProof exposes 4 open investigation skills via MCP for agents that need company identity, reputation, salary, and local footprint checks before they trust a job opportunity.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: FileCode2, label: 'SKILL.md package', desc: 'Portable agent instructions' },
              { icon: Server, label: 'Live MCP endpoint', desc: 'Tool calls over HTTP' },
              { icon: Bot, label: 'CLI ready', desc: 'Codex, Claude, Gemini, Cursor' },
            ].map((item) => (
              <div key={item.label} className="border-l border-border-soft pl-3">
                <div className="flex items-center gap-2 text-sm font-black text-foreground">
                  <item.icon className="h-4 w-4 text-safe" />
                  {item.label}
                </div>
                <div className="mt-1 text-xs font-semibold leading-5 text-muted">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-3xl border border-border-soft bg-surface/70 p-4 shadow-sm">
          <img
            src="/docs-media/skills-agent-network.svg"
            alt="Diagram showing HireProof skills connecting AI agents to MCP investigation tools"
            className="aspect-[16/11] w-full rounded-2xl object-contain"
            loading="lazy"
          />
        </section>
      </div>

      {/* Download Banner */}
      <div className="mb-10 space-y-3">
        <h2 className="text-2xl font-black">Get the Skills</h2>
        <p className="text-sm font-semibold text-muted">Choose the integration path that matches your agent runtime.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* AI CLI Skill */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-safe/30 bg-safe/5 p-5">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-black">
                <FileCode2 className="h-4 w-4 text-safe" />
                AI CLI Skill Package
              </div>
              <p className="text-xs font-semibold text-muted leading-5">
                Drop into <code className="font-mono bg-surface px-1 rounded">.agents/skills/hireproof/</code> to use with Gemini CLI, Claude Code, Cursor, Codex, or any agent that reads skill files.
              </p>
            </div>
            <a
              href="https://raw.githubusercontent.com/Iron-Mark/hackathon-v0-zero_to_agent/main/.agents/skills/hireproof/SKILL.md"
              target="_blank"
              rel="noopener noreferrer"
              className="hireproof-cta-primary flex w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black"
            >
              <Download className="h-4 w-4" />
              Download SKILL.md
            </a>
          </div>
          {/* Reference doc */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border-soft bg-surface p-5">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-black">
                <Plug className="h-4 w-4 text-evidence" />
                Full Reference
              </div>
              <p className="text-xs font-semibold text-muted leading-5">
                Complete markdown reference with all 4 skill definitions, parameter tables, and cURL examples. Great for documentation or custom integrations.
              </p>
            </div>
            <a
              href="https://raw.githubusercontent.com/Iron-Mark/hackathon-v0-zero_to_agent/main/SKILLS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-border-soft bg-background px-4 py-2.5 text-sm font-black text-foreground transition-colors hover:bg-surface"
            >
              <Download className="h-4 w-4" />
              Download SKILLS.md
            </a>
          </div>
        </div>
      </div>

      {/* Marketplaces */}
      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">Skill Directory Links</h2>
        <p className="mb-4 text-sm font-semibold text-muted">Use these public SKILL.md directories and MCP tool catalogs to discover compatible agent-skill surfaces. Availability can depend on each directory&apos;s current indexing and review state.</p>
        <div className="grid gap-3 lg:grid-cols-3">
          {[
            { name: 'SkillsLLM', url: 'https://skillsllm.com', desc: '1600+ security-vetted skills' },
            { name: 'SkillsMP', url: 'https://skillsmp.com', desc: '900k+ skills, open standard' },
            { name: 'MCP Market', url: 'https://mcpmarket.com/tools/skills', desc: 'Claude, ChatGPT & Codex directory' },
          ].map((m) => (
            <a
              key={m.name}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-border-soft bg-surface p-4 transition-all hover:border-safe hover:shadow-sm"
            >
              <div className="text-sm font-black group-hover:text-safe mb-0.5">{m.name}</div>
              <div className="text-xs font-semibold text-muted">{m.desc}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Install instructions */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-black">Install the Skill</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-border-soft bg-surface p-5">
            <div className="text-sm font-black mb-1">Claude Code / Gemini CLI / Codex CLI</div>
            <p className="text-xs font-semibold text-muted mb-3">Copy the SKILL.md into your skills directory. The AI detects it automatically on next start.</p>
            <CodeBlock title="Terminal" code={`# Create the skill folder
mkdir -p .agents/skills/hireproof

# Download the skill
curl -o .agents/skills/hireproof/SKILL.md \\
  https://raw.githubusercontent.com/Iron-Mark/hackathon-v0-zero_to_agent/main/.agents/skills/hireproof/SKILL.md`} />
          </div>
          <div className="rounded-xl border border-border-soft bg-surface p-5">
            <div className="text-sm font-black mb-1">Claude.ai (Pro / Max / Team / Enterprise)</div>
            <p className="text-xs font-semibold text-muted mb-3">Upload as a ZIP via <strong>Settings &rarr; Features &rarr; Custom Skills</strong>. Package the skill folder first:</p>
            <CodeBlock title="Terminal" code={`# Package the skill as a zip
zip -r hireproof-skill.zip .agents/skills/hireproof/

# Then upload hireproof-skill.zip in Claude.ai Settings > Features`} />
          </div>
          <div className="rounded-xl border border-border-soft bg-surface p-5">
            <div className="text-sm font-black mb-1">Claude API (workspace-wide)</div>
            <p className="text-xs font-semibold text-muted mb-3">Upload via the Skills API. Available to all workspace members once uploaded.</p>
            <CodeBlock title="Terminal" code={`curl -X POST https://api.anthropic.com/v1/skills \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: skills-2025-10-02" \\
  -F "file=@hireproof-skill.zip"`} />
          </div>
        </div>
      </section>

      {/* Quick Connect */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-black">Quick Connect via MCP</h2>
        <p className="mb-4 text-sm font-semibold text-muted">Alternatively, connect directly to the live MCP server without downloading anything:</p>
        <CodeBlock title="mcp-config.json" code={MCP_CONFIG} />
        <p className="mb-4 text-sm font-semibold text-muted">Or use the TypeScript SDK:</p>
        <CodeBlock title="agent.ts" code={SDK_EXAMPLE} />
      </section>

      {/* Tool Naming */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-black">Tool Naming Convention</h2>
        <p className="mb-4 text-sm font-semibold text-muted">
          MCP clients automatically namespace tools using the server name from your config. Since the server key is <code className="font-mono bg-surface px-1.5 py-0.5 rounded text-xs">"hireproof"</code>, the tools appear as:
        </p>
        <div className="max-w-full overflow-x-auto rounded-xl border border-border-soft">
          <table className="min-w-[42rem] w-full text-xs">
            <thead>
              <tr className="border-b border-border-soft bg-surface">
                <th className="px-4 py-3 text-left font-black text-muted">MCP Client Name</th>
                <th className="px-4 py-3 text-left font-black text-muted">Direct Protocol Name</th>
                <th className="px-4 py-3 text-left font-black text-muted">Used by</th>
              </tr>
            </thead>
            <tbody>
              {[
                { mcp: 'hireproof:search_company', direct: 'search_company', used: 'Claude Code, Cursor, Copilot' },
                { mcp: 'hireproof:news_check', direct: 'news_check', used: 'Claude Code, Cursor, Copilot' },
                { mcp: 'hireproof:jobs_compare', direct: 'jobs_compare', used: 'Claude Code, Cursor, Copilot' },
                { mcp: 'hireproof:local_presence', direct: 'local_presence', used: 'Claude Code, Cursor, Copilot' },
              ].map((row) => (
                <tr key={row.direct} className="border-b border-border-soft last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-evidence">{row.mcp}</td>
                  <td className="px-4 py-3 font-mono font-bold">{row.direct}</td>
                  <td className="px-4 py-3 text-muted">{row.used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs font-semibold text-muted">
          Both formats resolve to the same tool. The namespace prefix is added automatically by the client — you do not configure it yourself.
        </p>
      </section>

      {/* Skills List */}
      <section>
        <h2 className="mb-6 text-2xl font-black">Available Skills</h2>
        <div className="space-y-6">
          {SKILLS.map((skill) => (
            <div key={skill.name} className={`min-w-0 rounded-2xl border p-6 ${skill.color}`}>
              {/* Skill Header */}
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <code className="text-base font-black text-foreground">{skill.name}</code>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${skill.tagColor}`}>{skill.tag}</span>
                  </div>
                  <p className="text-sm font-semibold text-muted leading-6 max-w-xl">{skill.description}</p>
                </div>
                <CopyButton text={skill.example} label="Copy cURL" />
              </div>

              {/* Use When */}
              <div className="mb-4 rounded-lg border border-border-soft bg-background/50 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted">Use when: </span>
                <span className="text-xs font-semibold text-muted">{skill.useWhen}</span>
              </div>

              {/* Params */}
              <div className="mb-4 max-w-full overflow-x-auto rounded-xl border border-border-soft bg-background/50">
                <table className="min-w-[42rem] w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-soft">
                      <th className="px-4 py-2 text-left font-black text-muted">Parameter</th>
                      <th className="px-4 py-2 text-left font-black text-muted">Type</th>
                      <th className="px-4 py-2 text-left font-black text-muted">Required</th>
                      <th className="px-4 py-2 text-left font-black text-muted">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skill.params.map((p) => (
                      <tr key={p.name} className="border-b border-border-soft last:border-0">
                        <td className="px-4 py-2 font-mono font-bold">{p.name}</td>
                        <td className="px-4 py-2 text-muted">{p.type}</td>
                        <td className="px-4 py-2">{p.required ? <span className="font-black text-risk-text">Yes</span> : <span className="text-muted">No</span>}</td>
                        <td className="px-4 py-2 text-muted">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Example */}
              <CodeBlock title="cURL Example" code={skill.example} />
            </div>
          ))}
        </div>
      </section>

      {/* Contribute */}
      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-black">Contribute</h2>
        <p className="mb-5 text-sm font-semibold text-muted leading-6">
          The HireProof skill is open source and ships inside the repo at <code className="font-mono bg-surface px-1.5 py-0.5 rounded text-xs">.agents/skills/hireproof/</code>.
          When contributors clone the project, their AI CLI automatically loads the skill — no manual setup needed.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl border border-border-soft bg-surface p-5">
            <div className="text-sm font-black mb-1">Clone and start contributing</div>
            <p className="text-xs font-semibold text-muted mb-3">The skill is available immediately after cloning. Your AI agent can run HireProof investigations while you develop.</p>
            <CodeBlock title="Terminal" code={`git clone https://github.com/Iron-Mark/hackathon-v0-zero_to_agent.git
cd hackathon-v0-zero_to_agent
npm install

# The skill at .agents/skills/hireproof/SKILL.md is auto-detected
# by Gemini CLI, Claude Code, Cursor, and Codex on next start.`} />
          </div>
          <div className="rounded-xl border border-border-soft bg-surface p-5">
            <div className="text-sm font-black mb-1">Add a new investigation tool</div>
            <p className="text-xs font-semibold text-muted mb-3">Want to add a 5th tool (e.g. domain age check, social media scan)? Here is the structure:</p>
            <CodeBlock title="Project Structure" code={`.agents/skills/hireproof/
  SKILL.md              # Skill instructions (edit to add new tool docs)

lib/
  mcp-tools.ts          # MCP tool definitions (add your tool here)
  serpapi.ts             # SerpApi wrapper functions (add your search here)

app/api/mcp/route.ts    # MCP server route (register your tool here)`} />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-safe/20 bg-safe/5 px-4 py-3 text-xs font-bold text-safe">
            <ArrowRight className="h-4 w-4 shrink-0" />
            <span>After adding a new tool, update the SKILL.md with its name, parameters, and "when to use" guidance so every AI agent that loads the skill knows how to call it.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
