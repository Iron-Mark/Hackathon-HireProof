'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Globe,
  MapPin,
  SearchCheck,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'

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
      { label: 'Language cues', status: 'Pressure-language markers', icon: AlertCircle },
    ],
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
    ],
  },
}

export function HomeDemoPanel() {
  const [activeDemo, setActiveDemo] = useState<'scam' | 'legit'>('scam')
  const [demoStep, setDemoStep] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDemoStep((step) => {
        const nextStep = (step + 1) % 4
        if (nextStep === 0) {
          setActiveDemo((demo) => (demo === 'scam' ? 'legit' : 'scam'))
        }
        return nextStep
      })
    }, 4000)

    return () => window.clearInterval(timer)
  }, [])

  const current = demoData[activeDemo]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, rotateY: 6 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.45 }}
      className="hidden xl:block"
    >
      <div className="relative rounded-[2rem] border border-border-soft bg-surface/90 p-4 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full border border-safe/20 bg-safe/10 blur-xl" />
        <div className="relative overflow-hidden rounded-[1.5rem] border border-border-soft bg-background p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted">Live demo card</p>
              <h2 className="mt-1 text-xl font-black">{current.title}</h2>
              <p className="mt-1 text-sm font-semibold text-muted">{current.shortDesc}</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-black uppercase ${current.colorClass}`}>
              {current.status}
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-border-soft bg-surface p-1.5">
            {(['scam', 'legit'] as const).map((mode) => {
              const isActive = activeDemo === mode
              const isScam = mode === 'scam'
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setActiveDemo(mode)
                    setDemoStep(0)
                  }}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? isScam
                        ? 'bg-risk-bg text-risk-text'
                        : 'bg-safe-bg text-safe'
                      : 'text-muted hover:bg-background'
                  }`}
                >
                  {isScam ? <AlertCircle className="h-3 w-3" /> : <SearchCheck className="h-3 w-3" />}
                  {isScam ? 'Scam' : 'Legit'}
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted">Risk score</p>
                <div className={`mt-1 text-5xl font-black ${current.colorClass}`}>{current.score}</div>
              </div>
              <p className="max-w-34 text-right text-xs font-bold leading-5 text-muted">
                {activeDemo === 'scam'
                  ? 'Pattern analysis reveals automation markers. Avoid Telegram contact.'
                  : 'Company, recruiter, and role signals line up.'}
              </p>
            </div>
            <div className="h-2 rounded-full bg-border-soft">
              <div
                className={`h-full rounded-full ${current.progressClass}`}
                style={{ width: `${current.score}%` }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {current.scans.map((scan, index) => {
              const Icon = scan.icon
              const isActive = index <= demoStep
              return (
                <div
                  key={scan.label}
                  className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition-colors ${
                    isActive ? 'border-safe/35 bg-safe/5' : 'border-border-soft bg-surface/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background text-safe">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black">{scan.label}</p>
                      <p className="text-xs font-semibold text-muted">{scan.status}</p>
                    </div>
                  </div>
                  <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-safe' : 'bg-border-soft'}`} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
