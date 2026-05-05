'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, AlertCircle, Globe, TrendingUp, MapPin, ShieldAlert, SearchCheck, FileText, Sparkles, Zap, Bot, Terminal, Cpu, Zap as ZapIcon, Network, Download, Workflow } from 'lucide-react'
import { motion } from 'framer-motion'
import { SiteHeader } from '@/components/layout/site-header'

import { SpotTheBot } from '@/components/marketing/spot-the-bot'
import { ImpactTicker } from '@/components/marketing/impact-ticker'

const flags = [
  'PHP 80,000/week for an internship',
  'No interview or formal application path',
  'Telegram-only contact',
]

const steps = [
  { icon: FileText, title: 'Extract claims', description: 'Pull out role, pay, company, location, contact path, and urgency signals.' },
  { icon: SearchCheck, title: 'Check receipts', description: 'Compare the post against company footprint, reputation, job boards, and local signals.' },
  { icon: ShieldAlert, title: 'Return verdict', description: 'Show Safe, Caution, or High-Risk with a risk score and next steps.' },
]

const evidenceSignals = [
  { icon: Globe, title: 'Company web presence', description: 'Official sites, hiring pages, LinkedIn profiles, and domain details.' },
  { icon: AlertCircle, title: 'Recent reputation', description: 'News, reviews, scam reports, media mentions, and public complaints.' },
  { icon: TrendingUp, title: 'Comparable listings', description: 'Similar legitimate jobs to catch unrealistic pay or role expectations.' },
  { icon: MapPin, title: 'Local footprint', description: 'Maps, directories, registrations, and location consistency.' },
]

const automationSurfaces = [
  { label: 'n8n node', detail: 'Run audit and async audit operations', status: 'source-shipped' },
  { label: 'Make app', detail: 'API key connection and audit modules', status: 'source-shipped' },
  { label: 'LangChain tool', detail: 'Structured tool wrapper and helpers', status: 'source-shipped' },
]

const pitchDemos = [
  { href: '/audit?demo=high-risk', icon: AlertCircle, label: 'High-risk', description: 'Unrealistic pay, no interview, Telegram contact.', className: 'border-risk-bg bg-risk-bg text-risk-text' },
  { href: '/audit?demo=caution', icon: Zap, label: 'Caution', description: 'Some legitimacy, but incomplete details.', className: 'border-caution-bg bg-caution-bg text-caution-text' },
  { href: '/audit?demo=safe', icon: CheckCircle2, label: 'Safe', description: 'Established company and professional path.', className: 'border-safe-bg bg-safe-bg text-safe-text' },
]

const typingPhrases = [
  'Remote frontend intern. PHP 80,000/week...',
  'Join our team at TechStart Solutions...',
  'Senior Software Engineer at Microsoft...',
  'Urgent! Data entry clerk needed, $5000/week...',
]

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

function TypewriterEffect() {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const phrase = typingPhrases[phraseIndex]
    const timer = setTimeout(() => {
      if (!isDeleting) {
        setText(phrase.substring(0, text.length + 1))
        if (text === phrase) {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        setText(phrase.substring(0, text.length - 1))
        if (text === '') {
          setIsDeleting(false)
          setPhraseIndex((phraseIndex + 1) % typingPhrases.length)
        }
      }
    }, isDeleting ? 30 : 60)

    return () => clearTimeout(timer)
  }, [text, isDeleting, phraseIndex])

  return (
    <span className="text-safe">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  )
}

