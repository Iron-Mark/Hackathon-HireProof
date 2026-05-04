import type { Metadata } from 'next'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  GraduationCap,
  MessageSquare,
  MonitorCheck,
  PlugZap,
  ShieldCheck,
  Users,
  Workflow,
  XCircle,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Use Cases for Safer Hiring Automation | HireProof Docs',
  description:
    'Real-world HireProof use cases for job seekers, AI apply agents, automations, communities, developers, and teams verifying job opportunities before trust is spent.',
}

const scenarios = [
  {
    icon: BriefcaseBusiness,
    title: 'Individual applicants',
    situation: 'A remote role looks polished, but the apply path points away from the official employer domain.',
    action: 'HireProof checks company identity, apply path, recruiter claims, salary realism, reputation, and visible evidence before the applicant shares data.',
    surface: 'Web audit or report share link',
  },
  {
    icon: GraduationCap,
    title: 'Students and fresh grads',
    situation: 'An internship, trainee, or scholarship-style offer asks for documents before a real interview.',
    action: 'The audit turns the message into structured claims, highlights missing official evidence, and gives plain next steps.',
    surface: 'Screenshot upload, pasted text, or mobile chat intake',
  },
  {
    icon: MessageSquare,
    title: 'Freelancers and remote workers',
    situation: 'A recruiter pushes a high-paying contract through Telegram, WhatsApp, or direct message only.',
    action: 'HireProof preserves the risky contact pattern, checks the visible company footprint, and returns a Safe, Caution, or High-Risk verdict.',
    surface: 'Telegram-tested path, Slack-tested intake, Discord-ready route',
  },
  {
    icon: Bot,
    title: 'AI apply automation',
    situation: 'An apply agent is ready to autofill a form, send a resume, or draft follow-ups at machine speed.',
    action: 'HireProof acts as the pre-submit safety gate so automation pauses on Caution or High-Risk opportunities.',
    surface: 'Headless API, MCP tool, SDK, or workflow handoff',
  },
  {
    icon: Workflow,
    title: 'No-code and operations teams',
    situation: 'A community, school, or job board wants every submitted opportunity triaged before humans review it.',
    action: 'Automation calls the audit API, branches on verdict and risk score, then routes clean jobs, review cases, and likely scams differently.',
    surface: 'n8n node, Make source pack, webhooks, CSV/PDF exports',
  },
  {
    icon: Code2,
    title: 'Agent and developer platforms',
    situation: 'A larger career agent needs a specialist employment-fraud tool instead of another generic web-search prompt.',
    action: 'Developers plug HireProof into the existing agent as a reusable audit core with evidence receipts and typed report outputs.',
    surface: 'MCP server, REST API, ChatSDK route, CLI/TUI',
  },
]

const integrationRows = [
  ['Applicant self-check', 'Job post, URL, recruiter message, screenshot', 'Web UI', 'Verdict, evidence cards, next steps'],
  ['AI apply agent', 'Candidate workflow event before submit', 'API, MCP, SDK', 'Continue, pause, or stop automation'],
  ['Community intake', 'Forwarded suspicious role or chat message', 'Slack, Telegram, Discord-ready routes', 'Short verdict reply plus report link'],
  ['No-code operations', 'Webhook payload from job board or form', 'n8n, Make, webhooks', 'Branching by Safe, Caution, High-Risk'],
  ['Developer workflow', 'Tool call from a broader agent', 'MCP, REST, CLI/TUI', 'Structured JSON report and receipts'],
  ['Browser review', 'Visible listing while browsing', 'Chrome extension package workflow', 'On-page verification path and saved report'],
]

const proofAssets = [
  {
    src: '/docs-media/docs-investigation-engine.png',
    alt: 'HireProof investigation engine documentation showing evidence-weighted audit behavior',
    title: 'Reusable audit core',
    desc: 'The same investigation engine supports web reports, headless clients, and tool-based workflows.',
  },
  {
    src: '/docs-media/docs-automations.png',
    alt: 'HireProof automations documentation showing integration packages and workflow templates',
    title: 'Automation-ready surface',
    desc: 'Published packages and workflow templates let teams route verdicts into existing pipelines.',
  },
  {
    src: '/docs-media/docs-skills.png',
    alt: 'HireProof skills documentation showing MCP and agent-skill surfaces',
    title: 'Agent tool surface',
    desc: 'MCP and skill-style integrations make HireProof useful inside larger AI workbenches.',
  },
]

