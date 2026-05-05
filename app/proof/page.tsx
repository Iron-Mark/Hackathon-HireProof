import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Container,
  ExternalLink,
  FileArchive,
  MessageSquare,
  PackageCheck,
  PlugZap,
  Network,
  Server,
  ShieldCheck,
  Store,
  Target,
  Terminal,
  Workflow,
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'

export const metadata: Metadata = {
  title: 'Proof Pack | HireProof',
  description: 'Submission-ready proof that HireProof is production-deployed, API-smoke-tested, CLI-screenshot-proven, Slack-screenshot-proven, and WDK accepted-run proven.',
}

const readyProof = [
  {
    icon: ShieldCheck,
    title: 'Production web app',
    status: 'production-deployed',
    body: 'Stable demo URL is live on Vercel and the core audit flow is available without login.',
    href: 'https://hireproof-sigma.vercel.app',
  },
  {
    icon: CheckCircle2,
    title: 'API smoke proof',
    status: 'verified',
    body: 'The public demo key returns a High-Risk report through the headless audit API.',
    href: '/api/health',
  },
  {
    icon: Bot,
    brandIcons: [
      {
        src: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg',
        name: 'Slack',
        color: 'var(--hireproof-safe-text)',
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/telegram.svg',
        name: 'Telegram',
        color: 'var(--hireproof-safe-text)',
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/discord.svg',
        name: 'Discord',
        color: 'var(--hireproof-safe-text)',
      },
    ],
    title: 'ChatSDK delivery',
    status: 'Slack, Telegram, Discord observed',
    body: 'Slack has screenshot proof, Telegram has screenshot plus webhook-log proof, and Discord slash-command delivery has been observed with a real bot reply.',
    href: '/docs/triple-track-coverage',
  },
  {
    icon: Workflow,
    title: 'Vercel Workflow / WDK',
    status: 'accepted run',
    body: 'Production accepted run ID: wrun_01KQD9H6AND3W7YZBHHKAH2KV5.',
    href: '/api/workflows/audit',
  },
  {
    icon: Network,
    title: 'Automation integrations',
    status: 'npm-published',
    body: 'CLI, SDK, LangChain, and n8n packages are public on npm. Make remains a validated source pack because Make review happens externally.',
    href: '/docs/automations',
  },
  {
    icon: Terminal,
    title: 'HireProof CLI TUI',
    status: 'published + screenshot',
    body: '@hireproof/cli is public on npm and ships a branded Ink terminal console with Shield Sentinel, Tab autocomplete, guided audits, health/config tools, and local report history.',
    href: '/docs/cli',
  },
]

const proofStats = [
  { icon: Server, label: 'Production', value: 'Live Vercel app' },
  { icon: MessageSquare, label: 'Chat proof', value: 'Slack screenshot' },
  { icon: Workflow, label: 'Workflow', value: 'WDK accepted run' },
  { icon: FileArchive, label: 'Exports', value: 'PDF, PNG, CSV' },
  { icon: Terminal, label: 'CLI', value: 'TUI screenshot' },
]

const packagedSurfaces = [
  { icon: PlugZap, text: 'Runtime MCP tools for company, news, jobs, and local footprint evidence.' },
  { icon: Network, text: 'Published npm packages for CLI, SDK, LangChain, and n8n; Make source pack plus portable HTTP templates.' },
  { icon: MessageSquare, text: 'Discord slash-command delivery has been observed with a real HireProof bot reply and is demo-ready for the chat-agent path.' },
  { icon: MessageSquare, text: 'Telegram ChatSDK delivery has screenshot and webhook-log proof, with report-link recapture as final evidence polish.' },
  { icon: PackageCheck, text: 'Chrome extension package workflow with upload ZIP and listing notes.' },
  { icon: Container, text: 'Docker standalone image, Compose service, healthcheck, and smoke script.' },
  { icon: FileArchive, text: 'PDF dossier, PNG screenshot, report CSV, and safe-report certificate exports.' },
]

