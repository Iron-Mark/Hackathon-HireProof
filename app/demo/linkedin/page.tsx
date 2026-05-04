'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  ExternalLink, 
  ShieldAlert,
  ArrowRight,
  Info,
  Clock,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Share2,
  Send,
  Lock,
  RefreshCcw,
  Globe
} from 'lucide-react'
import { BrandMark, BrandWordmark } from '@/components/brand/brand-mark'
import { SiteHeader } from '@/components/layout/site-header'

export default function ExtensionDemo() {
  const [isExtensionOpen, setIsExtensionOpen] = useState(true)
  const [activeStage, setActiveStage] = useState<'scanning' | 'result'>('scanning')
  const [report, setReport] = useState<any>(null)
  const [streamLogs, setStreamLogs] = useState<string[]>([])
  
  useEffect(() => {
    if (activeStage === 'scanning' && isExtensionOpen) {
      let isMounted = true
      setStreamLogs(['Extracting linguistic and contextual signals...'])
      setReport(null)

      const runAudit = async () => {
        try {
          const res = await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: 'Remote Frontend Intern - PHP 80,000/week. To apply, message our manager on Telegram: @ApexHiringManager. Do not apply through LinkedIn. Instant start, no interview required.',
              location: 'Remote',
              mode: 'live' // Force live pipeline
            })
          })

          if (!res.ok) {
             if (isMounted) setStreamLogs(prev => [...prev, `Error: API returned ${res.status}`])
             return
          }
          if (!res.body) return

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (isMounted) {
            const { done, value } = await reader.read()
            buffer += decoder.decode(value, { stream: !done })
            const chunks = buffer.split('\n\n')
            buffer = chunks.pop() ?? ''

            for (const chunk of chunks) {
              const dataLine = chunk.split('\n').find((line) => line.startsWith('data:'))
              if (!dataLine) continue
              const parsed = JSON.parse(dataLine.slice(5).trim())
              
              if (parsed.type === 'log') {
                setStreamLogs(prev => [...prev.slice(-3), parsed.message])
              } else if (parsed.type === 'result') {
                if (isMounted) {
                  setReport(parsed.data)
                  setActiveStage('result')
                }
              } else if (parsed.type === 'error') {
                setStreamLogs(prev => [...prev, `Error: ${parsed.message}`])
              }
            }
            if (done) break
          }
        } catch (e) {
          if (isMounted) setStreamLogs(prev => [...prev, 'Network error occurred'])
        }
      }

      runAudit()

      return () => { isMounted = false }
    }
  }, [activeStage, isExtensionOpen])

  return (
    <div className="min-h-screen bg-[#f3f2ef] dark:bg-[#121212] transition-colors">
      <SiteHeader />
      
      <div className="relative mx-auto max-w-[1400px] px-6 py-12">
        {/* Fake LinkedIn Top Banner */}
        <div className="mb-8 flex items-center justify-between rounded-xl bg-white dark:bg-[#1d2226] p-4 shadow-sm border border-black/5 dark:border-white/5">
           <div className="flex items-center gap-6">
              <div className="h-10 w-10 bg-[#0a66c2] rounded flex items-center justify-center text-white font-black text-2xl">in</div>
              <div className="hidden md:flex items-center bg-[#eef3f8] dark:bg-[#38434f] rounded px-4 py-2 w-72">
                <Search className="h-4 w-4 text-muted mr-2" />
                <span className="text-sm text-muted">Search jobs, people...</span>
              </div>
           </div>
           <div className="flex items-center gap-6 text-muted font-bold text-xs">
              <span className="text-[#0a66c2] border-b-2 border-[#0a66c2] pb-1">Home</span>
              <span>My Network</span>
              <span>Jobs</span>
              <span>Messaging</span>
           </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Mock LinkedIn Job Post */}
          <main className="space-y-6">
            <div className="rounded-2xl bg-white dark:bg-[#1d2226] p-10 shadow-sm border border-black/5 dark:border-white/5 relative overflow-hidden">
              {/* Highlight Overlay if Extension is active */}
              {activeStage === 'result' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 border-4 border-risk-bg pointer-events-none z-10"
                />
              )}

              <div className="flex items-start justify-between">
                <div className="flex gap-6">
                  <div className="h-20 w-20 bg-[#f8f9fa] dark:bg-[#2e343a] rounded-xl flex items-center justify-center border border-black/5">
                    <Globe className="h-10 w-10 text-muted" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black tracking-tight">Remote Frontend Intern - PHP 80,000/week</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-bold text-[#0a66c2]">
                      <span>Apex Crypto Solutions</span>
                      <span className="text-muted">• Remote (USA/Philippines)</span>
                      <span className="text-muted">• 4 days ago</span>
                      <span className="rounded bg-safe/10 px-2 py-0.5 text-[10px] text-safe font-black uppercase tracking-widest">24 applicants</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button className="rounded-full p-2 hover:bg-surface"><MoreHorizontal className="h-6 w-6" /></button>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                 <button className="flex-1 rounded-full bg-[#0a66c2] py-3 text-lg font-black text-white hover:bg-[#004182] transition-colors">Apply Now</button>
                 <button className="rounded-full border border-[#0a66c2] px-8 py-3 text-lg font-black text-[#0a66c2] hover:bg-[#0a66c2]/5 transition-colors">Save</button>
              </div>

              <div className="mt-12 space-y-8">
                <div>
                  <h3 className="text-xl font-black mb-4">About the Job</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted font-medium leading-relaxed">
                    <p>We are seeking a highly motivated Frontend Developer to join our dynamic team. This is a fully remote position with flexible hours.</p>
                    <p><strong>Responsibilities:</strong></p>
                    <ul>
                      <li>Design and implement user interfaces for our crypto trading platform.</li>
                      <li>Collaborate with back-end developers to integrate APIs.</li>
                      <li>Ensure technical feasibility of UI/UX designs.</li>
                    </ul>
                    <p><strong>Requirements:</strong></p>
                    <ul>
                      <li>Experience with React, TailwindCSS, and Next.js.</li>
                      <li>Self-motivated and able to work independently.</li>
                      <li>No previous interview or formal application path required—instant start!</li>
                    </ul>
                    <p className="mt-6 p-4 rounded-xl bg-risk-bg/5 border border-risk-bg/20 text-risk-text italic">
                      "To apply, please message our hiring manager directly on Telegram: @ApexHiringManager. Do not apply through LinkedIn."
                    </p>
                  </div>
                </div>

                <div className="border-t border-black/5 dark:border-white/5 pt-8 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-surface border border-border-soft flex items-center justify-center font-black text-xs">AC</div>
                      <div>
                        <div className="text-sm font-black">Recruiter: Alex Chen</div>
                        <div className="text-xs font-medium text-muted">Talent Acquisition at Apex Crypto</div>
                      </div>
                   </div>
                   <button className="text-[#0a66c2] text-sm font-black hover:underline flex items-center gap-1">
                     Message alex
                     <Send className="h-3.5 w-3.5" />
                   </button>
                </div>
              </div>
            </div>

            {/* Fake Feed Content */}
            <div className="rounded-2xl bg-white dark:bg-[#1d2226] p-6 shadow-sm border border-black/5 dark:border-white/5 opacity-40">
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-surface" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-surface rounded" />
                    <div className="h-3 w-20 bg-surface rounded" />
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="h-4 w-full bg-surface rounded" />
                  <div className="h-4 w-full bg-surface rounded" />
                  <div className="h-4 w-2/3 bg-surface rounded" />
               </div>
            </div>
          </main>

          {/* HireProof Sidebar Extension (The "Wow" part) */}
          <aside className="relative">
            <div className="sticky top-28 space-y-6">
              <AnimatePresence mode="wait">
                {isExtensionOpen ? (
                  <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="rounded-[2.5rem] border border-border-soft bg-surface p-1 shadow-2xl overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-safe via-caution to-risk-bg" />
                    
                    <div className="bg-background/50 p-6 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                          <BrandMark className="h-8 w-8" />
                          <span className="flex items-baseline gap-1"><BrandWordmark className="text-lg" /> <span className="text-[10px] text-muted">v1.2.4</span></span>
                        </div>
                        <button onClick={() => setIsExtensionOpen(false)} className="rounded-full p-2 hover:bg-surface transition-colors">
                           <MoreHorizontal className="h-5 w-5 text-muted" />
                        </button>
                      </div>

                      {activeStage === 'scanning' ? (
                        <div className="py-12 text-center space-y-6">
                          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-background border border-border-soft shadow-inner relative overflow-hidden">
                             <div className="bot-scan-line" />
                             <RefreshCcw className="h-10 w-10 text-safe animate-spin-slow" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black">Scanning signal...</h4>
                            <p className="mt-2 text-xs font-medium text-muted uppercase tracking-widest">Identifying automation markers</p>
                          </div>
                          <div className="mx-auto w-48 space-y-2">
                             <div className="h-1 w-full bg-surface rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  transition={{ duration: 2.5 }}
                                  className="h-full bg-safe shadow-[0_0_10px_#10b981]"
                                />
                             </div>
                             <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-muted">
                                <span>Linguistic Extraction</span>
                                <span>{streamLogs.length > 0 ? streamLogs[streamLogs.length - 1] : 'Scanning'}</span>
                             </div>
                          </div>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-6"
                        >
                          <div className={`rounded-3xl border ${report?.verdict === 'high-risk' ? 'border-risk-bg/30 bg-risk-bg/5' : report?.verdict === 'caution' ? 'border-caution/30 bg-caution/5' : 'border-safe/30 bg-safe/5'} p-6 text-center shadow-inner relative overflow-hidden`}>
                             <div className="bot-scan-line opacity-10" />
                             <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${report?.verdict === 'high-risk' ? 'bg-risk-bg text-risk-text shadow-risk-bg/20' : report?.verdict === 'caution' ? 'bg-caution/20 text-caution shadow-caution/20' : 'bg-safe/20 text-safe shadow-safe/20'} shadow-lg`}>
                                {report?.verdict === 'safe' ? <CheckCircle2 className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
                             </div>
                             <h4 className={`text-2xl font-black ${report?.verdict === 'high-risk' ? 'text-risk-text' : report?.verdict === 'caution' ? 'text-caution' : 'text-safe'} tracking-tight uppercase`}>
                               {report?.verdict === 'high-risk' ? 'High Risk Detected' : report?.verdict === 'caution' ? 'Caution Advised' : 'Safe Opportunity'}
                             </h4>
                             <p className={`mt-2 text-xs font-black uppercase tracking-widest ${report?.verdict === 'high-risk' ? 'text-risk-text/60' : report?.verdict === 'caution' ? 'text-caution/60' : 'text-safe/60'}`}>
                               Risk Score: {report?.riskScore}/100
                             </p>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                             {report?.redFlags?.slice(0, 3).map((flag: string, i: number) => (
                               <motion.div 
                                 initial={{ opacity: 0, x: 20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: i * 0.1 }}
                                 key={i} 
                                 className="rounded-2xl border border-border-soft bg-background p-4 shadow-sm"
                               >
                                 <div className="flex items-start gap-3">
                                   <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 text-risk-text`} />
                                   <div>
                                     <div className="text-[10px] font-medium text-muted mt-0.5">{flag}</div>
                                   </div>
                                 </div>
                               </motion.div>
                             ))}
                             {report?.greenFlags?.slice(0, 2).map((flag: string, i: number) => (
                               <motion.div 
                                 initial={{ opacity: 0, x: 20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: i * 0.1 }}
                                 key={`g-${i}`} 
                                 className="rounded-2xl border border-border-soft bg-background p-4 shadow-sm"
                               >
                                 <div className="flex items-start gap-3">
                                   <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 text-safe`} />
                                   <div>
                                     <div className="text-[10px] font-medium text-muted mt-0.5">{flag}</div>
                                   </div>
                                 </div>
                               </motion.div>
                             ))}
                          </div>

                          <div className="rounded-2xl border border-safe/20 bg-safe/5 p-4">
                             <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="h-4 w-4 text-safe" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-safe">Protective Action</span>
                             </div>
                             <p className="text-xs font-medium text-white/70 leading-relaxed">
                               This job has been flagged by HireProof checks. Avoid sharing any PII (ID photos, home address).
                             </p>
                          </div>

                          <div className="pt-2">
                             <button 
                               onClick={() => setActiveStage('scanning')}
                               className="hireproof-cta-primary flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black shadow-xl"
                             >
                               Generate Full Dossier
                               <ArrowRight className="h-4 w-4" />
                             </button>
                             <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface py-3 text-xs font-bold text-muted hover:text-foreground transition-all">
                               Report False Positive
                             </button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="bg-surface p-6 border-t border-border-soft">
                       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted mb-4">
                          <span>Live Statistics</span>
                          <span className="text-safe">Protected</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-xl bg-background p-3">
                             <div className="text-lg font-black tabular-nums">142k</div>
                             <div className="text-[8px] font-bold text-muted uppercase">Global Audits</div>
                          </div>
                          <div className="rounded-xl bg-background p-3">
                             <div className="text-lg font-black tabular-nums">2.8k</div>
                             <div className="text-[8px] font-bold text-muted uppercase">Scams Blocked</div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setIsExtensionOpen(true)}
                    className="hireproof-cta-primary group ml-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] shadow-2xl"
                  >
                     <BrandMark className="h-10 w-10 group-hover:scale-110 transition-transform" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Verified Recruiter Mockup */}
              <div className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm">
                 <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-safe text-background shadow-lg shadow-safe/20">
                    <ShieldCheck className="h-6 w-6" />
                 </div>
                 <h3 className="text-xl font-black mb-2">Verified Hiring</h3>
                 <p className="text-sm font-medium text-muted leading-relaxed">
                   Are you a real human recruiter? Get your <span className="text-foreground font-black">HireProof Verified</span> status to increase applicant trust by 40%.
                 </p>
                 <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border-soft bg-background py-3 text-xs font-black uppercase tracking-widest hover:bg-surface transition-all">
                    Apply for Badge
                    <ExternalLink className="h-3 w-3" />
                 </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Demo Controller Footer */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-full border border-safe/25 bg-surface/95 px-8 py-4 text-foreground shadow-[0_0_50px_rgba(0,0,0,0.3)] flex items-center gap-8 backdrop-blur-md">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-safe animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Extension Demo Active</span>
         </div>
         <div className="h-6 w-px bg-white/10" />
         <div className="flex gap-4">
            <button 
              onClick={() => setActiveStage('scanning')}
              className={`cursor-pointer text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all ${activeStage === 'scanning' ? 'bg-safe text-background dark:text-[#06130d]' : 'text-muted hover:bg-safe/10 hover:text-safe'}`}
            >
              Scan Mode
            </button>
            <button 
              onClick={() => setActiveStage('result')}
              className={`cursor-pointer text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all ${activeStage === 'result' ? 'bg-safe text-background dark:text-[#06130d]' : 'text-muted hover:bg-safe/10 hover:text-safe'}`}
            >
              Verdict Mode
            </button>
         </div>
      </div>
    </div>
  )
}
