import Image from 'next/image'
import { Terminal, FileText, HeartPulse, Settings, Braces, Package, Gauge } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'

export const metadata = {
  title: 'CLI — HireProof Docs',
  description: 'Run HireProof audits from a terminal, CI job, or local automation script.',
}

export default function CliDocsPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <div className="inline-block rounded-full bg-safe/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-safe">
          Published on npm
        </div>
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">HireProof CLI</h1>
        <p className="max-w-3xl text-xl font-medium leading-relaxed text-muted">
          A branded terminal console for running HireProof audits without opening the web app. Run <code className="rounded bg-background px-1.5 py-0.5">hireproof</code> to open the Shield Sentinel TUI, or use direct commands when scripts need clean JSON.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Package className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Status</h2>
        </div>
        <div className="rounded-3xl border border-border-soft bg-surface p-6">
          <p className="text-sm font-semibold leading-relaxed text-muted">
            The CLI is published as <a href="https://www.npmjs.com/package/@hireproof/cli" className="font-black text-safe hover:underline">@hireproof/cli</a> and the source remains in the repo at <code className="rounded bg-background px-1.5 py-0.5">packages/hireproof-cli</code>. The package includes the Ink TUI, rich report output, local report summaries, and clean JSON mode for automation.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Terminal className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Run From The Repo</h2>
        </div>
        <CodeBlock
          title="Install from npm"
          code={`npx @hireproof/cli --help
npx @hireproof/cli tui
npx @hireproof/cli health
npx @hireproof/cli audit --text "Remote frontend intern. PHP 80,000/week. No interview. Telegram only." --mode demo`}
        />
        <CodeBlock
          title="Run from repo source"
          code={`npm install
node packages\\hireproof-cli\\bin\\hireproof.mjs --help
node packages\\hireproof-cli\\bin\\hireproof.mjs tui
node packages\\hireproof-cli\\bin\\hireproof.mjs health
node packages\\hireproof-cli\\bin\\hireproof.mjs audit --text "Remote frontend intern. PHP 80,000/week. No interview. Telegram only." --mode demo`}
        />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Terminal className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Interactive Console</h2>
        </div>
        <p className="max-w-3xl text-sm font-semibold leading-relaxed text-muted">
          In a real terminal, <code className="rounded bg-background px-1.5 py-0.5">hireproof</code> opens a full-screen-style Ink TUI with the Shield Sentinel mascot, menu navigation, command-console input with Tab autocomplete, slash commands, status context, audit flows, health/config tools, recent report summaries, and a local Ask HireProof panel.
        </p>
        <figure className="overflow-hidden rounded-[28px] border border-border-soft bg-surface shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <Image
            src="/cli-tui-screenshot.png"
            alt="HireProof CLI interactive terminal UI with Shield Sentinel mascot, command console, and docs-style menu"
            width={1248}
            height={930}
            className="block h-auto w-full dark:hidden"
            priority
          />
          <Image
            src="/cli-tui-screenshot-dark.png"
            alt="HireProof CLI dark-theme interactive terminal UI with Shield Sentinel mascot, command console, and docs-style menu"
            width={1248}
            height={930}
            className="hidden h-auto w-full dark:block"
          />
          <figcaption className="border-t border-border-soft bg-muted/35 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Actual repo-rendered CLI TUI screenshot, theme-aware
          </figcaption>
        </figure>
        <CodeBlock
          title="Terminal"
          code={`HIREPROOF
Shield Sentinel terminal console
Target https://hireproof-sigma.vercel.app  Mode demo  Key configured
API ok | mode demo | key configured | latest High-Risk 92/100 | / commands | Tab complete | ? help

Shield Sentinel        > Audit - Run the guided audit workflow
    .-=========-.        Paste message - Paste a recruiter message or job post
  .'  HIREPROOF  '.      Audit file - Audit text from a local file path
 /   .---------.   \\     Audit URL - Audit a job URL with optional context
|   /    HP     \\   |    Recent reports - Review locally saved TUI report summaries
|   |  [SCAN]   |   |    Ask HireProof - Ask local questions about the selected report
|   \\___________/   |    Health - Check API, search, and model readiness
 '.   SENTINEL   .'      Config - Inspect base URL and API key status
   '-._______ .-'        Help - Show shortcuts and command examples

Command console  Tab autocomplete  Enter run
> hea
Tab -> health

Slash commands: /health /reports /ask
Shortcuts: a audit, h health, r reports, ? help
Esc back/exit  q exit  Direct JSON commands remain unchanged.`}
        />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Gauge className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Rich Terminal Report</h2>
        </div>
        <p className="max-w-3xl text-sm font-semibold leading-relaxed text-muted">
          The default audit output is designed for humans: verdict first, risk bar next, then the claims and evidence that explain the result. Interactive terminals use HireProof's green brand accent plus verdict colors, while the layout stays ASCII-safe for PowerShell and CI logs.
        </p>
        <CodeBlock
          title="Example"
          code={`+----------------------------------------------------------+
| HIREPROOF TERMINAL REPORT                                |
+----------------------------------------------------------+
| Target: demo                                             |
| Report: report_demo_high_risk                            |
+----------------------------------------------------------+

Verdict High-Risk   Score: 92/100 [##################--]

+ Summary -------------------------------------------------+
| High-pressure remote offer with off-platform messaging,   |
| unusually high pay, and no normal interview path.         |
+----------------------------------------------------------+

+ Claims --------------------------------------------------+
| Company            Unknown                               |
| Role               Remote frontend intern                |
| Salary             PHP 80,000/week                       |
| Contact            Telegram only                         |
+----------------------------------------------------------+`}
        />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <FileText className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Audit A File</h2>
        </div>
        <CodeBlock
          title="PowerShell"
          code={`node packages\\hireproof-cli\\bin\\hireproof.mjs audit --file .\\job-post.txt --location Philippines
node packages\\hireproof-cli\\bin\\hireproof.mjs audit .\\job-post.txt --json`}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border-soft bg-surface p-6">
          <HeartPulse className="mb-4 h-6 w-6 text-safe" />
          <h2 className="mb-3 text-xl font-black">Health Checks</h2>
          <p className="mb-4 text-sm font-semibold leading-relaxed text-muted">
            Check whether the target HireProof API is reachable before wiring it into a script or CI job.
          </p>
          <CodeBlock title="Terminal" code="hireproof health --base-url https://hireproof-sigma.vercel.app" />
        </div>

        <div className="rounded-3xl border border-border-soft bg-surface p-6">
          <Settings className="mb-4 h-6 w-6 text-safe" />
          <h2 className="mb-3 text-xl font-black">Local Config</h2>
          <p className="mb-4 text-sm font-semibold leading-relaxed text-muted">
            Store default API settings locally, then keep normal audit commands short.
          </p>
          <CodeBlock
            title="Terminal"
            code={`hireproof config set baseUrl https://hireproof-sigma.vercel.app
hireproof config set apiKey hireproof_agent_demo_key
hireproof config list`}
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Terminal className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Output Modes</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border-soft bg-surface p-5">
            <h3 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-foreground">Rich</h3>
            <p className="text-sm font-semibold leading-relaxed text-muted">
              Default direct-command mode for people reading in a terminal. Includes boxes, status labels, a risk bar, and truncated evidence.
            </p>
          </div>
          <div className="rounded-3xl border border-border-soft bg-surface p-5">
            <h3 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-foreground">JSON</h3>
            <p className="text-sm font-semibold leading-relaxed text-muted">
              Automation-safe output. No banners, no ANSI color, no extra text, and parseable directly by scripts.
            </p>
          </div>
          <div className="rounded-3xl border border-border-soft bg-surface p-5">
            <h3 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-foreground">Plain</h3>
            <p className="text-sm font-semibold leading-relaxed text-muted">
              Compact text for narrow logs or environments where boxed layout is unwanted.
            </p>
          </div>
        </div>
        <CodeBlock
          title="Terminal"
          code={`hireproof
hireproof tui
Inside the TUI: /health, /reports, /ask, Tab autocomplete
hireproof audit --file .\\job-post.txt --plain
hireproof audit --file .\\job-post.txt --no-color
hireproof audit --file .\\job-post.txt --verbose`}
        />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <FileText className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Local Report History</h2>
        </div>
        <p className="max-w-3xl text-sm font-semibold leading-relaxed text-muted">
          TUI-run audits save compact report summaries at <code className="rounded bg-background px-1.5 py-0.5">~/.hireproof/reports.jsonl</code>. The CLI does not store API keys or the full pasted recruiter text in this history file by default.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Braces className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">JSON For Automation</h2>
        </div>
        <CodeBlock
          title="Terminal"
          code={`hireproof audit --file .\\job-post.txt --mode demo --json
hireproof audit --text "Suspicious recruiter message..." --webhook-url https://example.com/hireproof-callback --json`}
        />
      </section>
    </div>
  )
}
