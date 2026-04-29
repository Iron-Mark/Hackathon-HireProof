'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { ArrowRight, CheckCircle2, AlertCircle, Globe, TrendingUp, MapPin, ShieldAlert, SearchCheck, FileText, Sparkles, Zap, Bot, Terminal, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import { SiteHeader } from '@/components/site-header'
import { BrandMark } from '@/components/brand-mark'
import { ImpactTicker } from '@/components/impact-ticker'

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
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const phrase = typingPhrases[phraseIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(phrase.slice(0, charIndex + 1))
        setCharIndex(charIndex + 1)
        if (charIndex + 1 >= phrase.length) {
          setTimeout(() => setIsDeleting(true), 1800)
        }
      } else {
        setText(phrase.slice(0, charIndex - 1))
        setCharIndex(charIndex - 1)
        if (charIndex <= 1) {
          setIsDeleting(false)
          setPhraseIndex((phraseIndex + 1) % typingPhrases.length)
        }
      }
    }, isDeleting ? 30 : 55)
    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, phraseIndex])

  return (
    <span className="text-safe">
      {text}<span className="animate-pulse">|</span>
    </span>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { delay: i * 0.12, duration: 0.5, ease: heroEase } 
  }),
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const cardReveal = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ImpactTicker />
      <SiteHeader />

      <section ref={heroRef} className="hireproof-grid border-b border-border-soft overflow-hidden">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-6 md:px-12 lg:px-20 xl:px-32 py-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:py-16">
          <motion.div
            initial="hidden"
            animate="show"
            className="max-w-2xl"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6 flex items-center gap-3">
              <BrandMark className="h-14 w-14 shrink-0 shadow-lg" />
              <div>
                <p className="text-sm font-black uppercase tracking-normal text-safe">HireProof</p>
                <p className="text-sm font-semibold text-muted">Job-post verification with receipts</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="mb-5 inline-flex items-center gap-2 rounded-full border border-risk-bg bg-risk-bg px-3 py-1 text-sm font-bold text-risk-text">
              <ShieldAlert className="h-4 w-4" />
              Built for suspicious job posts
            </motion.div>

            <motion.h1 variants={fadeUp} custom={2} className="text-4xl font-black leading-tight text-balance sm:text-5xl">
              Know if a job post is legit before you apply.
            </motion.h1>

            <motion.div variants={fadeUp} custom={3} className="mt-5 max-w-xl text-lg font-medium leading-8 text-muted">
              <p>Paste a recruiter message, job listing, or apply URL.</p>
              <div className="mt-3 rounded-xl border border-border-soft bg-surface px-4 py-3 font-mono text-sm">
                <span className="text-muted">&gt; </span><TypewriterEffect />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/audit"
                className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-2.5 font-bold text-background shadow-lg hover:bg-safe transition-colors"
              >
                Start investigation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/audit?demo=high-risk"
                className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface/85 px-5 py-2.5 font-bold hover:bg-background transition-colors"
              >
                Quick demo
              </Link>
            </motion.div>

            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-6 grid gap-2 sm:grid-cols-3">
              {pitchDemos.map((demo) => {
                const Icon = demo.icon
                return (
                  <motion.div key={demo.href} variants={cardReveal}>
                    <Link
                      href={demo.href}
                      className={`hireproof-focus block rounded-xl border p-3 text-left shadow-sm transition hover:shadow-md ${demo.className}`}
                    >
                      <div className="mb-2 flex items-center gap-2 text-sm font-black">
                        <Icon className="h-4 w-4" />
                        {demo.label}
                      </div>
                      <p className="text-xs font-semibold leading-5">{demo.description}</p>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* Report card with staggered animation */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hireproof-card rounded-2xl p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-border-soft pb-4">
              <div>
                <p className="text-sm font-black">Investigation report</p>
                <p className="text-xs font-semibold text-muted">Remote Frontend Intern</p>
              </div>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.8, stiffness: 300 }}
                className="rounded-full bg-risk-bg px-3 py-1 text-sm font-black text-risk-text"
              >
                High-Risk
              </motion.span>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border-soft bg-background p-4">
                <div className="mb-2 flex items-end justify-between text-sm">
                  <span className="font-semibold text-muted">Risk score</span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-3xl font-black text-high-risk"
                  >
                    92
                  </motion.span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-border-soft">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-high-risk"
                  />
                </div>
              </div>
              {flags.map((flag, i) => (
                <motion.div
                  key={flag}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.15, duration: 0.4 }}
                  className="flex gap-3 rounded-xl border border-risk-bg bg-risk-bg/70 p-3 text-sm font-semibold text-risk-text"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{flag}</span>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="rounded-xl border border-safe-bg bg-safe-bg p-4 text-sm text-safe-text"
              >
                <div className="mb-2 flex items-center gap-2 font-black">
                  <CheckCircle2 className="h-4 w-4" />
                  Safer next step
                </div>
                Compare the opportunity against verified job boards before replying.
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Dead Internet Manifesto */}
      <section className="border-b border-border-soft bg-background py-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#00ffc310,transparent_50%)]" />
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32 relative z-10">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tighter sm:text-6xl text-balance leading-[0.9]">
                  The Dead Internet <span className="text-muted">is Real</span>
                </h2>
                <div className="inline-flex items-center gap-2 rounded-full border border-risk-bg bg-risk-bg/50 px-3 py-1 text-xs font-black uppercase tracking-widest text-risk-text">
                  <Bot className="h-3.5 w-3.5" />
                  40% of the internet is now bots
                </div>
              </div>
              
              <p className="text-xl font-medium text-muted leading-relaxed">
                The job market is the new frontier for automated phishing. AI is posting jobs, AI is sending messages, and AI is interviewing you. <strong className="text-foreground">HireProof is the human filter.</strong>
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3 p-6 rounded-3xl border border-border-soft bg-surface/50 backdrop-blur-sm transition-colors hover:border-evidence/30">
                  <div className="h-10 w-10 rounded-xl bg-evidence/10 text-evidence flex items-center justify-center">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <h3 className="font-black">LLM Forensics</h3>
                  <p className="text-sm font-medium text-muted leading-relaxed">
                    Our engine identifies linguistic patterns unique to generative AI models.
                  </p>
                </div>
                <div className="space-y-3 p-6 rounded-3xl border border-border-soft bg-surface/50 backdrop-blur-sm transition-colors hover:border-safe/30">
                  <div className="h-10 w-10 rounded-xl bg-safe/10 text-safe flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h3 className="font-black">Bot-Speed Detection</h3>
                  <p className="text-sm font-medium text-muted leading-relaxed">
                    We flag listings that appear across hundreds of domains in milliseconds.
                  </p>
                </div>
              </div>

              <Link href="/docs/dead-internet" className="group inline-flex items-center gap-2 text-sm font-black text-muted hover:text-foreground transition-colors">
                Learn about our bot-defense 
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Forensics Terminal */}
            <div className="hireproof-card rounded-3xl overflow-hidden border border-border-soft shadow-2xl relative">
              <div className="absolute inset-0 bg-background/50 backdrop-blur-md z-[-1]" />
              <div className="border-b border-border-soft bg-surface px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-risk-text/40" />
                  <div className="h-3 w-3 rounded-full bg-caution/40" />
                  <div className="h-3 w-3 rounded-full bg-safe/40" />
                  <span className="ml-2 text-[10px] font-black text-muted uppercase tracking-widest">Forensic Console</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-safe animate-pulse" />
                  <span className="text-[10px] font-black text-safe uppercase tracking-widest">Detection Active</span>
                </div>
              </div>
              <div className="p-6 font-mono text-[11px] leading-relaxed space-y-4">
                <div className="text-muted">SCANNING FOR AUTOMATION...</div>
                
                <div className="space-y-1">
                  <div className="text-foreground font-bold">MATCH: &quot;We are looking for a highly motivated individual...&quot;</div>
                  <div className="text-safe">// Probability of GPT-4 origin: 98.4%</div>
                </div>

                <div className="space-y-1">
                  <div className="text-foreground font-bold">MATCH: &quot;Salary: $5000/week&quot;</div>
                  <div className="text-caution">// Pattern: Unrealistic compensation outlier</div>
                </div>

                <div className="space-y-1">
                  <div className="text-foreground font-bold">MATCH: Domain created 2 hours ago.</div>
                  <div className="text-high-risk">// Status: High-risk throwaway infrastructure</div>
                </div>

                <div className="pt-4 border-t border-border-soft space-y-2">
                  <div className="text-high-risk font-black uppercase text-xs">Bot Signature Found</div>
                  <div className="text-muted">Isolating human footprint: <span className="text-high-risk">0% lacks contrast</span></div>
                </div>
              </div>
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%]" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border-soft bg-surface">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-6 md:px-12 lg:px-20 xl:px-32 py-14 lg:grid-cols-[360px_1fr]">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-evidence-bg px-3 py-1 text-xs font-black uppercase tracking-normal text-evidence">
              Example input
            </div>
            <h2 className="text-2xl font-black">Suspicious opportunity</h2>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p><strong>Position:</strong> Remote Frontend Intern</p>
              <p><strong>Salary:</strong> PHP 80,000 per week</p>
              <p><strong>Location:</strong> Remote</p>
              <p><strong>Contact:</strong> Message us on Telegram</p>
              <p className="sm:col-span-2"><strong>Requirements:</strong> Basic HTML/CSS knowledge, no interview needed</p>
            </div>
            <Link href="/audit?demo=high-risk" className="hireproof-focus mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background hover:bg-safe transition-colors">
              Run quick demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border-soft">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32 py-14">
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
                <motion.div key={signal.title} variants={cardReveal} className="flex gap-4 rounded-2xl border border-border-soft bg-background p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-evidence-bg text-evidence">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black">{signal.title}</h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-muted">{signal.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Dead Internet Theory Section */}
      <section className="relative overflow-hidden bg-black py-24 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>
        
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-widest text-risk-text">
                <Bot className="h-4 w-4" />
                The Dead Internet is Real
              </div>
              <h2 className="text-4xl font-black leading-tight sm:text-5xl">
                40% of the internet <br />
                <span className="text-risk-text">is now bots.</span>
              </h2>
              <p className="mt-6 text-lg font-medium leading-relaxed text-white/60">
                The job market is the new frontier for automated phishing. AI is posting jobs, AI is sending messages, and AI is interviewing you. HireProof is the human filter.
              </p>
              
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <Cpu className="h-5 w-5 text-risk-text" />
                  </div>
                  <h3 className="font-bold">LLM Forensics</h3>
                  <p className="text-sm text-white/40">Our engine identifies linguistic patterns unique to generative AI models.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <Terminal className="h-5 w-5 text-safe" />
                  </div>
                  <h3 className="font-bold">Bot-Speed Detection</h3>
                  <p className="text-sm text-white/40">We flag listings that appear across hundreds of domains in milliseconds.</p>
                </div>
              </div>
              
              <Link
                href="/docs/dead-internet"
                className="mt-10 inline-flex items-center gap-2 font-black text-white hover:text-safe transition-colors"
              >
                Learn about our bot-defense <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-white/40">
                  <span className="h-2 w-2 rounded-full bg-risk-text animate-pulse"></span>
                  SCANNING FOR AUTOMATION...
                </div>
                <div className="text-xs font-black text-risk-text">DETECTION ACTIVE</div>
              </div>
              
              <div className="space-y-4 font-mono">
                <div className="rounded border border-white/5 bg-black/40 p-3 text-xs leading-relaxed text-white/80">
                  <span className="text-risk-text">MATCH:</span> "We are looking for a highly motivated individual..." <br/>
                  <span className="text-white/40">// Probability of GPT-4 origin: 98.4%</span>
                </div>
                <div className="rounded border border-white/5 bg-black/40 p-3 text-xs leading-relaxed text-white/80">
                  <span className="text-risk-text">MATCH:</span> "Salary: $5000/week" <br/>
                  <span className="text-white/40">// Pattern: Unrealistic compensation outlier</span>
                </div>
                <div className="rounded border border-white/5 bg-black/40 p-3 text-xs leading-relaxed text-white/80">
                  <span className="text-risk-text">MATCH:</span> Domain created 2 hours ago. <br/>
                  <span className="text-white/40">// Status: High-risk throwaway infrastructure</span>
                </div>
              </div>
              
              <div className="mt-8 relative rounded-xl bg-risk-bg/20 border border-risk-bg/30 p-4 text-center overflow-hidden">
                <div className="bot-scan-line"></div>
                <div className="text-2xl font-black text-risk-text glitch-hover uppercase">Bot Signature Found</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Isolating human footprint: 0%</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Spot the Bot Section */}
      <section className="bg-surface border-b border-border-soft py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-12 xl:px-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-evidence-bg px-3 py-1 text-xs font-black uppercase text-evidence">
            <Sparkles className="h-4 w-4" />
            Interactive Training
          </div>
          <h2 className="text-3xl font-black">Can you spot the bot?</h2>
          <p className="mt-3 text-muted font-medium">Click on the job post that you think is AI-generated.</p>
          
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => { alert("Correct! This is LLM-generated.") }}
              className="flex flex-col text-left rounded-2xl border border-border bg-background p-6 hover:border-risk-text transition-all group"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-muted">Example A</span>
                <Bot className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-risk-text" />
              </div>
              <p className="text-sm font-bold leading-relaxed">
                "Seeking a highly motivated Frontend Developer to join our dynamic team. Competitive salary and remote work options available. Apply now!"
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-black text-risk-text opacity-0 group-hover:opacity-100 transition-opacity">
                SELECT BOT <ArrowRight className="h-3 w-3" />
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => { alert("Incorrect! This is a human-written post.") }}
              className="flex flex-col text-left rounded-2xl border border-border bg-background p-6 hover:border-safe transition-all group"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-muted">Example B</span>
                <Bot className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-safe rotate-180" />
              </div>
              <p className="text-sm font-bold leading-relaxed italic">
                "Small team at Vertex Labs looking for a dev who doesn't mind diving into legacy code. Warning: our office dog will bark at your first PR."
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-black text-safe opacity-0 group-hover:opacity-100 transition-opacity">
                SELECT HUMAN <ArrowRight className="h-3 w-3" />
              </div>
            </motion.button>
          </div>
          
          <div className="mt-12 rounded-xl bg-evidence-bg/30 p-6 text-center">
            <p className="text-sm font-semibold leading-relaxed text-evidence">
              Bots often use "Generic Optimization" patterns. HireProof detects thousands of these linguistic markers in milliseconds—far faster than a human ever could.
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
