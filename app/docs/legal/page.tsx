import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ExternalLink, FileWarning, Info, Mail, Scale, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Legal, Terms, and Privacy | HireProof Docs',
  description: 'HireProof legal notices, terms of service, privacy policy, AI limitations, and dispute process.',
}

const privacySections = [
  {
    title: 'What HireProof processes',
    body: [
      'HireProof processes job posts, recruiter messages, job URLs, screenshots or extracted text that users choose to submit for review.',
      'The product may extract role, company, pay, location, contact method, urgency signals, evidence links, red flags, green flags, verdict, risk score, and next steps.',
      'If a user creates an account or uses the developer portal, HireProof may process account identifiers, API keys, verified domains, webhook test payloads, and usage metadata needed to operate those features.',
    ],
  },
  {
    title: 'Provider and third-party calls',
    body: [
      'Live evidence mode can call AI, search, storage, chat, workflow, or hosting providers configured for the deployment.',
      'Those providers may process request content according to their own terms, policies, data-processing settings, and retention rules.',
      'Demo mode uses deterministic fixture data and is intended for reliable product demonstration without requiring live provider credentials.',
    ],
  },
  {
    title: 'Storage and retention',
    body: [
      'HireProof stores only what is needed to operate the selected surface, such as saved reports, audit history, API usage records, verified badge metadata, developer keys, webhook test records, and operational logs.',
      'Self-hosted deployments control their own storage, logs, retention, and provider configuration.',
      'The public demo should not be treated as a secure vault for sensitive personal, financial, medical, legal, or credential material.',
    ],
  },
  {
    title: 'What HireProof does not do',
    body: [
      'HireProof does not sell user data.',
      'HireProof does not guarantee that a job is lawful, unlawful, safe, unsafe, available, or affiliated with a specific company.',
      'HireProof does not replace direct verification with the employer, official hiring portals, government registries, professional advisors, or platform support teams.',
    ],
  },
]

const termsSections = [
  {
    title: 'Informational use only',
    body: [
      'HireProof provides AI-assisted job-post risk assessments for informational and safety-review purposes.',
      'A HireProof verdict is not legal, financial, employment, cybersecurity, medical, or professional advice.',
      'Users remain responsible for deciding whether to apply, contact a recruiter, share information, pay a fee, report a listing, or take any other action.',
    ],
  },
  {
    title: 'Acceptable use',
    body: [
      'Use HireProof only for lawful safety checks, research, review, and internal workflow automation.',
      'Do not use HireProof to harass employers, publish defamatory claims, bypass platform rules, scrape prohibited content, attack third-party systems, or make automated decisions without human review.',
      'You must comply with applicable laws, website terms, job-board rules, workplace or school policies, and third-party provider terms.',
    ],
  },
  {
    title: 'No guarantees',
    body: [
      'HireProof may be wrong, incomplete, delayed, unavailable, or affected by provider outages, missing credentials, stale public information, or AI model errors.',
      'Risk scores are not proof that a person or company committed fraud, and safe-looking results are not a guarantee that an opportunity is legitimate.',
      'The service is provided as-is and as-available to the fullest extent permitted by applicable law.',
    ],
  },
  {
    title: 'Accounts, API keys, and automations',
    body: [
      'Users are responsible for protecting their API keys, account credentials, webhook URLs, provider keys, and automation destinations.',
      'Automation integrations should include human review before applying to jobs, sending resumes, sharing personal data, or continuing high-impact workflows.',
      'Marketplace listings for n8n, Make, npm, and Chrome Web Store are not claimed live until the relevant external review or publish step is completed.',
    ],
  },
]

const boundaryItems = [
  'Chrome Web Store publication requires Google review and is not claimed live until approved.',
  'n8n, Make, and npm marketplace publication require external account-backed submission or publishing.',
  'Discord and WhatsApp/Zernio proof require real provider events and matching logs before live-proof claims are made.',
  'WDK proof currently means accepted-run proof unless a completed durable workflow transcript and callback evidence are captured.',
]

