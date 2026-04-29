'use client'

import { motion } from 'framer-motion'
import { Activity, AlertCircle, SearchCheck, Shield } from 'lucide-react'

export function ImpactTicker() {
  const items = [
    { icon: Shield, text: 'Recruitment scam checks for pasted job posts' },
    { icon: SearchCheck, text: 'Live evidence search configured' },
    { icon: Activity, text: 'Demo and live audit modes available' },
    { icon: AlertCircle, text: 'High-risk signals flagged before you apply' },
  ]

  return (
    <div className="w-full bg-surface/50 dark:bg-[#0c0f14] py-2 overflow-hidden border-y border-border-soft dark:border-white/5 backdrop-blur-sm">
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex whitespace-nowrap gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70 dark:text-white/70"
      >
        {items.map((item) => (
          <StatItem key={item.text} icon={item.icon} text={item.text} />
        ))}
        {/* Duplicate for seamless loop */}
        {items.map((item) => (
          <StatItem key={`repeat-${item.text}`} icon={item.icon} text={item.text} />
        ))}
      </motion.div>
    </div>
  )
}

function StatItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-3 w-3 text-safe" />
      <span>{text}</span>
    </div>
  )
}
