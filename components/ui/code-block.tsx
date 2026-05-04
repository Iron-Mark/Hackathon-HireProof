'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CodeBlockProps {
  title?: string
  language?: string
  code: string
}

export function CodeBlock({ title, language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border-soft bg-[#0d1117] shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
          {title || language || 'Snippet'}
        </div>
        <button
          onClick={handleCopy}
          className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-safe/10 hover:text-safe"
          aria-label="Copy code"
          title="Copy code"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.div
                key="check"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="h-3.5 w-3.5 text-[#3fb950]" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
              >
                <Copy className="h-3.5 w-3.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
      <div className="relative overflow-x-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <pre className="text-[13px] leading-relaxed text-[#c9d1d9] font-mono selection:bg-[#1f6feb]/30">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
