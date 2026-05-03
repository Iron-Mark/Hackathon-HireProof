import type { Metadata } from 'next'
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
  Server,
  ShieldCheck,
  Store,
  Workflow,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export const metadata: Metadata = {
  title: 'Proof Pack | HireProof',
  description: 'Submission-ready proof that HireProof is production-deployed, API-smoke-tested, Slack-screenshot-proven, and WDK accepted-run proven.',
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
    brandIcon: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg',
    brandName: 'Slack',
    title: 'ChatSDK Slack',
    status: 'Slack + Telegram proof',
    body: 'Slack has screenshot proof. Telegram now has live delivery screenshot and webhook log proof; Discord is credential-ready but still needs a real event capture.',
    href: '/docs/triple-track-coverage',
  },
  {
    icon: Workflow,
    title: 'Vercel Workflow / WDK',
    status: 'accepted run',
    body: 'Production accepted run ID: wrun_01KQD9H6AND3W7YZBHHKAH2KV5.',
    href: '/api/workflows/audit',
  },
]

const proofStats = [
  { icon: Server, label: 'Production', value: 'Live Vercel app' },
  {
    icon: MessageSquare,
    brandIcon: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg',
    label: 'Chat proof',
    value: 'Slack screenshot',
    brandColor: '#4A154B',
    brandIconColor: '#4A154B',
    cardClassName: 'border-[#4A154B]/25 bg-[#4A154B]/10',
    iconClassName: 'border border-[#4A154B]/20 bg-white',
  },
  { icon: Workflow, label: 'Workflow', value: 'WDK accepted run' },
  { icon: FileArchive, label: 'Exports', value: 'PDF, PNG, CSV' },
]

const packagedSurfaces = [
  { icon: PlugZap, text: 'Runtime MCP tools for company, news, jobs, and local footprint evidence.' },
  { icon: PackageCheck, text: 'Chrome extension package workflow with upload ZIP and listing notes.' },
  { icon: Container, text: 'Docker standalone image, Compose service, healthcheck, and smoke script.' },
  { icon: FileArchive, text: 'PDF dossier, PNG screenshot, report CSV, and safe-report certificate exports.' },
]

const gatedSurfaces = [
  { brandIcon: 'https://cdn.simpleicons.org/discord/5865F2', brandName: 'Discord', brandColor: '#5865F2', status: 'Credential-ready', text: 'Discord ChatSDK delivery is configured and webhook-ready, but not claimed as live until a real Discord event is captured.' },
  { brandIcon: 'https://cdn.simpleicons.org/telegram/26A5E4', brandName: 'Telegram', brandColor: '#26A5E4', status: 'Live delivery proven', text: 'Telegram ChatSDK delivery has a real message screenshot and matching Vercel webhook log; one follow-up screenshot should capture the full report link.' },
  { brandIcon: 'https://cdn.simpleicons.org/whatsapp/25D366', brandName: 'WhatsApp', brandColor: '#25D366', status: 'Credential-gated', text: 'WhatsApp/Zernio delivery is implemented but credential-gated until Zernio credentials and a real provider event are captured.' },
  { brandIcon: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Google_Chrome_Web_Store_icon_2022.svg', brandName: 'Chrome Web Store', brandColor: '#4285F4', status: 'Store review pending', text: 'Chrome Web Store publication still requires developer-account submission and Google review.' },
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
              HireProof is live, proven, and clearly bounded.
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        <section className="grid gap-4 md:grid-cols-2">
          {readyProof.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.title} href={item.href} className="hireproof-focus group rounded-2xl border border-border-soft bg-surface p-6 shadow-sm transition hover:border-safe-bg hover:bg-background">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-safe-bg text-safe-text">
                    {'brandIcon' in item ? (
                      <img src={item.brandIcon} alt={`${item.brandName} logo`} className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="rounded-full bg-background px-3 py-1 text-[10px] font-black uppercase tracking-normal text-muted group-hover:text-foreground">
                    {item.status}
                  </div>
                </div>
                <h2 className="text-xl font-black">{item.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted">{item.body}</p>
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

          <div className="rounded-2xl border border-caution-bg bg-caution-bg/40 p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-caution-text" />
              <h2 className="text-xl font-black">Remaining proof boundaries</h2>
            </div>
            <p className="mb-4 text-sm font-semibold leading-6 text-muted">Core production proof is ready. Telegram delivery is captured; Discord and WhatsApp still need the remaining provider evidence below.</p>
            <ul className="space-y-3">
              {gatedSurfaces.map((item) => (
                <li key={item.text} className="flex gap-3 rounded-xl border border-caution-bg bg-background/40 p-3 text-sm font-semibold leading-6 text-muted">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background"
                    style={{ border: `1px solid ${item.brandColor}33` }}
                  >
                    <img src={item.brandIcon} alt={`${item.brandName} logo`} className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="mb-1 inline-flex rounded-full bg-caution-bg px-2 py-0.5 text-[10px] font-black uppercase tracking-normal text-caution-text">
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
