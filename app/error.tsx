'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, RotateCw, ArrowLeft, ShieldAlert, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import { SiteHeader } from '@/components/layout/site-header'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col bg-background hireproof-grid">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--hireproof-risk-bg),transparent_70%)] opacity-5 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hireproof-card relative flex max-w-lg flex-col items-center justify-center space-y-8 rounded-[32px] border border-risk-bg/30 p-10 text-center shadow-2xl sm:p-16 overflow-hidden"
        >
          <div className="bot-scan-line bg-high-risk opacity-30" />
          
          <div className="relative">
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, -2, 2, 0]
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="flex h-24 w-24 items-center justify-center rounded-3xl bg-risk-bg/50 text-high-risk shadow-inner relative z-10 border border-risk-bg"
            >
              <AlertCircle className="h-12 w-12" />
            </motion.div>
            <div className="absolute -inset-6 bg-high-risk/10 blur-3xl rounded-full -z-10 animate-pulse" />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.4em] text-high-risk mb-2">
                <Cpu className="h-3 w-3" />
                System Failure
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-foreground">Verification Engine Halted</h1>
            </div>
            <p className="text-lg font-medium leading-relaxed text-muted max-w-xs mx-auto">
              An unexpected anomaly was detected in the data stream. The current investigation has been suspended for safety.
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 pt-4 sm:flex-row">
            <button
              onClick={() => reset()}
              className="hireproof-focus cta-glow flex flex-1 items-center justify-center gap-3 rounded-2xl bg-foreground px-8 py-4 text-base font-black text-background transition-all hover:bg-high-risk hover:scale-105 shadow-xl"
            >
              <RotateCw className="h-5 w-5" />
              Reboot Engine
            </button>
            <button
              onClick={() => router.back()}
              className="hireproof-focus flex flex-1 items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-8 py-4 text-base font-black text-foreground transition-all hover:bg-background hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5" />
              Abort Case
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted/50 pt-4">
            <ShieldAlert className="h-3 w-3" />
            Automatic error logging active
          </div>
        </motion.div>
      </div>
    </div>
  )
}
