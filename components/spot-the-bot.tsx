'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, Cpu, RefreshCcw, ChevronRight, Target, Zap, Bot, ShieldCheck, Share2 } from 'lucide-react'
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
        explanation: '✅ Busted! This is a classic "Generic Optimization" pattern used by bot farms to flood job boards.',
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
        explanation: '✅ Busted! Direct redirection to WhatsApp/Telegram is a major forensic red flag.',
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
    <div className="mx-auto max-w-5xl px-6 py-24">
      <div className="rounded-[3rem] border border-border-soft bg-surface p-1 shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-evidence/5 to-transparent pointer-events-none" />
        
        {currentStep < quizItems.length ? (
          <div className="p-8 md:p-12">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-8 mb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Spot the Bot</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Investigator Rank:</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                      score >= 3 ? 'text-safe' : score >= 1 ? 'text-evidence' : 'text-muted'
                    }`}>
                      {score >= 3 ? 'Forensic Lead' : score >= 1 ? 'Special Agent' : 'Rookie'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-black tabular-nums">{score}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Solved</div>
                </div>
                <div className="text-center">
                  <motion.div 
                    key={streak}
                    initial={{ scale: 1.5, color: '#10b981' }}
                    animate={{ scale: 1, color: streak > 0 ? '#10b981' : '#64748b' }}
                    className="text-3xl font-black tabular-nums"
                  >
                    {streak}
                  </motion.div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Streak</div>
                </div>
              </div>
            </div>

            <div className="mb-10 text-center max-w-2xl mx-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-evidence/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-evidence border border-evidence/20"
              >
                Case File #{currentItem.id}
              </motion.div>
              <h2 className="text-2xl font-black mb-4 tracking-tight">Can you spot the bot?</h2>
              <p className="text-lg font-medium text-muted leading-relaxed">
                Click on the job post that you think is AI-generated.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {(['A', 'B'] as const).map((choice) => {
                const isSelected = selection === choice
                const isCorrect = choice === currentItem.correct
                const isDisabled = !!selection

                return (
                  <motion.button
                    key={choice}
                    onClick={() => handleSelection(choice)}
                    disabled={isDisabled}
                    whileHover={!isDisabled ? { scale: 1.02, y: -4 } : {}}
                    whileTap={!isDisabled ? { scale: 0.98 } : {}}
                    className={`group relative w-full h-full flex flex-col text-left rounded-[2rem] border-2 p-6 sm:p-10 transition-all duration-300 ${
                      isSelected
                        ? isCorrect
                          ? 'border-safe bg-safe/5 shadow-2xl shadow-safe/10'
                          : 'border-risk-bg bg-risk-bg/5 shadow-2xl shadow-risk-bg/10'
                        : isDisabled
                        ? 'border-border-soft opacity-40 grayscale pointer-events-none'
                        : 'border-border-soft bg-background hover:border-evidence hover:shadow-xl'
                    }`}
                  >
                    <div className={`mb-6 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black uppercase tracking-widest ${
                      isSelected
                        ? isCorrect
                          ? 'bg-safe text-background'
                          : 'bg-risk-bg text-risk-text'
                        : 'bg-surface text-muted'
                    }`}>
                      {choice}
                    </div>
                    <p className="text-base font-bold leading-relaxed text-foreground italic">
                      {currentItem.options[choice].text}
                    </p>
                    
                    {isSelected && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`absolute -right-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full border-4 border-surface shadow-2xl ${
                          isCorrect ? 'bg-safe text-background' : 'bg-risk-bg text-risk-text'
                        }`}
                      >
                        {isCorrect ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {selection && (
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 rounded-[2.5rem] border border-border-soft bg-background p-10 shadow-inner relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <RefreshCcw className="h-32 w-32 animate-spin-slow" />
                  </div>
                  
                  <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <h4 className="text-xl font-black uppercase tracking-tighter">{currentItem.options[selection].explanation}</h4>
                    {selection === currentItem.correct && (
                      <div className="flex items-center gap-2 rounded-full bg-safe/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-safe border border-safe/20 animate-pulse">
                        <Zap className="h-4 w-4" />
                        Forensic Precision Match
                      </div>
                    )}
                  </div>
                  
                  {/* Forensic Evidence Breakdown */}
                  <div className="mb-10 rounded-2xl border border-border-soft bg-surface p-8 relative overflow-hidden group">
                    <div className="bot-scan-line opacity-10" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <Cpu className="h-5 w-5 text-evidence" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Forensic Signal Extraction: {currentItem.evidence.marker}</span>
                      </div>
                      <p className="text-lg font-medium leading-relaxed text-foreground italic">
                        "{currentItem.evidence.explanation}"
                      </p>
                    </div>
                  </div>

                  <div className="mb-10 grid gap-6 sm:grid-cols-3">
                    {currentItem.options[selection].points.map((point, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="rounded-2xl border border-border-soft bg-surface/50 p-6 text-sm font-black shadow-sm group hover:border-evidence/50 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 text-evidence mb-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {point}
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <button
                      onClick={() => {
                        if (currentStep < quizItems.length - 1) {
                          setCurrentStep(s => s + 1)
                          setSelection(null)
                        } else {
                          setCurrentStep(quizItems.length)
                        }
                      }}
                      className="flex h-16 flex-1 items-center justify-center gap-3 rounded-[1.5rem] bg-foreground px-10 text-lg font-black text-background hover:bg-safe transition-all w-full shadow-2xl hover:shadow-safe/20"
                    >
                      {currentStep < quizItems.length - 1 ? 'Next Intelligence Case' : 'Final Performance Audit'}
                      <ArrowRight className="h-6 w-6" />
                    </button>
                    {selection === currentItem.correct && (
                      <button className="flex h-16 items-center gap-3 rounded-[1.5rem] border border-border-soft bg-background px-8 text-sm font-black uppercase tracking-widest hover:bg-surface transition-all">
                        <Share2 className="h-5 w-5" />
                        Share Dossier
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-16 md:p-24 text-center"
          >
            <div className="mx-auto mb-10 flex h-28 w-28 items-center justify-center rounded-[3rem] bg-safe text-background shadow-2xl shadow-safe/30 relative overflow-hidden">
               <div className="bot-scan-line opacity-20" />
               <Sparkles className="h-14 w-14 relative z-10" />
            </div>
            <h3 className="text-5xl font-black tracking-tighter">Training Complete</h3>
            <div className="mt-6 flex items-center justify-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted">Final Forensic Rank:</span>
              <span className="text-2xl font-black text-safe uppercase tracking-widest">
                {score === 3 ? 'Master Investigator' : score >= 1 ? 'Field Agent' : 'Rookie'}
              </span>
            </div>
            <p className="mx-auto mt-8 max-w-md text-xl font-medium text-muted leading-relaxed">
              You've identified <span className="text-foreground font-black underline decoration-safe underline-offset-8 decoration-4">{score} out of 3</span> automated recruitment vectors. Your neural weights for bot-detection are optimized.
            </p>
            
            {/* Investigator Badge Preview */}
            <div className="mt-12 mb-16 rounded-[3rem] border border-border-soft bg-background p-12 relative overflow-hidden group shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-br from-safe/10 to-transparent pointer-events-none" />
               <div className="bot-scan-line opacity-5" />
               <div className="relative z-10">
                  <div className="mx-auto w-40 h-40 rounded-full bg-surface border-[6px] border-safe flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck className="h-20 w-20 text-safe" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.8em] text-muted opacity-50">HireProof Certified Forensic Analyst</div>
                  <div className="text-3xl font-black text-foreground mt-2 uppercase tracking-tighter">Level {score} Intelligence Lead</div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => {
                  setCurrentStep(0)
                  setScore(0)
                  setSelection(null)
                  setStreak(0)
                }}
                className="hireproof-focus h-16 rounded-[1.5rem] border-2 border-border px-12 text-lg font-black hover:bg-surface transition-all w-full sm:w-auto"
              >
                Reset Synapses
              </button>
              <Link
                href="/audit"
                className="hireproof-focus flex h-16 items-center justify-center gap-3 rounded-[1.5rem] bg-foreground px-12 text-lg font-black text-background hover:bg-safe transition-all w-full sm:w-auto shadow-2xl hover:shadow-safe/30"
              >
                Start Live Audit
                <ArrowRight className="h-6 w-6" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