const demoData = {
  scam: {
    title: 'High-Risk Signal Detected',
    score: 94,
    status: 'High-Risk',
    colorClass: 'text-risk-text',
    progressClass: 'bg-risk-bg shadow-[0_0_10px_#f43f5e]',
    shortDesc: 'Critical risk factors identified',
    scans: [
      { label: 'Pay Index', status: '400% Above Market', icon: TrendingUp },
      { label: 'Contact Path', status: 'Off-platform (Telegram)', icon: ShieldAlert },
      { label: 'Linguistic', status: 'GPT-4 Pattern Match', icon: Bot },
    ]
  },
  legit: {
    title: 'Safe Opportunity Verified',
    score: 8,
    status: 'Safe',
    colorClass: 'text-safe',
    progressClass: 'bg-safe shadow-[0_0_10px_#10b981]',
    shortDesc: 'Strong reputation signals verified',
    scans: [
      { label: 'Domain Age', status: '12.4 Years', icon: Globe },
      { label: 'Reputation', status: 'Positive (Major Boards)', icon: SearchCheck },
      { label: 'LinkedIn', status: 'Verified Recruiter', icon: MapPin },
    ]
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: heroEase } }
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const cardReveal = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
}

export function HomeClient() {
  const [activeDemo, setActiveDemo] = useState<'scam' | 'legit'>('scam')
  const [demoStep, setDemoStep] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoStep(s => (s + 1) % 4)
      if (demoStep === 3) {
        setActiveDemo(d => d === 'scam' ? 'legit' : 'scam')
      }
    }, 4000)
    return () => clearInterval(timer)
  }, [demoStep])

  const current = demoData[activeDemo]

  return (
    <div className="flex flex-col">
      <ImpactTicker />
      <SiteHeader />

      {/* SEO FAQ Schema */}
      <Script
        id="hireproof-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does HireProof detect job scams?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "HireProof extracts the job post claims, checks company web presence, reviews reputation signals, compares similar roles, and returns an evidence-backed risk verdict."
                }
              },
              {
                "@type": "Question",
                "name": "Can HireProof check AI-generated recruiter scams?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. HireProof looks for suspicious recruitment patterns such as unrealistic pay, vague company details, off-platform contact, and missing hiring evidence."
                }
              },
              {
                "@type": "Question",
                "name": "Is HireProof free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, the HireProof demo is free for individual job seekers to verify suspicious opportunities before applying."
                }
              }
            ]
          })
        }}
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-20 lg:pt-10">
        {/* Evidence radar background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.1)_90deg,transparent_90deg)]"
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-16 z-0 hidden h-[260px] w-[310px] rotate-[-10deg] opacity-[0.1] md:block xl:left-4 xl:top-24"
        >
          <div className="absolute inset-0 rounded-[3rem] border border-safe/20 bg-[radial-gradient(circle_at_30%_25%,rgba(52,211,153,0.28),transparent_34%),linear-gradient(135deg,rgba(52,211,153,0.12),rgba(96,165,250,0.05)_48%,transparent)] shadow-[0_0_90px_rgba(52,211,153,0.16)]" />
          <div className="absolute left-16 top-14 h-28 w-28 rotate-[-8deg] rounded-[1.7rem] border border-safe/35 bg-safe/10 shadow-[0_0_42px_rgba(52,211,153,0.22)]" />
          <div className="absolute left-28 top-22 h-16 w-12 rotate-[-8deg] rounded-lg border border-safe/35 bg-background/35" />
          <div className="absolute left-34 top-28 h-2 w-14 rotate-[-8deg] rounded-full bg-safe/55" />
          <div className="absolute left-32 top-38 h-2 w-20 rotate-[-8deg] rounded-full bg-evidence/25" />
          <div className="absolute left-34 top-48 h-2 w-12 rotate-[-8deg] rounded-full bg-safe/35" />
          <div className="absolute left-52 top-24 h-3 w-40 rounded-full bg-safe/50" />
          <div className="absolute left-52 top-48 h-3 w-56 rounded-full bg-evidence/25" />
          <div className="absolute left-52 top-72 h-3 w-36 rounded-full bg-safe/35" />
          <div className="absolute left-68 top-30 h-14 w-14 rotate-12 rounded-2xl border border-evidence/25 bg-evidence/10" />
          <div className="absolute bottom-10 left-20 h-24 w-64 rounded-[2rem] border border-safe/20 bg-background/25 backdrop-blur-sm" />
          <div className="absolute bottom-20 left-34 h-3 w-24 rounded-full bg-risk-text/30" />
          <div className="absolute bottom-20 left-64 h-3 w-20 rounded-full bg-safe/45" />
          <div className="absolute bottom-34 left-34 h-3 w-36 rounded-full bg-muted/25" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-[4%] z-0 hidden h-[800px] w-[616px] origin-bottom-right overflow-hidden rounded-[2.2rem] border border-safe/30 bg-surface/5 opacity-[0.18] shadow-[0_0_110px_rgba(52,211,153,0.28)] saturate-125 [transform-style:preserve-3d] [transform:perspective(1100px)_rotateX(11deg)_rotateY(-8deg)_rotateZ(17deg)_skewX(-4deg)] md:block xl:-bottom-44 xl:right-[12%] xl:h-[960px] xl:w-[738px] xl:[transform:perspective(1200px)_rotateX(11deg)_rotateY(-8deg)_rotateZ(19deg)_skewX(-4deg)]"
        >
          <img
            src="/media/job-application-meme.png"
            alt=""
            className="h-full w-full object-cover object-[center_12%]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-background/0 via-background/22 to-background/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 mx-auto grid max-w-[1600px] gap-8 px-6 py-10 md:px-12 lg:px-20 lg:py-14 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-center xl:px-32">
          <motion.div
            initial="hidden"
            animate="show"
            className="mx-auto max-w-4xl text-center xl:mx-0 xl:max-w-2xl xl:text-left"
          >

            <motion.div variants={fadeUp} custom={1} className="mb-5 inline-flex items-center gap-2 rounded-full border border-risk-bg bg-risk-bg px-3 py-1 text-sm font-bold text-risk-text">
              <ShieldAlert className="h-4 w-4" />
              Built for suspicious work offers
            </motion.div>

            <motion.h1 variants={fadeUp} custom={2} className="text-4xl font-black leading-tight text-balance sm:text-5xl lg:text-6xl">
              Paste a job post. See if it&apos;s safe, suspicious, or high-risk, with receipts.
            </motion.h1>

            <motion.div variants={fadeUp} custom={3} className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-muted xl:mx-0 xl:max-w-xl">
              <p>Check a recruiter message, job listing, freelance gig, internship, or scholarship or training offer before you share personal details.</p>
              <div className="mt-3 rounded-xl border border-border-soft bg-surface/80 dark:bg-black p-4 font-mono text-xs shadow-2xl relative overflow-hidden group backdrop-blur-md">
                <div className="absolute top-0 left-0 h-full w-1 bg-safe/50" />
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <div className="h-2 w-2 rounded-full bg-risk-text" />
                  <div className="h-2 w-2 rounded-full bg-caution" />
                  <div className="h-2 w-2 rounded-full bg-safe" />
                  <span className="ml-2 text-[8px] uppercase tracking-widest text-muted dark:text-white/70">hireproof-terminal v1.0.4</span>
                </div>
                <div className="text-foreground dark:text-white/90">
                  <span className="text-safe mr-2">investigator@hireproof:~$</span>
                  <TypewriterEffect />
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row xl:justify-start">
              <Link href="/audit" className="hireproof-focus hireproof-cta-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-bold shadow-lg">
                Start investigation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/audit?demo=high-risk" className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface/85 px-5 py-2.5 font-bold transition-colors hover:bg-background">
                Quick demo
              </Link>
              <Link href="/proof" className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-lg border border-evidence-bg bg-evidence-bg px-5 py-2.5 font-bold text-evidence transition-colors hover:bg-background">
                Proof pack
              </Link>
            </motion.div>

            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto mt-6 grid max-w-3xl gap-2 sm:grid-cols-3 xl:mx-0">
              {pitchDemos.map((demo) => {
                const Icon = demo.icon
                return (
                  <motion.div key={demo.href} variants={cardReveal}>
                    <Link
                      href={demo.href}
                      className={`hireproof-focus group relative block min-w-0 overflow-hidden rounded-xl border p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.98] ${demo.className}`}
                    >
                      <span className="pointer-events-none absolute inset-0 bg-white/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-white/10" />
                      <span className="pointer-events-none absolute right-2 top-2 h-16 w-16 rounded-full bg-current/10 blur-2xl transition-transform duration-300 group-hover:scale-125 group-focus-visible:scale-125" />
                      <div className="relative mb-2 flex min-w-0 items-center justify-between gap-2 text-sm font-black">
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110" />
                          {demo.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-80 group-focus-visible:translate-x-0.5 group-focus-visible:opacity-80" />
                      </div>
                      <p className="relative min-w-0 break-words text-xs font-semibold leading-5">{demo.description}</p>
                      <span className="relative mt-2 inline-flex max-w-full whitespace-normal break-words text-[10px] font-black uppercase leading-tight tracking-wide opacity-0 transition-opacity duration-300 group-hover:opacity-70 group-focus-visible:opacity-70">
                        Try case
                      </span>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: heroEase, delay: 0.4 }}
            className="hidden xl:block"
          >
            <div className="mb-6 flex gap-3">
              {['scam', 'legit'].map((mode) => {
                const isActive = activeDemo === mode
                const isScam = mode === 'scam'
                return (
                  <button
                    key={mode}
                    onClick={() => setActiveDemo(mode as any)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                      isActive
                        ? isScam
                          ? 'bg-risk-bg text-risk-text shadow-lg shadow-risk-bg/20'
                          : 'bg-safe/15 text-safe shadow-lg shadow-safe/20'
                        : 'bg-surface text-muted hover:bg-background hover:text-foreground'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? (isScam ? 'bg-risk-text' : 'bg-safe') : 'bg-muted'}`} />
                    {isScam ? 'Case: Phishing' : 'Case: Verified'}
                  </button>
                )
              })}
            </div>

              <motion.div
                key={activeDemo}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  perspective: '1000px',
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-3"
              >
                <div className="px-1">
                  <p className="text-xs font-bold text-muted">
                    {demoData[activeDemo].shortDesc}
                  </p>
                </div>

                <motion.div 
                  whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
                  className="hireproof-card relative rounded-[2rem] p-6 border border-border-soft shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-safe/20 bg-surface/50 backdrop-blur-sm"
                >
                <div className={`absolute top-0 left-0 w-full h-1 ${current.progressClass}`} />
                
                <div className="mb-6 flex items-center justify-between gap-4 border-b border-border-soft pb-4">
                  <div>
                    <h3 className={`text-xl font-black ${current.colorClass}`}>
                      {current.title}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Evidence confidence index</p>
                  </div>
                  <div className={`text-3xl font-black tabular-nums ${current.colorClass}`}>
                    {current.score}%
                  </div>
                </div>

                <div className="space-y-3">
                  {current.scans.map((scan, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={scan.label}
                      className="flex items-center justify-between rounded-xl bg-background/50 p-4 border border-border-soft group/item"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 bg-background ${current.colorClass} border border-border-soft group-hover/item:scale-110 transition-transform`}>
                          <scan.icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-muted uppercase tracking-widest">{scan.label}</span>
                      </div>
                      <span className="text-xs font-black">{scan.status}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl bg-background p-5 border border-border-soft">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System Recommendation</span>
                    <div className="flex gap-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${current.progressClass}`} />
                      <div className="h-1.5 w-1.5 rounded-full bg-border" />
                    </div>
                  </div>
                  <p className="text-sm font-black italic text-foreground leading-relaxed">
                    {activeDemo === 'scam' 
                      ? '"Pattern analysis reveals automation markers. Avoid Telegram contact."'
                      : '"Entity identity verified via multiple authoritative footprints."'
                    }
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative border-y border-border-soft bg-safe/5">
        <div className="absolute inset-x-0 top-0 h-px bg-safe/35" />
        <div className="mx-auto max-w-[1600px] px-6 py-14 md:px-12 lg:px-20 xl:px-32">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-safe">Workflow</p>
              <h2 className="text-2xl font-black">How it works</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-muted">
              The interface is intentionally report-first: every verdict should feel backed by visible evidence.
            </p>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-4 md:grid-cols-3"
          >
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div key={step.title} variants={cardReveal} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-safe-bg text-safe">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mb-2 text-xs font-black uppercase tracking-normal text-muted">Step {index + 1}</div>
                  <h3 className="font-black">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-muted">{step.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Evidence signals */}
      <section className="border-b border-border-soft bg-surface">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32 py-14">
          <div className="mb-8 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-evidence" />
            <h2 className="text-2xl font-black">Evidence signals</h2>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-5 md:grid-cols-2"
          >
            {evidenceSignals.map((signal) => {
              const Icon = signal.icon
              return (
                <motion.div key={signal.title} variants={cardReveal} className="group relative flex gap-4 overflow-hidden rounded-2xl border border-border-soft bg-background p-5 transition-all hover:border-evidence/50 hover:shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-evidence/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-evidence-bg text-evidence shadow-inner transition-transform group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black">{signal.title}</h3>
                      <div className="h-1 w-1 rounded-full bg-evidence opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="mt-1 text-sm font-medium leading-6 text-muted">{signal.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Automations */}
      <section className="border-b border-border-soft bg-background">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-6 py-14 md:px-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-20 xl:px-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: heroEase }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-safe">
              <Network className="h-4 w-4" />
              Built for automation builders
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Put HireProof in front of apply agents and job pipelines.
            </h2>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-muted">
              The same audit API now has repo-shipped integration packs for n8n, Make, and LangChain, plus portable HTTP templates for teams that want direct webhook control.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/docs/automations" className="hireproof-focus hireproof-cta-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black">
                View automation docs <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="/api/downloads/hireproof-native-integrations.zip" download className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface px-5 py-3 text-sm font-black text-foreground transition-colors hover:bg-background">
                Download source pack <Download className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-4 text-xs font-bold leading-5 text-muted">
              Source packs are implemented and build-verified. External marketplace approval is still separate for npm, n8n, and Make.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-3"
          >
            {automationSurfaces.map((surface, index) => (
              <motion.div key={surface.label} variants={cardReveal} className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 text-xs font-black uppercase tracking-widest text-muted">Integration {index + 1}</div>
                    <h3 className="text-lg font-black">{surface.label}</h3>
                  </div>
                  <span className="rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-safe">
                    {surface.status}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-muted">{surface.detail}</p>
              </motion.div>
            ))}
            <motion.div variants={cardReveal} className="rounded-2xl border border-evidence/30 bg-evidence/5 p-5">
              <div className="mb-2 flex items-center gap-2 text-evidence">
                <Workflow className="h-5 w-5" />
                <h3 className="font-black">Separate WDK handoff</h3>
              </div>
              <p className="text-sm font-semibold leading-6 text-evidence-text">
                Portable integrations call <code className="rounded bg-background px-1 py-0.5">/api/v1/audit</code>. Durable Workflow handoff stays separate at <code className="rounded bg-background px-1 py-0.5">/api/workflows/audit</code>.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Dead Internet Theory Section */}
      <section className="relative overflow-hidden border-b border-border-soft bg-background py-24 text-foreground">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-10 text-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>
        
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-risk-bg bg-risk-bg/50 px-3 py-1 text-xs font-black uppercase tracking-widest text-risk-text">
                <Bot className="h-4 w-4" />
                The Dead Internet is Real
              </div>
              <h2 className="text-4xl font-black leading-tight sm:text-5xl">
                Job posts can be real, fake, or <span className="text-risk-text">AI-shaped bait.</span>
              </h2>
              <p className="mt-6 text-lg font-medium leading-relaxed text-muted">
              The job market is becoming a target for automated phishing. HireProof helps candidates, students, and freelancers slow down, inspect the evidence, and avoid sharing personal details with suspicious contacts.
              </p>
              
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-risk-bg text-risk-text">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-foreground">Pattern checks</h3>
                  <p className="text-sm text-muted">Flag unrealistic compensation, vague company claims, and contact paths that move you off trusted platforms.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-safe-bg text-safe">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-foreground">Evidence-first reports</h3>
                  <p className="text-sm text-muted">Show why a verdict was returned so the user can decide before applying.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="relative rounded-2xl border border-border-soft bg-surface/80 p-8 shadow-xl backdrop-blur-sm"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-muted">
                  <span className="h-2 w-2 rounded-full bg-risk-text animate-pulse" />
                  SCANNING JOB POST...
                </div>
                <div className="text-xs font-black text-risk-text">DETECTION ACTIVE</div>
              </div>
              
              <div className="space-y-4 font-mono">
                {flags.map((flag) => (
                  <div key={flag} className="rounded border border-border bg-background p-3 text-xs leading-relaxed text-foreground">
                    <span className="text-risk-text">MATCH:</span> {flag}<br />
                    <span className="text-muted">// Status: needs investigation</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 relative overflow-hidden rounded-xl border border-risk-bg bg-risk-bg/50 p-4 text-center">
                <div className="text-2xl font-black uppercase text-risk-text">Suspicious Pattern Found</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-risk-text/80">Run evidence checks before applying</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Spot the Bot Training Section */}
      <section className="border-b border-border-soft bg-surface py-14">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32">
          <div className="mb-6 text-center sm:mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-4 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-safe">
              <ZapIcon className="h-4 w-4" />
              Red Flag Training
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Spot the <span className="text-safe">red flags.</span></h2>
            <p className="mx-auto mt-3 max-w-2xl text-base font-medium text-muted sm:text-lg">
              Practice identifying suspicious job posts before you share personal details or apply.
            </p>
          </div>
          <SpotTheBot />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-border-soft bg-background dark:bg-[#080a0d] py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(var(--hireproof-safe)_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>
        <img
          src="/media/job-application-meme.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[46%] top-1/2 hidden w-[min(34rem,72vw)] -translate-x-1/2 -translate-y-1/2 rotate-[-7deg] rounded-[1.75rem] border border-safe/30 object-cover opacity-[0.08] shadow-[0_0_54px_rgba(52,211,153,0.28)] dark:opacity-[0.14] sm:block lg:left-[56%] lg:w-[38rem]"
        />
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-safe text-background shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)]"
          >
            <ShieldAlert className="h-10 w-10" />
          </motion.div>
          <h2 className="text-4xl font-black tracking-tight text-foreground dark:text-white md:text-5xl lg:text-6xl">
            Check the post<br />
            before you apply.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-muted dark:text-white/70 md:text-xl">
            Paste the listing, recruiter message, freelance gig, scholarship pitch, or application URL. HireProof turns suspicious claims into an evidence-backed verdict.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/audit"
              className="hireproof-focus hireproof-cta-primary group relative inline-flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-4 text-lg font-black sm:w-auto"
            >
              Start investigation
              <ArrowRight className="h-5 w-5" />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-max max-w-64 -translate-x-1/2 translate-y-1 rounded-xl border border-border-soft bg-surface/95 px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-foreground opacity-0 shadow-2xl ring-1 ring-white/10 backdrop-blur-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                Paste a real post or message
                <span className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-border-soft" />
              </span>
            </Link>
            <Link
              href="/audit?demo=high-risk"
              className="hireproof-focus group relative inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-border-soft bg-surface px-8 py-4 text-lg font-black text-foreground transition-all hover:border-safe/40 hover:bg-safe/5 sm:w-auto"
            >
              Try high-risk demo
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-max max-w-64 -translate-x-1/2 translate-y-1 rounded-xl border border-border-soft bg-surface/95 px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-foreground opacity-0 shadow-2xl ring-1 ring-white/10 backdrop-blur-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                Open an instant scam example
                <span className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-border-soft" />
              </span>
            </Link>
          </div>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-muted dark:text-white/30">
            Evidence-backed · Candidate-first · Free demo
          </p>
        </div>
      </section>


    </div>
  )
}