const expansionSurfaces = [
  { brandIcon: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Google_Chrome_Web_Store_icon_2022.svg', brandName: 'Chrome Web Store', brandColor: '#4285F4', status: 'Submission-ready package', text: 'The Chrome extension package workflow is prepared for developer-account upload and store review.' },
]

function BrandIcon({
  src,
  alt,
  className,
  color,
}: {
  src: string
  alt: string
  className: string
  color?: string
}) {
  if (color) {
    return (
      <span
        aria-label={alt}
        role="img"
        className={`inline-block ${className}`}
        style={{
          backgroundColor: color,
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      />
    )
  }

  return <img src={src} alt={alt} className={className} />
}

export default function ProofPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-14 lg:px-8">
        <section className="mb-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-safe-bg bg-safe-bg px-3 py-1 text-xs font-black uppercase tracking-normal text-safe-text">
              <ShieldCheck className="h-4 w-4" />
              Submission proof
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              HireProof proof, clearly bounded.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-muted">
              Use this page to show the strongest working evidence: production deployment, audit API smoke proof, Slack screenshot proof, and the accepted WDK workflow run.
            </p>
          </div>
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <div className="text-xs font-black uppercase tracking-normal text-muted">Safe public claim</div>
            <p className="mt-3 text-xl font-black leading-7">
              HireProof is production-deployed, API-smoke-tested, Slack-screenshot-proven, and WDK accepted-run proven.
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-border-soft bg-surface p-4">
          <div className="mb-4 flex items-center gap-2 px-1">
            <Clock3 className="h-5 w-5 text-evidence" />
            <h2 className="text-lg font-black">Proof at a glance</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {proofStats.map((item) => {
              const Icon = item.icon
              const brandIcon = 'brandIcon' in item && typeof item.brandIcon === 'string' ? item.brandIcon : null
              const brandColor = 'brandColor' in item && typeof item.brandColor === 'string' ? item.brandColor : undefined
              return (
                <div key={item.label} className={`rounded-xl border p-4 ${'cardClassName' in item ? item.cardClassName : 'border-border-soft bg-background'}`}>
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${'iconClassName' in item ? item.iconClassName : 'bg-evidence-bg text-evidence'}`}>
                    {brandIcon ? (
                      <BrandIcon src={brandIcon} alt={`${item.label} logo`} className="h-5 w-5" color={brandColor} />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-normal text-muted">{item.label}</div>
                  <div className="mt-1 text-sm font-black">{item.value}</div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-border-soft bg-surface shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,0.72fr)_minmax(340px,1fr)] lg:items-stretch">
            <div className="flex flex-col justify-between gap-6 p-6 lg:p-8">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-safe-bg bg-safe-bg px-3 py-1 text-[10px] font-black uppercase tracking-normal text-safe-text">
                  <Terminal className="h-3.5 w-3.5" />
                  CLI product surface
                </div>
                <h2 className="max-w-xl text-2xl font-black tracking-tight sm:text-3xl">
                  The terminal experience is visible proof, not just a package claim.
                </h2>
                <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-muted">
                  This screenshot is rendered from the published CLI TUI source. It shows the branded Shield Sentinel launcher, command console, Tab autocomplete affordance, proof-safe mode/key status, and the audit workflow menu.
                </p>
              </div>
              <Link href="/docs/cli" className="hireproof-focus inline-flex w-fit items-center gap-2 rounded-xl border border-safe/30 bg-safe/10 px-4 py-3 text-sm font-black text-safe transition-colors hover:border-safe/50 hover:bg-safe/15">
                View CLI docs <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <div className="border-t border-border-soft bg-background p-3 lg:border-l lg:border-t-0">
              <Image
                src="/cli-tui-screenshot.png"
                alt="HireProof CLI interactive terminal UI with Shield Sentinel mascot and command console"
                width={1248}
                height={930}
                className="h-full w-full rounded-xl object-cover object-left-top dark:hidden"
                priority
              />
              <Image
                src="/cli-tui-screenshot-dark.png"
                alt="HireProof CLI dark-theme interactive terminal UI with Shield Sentinel mascot and command console"
                width={1248}
                height={930}
                className="hidden h-full w-full rounded-xl object-cover object-left-top dark:block"
              />
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-border-soft bg-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-safe" />
            <h2 className="text-lg font-black">Submission positioning</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border-soft bg-background p-4">
              <div className="text-[10px] font-black uppercase tracking-normal text-muted">Focused wedge</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                HireProof starts with employment fraud because job seekers need an actionable verdict before applying, paying fees, or sharing identity data.
              </p>
            </div>
            <div className="rounded-xl border border-border-soft bg-background p-4">
              <div className="text-[10px] font-black uppercase tracking-normal text-muted">Transparent model</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                The scorer is a transparent evidence-weighted safety policy, not a claimed continuous-learning model.
              </p>
            </div>
            <div className="rounded-xl border border-border-soft bg-background p-4">
              <div className="text-[10px] font-black uppercase tracking-normal text-muted">WDK roadmap</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                Workflow proof is a production-accepted run. The next step is a durable timeline with checkpoints, retries, callbacks, and completed-result proof.
              </p>
            </div>
          </div>
        </section>

        <section className="grid min-w-0 gap-4 md:grid-cols-2">
          {readyProof.map((item) => {
            const Icon = item.icon
            const brandIcons = 'brandIcons' in item && Array.isArray(item.brandIcons) ? item.brandIcons : null
            return (
              <Link key={item.title} href={item.href} className="hireproof-focus group min-w-0 rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition hover:border-safe-bg hover:bg-background sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className={`${brandIcons ? 'w-20 gap-1.5 px-2' : 'w-12'} flex h-12 shrink-0 items-center justify-center rounded-xl bg-safe-bg text-safe-text`}>
                    {brandIcons ? (
                      brandIcons.map((brand) => (
                        <BrandIcon
                          key={brand.name}
                          src={brand.src}
                          alt={`${brand.name} logo`}
                          className="h-4 w-4"
                          color={brand.color}
                        />
                      ))
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0 rounded-full bg-background px-2.5 py-1 text-right text-[10px] font-black uppercase tracking-normal text-muted group-hover:text-foreground">
                    {item.status}
                  </div>
                </div>
                <h2 className="break-words text-xl font-black">{item.title}</h2>
                <p className="mt-2 break-words text-sm font-semibold leading-6 text-muted">{item.body}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-evidence">
                  View proof <ExternalLink className="h-4 w-4" />
                </div>
              </Link>
            )
          })}
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border-soft bg-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-safe" />
              <h2 className="text-xl font-black">Packaged and demo-ready</h2>
            </div>
            <ul className="space-y-3">
              {packagedSurfaces.map((item) => (
                <li key={item.text} className="flex gap-3 text-sm font-semibold leading-6 text-muted">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-safe-bg text-safe">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-safe/20 bg-safe/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-safe" />
              <h2 className="text-xl font-black">Proof expansion path</h2>
            </div>
            <p className="mb-4 text-sm font-semibold leading-6 text-muted">Core production proof and demo-ready chat delivery are in place. This section tracks optional provider activation and external review paths.</p>
            <ul className="space-y-3">
              {expansionSurfaces.map((item) => (
                <li key={item.text} className="flex gap-3 rounded-xl border border-safe/15 bg-background/50 p-3 text-sm font-semibold leading-6 text-muted">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background"
                    style={{ border: `1px solid ${item.brandColor}33` }}
                  >
                    <img src={item.brandIcon} alt={`${item.brandName} logo`} className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="mb-1 inline-flex rounded-full bg-safe/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-normal text-safe">
                      {item.status}
                    </span>
                    <span className="block">{item.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

