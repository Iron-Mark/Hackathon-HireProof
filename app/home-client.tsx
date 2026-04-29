'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { ArrowRight, CheckCircle2, AlertCircle, Globe, TrendingUp, MapPin, ShieldAlert, SearchCheck, FileText, Sparkles, Zap, Bot, Terminal, Cpu, RefreshCcw, Share2, Award, Zap as ZapIcon, Target, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SpotTheBot } from '@/components/spot-the-bot'
import { BrandMark } from '@/components/brand-mark'
import { ImpactTicker } from '@/components/impact-ticker'
import { WorldMap } from '@/components/world-map'
import { DEMO_FIXTURES } from '@/lib/fixtures'

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
    <div className="font-mono text-sm sm:text-base">
      <span className="text-safe mr-2">$</span>
      <span>{text}</span>
      <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-safe align-middle" />
    </div>
  )
}

const demoData = {
  scam: {
    title: 'High-Risk Signal Detected',
    score: 94,
    status: 'High-Risk',
    colorClass: 'text-risk-text',
    progressClass: 'bg-risk-bg shadow-[0_0_10px_#f43f5e]',
    shortDesc: 'Identifying automation markers...',
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
    shortDesc: 'Company footprint matches...',
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
      <script
        type="application/ld+json"
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
                  "text": "HireProof uses an agentic forensic engine to cross-reference job posts against company web presence, LinkedIn profiles, domain registration data, and linguistic markers of AI-driven phishing."
                }
              },
              {
                "@type": "Question",
                "name": "What is the Dead Internet Theory in recruitment?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Dead Internet Theory in recruitment refers to the proliferation of automated, AI-generated job posts and recruiter profiles designed to harvest personal data or facilitate phishing scams."
                }
              },
              {
                "@type": "Question",
                "name": "Is HireProof free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, the HireProof forensic audit tool is free for individual job seekers to verify opportunities and protect their data."
                }
              }
            ]
          })
        }}
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-20 lg:pt-10">
        {/* Forensic Radar Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.1)_90deg,transparent_90deg)]"
          />
        </div>
        <div className="mx-auto grid max-w-[1600px] gap-8 px-6 md:px-12 lg:px-20 xl:px-32 py-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:py-14 relative z-10">
          <motion.div
            initial="hidden"
            animate="show"
            className="max-w-2xl"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-4 flex items-center gap-3">
              <BrandMark className="h-12 w-12 shrink-0 shadow-lg" />
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="mb-4 inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-safe shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Sparkles className="h-4 w-4" />
              World's First Agentic Recruitment Forensic Engine
            </motion.div>

            <motion.h1 variants={fadeUp} custom={2} className="text-5xl font-black leading-[1.05] tracking-tighter sm:text-6xl lg:text-7xl xl:text-8xl glitch-hover">
              The Human Filter for the <span className="text-safe">Dead Internet.</span>
            </motion.h1>

            <motion.div variants={fadeUp} custom={3} className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-muted sm:text-xl">
              <p>Verify your next opportunity with <span className="text-foreground font-black underline decoration-safe underline-offset-8">Receipt-Grade Forensic Evidence.</span></p>
              <div className="mt-6 rounded-2xl border border-border-soft bg-surface/80 dark:bg-black p-5 font-mono text-xs shadow-2xl relative overflow-hidden group backdrop-blur-md border-l-4 border-l-safe">
                <div className="flex items-center gap-2 mb-3 opacity-80">
                  <div className="h-2 w-2 rounded-full bg-risk-text" />
                  <div className="h-2 w-2 rounded-full bg-caution" />
                  <div className="h-2 w-2 rounded-full bg-safe" />
                </div>
                <TypewriterEffect />
                <div className="absolute top-2 right-4 text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-safe transition-colors">Forensic Scan Mode</div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <Link href="/audit" className="hireproof-focus group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-foreground px-10 py-5 text-lg font-black text-background transition-all hover:bg-safe sm:w-auto shadow-xl">
                Start Forensic Audit
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-muted">
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse" /> 14.2k Daily Audits</span>
                <span className="h-4 w-px bg-border" />
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-safe" /> 99.8% Precision</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: heroEase, delay: 0.4 }}
            className="hidden lg:block"
          >
            <div className="mb-6 flex gap-3">
              {['scam', 'legit'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveDemo(mode as any)}
                  className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeDemo === mode 
                      ? 'bg-foreground text-background shadow-lg' 
                      : 'bg-surface text-muted hover:bg-background hover:text-foreground'
                  }`}
                >
                  {mode === 'scam' ? 'Case: Phishing' : 'Case: Verified'}
                </button>
              ))}
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
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Forensic confidence index</p>
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

      {/* Global Telemetry / World Map Section */}
      <section className="relative py-24 overflow-hidden bg-[#080a0d]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32 relative z-10">
          <div className="mb-16 grid gap-12 lg:grid-cols-2 lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-evidence/30 bg-evidence/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-evidence">
                <Globe className="h-4 w-4" />
                Live Global Telemetry
              </div>
              <h2 className="text-4xl font-black leading-none tracking-tight sm:text-6xl lg:text-7xl">
                The Network that <span className="text-safe">Never Sleeps.</span>
              </h2>
            </div>
            <div className="max-w-md">
              <p className="text-lg font-medium text-white/40 leading-relaxed uppercase tracking-tighter">
                Our agentic nodes monitor job boards and recruiter patterns globally, building a real-time defense against the next wave of AI-driven scams.
              </p>
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            <div className="rounded-[3rem] border border-white/5 bg-white/5 p-4 shadow-2xl backdrop-blur-md">
              <WorldMap />
            </div>
            <div className="space-y-6">
              {[
                { label: 'Total Audits', value: '142,309', change: '+12.4%', color: 'text-safe' },
                { label: 'Scams Blocked', value: '2,842', change: '+5.2%', color: 'text-risk-text' },
                { label: 'Active Nodes', value: '142', change: 'Operational', color: 'text-evidence' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-md">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/30">{stat.label}</div>
                  <div className="mt-2 flex items-end justify-between">
                    <div className="text-4xl font-black tabular-nums">{stat.value}</div>
                    <div className={`text-xs font-black ${stat.color}`}>{stat.change}</div>
                  </div>
                </div>
              ))}
              <div className="rounded-3xl border border-safe/20 bg-safe/5 p-8 text-center">
                <p className="text-sm font-black text-safe uppercase tracking-widest">Protective Buffer: ACTIVE</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spot the Bot Training Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32">
          <div className="mb-12 sm:mb-20 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-4 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-safe">
              <ZapIcon className="h-4 w-4" />
              Investigator Academy
            </div>
            <h2 className="text-4xl font-black tracking-tight sm:text-6xl">Sharpen Your <span className="text-safe">Senses.</span></h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl font-medium text-muted">
              Can you tell a human from a bot? Take our interactive training module to recognize the linguistic markers of AI-driven phishing.
            </p>
          </div>
          <SpotTheBot />
        </div>
      </section>

      {/* Community / Collective Defense Section */}
      <section className="bg-foreground py-20 sm:py-32 text-background relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-5">
          <Users className="h-[200px] w-[200px] sm:h-[400px] sm:w-[400px]" />
        </div>
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-12 mb-12 sm:mb-20">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-black leading-[0.95] tracking-tighter sm:text-7xl lg:text-8xl">
                The People vs. <br/> <span className="opacity-40 italic">The Dead Internet.</span>
              </h2>
              <p className="mt-8 text-xl font-black uppercase tracking-tight opacity-70">
                Join thousands of investigators building the last line of defense.
              </p>
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-safe text-background shadow-2xl shadow-safe/20">
              <Share2 className="h-10 w-10" />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { 
                quote: "HireProof saved me from a 'too-good-to-be-true' offer that looked 100% real. The Telegram red-flag was something I would have missed.",
                author: "Sarah J.",
                role: "Product Designer",
                icon: ShieldAlert
              },
              { 
                quote: "The forensic report is incredible. I showed it to my university's career center and they're now recommending it to all students.",
                author: "Markus D.",
                role: "Recent Graduate",
                icon: Award
              },
              { 
                quote: "As a recruiter, the Verified Badge has been a game-changer. My response rates are up 40% because candidates know I'm real.",
                author: "Elena R.",
                role: "Senior Tech Recruiter",
                icon: Target
              }
            ].map((item, i) => (
              <div key={i} className="rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-md">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <item.icon className="h-6 w-6" />
                </div>
                <p className="text-lg font-bold leading-relaxed mb-8 italic">"{item.quote}"</p>
                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div>
                    <div className="font-black text-sm">{item.author}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Global Leaderboard */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
                <div className="text-left">
                  <h3 className="text-2xl font-black mb-2">Global Investigator Leaderboard</h3>
                  <p className="text-sm font-medium opacity-60 uppercase tracking-widest">Top forensic analysts this week</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-safe text-background shadow-lg shadow-safe/20">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="grid gap-4">
                {[
                  { name: 'Alex Forensic', score: 142, rank: 'Master', color: 'text-safe' },
                  { name: 'Sarah Security', score: 128, rank: 'Master', color: 'text-safe' },
                  { name: 'Marcus Audit', score: 95, rank: 'Senior', color: 'text-evidence' },
                  { name: 'Elena Protect', score: 82, rank: 'Senior', color: 'text-evidence' },
                ].map((user, i) => (
                  <div key={user.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center font-black text-xs border border-white/10">{i + 1}</div>
                      <div>
                        <div className="text-sm font-black">{user.name}</div>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${user.color}`}>{user.rank} Analyst</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black">{user.score} Audits</div>
                      <div className={`text-[10px] font-medium opacity-40`}>Veracity: 99.8%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-8">
            <Link href="/audit" className="w-full sm:w-auto rounded-2xl bg-foreground px-12 py-5 text-lg font-black text-background hover:bg-safe transition-all shadow-xl hover:shadow-safe/20">
              Join the Network
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 w-12 rounded-full border-4 border-foreground bg-white/10" />
                ))}
              </div>
              <div className="text-sm font-black uppercase tracking-widest opacity-60">+12k Analysts Active</div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
