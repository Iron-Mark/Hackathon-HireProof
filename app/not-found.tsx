'use client'

import Link from 'next/link'
import { FileQuestion, Home, Search, ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'
import { SiteHeader } from '@/components/layout/site-header'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background hireproof-grid">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-safe/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-risk-bg/5 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hireproof-card relative flex max-w-lg flex-col items-center justify-center space-y-8 rounded-[32px] border border-border-soft p-10 text-center shadow-2xl sm:p-16 overflow-hidden"
        >
          <div className="bot-scan-line opacity-20" />
          
          <div className="relative">
            <motion.div 
              animate={{ 
                rotate: [0, 5, -5, 0],
                x: [0, 2, -2, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-24 w-24 items-center justify-center rounded-3xl bg-surface text-muted shadow-inner relative z-10"
            >
              <FileQuestion className="h-12 w-12" />
            </motion.div>
            <div className="absolute -inset-4 bg-muted/5 blur-2xl rounded-full -z-10" />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xs font-black uppercase tracking-[0.4em] text-safe mb-2"
              >
                Error Code: 404
              </motion.div>
              <h1 className="text-5xl font-black tracking-tighter text-foreground glitch-hover">Evidence Missing</h1>
            </div>
            <p className="text-lg font-medium leading-relaxed text-muted max-w-xs mx-auto">
              HireProof could not locate the requested report. The resource may have been removed or moved.
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 pt-4 sm:flex-row">
            <Link
              href="/"
              className="hireproof-focus flex flex-1 items-center justify-center gap-3 rounded-2xl bg-foreground px-8 py-4 text-base font-black text-background transition-all hover:bg-safe hover:scale-105 shadow-xl"
            >
              <Home className="h-5 w-5" />
              Return Home
            </Link>
            <Link
              href="/audit"
              className="hireproof-focus flex flex-1 items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-8 py-4 text-base font-black text-foreground transition-all hover:bg-background hover:scale-105"
            >
              <Search className="h-5 w-5" />
              New Audit
            </Link>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted/50 pt-4">
            <ShieldAlert className="h-3 w-3" />
            HireProof Verification Active
          </div>
        </motion.div>
      </div>
    </div>
  )
}