const truthBoundaries = [
  {
    icon: CheckCircle2,
    title: 'What HireProof does claim',
    points: [
      'Structured extraction from job posts, recruiter messages, screenshots, and URLs.',
      'Evidence-weighted scoring across company identity, apply path, salary, local footprint, reputation, and recruiter claims.',
      'Safe, Caution, and High-Risk outputs with report exports for review, sharing, and demos.',
      'A reusable audit core that can be called from web, API, MCP, chat, automation, CLI, and extension workflows.',
    ],
  },
  {
    icon: XCircle,
    title: 'What HireProof does not overclaim',
    points: [
      'It is not law-enforcement verification or a guarantee that every job is real or fake.',
      'It is not positioned as a generic fraud platform beyond employment-fraud workflows.',
      'It does not claim continuous learning, hidden certainty, or production proof for credential-gated channels.',
      'Demo fixture mode is intentionally labeled and should not be confused with fresh live evidence.',
    ],
  },
]

export default function UseCasesPage() {
  return (
    <div className="space-y-14 pb-24">
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(24rem,1.05fr)]">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-safe">
            <ShieldCheck className="h-4 w-4" />
            Use cases
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-foreground lg:text-5xl">
              Use Cases for Safer Hiring Automation
            </h1>
            <p className="text-lg font-semibold leading-8 text-muted">
              HireProof verifies opportunities before applicants, agents, or automations trust them with resumes, identity data, money, or recruiter conversations. It is a plug-in safety layer for modern job search workflows, built around one reusable employment-fraud audit core.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/audit"
              className="hireproof-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-safe px-5 py-3 text-sm font-black text-background shadow-lg shadow-safe/15 transition-transform hover:-translate-y-0.5"
            >
              Run an audit
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs/automations"
              className="hireproof-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface px-5 py-3 text-sm font-black text-foreground transition-colors hover:border-safe/40 hover:bg-safe/5"
            >
              View automations
            </Link>
          </div>
        </div>

        <figure className="overflow-hidden rounded-2xl border border-border-soft bg-surface shadow-sm">
          <img
            src="/docs-media/use-cases-agent-gate.svg"
            alt="HireProof branded architecture graphic showing an AI apply agent routed through an audit gate before Safe, Caution, or High-Risk outcomes"
            className="aspect-[16/10] w-full object-cover"
            loading="eager"
          />
        </figure>
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <PlugZap className="h-6 w-6 text-safe" />
              <h2 className="text-2xl font-black">Multi-surface architecture ready</h2>
            </div>
            <p className="font-semibold leading-7 text-muted">
              HireProof is not just a single prompt wrapper. The same audit core can sit inside applicant tools, internal review queues, AI agents, community chat intake, and automated apply pipelines.
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-0 text-sm font-semibold text-muted sm:grid-cols-2">
            {[
              'Web UI for fast manual checks',
              'Headless API for product workflows',
              'MCP tools for agent workbenches',
              'ChatSDK routes for chat intake',
              'n8n, Make, SDK, and webhook paths',
              'CLI/TUI and extension package workflow',
            ].map((item) => (
              <div key={item} className="flex gap-3 border-b border-border-soft py-4 last:border-b-0">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-2xl font-black">Real-world workflows</h2>
          <p className="font-semibold leading-7 text-muted">
            Each use case starts with the same failure mode: the job opportunity looks urgent, remote, or unusually generous, and the user needs evidence before they proceed.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface shadow-sm">
          {scenarios.map((scenario) => (
            <article key={scenario.title} className="grid gap-4 border-b border-border-soft p-5 last:border-b-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)_14rem] lg:items-start">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-safe/10 text-safe">
                  <scenario.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">{scenario.title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-muted">{scenario.situation}</p>
                </div>
              </div>
              <p className="text-sm font-semibold leading-6 text-muted">{scenario.action}</p>
              <p className="text-xs font-black uppercase leading-5 tracking-wider text-safe">{scenario.surface}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border border-safe/25 bg-safe/5 p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-safe" />
            <h2 className="text-2xl font-black">The AI apply-agent checkpoint</h2>
          </div>
          <p className="font-semibold leading-7 text-muted">
            As AI apply tools speed up job search, they also speed up mistakes. HireProof gives those systems a practical trust checkpoint before they submit resumes, reveal personal data, or move a user into a risky recruiter conversation.
          </p>
        </div>
        <div className="grid gap-0 overflow-hidden rounded-xl border border-border-soft bg-background sm:grid-cols-4">
          {[
            ['1', 'Ingest', 'Job source, chat, URL, screenshot'],
            ['2', 'Audit', 'Company, recruiter, salary, path, evidence'],
            ['3', 'Route', 'Safe, Caution, or High-Risk decision'],
            ['4', 'Act', 'Continue, review, stop, or export proof'],
          ].map(([number, title, body]) => (
            <div key={title} className="border-b border-border-soft p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-safe text-sm font-black text-background">{number}</div>
              <h3 className="mb-1 text-sm font-black">{title}</h3>
              <p className="text-xs font-semibold leading-5 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <MonitorCheck className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Product proof, not decoration</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {proofAssets.map((asset) => (
            <figure key={asset.src} className="overflow-hidden rounded-2xl border border-border-soft bg-surface shadow-sm">
              <img src={asset.src} alt={asset.alt} className="aspect-[16/10] w-full object-cover" loading="lazy" />
              <figcaption className="border-t border-border-soft p-4">
                <strong className="block text-sm font-black text-foreground">{asset.title}</strong>
                <span className="mt-1 block text-xs font-semibold leading-5 text-muted">{asset.desc}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Workflow className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Where it plugs in</h2>
        </div>
        <div className="grid gap-3 lg:hidden">
          {integrationRows.map(([useCase, input, surface, output]) => (
            <article key={useCase} className="rounded-2xl border border-border-soft bg-surface p-4 shadow-sm">
              <h3 className="text-sm font-black text-foreground">{useCase}</h3>
              <dl className="mt-3 grid gap-3 text-xs font-semibold leading-5 text-muted">
                <div>
                  <dt className="font-black uppercase tracking-wider text-safe">Input</dt>
                  <dd className="mt-1">{input}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase tracking-wider text-safe">Surface</dt>
                  <dd className="mt-1">{surface}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase tracking-wider text-safe">Output</dt>
                  <dd className="mt-1">{output}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-2xl border border-border-soft bg-surface shadow-sm lg:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border-soft bg-background text-xs font-black uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Use case</th>
                <th className="px-4 py-3">Input</th>
                <th className="px-4 py-3">Surface</th>
                <th className="px-4 py-3">Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {integrationRows.map(([useCase, input, surface, output]) => (
                <tr key={useCase} className="align-top">
                  <td className="px-4 py-4 font-black text-foreground">{useCase}</td>
                  <td className="px-4 py-4 font-semibold leading-6 text-muted">{input}</td>
                  <td className="px-4 py-4 font-semibold leading-6 text-muted">{surface}</td>
                  <td className="px-4 py-4 font-semibold leading-6 text-muted">{output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {truthBoundaries.map((boundary) => (
          <div key={boundary.title} className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <boundary.icon className={`h-5 w-5 ${boundary.title.includes('not') ? 'text-caution' : 'text-safe'}`} />
              <h2 className="text-xl font-black">{boundary.title}</h2>
            </div>
            <ul className="space-y-3">
              {boundary.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm font-semibold leading-6 text-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-safe" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-caution/30 bg-caution/5 p-6 lg:p-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-caution" />
          <div>
            <h2 className="mb-2 text-2xl font-black">Why this matters now</h2>
            <p className="font-semibold leading-7 text-muted">
              Hiring is being automated on both sides: applicants use agents to apply faster, while scammers can use AI to produce cleaner job posts, recruiter messages, and fake-company surfaces. HireProof gives that faster market a slower, evidence-backed checkpoint before trust is spent.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-black">Ready to test a real opportunity?</div>
          <p className="mt-1 text-sm font-semibold text-muted">Paste a listing, upload a screenshot, or call the API from your own workflow.</p>
        </div>
        <Link
          href="/audit"
          className="hireproof-focus inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-black text-background transition-opacity hover:opacity-85"
        >
          Start investigation
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
