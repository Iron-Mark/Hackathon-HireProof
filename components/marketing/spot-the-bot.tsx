'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, Cpu, ChevronRight, Zap, Bot, ShieldCheck, Share2 } from 'lucide-react'
import Link from 'next/link'

const quizItems = [
  {
    id: 1,
    correct: 'A',
    description: 'Bots often use "Generic Optimization" patterns. HireProof detects thousands of these linguistic markers in milliseconds—far faster than a human ever could.',
    evidence: {
      marker: 'Automated Politeness',
      explanation: 'Notice the overly formal and generic phrases like "highly motivated" and "dynamic team" without specific company context. This is a classic hallmark of LLM-generated descriptions from early 2024 models.'
    },
    options: {
      A: {
        text: '"Seeking a highly motivated Frontend Developer to join our dynamic team. Competitive salary and remote work options available. Apply now!"',
        explanation: 'Correct. This is a generic pattern often seen in mass-posted job scams.',
        points: [
          'Vague company description.',
          'High-velocity call to action.',
          'Zero specific tech stack mentioned.'
        ]
      },
      B: {
        text: '"Small team at Vertex Labs looking for a dev who doesn\'t mind diving into legacy code. Warning: our office dog will bark at your first PR."',
        explanation: '❌ Wrong! This is a human listing with unique cultural markers.',
        points: [
          'Specific company name (Vertex Labs).',
          'Human touch/humor (office dog).',
          'Realistic expectations (legacy code).'
        ]
      }
    }
  },
  {
    id: 2,
    correct: 'B',
    description: 'Financial outliers are the #1 red flag. Programmatic scams use high salaries to bypass critical thinking.',
    evidence: {
      marker: 'Compensation Anomaly',
      explanation: 'Legitimate internships rarely offer senior-level salaries. Bots use these "hooks" to ensure high click-through rates regardless of the job content.'
    },
    options: {
      A: {
        text: '"Junior Designer needed for local agency. 3 days/week in Makati. PHP 25k/mo. Must have a portfolio showing typography work."',
        explanation: '❌ Incorrect! This listing follows local market indices perfectly.',
        points: [
          'Realistic local salary.',
          'Specific location details.',
          'Clear portfolio requirements.'
        ]
      },
      B: {
        text: '"Entry Level Data Entry. Work from home. Flexible hours. PHP 80,000 per week. No experience required. Message on Telegram for info."',
        explanation: '✅ Busted! This is a "High-Value Hook" used in recruitment phishing.',
        points: [
          'Massive salary/effort imbalance.',
          'Telegram-only redirection.',
          'Zero barrier to entry.'
        ]
      }
    }
  },
  {
    id: 3,
    correct: 'A',
    description: 'Ghost hiring infrastructure often relies on "Throwaway" contact paths that bypass corporate security.',
    evidence: {
      marker: 'Channel Redirection',
      explanation: 'Official recruiters use official domains. If the call to action immediately moves you to an unencrypted, non-corporate chat app, the risk of data theft is 99%.'
    },
    options: {
      A: {
        text: '"Urgent hiring for Virtual Assistants! High pay. Apply via this WhatsApp link: [Link]. We need your name, age, and ID photo to start."',
        explanation: 'Correct. Direct redirection to WhatsApp or Telegram is a major recruitment-scam red flag.',
        points: [
          'Off-platform communication.',
          'Request for PII (ID photo) early.',
          'Artificial urgency ("Urgent!").'
        ]
      },
      B: {
        text: '"Product Manager, Growth. Help us scale our user base. Check our LinkedIn page for full details. No direct email applications."',
        explanation: '❌ Incorrect! This is a standard authentic listing.',
        points: [
          'Refers to official social channels.',
          'Specific role focus (Growth).',
          'Professional and realistic tone.'
        ]
      }
    }
  }
]

