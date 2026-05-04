import { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/site-header'
import { AlertTriangle, Camera, CheckCircle2, Database, Key, MessageSquare, PackageCheck, Server, ShieldCheck, Store, Zap } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing | HireProof',
  description: 'Free individual job-scam checks plus suggested managed API and enterprise tiers for job boards, schools, recruiters, and community groups.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-black tracking-tight lg:text-7xl">
            Free checks for applicants. Paid proof for teams.
          </h1>
          <p className="mx-auto max-w-2xl text-xl font-medium leading-relaxed text-muted">
            HireProof starts with free individual checks, then scales into self-hosted and suggested managed-team paths for job boards, schools, recruiters, and communities that need bulk verification.
          </p>
        </div>

        <div className="mb-12 grid gap-4 md:grid-cols-4">
          {[
            { icon: ShieldCheck, title: 'Live audit API', body: 'Production audit, headless API, MCP tools, and signed webhook paths.' },
            { icon: Camera, title: 'Screenshot OCR', body: 'Google Vision first, then Tesseract fallback with preprocessing.' },
            { icon: PackageCheck, title: 'Published packages', body: 'CLI, SDK, LangChain, and n8n packages are live on npm.' },
            { icon: Database, title: 'Export proof', body: 'PDF dossier, PNG report image, CSV trends, and certificates.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
              <item.icon className="mb-3 h-5 w-5 text-safe" />
              <h2 className="text-sm font-black">{item.title}</h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          
          {/* Open Source / BYOK Tier */}
          <div className="flex flex-col rounded-3xl border border-border-soft bg-surface p-8 shadow-sm transition-transform hover:-translate-y-1">
            <div className="mb-4 flex items-center gap-2 text-muted">
              <Key className="h-5 w-5" />
              <span className="font-bold uppercase tracking-wider text-xs">Self-Hosted</span>
            </div>
            <h2 className="mb-2 text-3xl font-black">Open Source</h2>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-5xl font-black">$0</span>
              <span className="font-bold text-muted">/ forever</span>
            </div>
            <p className="mb-8 text-sm font-medium text-muted">
              Perfect for individual job seekers and developers who want local control with their own model and search credentials.
            </p>
            <ul className="mb-8 flex-1 space-y-4">
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Free individual checks
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Local extension package
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Local report history
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Runtime MCP tools
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Screenshot OCR with BYOK providers
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Local Chrome extension package
              </li>
            </ul>
            <div className="flex flex-col gap-2">
              <a href={process.env.GITHUB_REPO_URL || "https://github.com/Iron-Mark/hackathon-v0-zero_to_agent"} target="_blank" rel="noreferrer" className="hireproof-focus flex w-full items-center justify-center rounded-xl border border-border-soft bg-background px-4 py-3 text-sm font-black text-foreground hover:bg-border-soft transition-colors">
                Clone Repository
              </a>
              <Link href="/docs/self-hosting" className="text-center text-xs font-bold text-muted underline hover:text-foreground">
                Read Self-Hosting Guide
              </Link>
            </div>
          </div>

          {/* Developer Pro Tier */}
          <div className="relative flex flex-col rounded-3xl border-2 border-safe bg-background p-8 shadow-xl shadow-safe/10 transition-transform hover:-translate-y-1">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-safe px-4 py-1 text-xs font-black uppercase tracking-wider text-background">
              Most Popular
            </div>
            <div className="mb-4 flex items-center gap-2 text-safe">
              <Zap className="h-5 w-5" />
              <span className="font-bold uppercase tracking-wider text-xs">Suggested Managed Cloud</span>
            </div>
            <h2 className="mb-2 text-3xl font-black">Developer Pro</h2>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-5xl font-black">$29</span>
              <span className="font-bold text-muted">/ month</span>
            </div>
            <p className="mb-8 text-sm font-medium text-muted">
              Suggested managed audit API tier for automation agents, student groups, career centers, and small recruiting teams.
            </p>
            <ul className="mb-8 flex-1 space-y-4">
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                1,000 headless API checks / mo
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                Async webhook delivery for n8n/Make
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                Shareable reports and 30-day retention
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                Slack + Telegram proof; Discord ready
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                SDK, CLI, LangChain, and n8n support
              </li>
            </ul>
            <Link href="/audit" className="hireproof-focus hireproof-cta-primary flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-black">
              Start with demo
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div className="flex flex-col rounded-3xl border border-border-soft bg-surface p-8 shadow-sm transition-transform hover:-translate-y-1">
            <div className="mb-4 flex items-center gap-2 text-muted">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-bold uppercase tracking-wider text-xs">Custom</span>
            </div>
            <h2 className="mb-2 text-3xl font-black">Enterprise</h2>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-5xl font-black">Custom</span>
            </div>
            <p className="mb-8 text-sm font-medium text-muted">
              Bulk verification and trust tooling for job boards, schools, recruiters, and community groups.
            </p>
            <ul className="mb-8 flex-1 space-y-4">
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Bulk verification workflows
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Verified badge and domain ownership checks
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Custom API volume and onboarding
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Exportable audit evidence for review teams
              </li>
              <li className="flex items-start gap-3 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                Custom integration onboarding
              </li>
            </ul>
            <a href={`mailto:${process.env.CONTACT_EMAIL || 'sales@hireproof.com'}?subject=HireProof%20Enterprise%20Inquiry`} className="hireproof-focus flex w-full items-center justify-center rounded-xl border border-border-soft bg-background px-4 py-3 text-sm font-black text-foreground hover:bg-border-soft transition-colors">
              Contact Sales
            </a>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-24 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-black">Compare Features</h2>
            <p className="text-muted font-medium mt-2">Simple tiers for individual safety checks and high-volume verification.</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border-soft bg-surface">
            <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border-soft bg-background/50">
                  <th className="px-6 py-4 font-black">Feature</th>
                  <th className="px-6 py-4 font-black">Self-Hosted</th>
                  <th className="px-6 py-4 font-black text-safe">Developer Pro</th>
                  <th className="px-6 py-4 font-black">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {[
                  { name: 'Investigation Engine', free: 'Unlimited (BYOK)', pro: 'Unlimited', ent: 'Unlimited' },
                  { name: 'Access Methods', free: 'Web + local extension', pro: 'Web + API + local extension', ent: 'Web + API + badge' },
                  { name: 'Headless REST API', free: 'Local only', pro: '1,000 req/mo', ent: 'Custom' },
                  { name: 'Published Packages', free: 'CLI + SDK available', pro: 'CLI + SDK + LangChain + n8n', ent: 'Custom integration support' },
                  { name: 'Screenshot OCR', free: 'BYOK Google Vision + Tesseract fallback', pro: 'Managed OCR path', ent: 'Custom OCR policy' },
                  { name: 'Webhook Callbacks', free: 'No', pro: 'Yes', ent: 'Yes' },
                  { name: 'Chat Adapters', free: 'Local/dev only', pro: 'Slack + Telegram proof; Discord ready', ent: 'Custom integration onboarding' },
                  { name: 'Storage Engine', free: 'Local browser or JSON fallback', pro: 'Upstash-backed reports', ent: 'Dedicated retention policy' },
                  { name: 'Audit History', free: '7 Days', pro: '30 Days', ent: 'Unlimited' },
                  { name: 'Bulk verification', free: 'No', pro: 'Limited', ent: 'Custom' },
                  { name: 'Compliance Exports', free: 'JSON only', pro: 'JSON + PDF', ent: 'PDF + CSV + Certificate' },
                  { name: 'Review Boundaries', free: 'Chrome local package', pro: 'Make source pack; n8n npm package', ent: 'Review/support planning' },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-background/30 transition-colors">
                    <td className="px-6 py-4 font-black">{row.name}</td>
                    <td className="px-6 py-4 font-medium text-muted">{row.free}</td>
                    <td className="px-6 py-4 font-bold text-safe">{row.pro}</td>
                    <td className="px-6 py-4 font-medium text-muted">{row.ent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <div className="mt-24 rounded-3xl border border-safe-bg bg-safe-bg/20 p-8 md:p-10">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-safe-text" />
            <h2 className="text-2xl font-black">Availability notes</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { icon: ShieldCheck, text: 'Demo fixtures are clearly labeled so teams can evaluate the full report flow even when live providers are not needed.' },
              { icon: Store, text: 'The Chrome extension package is ready for local install, with Chrome Web Store publication handled through Google review.' },
              { icon: PackageCheck, text: 'CLI, SDK, LangChain, and n8n are published on npm; Make teams can start from the included source pack.' },
              { icon: MessageSquare, text: 'Slack and Telegram proof are captured, and Discord is ready for event capture.' },
              { icon: Zap, text: 'Developer Pro shows the intended managed-tier packaging; teams can start with the demo while billing is connected.' },
              { icon: Camera, text: 'Screenshot OCR uses Google Vision when available and keeps Tesseract as a fallback for resilient intake.' },
            ].map((item) => (
              <div key={item.text} className="rounded-2xl border border-border-soft bg-background/70 p-5">
                <item.icon className="mb-3 h-5 w-5 text-safe-text" />
                <p className="text-sm font-semibold leading-6 text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-32 space-y-12">
          <div className="text-center">
            <h2 className="text-4xl font-black">Frequently Asked Questions</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                q: "What does 'Bring Your Own Key' (BYOK) mean?",
                a: "It means you use your own OpenAI or SerpApi credentials. HireProof provides the UI and job-verification logic, while you pay inference and search costs directly to the providers."
              },
              {
                q: "Is my data stored on your servers?",
                a: "Demo checks can run without an account. Reports may be saved for history or share links. Managed deployments use Redis-backed storage with a default 30-day retention policy."
              },
              {
                q: "Can I use the API for free?",
                a: "Yes. If you run HireProof locally, the /api/v1 endpoints are available to your scripts. The Developer Pro tier provides managed API access for hosted automation."
              },
              {
                q: "How does HireProof assess suspicious posts?",
                a: "It checks the post against signals like company footprint, official hiring paths, off-platform contact, unrealistic pay, and recent reputation evidence."
              }
            ].map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-border-soft bg-surface p-8">
                <h3 className="mb-3 text-lg font-black text-foreground">{faq.q}</h3>
                <p className="font-medium leading-relaxed text-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture Section */}
        <div className="mt-32 rounded-3xl border border-border-soft bg-background p-8 md:p-12 shadow-sm">
          <div className="flex flex-col gap-12 md:flex-row md:items-center">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl font-black">Infrastructure Integrity</h2>
              <p className="font-medium leading-relaxed text-muted">
                HireProof is designed for portable deployment: hosted on Vercel for the public demo, self-hostable with Docker, and usable locally with your own model and search credentials.
              </p>
              <p className="font-medium leading-relaxed text-muted">
                The app uses a <strong>Hybrid Database Architecture</strong>: Redis-backed persistence when configured, with local fallbacks for development and demo mode. Seeded demos keep the judging flow reliable even if live providers are slow.
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-4 sm:flex-row">
              <div className="flex-1 rounded-2xl border border-border-soft bg-surface p-6">
                <Database className="mb-4 h-8 w-8 text-safe" />
                <h3 className="mb-2 font-black">Hybrid Storage</h3>
                <p className="text-sm font-medium text-muted">Upstash Redis for Pro users, local JSON storage for BYOK users.</p>
              </div>
              <div className="flex-1 rounded-2xl border border-border-soft bg-surface p-6">
                <Server className="mb-4 h-8 w-8 text-safe" />
                <h3 className="mb-2 font-black">Vercel Edge</h3>
                <p className="text-sm font-medium text-muted">L7 DDoS protection and edge-distributed rate limiters.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

