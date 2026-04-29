'use client'

import { ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export function VerifiedBadge({ company = 'HireProof' }: { company?: string }) {
  return (
    <motion.a
      href="https://hireproof.com/verify"
      target="_blank"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center gap-3 rounded-2xl border-2 border-safe bg-background px-5 py-3 shadow-lg shadow-safe/10 transition-shadow hover:shadow-safe/20"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-safe text-background">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <div className="text-left">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-safe">Verified Secure</div>
        <div className="text-sm font-black text-foreground">{company} Official</div>
      </div>
    </motion.a>
  )
}