export function SpotTheBot() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selection, setSelection] = useState<'A' | 'B' | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  const currentItem = quizItems[currentStep]

  const handleSelection = (choice: 'A' | 'B') => {
    if (selection) return
    setSelection(choice)
    if (choice === currentItem.correct) {
      setScore(s => s + 1)
      setStreak(s => s + 1)
    } else {
      setStreak(0)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="relative overflow-hidden rounded-2xl border border-border-soft bg-surface p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-evidence/5 to-transparent pointer-events-none" />

        {currentStep < quizItems.length ? (
          <div className="relative z-10 p-4 sm:p-5 lg:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background shadow-lg">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight sm:text-2xl">Spot the Bot</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Rank:</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      score >= 3 ? 'text-safe' : score >= 1 ? 'text-evidence' : 'text-muted'
                    }`}>
                      {score >= 3 ? 'Lead Reviewer' : score >= 1 ? 'Reviewer' : 'Rookie'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border-soft bg-background px-4 py-2 text-center">
                  <div className="text-2xl font-black tabular-nums">{score}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Solved</div>
                </div>
                <div className="rounded-xl border border-border-soft bg-background px-4 py-2 text-center">
                  <motion.div
                    key={streak}
                    initial={{ scale: 1.5, color: '#10b981' }}
                    animate={{ scale: 1, color: streak > 0 ? '#10b981' : '#64748b' }}
                    className="text-2xl font-black tabular-nums"
                  >
                    {streak}
                  </motion.div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Streak</div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[minmax(13rem,0.62fr)_minmax(0,1.38fr)] md:items-stretch">
              <div className="rounded-2xl border border-border-soft bg-background p-5">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 inline-flex items-center gap-2 rounded-full border border-evidence/20 bg-evidence/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-evidence"
                >
                  Case File #{currentItem.id}
                </motion.div>
                <h2 className="text-2xl font-black tracking-tight">Can you spot the bot?</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-muted">
                  Pick the job post that looks AI-generated or scam-template generated.
                </p>
                <p className="mt-5 rounded-xl border border-border-soft bg-surface p-4 text-xs font-semibold leading-5 text-muted">
                  {currentItem.description}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(['A', 'B'] as const).map((choice) => {
                  const isSelected = selection === choice
                  const isCorrect = choice === currentItem.correct
                  const isDisabled = !!selection

                  return (
                    <motion.button
                      key={choice}
                      onClick={() => handleSelection(choice)}
                      disabled={isDisabled}
                      whileHover={!isDisabled ? { scale: 1.01, y: -2 } : {}}
                      whileTap={!isDisabled ? { scale: 0.99 } : {}}
                      className={`group relative flex min-h-[12rem] w-full flex-col text-left rounded-2xl border p-5 transition-all duration-200 ${
                        isSelected
                          ? isCorrect
                            ? 'border-safe bg-safe/5 shadow-xl shadow-safe/10'
                            : 'border-risk-bg bg-risk-bg/5 shadow-xl shadow-risk-bg/10'
                          : isDisabled
                          ? 'border-border-soft opacity-40 grayscale pointer-events-none'
                          : 'border-border-soft bg-background hover:border-evidence hover:shadow-lg'
                      }`}
                    >
                      <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black uppercase tracking-widest ${
                        isSelected
                          ? isCorrect
                            ? 'bg-safe text-background'
                            : 'bg-risk-bg text-risk-text'
                          : 'bg-surface text-muted'
                      }`}>
                        {choice}
                      </div>
                      <p className="text-sm font-bold leading-6 text-foreground italic sm:text-base">
                        {currentItem.options[choice].text}
                      </p>

                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border-4 border-surface shadow-xl ${
                            isCorrect ? 'bg-safe text-background' : 'bg-risk-bg text-risk-text'
                          }`}
                        >
                          {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {selection && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selection}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-5 overflow-hidden rounded-2xl border border-border-soft bg-background p-5 shadow-inner"
                >
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-lg font-black">{currentItem.options[selection].explanation}</h4>
                    {selection === currentItem.correct && (
                      <div className="flex items-center gap-2 rounded-full bg-safe/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-safe border border-safe/20">
                        <Zap className="h-3.5 w-3.5" />
                        Red Flag Match
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.78fr)]">
                    <div className="relative overflow-hidden rounded-xl border border-border-soft bg-surface p-5">
                      <div className="bot-scan-line opacity-10" />
                      <div className="relative z-10">
                        <div className="mb-3 flex items-center gap-3">
                          <Cpu className="h-4 w-4 text-evidence" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted">Signal reviewed: {currentItem.evidence.marker}</span>
                        </div>
                        <p className="text-sm font-semibold leading-6 text-foreground">
                          {currentItem.evidence.explanation}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                      {currentItem.options[selection].points.map((point, i) => (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.06 }}
                          key={i}
                          className="flex items-start gap-2 rounded-xl border border-border-soft bg-surface/50 p-3 text-xs font-black leading-5"
                        >
                          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-evidence" />
                          {point}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row">
                    <button
                      onClick={() => {
                        if (currentStep < quizItems.length - 1) {
                          setCurrentStep(s => s + 1)
                          setSelection(null)
                        } else {
                          setCurrentStep(quizItems.length)
                        }
                      }}
                      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-black text-background shadow-lg transition-all hover:bg-safe hover:shadow-safe/20 w-full"
                    >
                      {currentStep < quizItems.length - 1 ? 'Next Case' : 'Final Score'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {selection === currentItem.correct && (
                      <button className="flex min-h-12 items-center gap-2 rounded-xl border border-border-soft bg-background px-5 text-xs font-black uppercase tracking-widest transition-all hover:bg-surface w-full justify-center sm:w-auto">
                        <Share2 className="h-4 w-4" />
                        Share
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 p-6 text-center md:p-10"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-safe text-background shadow-xl shadow-safe/20 relative overflow-hidden">
               <div className="bot-scan-line opacity-20" />
               <Sparkles className="h-10 w-10 relative z-10" />
            </div>
            <h3 className="text-3xl font-black tracking-tight sm:text-4xl">Training Complete</h3>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">Final Rank:</span>
              <span className="text-lg font-black text-safe uppercase tracking-widest">
                {score === 3 ? 'Master Investigator' : score >= 1 ? 'Field Agent' : 'Rookie'}
              </span>
            </div>
            <p className="mx-auto mt-4 max-w-md text-base font-medium text-muted leading-relaxed">
              You identified <span className="text-foreground font-black underline decoration-safe underline-offset-4 decoration-2">{score} out of 3</span> suspicious recruitment patterns.
            </p>

            <div className="mx-auto my-8 max-w-md rounded-2xl border border-border-soft bg-background p-6 relative overflow-hidden shadow-xl">
               <div className="absolute inset-0 bg-gradient-to-br from-safe/10 to-transparent pointer-events-none" />
               <div className="bot-scan-line opacity-5" />
               <div className="relative z-10">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-safe bg-surface shadow-[0_0_40px_rgba(16,185,129,0.22)] transition-transform duration-300">
                    <ShieldCheck className="h-12 w-12 text-safe" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted opacity-70">HireProof Red Flag Training</div>
                  <div className="text-2xl font-black text-foreground mt-2 uppercase tracking-tight">Level {score} Reviewer</div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setCurrentStep(0)
                  setScore(0)
                  setSelection(null)
                  setStreak(0)
                }}
                className="hireproof-focus h-12 rounded-xl border border-border px-6 text-sm font-black hover:bg-surface transition-all w-full sm:w-auto"
              >
                Try Again
              </button>
              <Link
                href="/audit"
                className="hireproof-focus flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-sm font-black text-background hover:bg-safe transition-all w-full sm:w-auto shadow-lg hover:shadow-safe/20"
              >
                Start Live Audit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
