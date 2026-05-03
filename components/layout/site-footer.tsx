'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrandMark } from './brand-mark'
import { Code2, Globe, MessageSquare, ShieldCheck } from 'lucide-react'

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const footerLinks = {
  product: [
    { label: 'Audit Engine', href: '/audit', description: 'Verify a suspicious job post' },
    { label: 'Exploration', href: '/explore', description: 'Discover recent audit patterns' },
    { label: 'Self-hosting / Plans', href: '/pricing', description: 'BYOK and hosting options' },
    { label: 'Developer Portal', href: '/developer', description: 'Manage keys for job checks' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs', description: 'Guides for using HireProof' },
    { label: 'API Reference', href: '/docs/api-reference', description: 'Detailed endpoint specifications' },
    { label: 'Automations', href: '/docs/automations', description: 'n8n, Make, LangChain, and webhooks' },
    { label: 'SDK Quickstart', href: '/docs/sdk-quickstart', description: 'Get running in minutes' },
    { label: 'Agent Skills', href: '/docs/skills', description: 'Extend agent capabilities' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/docs/legal#terms-of-service', description: 'Our usage agreement' },
    { label: 'Privacy Policy', href: '/docs/legal#privacy-policy', description: 'How we handle data' },
    { label: 'Disclaimer', href: '/docs/legal', description: 'AI accuracy and limitations' },
    { label: 'Security Whitepaper', href: '/docs/security', description: 'Data and API safeguards' },
    { label: 'Rate Limiting', href: '/docs/rate-limiting', description: 'Fair use policies' },
  ]
}

const socialLinkClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safe/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95'

function Tooltip({ children, content, delay = 0.3 }: { children: React.ReactNode; content: string; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay * 1000)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  const showImmediately = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(true)
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={showImmediately}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute bottom-full left-1/2 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-xl border border-border-soft bg-surface/95 backdrop-blur-md px-4 py-2 text-[10px] font-black text-foreground shadow-2xl pointer-events-none z-50 text-center uppercase tracking-widest ring-1 ring-white/10"
          >
            {content}
            <div className="absolute top-full left-1/2 -mt-1 -translate-x-1/2 border-4 border-transparent border-t-border-soft" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


export function SiteFooter() {
  const [health, setHealth] = useState<{ status: string; storage: string; liveSearch: boolean; model: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/health').then((res) => res.json()).then(setHealth).catch(() => setHealth(null))
  }, [])

  return (
    <footer className="border-t border-border-soft bg-background pt-16 pb-12 print:hidden">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32">
        <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
          
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="group flex items-center gap-2 mb-6 transition-transform hover:scale-105 active:scale-95 origin-left">
              <BrandMark className="h-8 w-8 transition-transform group-hover:rotate-12" />
              <span className="text-xl font-black">HireProof</span>
            </Link>
            <p className="text-sm font-medium text-muted leading-relaxed mb-6">
              Verify suspicious job posts and recruiter messages with live evidence before you apply.
            </p>
            <div className="flex gap-4">
              <Tooltip content="View source and implementation proof">
                <a href="https://github.com/Iron-Mark/hackathon-v0-zero_to_agent" target="_blank" rel="noreferrer" aria-label="HireProof GitHub repository" className={socialLinkClass}>
                  <Code2 className="h-5 w-5" />
                </a>
              </Tooltip>
              <Tooltip content="Connect with the builder">
                <a href="https://www.linkedin.com/in/mark-siazon/" target="_blank" rel="noreferrer" aria-label="Mark Siazon LinkedIn" className={socialLinkClass}>
                  <LinkedinIcon className="h-5 w-5" />
                </a>
              </Tooltip>
              <Tooltip content="View builder portfolio">
                <a href="https://www.marksiazon.dev/" target="_blank" rel="noreferrer" aria-label="Mark Siazon Portfolio" className={socialLinkClass}>
                  <Globe className="h-5 w-5" />
                </a>
              </Tooltip>
              <Tooltip content="View Zero to Agent showcase">
                <a href="https://community.vercel.com/hackathons/zero-to-agent/showcase" target="_blank" rel="noreferrer" aria-label="HireProof Zero to Agent showcase submission" className={socialLinkClass}>
                  <ShieldCheck className="h-5 w-5" />
                </a>
              </Tooltip>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-6">Product</h3>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Tooltip content={link.description}>
                    <Link href={link.href} className="text-sm font-semibold text-muted hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-6">Resources</h3>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Tooltip content={link.description}>
                    <Link href={link.href} className="text-sm font-semibold text-muted hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-6">Legal</h3>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Tooltip content={link.description}>
                    <Link href={link.href} className="text-sm font-semibold text-muted hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border-soft flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Tooltip content="Live connection to the HireProof verification engine">
              <div className="flex items-center gap-2 rounded-full border border-safe/20 bg-safe/5 px-3 py-1 text-[10px] font-black text-safe uppercase tracking-widest cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-safe"></span>
                </span>
                {health?.status === 'ok' ? 'Core API Reachable' : 'Status Unknown'}
              </div>
            </Tooltip>
            <Tooltip content={health ? `Infrastructure: ${health.storage} | Search Capabilities: ${health.liveSearch ? 'Enabled' : 'Disabled'}` : 'Checking system configuration...'}>
              <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest cursor-default">
                <Globe className="h-3 w-3" />
                {health ? `${health.storage} · ${health.liveSearch && health.model ? 'live ready' : 'demo/local ready'}` : 'Checking'}
              </div>
            </Tooltip>
          </div>
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">
            © 2026 HireProof. Developed by M.Siazon. Built for Vercel Zero to Agent · <a href="https://community.vercel.com/hackathons/zero-to-agent/showcase" target="_blank" rel="noreferrer" className="text-foreground hover:text-safe underline underline-offset-4">Submitted showcase</a>.
          </p>
        </div>
      </div>
    </footer>
  )
}