function BulletSection({ title, body }: { title: string; body: string[] }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-5">
      <h3 className="mb-3 text-base font-black">{title}</h3>
      <ul className="space-y-3 text-sm font-semibold leading-6 text-muted">
        {body.map((item) => (
          <li key={item} className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LegalPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-safe/10 text-safe">
          <Scale className="h-6 w-6" />
        </div>
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-safe">Legal notices</p>
          <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Legal, Terms, and Privacy</h1>
        </div>
        <p className="max-w-3xl text-xl font-medium leading-relaxed text-muted">
          HireProof is an AI-assisted job-post safety tool. This page explains the current public terms, privacy boundaries, AI limitations, and dispute process in plain language.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="#privacy-policy" className="hireproof-focus rounded-xl border border-border-soft bg-surface px-4 py-2 text-sm font-black hover:bg-background">
            Privacy Policy
          </a>
          <a href="#terms-of-service" className="hireproof-focus rounded-xl border border-border-soft bg-surface px-4 py-2 text-sm font-black hover:bg-background">
            Terms of Service
          </a>
          <a href="#business-disputes" className="hireproof-focus rounded-xl border border-border-soft bg-surface px-4 py-2 text-sm font-black hover:bg-background">
            Disputes
          </a>
        </div>
        <div className="rounded-2xl border border-caution/30 bg-caution/5 p-5">
          <div className="mb-2 flex items-center gap-2 text-caution-text">
            <AlertTriangle className="h-5 w-5" />
            <strong className="text-sm font-black uppercase tracking-widest">Not lawyer-reviewed terms</strong>
          </div>
          <p className="text-sm font-semibold leading-6 text-caution-text">
            This page is general product/legal notice copy for a hackathon project. It is not legal advice, not jurisdiction-specific legal drafting, and not a substitute for review by a qualified lawyer before commercial launch.
          </p>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="ai-accuracy-disclaimer">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <FileWarning className="h-6 w-6 text-caution" />
          <h2 id="ai-accuracy-disclaimer" className="scroll-mt-28 text-2xl font-black">AI Accuracy Disclaimer</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <h3 className="mb-2 font-black">False positives</h3>
            <p className="text-sm font-semibold leading-6 text-muted">
              Legitimate postings can be marked Caution or High-Risk when evidence is incomplete, public information is stale, or signals resemble known scam patterns.
            </p>
          </div>
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <h3 className="mb-2 font-black">False negatives</h3>
            <p className="text-sm font-semibold leading-6 text-muted">
              A Safe or lower-risk result does not guarantee that a role, recruiter, company, or application path is legitimate.
            </p>
          </div>
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <h3 className="mb-2 font-black">Human review</h3>
            <p className="text-sm font-semibold leading-6 text-muted">
              Review the evidence, use official hiring portals, and verify directly before sending money, credentials, identification, or private documents.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="privacy-policy">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <ShieldCheck className="h-6 w-6 text-safe" />
          <div>
            <h2 id="privacy-policy" className="scroll-mt-28 text-2xl font-black">Privacy Policy</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Last updated: May 4, 2026</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {privacySections.map((section) => (
            <BulletSection key={section.title} title={section.title} body={section.body} />
          ))}
        </div>
        <div className="rounded-2xl border border-evidence/30 bg-evidence/5 p-5">
          <h3 className="mb-2 font-black text-evidence">Sensitive data caution</h3>
          <p className="text-sm font-semibold leading-6 text-evidence-text">
            Do not submit passwords, government ID numbers, bank details, private medical information, legal secrets, or other highly sensitive data unless you operate the deployment and understand the storage, logs, and provider configuration.
          </p>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="terms-of-service">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Scale className="h-6 w-6 text-safe" />
          <div>
            <h2 id="terms-of-service" className="scroll-mt-28 text-2xl font-black">Terms of Service</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Last updated: May 4, 2026</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {termsSections.map((section) => (
            <BulletSection key={section.title} title={section.title} body={section.body} />
          ))}
        </div>
        <div className="rounded-2xl border border-risk-bg bg-risk-bg/20 p-5 text-risk-text">
          <h3 className="mb-2 font-black">Limitation notice</h3>
          <p className="text-sm font-semibold leading-6">
            To the fullest extent permitted by applicable law, HireProof and its maintainers are not responsible for employment decisions, application outcomes, financial loss, reputational harm, missed opportunities, third-party provider behavior, platform enforcement, or user actions taken based on AI-generated output.
          </p>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="business-disputes">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Mail className="h-6 w-6 text-safe" />
          <h2 id="business-disputes" className="scroll-mt-28 text-2xl font-black">Business and False Positive Disputes</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-border-soft bg-surface p-6">
            <p className="mb-4 text-sm font-semibold leading-6 text-muted">
              If a legitimate company, recruiter, school, or organization believes a HireProof report is inaccurate, submit a dispute with enough information to verify the official hiring path.
            </p>
            <ul className="space-y-3 text-sm font-semibold leading-6 text-muted">
              <li className="flex gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-safe" />Link to the specific HireProof report or screenshot.</li>
              <li className="flex gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-safe" />Official hiring page, job board listing, or company-domain contact.</li>
              <li className="flex gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-safe" />Business registration, public profile, or other verification evidence when available.</li>
              <li className="flex gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-safe" />Short explanation of what the report got wrong.</li>
            </ul>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-safe/20 bg-safe/5 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-safe text-background">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="mb-1 font-black">Submit a dispute</h3>
            <p className="mb-4 text-sm font-semibold leading-6 text-muted">
              Use the support path for product support and dispute intake. It is not a legal-advice channel.
            </p>
            <Link href="/docs/legal#support-and-contact" className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-black text-background transition-colors hover:bg-safe">
              Contact path <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="status-boundaries">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Info className="h-6 w-6 text-safe" />
          <h2 id="status-boundaries" className="scroll-mt-28 text-2xl font-black">External Status Boundaries</h2>
        </div>
        <div className="rounded-2xl border border-border-soft bg-surface p-6">
          <ul className="grid gap-3 text-sm font-semibold leading-6 text-muted md:grid-cols-2">
            {boundaryItems.map((item) => (
              <li key={item} className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caution" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="support-and-contact" className="scroll-mt-28 rounded-2xl border border-border-soft bg-surface p-6">
        <div className="flex items-start gap-4">
          <Info className="mt-1 h-5 w-5 shrink-0 text-safe" />
          <div className="space-y-3">
            <h2 className="text-xl font-black">Support and Contact</h2>
            <p className="text-sm font-semibold leading-6 text-muted">
              For product support, disputes, correction requests, security concerns, or publication-status updates, use the project support path or GitHub issue tracker. Support channels do not provide legal, employment, financial, or professional advice.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/docs" className="hireproof-focus rounded-xl border border-border-soft bg-background px-4 py-2 text-sm font-black hover:bg-surface">
                Documentation
              </Link>
              <a href="https://github.com/Iron-Mark/hackathon-v0-zero_to_agent/issues" target="_blank" rel="noreferrer" className="hireproof-focus rounded-xl border border-border-soft bg-background px-4 py-2 text-sm font-black hover:bg-surface">
                GitHub Issues
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
