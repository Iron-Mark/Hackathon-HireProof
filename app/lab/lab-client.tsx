'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, 
  Cpu, 
  Search, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Database, 
  Globe, 
  Code2, 
  Sparkles,
  ArrowRight,
  RefreshCcw,
  Fingerprint,
  Layers
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { BrandMark } from '@/components/brand-mark'
import { showToast } from '@/components/toast'

type LabStep = {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete' | 'error'
  msg: string
}

export function LabClient() {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [steps, setSteps] = useState<LabStep[]>([
    { id: '1', label: 'Signal Acquisition', status: 'pending', msg: 'Awaiting raw input buffer...' },
    { id: '2', label: 'Entity Dissection', status: 'pending', msg: 'Isolating roles, pay, and contact paths...' },
    { id: '3', label: 'Footprint Verification', status: 'pending', msg: 'Cross-referencing global job networks...' },
    { id: '4', label: 'Linguistic Fingerprinting', status: 'pending', msg: 'Analyzing LLM probability weights...' },
    { id: '5', label: 'Forensic Synthesis', status: 'pending', msg: 'Compiling final evidence dossier...' },
  ])
  const [logs, setLogs] = useState<string[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-50))
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const runInvestigation = async () => {
    if (!input) return showToast('Input buffer empty. Please provide forensic data.', 'info')
    
    setIsProcessing(true)
    setProgress(0)
    setActiveStep(0)
    setLogs([])
    setSteps(s => s.map(step => ({ ...step, status: 'pending', msg: step.id === '1' ? 'Awaiting raw input buffer...' : step.msg })))

    const processSteps = [
      { msg: 'Input detected. Normalizing character encoding...', log: 'UTF-8 normalization complete. Signal strength: HIGH.' },
      { msg: 'Extracting linguistic markers...', log: 'Pattern match found: "Generic Optimization" vector detected.' },
      { msg: 'Connecting to SerpApi node...', log: 'Global search initiated. Node [US-EAST-1] active.' },
      { msg: 'Analyzing domain reputation...', log: 'Domain age: 4 days. Probability of throwaway infra: 94.2%.' },
      { msg: 'Generating final forensic report...', log: 'Synthesis complete. Evidence locked.' },
    ]

    for (let i = 0; i < processSteps.length; i++) {
      setActiveStep(i)
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx === i ? 'active' : idx < i ? 'complete' : 'pending',
        msg: idx === i ? processSteps[i].msg : s.msg
      })))
      addLog(processSteps[i].log)
      
      for (let p = 0; p < 20; p++) {
        setProgress(prev => prev + 1)
        await new Promise(r => setTimeout(r, 50))
      }
    }

    setIsProcessing(false)
    showToast('Investigation complete. Dossier ready.', 'success')
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-safe/30 hireproof-grid">
      <SiteHeader />
      
      <main className="mx-auto max-w-[1600px] px-6 py-12 md:px-12 lg:px-20 xl:px-32">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-safe/10 text-safe border border-safe/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight lg:text-5xl">Forensic Laboratory</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2 w-2 rounded-full bg-safe animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-safe">Agentic Engine v9.4 (Active)</span>
                </div>
              </div>
            </div>
            <p className="max-w-xl text-lg font-medium text-muted-foreground leading-relaxed">
              Step inside the "Glass Box". Monitor the autonomous agent as it dissects recruitment data and isolates malicious automation markers in real-time.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="rounded-2xl border border-border-soft bg-surface p-4 text-center backdrop-blur-md">
              <div className="text-2xl font-black tabular-nums">{progress}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">Engine Load</div>
            </div>
            <div className="rounded-2xl border border-border-soft bg-surface p-4 text-center backdrop-blur-md">
              <div className="text-2xl font-black tabular-nums">0.4ms</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">Latency</div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Main Lab Interface */}
          <div className="space-y-8">
            {/* Input Terminal */}
            <section className="hireproof-card rounded-[2.5rem] p-10 relative overflow-hidden group">
              <div className="bot-scan-line opacity-5" />
              
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-5 w-5 text-safe" />
                  <h2 className="text-xl font-black">Data Acquisition Buffer</h2>
                </div>
                <div className="text-[10px] font-mono text-muted uppercase tracking-widest">Secure Channel // 256-BIT AES</div>
              </div>

              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste job description, email content, or raw HTML signal here..."
                  className="h-48 w-full rounded-3xl border border-border-soft bg-background/40 p-8 font-mono text-sm leading-relaxed text-foreground outline-none focus:border-safe/50 focus:ring-1 focus:ring-safe/20 transition-all placeholder:text-muted/30"
                />
                <div className="absolute bottom-6 right-6">
                  <button 
                    onClick={runInvestigation}
                    disabled={isProcessing}
                    className={`flex h-14 items-center gap-3 rounded-2xl bg-foreground px-8 text-sm font-black text-background transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale hover:bg-safe hover:text-background ${
                      isProcessing ? 'shadow-[0_0_40px_rgba(16,185,129,0.4)]' : ''
                    }`}
                  >
                    {isProcessing ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                    {isProcessing ? 'INVESTIGATING...' : 'RUN FORENSIC SCAN'}
                  </button>
                </div>
              </div>
            </section>

            {/* Agentic Reasoner Engine */}
            <section className="hireproof-card rounded-[2.5rem] p-10 relative overflow-hidden">
               <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-evidence" />
                  <h2 className="text-xl font-black">Agentic Thought Engine</h2>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-safe/50 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>

              <div className="grid gap-6">
                {steps.map((step, i) => (
                  <motion.div 
                    key={step.id}
                    animate={{ 
                      opacity: step.status === 'pending' ? 0.3 : 1,
                      x: step.status === 'active' ? 10 : 0
                    }}
                    className={`relative flex items-center gap-6 rounded-3xl border p-6 transition-all ${
                      step.status === 'active' 
                        ? 'border-safe bg-safe/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                        : 'border-border-soft bg-surface/50'
                    }`}
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-black ${
                      step.status === 'complete' ? 'bg-safe text-background' : 
                      step.status === 'active' ? 'bg-safe animate-pulse text-background' : 
                      'bg-muted/10 text-muted'
                    }`}>
                      {step.status === 'complete' ? <ShieldCheck className="h-6 w-6" /> : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-black text-sm uppercase tracking-widest">{step.label}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                          step.status === 'active' ? 'text-safe' : 'text-muted/40'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${step.status === 'active' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.msg}
                      </p>
                    </div>
                    {step.status === 'active' && (
                      <div className="absolute right-6 flex items-center gap-2">
                         <div className="h-1 w-24 overflow-hidden rounded-full bg-border-soft">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="h-full bg-safe shadow-[0_0_10px_#10b981]"
                            />
                         </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Telemetry */}
          <aside className="space-y-8">
            {/* Live Console Output */}
            <section className="rounded-[2.5rem] border border-border-soft bg-foreground p-8 shadow-2xl h-[420px] flex flex-col dark:bg-black">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="h-4 w-4 text-background/40 dark:text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-background/40 dark:text-white/40">Raw Telemetry</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-risk-bg" />
                  <div className="h-2 w-2 rounded-full bg-caution" />
                  <div className="h-2 w-2 rounded-full bg-safe" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[10px] scrollbar-hide">
                {logs.length === 0 ? (
                  <div className="text-background/10 dark:text-white/10 italic py-20 text-center">Awaiting signal acquisition...</div>
                ) : (
                  logs.map((log, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i} 
                      className="flex gap-3 text-background/60 dark:text-white/60 leading-relaxed border-l border-background/5 dark:border-white/5 pl-3"
                    >
                      <span className="text-background/20 dark:text-white/20 shrink-0">[{i}]</span>
                      <span className={log.includes('complete') || log.includes('HIGH') ? 'text-safe' : ''}>{log}</span>
                    </motion.div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </section>

            {/* Neural Probability Ticker */}
            <section className="hireproof-card rounded-[2.5rem] p-8">
              <div className="mb-8 flex items-center gap-3">
                <Activity className="h-4 w-4 text-evidence" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Neural Weights</h3>
              </div>
              
              <div className="space-y-6">
                {[
                  { label: 'Automation Probability', value: isProcessing ? Math.floor(progress * 0.9) : 0, color: 'text-risk-text' },
                  { label: 'Human Fingerprint', value: isProcessing ? 100 - progress : 100, color: 'text-safe' },
                  { label: 'Context Consistency', value: isProcessing ? Math.floor(Math.random() * 40 + 60) : 100, color: 'text-caution' },
                ].map((stat) => (
                  <div key={stat.label} className="space-y-2">
                    <div className="flex items-end justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-muted">{stat.label}</span>
                      <span className={stat.color}>{stat.value}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/10">
                      <motion.div 
                        animate={{ width: `${stat.value}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full bg-current ${stat.color} shadow-[0_0_10px_currentColor]`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="grid gap-4">
               <button className="flex items-center justify-between rounded-3xl border border-border-soft bg-surface p-6 text-sm font-black transition-all hover:bg-background hover:border-safe/30 group">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-safe/10 p-2 text-safe">
                      <Database className="h-4 w-4" />
                    </div>
                    Sync to History
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
               </button>
               <button className="flex items-center justify-between rounded-3xl border border-border-soft bg-surface p-6 text-sm font-black transition-all hover:bg-background hover:border-evidence/30 group">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-evidence/10 p-2 text-evidence">
                      <Globe className="h-4 w-4" />
                    </div>
                    Global Threat Map
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
               </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
