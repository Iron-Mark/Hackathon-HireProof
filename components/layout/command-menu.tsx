'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Home, ShieldCheck, History, BookOpen, DollarSign, Terminal, Compass, TrendingUp, Code2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const ACTIONS = [
  { id: 'audit', title: 'New Audit', icon: ShieldCheck, href: '/audit', shortcut: 'A' },
  { id: 'history', title: 'Investigation History', icon: History, href: '/history', shortcut: 'H' },
  { id: 'docs', title: 'Documentation', icon: BookOpen, href: '/docs', shortcut: 'D' },
  { id: 'explore', title: 'Explore Reports', icon: Compass, href: '/explore', shortcut: 'E' },
  { id: 'trends', title: 'Pattern Trends', icon: TrendingUp, href: '/trends', shortcut: 'T' },
  { id: 'developer', title: 'Developer Portal', icon: Code2, href: '/developer', shortcut: 'K' },
  { id: 'plans', title: 'Self-hosting / Plans', icon: DollarSign, href: '/pricing', shortcut: 'P' },
  { id: 'home', title: 'Go to Landing Page', icon: Home, href: '/', shortcut: 'L' },
]

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const filteredActions = ACTIONS.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase())
  )

  const onSelect = (href: string) => {
    router.push(href)
    setOpen(false)
    setQuery('')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-[20%] z-[70] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          >
            <div className="flex items-center border-b border-border-soft px-4">
              <Search className="h-5 w-5 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="h-14 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted"
              />
              <div className="flex items-center gap-1 rounded bg-muted/20 px-1.5 py-0.5 text-[10px] font-bold text-muted">
                ESC
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted">
                Navigation
              </div>
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onSelect(action.href)}
                  className="group flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors hover:bg-safe/10 hover:text-safe"
                >
                  <div className="flex items-center gap-3">
                    <action.icon className="h-4 w-4" />
                    <span className="font-semibold">{action.title}</span>
                  </div>
                  <div className="flex items-center gap-1 rounded bg-muted/10 px-1.5 py-0.5 text-[10px] font-bold text-muted group-hover:bg-safe/20 group-hover:text-safe">
                    {action.shortcut}
                  </div>
                </button>
              ))}
              {filteredActions.length === 0 && (
                <div className="py-8 text-center text-sm text-muted">
                  No results found for "{query}"
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border-soft bg-background/50 px-4 py-3 text-[10px] font-bold text-muted">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><Terminal className="h-3 w-3" /> Select</span>
                <span className="flex items-center gap-1">↑↓ Navigate</span>
              </div>
              <div>HireProof Command Palette</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
