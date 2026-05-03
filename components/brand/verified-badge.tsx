'use client'

import { ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export function VerifiedBadge({ company = 'HireProof', verified = true }: { company?: string; verified?: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center gap-3 rounded-2xl border-2 bg-background px-5 py-3 shadow-lg transition-shadow ${verified ? 'border-safe shadow-safe/10' : 'border-caution shadow-caution/10'}`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-background ${verified ? 'bg-safe' : 'bg-caution'}`}>
        <ShieldCheck className="h-6 w-6" />
      </div>
      <div className="text-left">
        <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${verified ? 'text-safe' : 'text-caution-text'}`}>
          {verified ? 'Verified Secure' : 'Verification Required'}
        </div>
        <div className="text-sm font-black text-foreground">{company} Official</div>
      </div>
    </motion.div>
  )
}
