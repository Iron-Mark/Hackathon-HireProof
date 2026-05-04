'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark, BrandWordmark } from '@/components/brand/brand-mark'
import {
  Activity,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Code2,
  Compass,
  CreditCard,
  History,
  KeyRound,
  Menu,
  Network,
  Search,
  SearchCheck,
  ShieldCheck,
  Cpu,
  type LucideIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/system/theme-toggle'
import { openHireProofCommandMenu } from '@/components/layout/command-menu'

type NavLink = {
  href: string
  label: string
  description?: string
  icon: LucideIcon
}

type ResourceGroup = {
  label: string
  accent: string
  links: NavLink[]
}

const primaryLinks: NavLink[] = [
  { href: '/history', label: 'History', icon: History },
  { href: '/docs', label: 'Docs', icon: BookOpen },
]

const resourceGroups: ResourceGroup[] = [
  {
    label: 'Evidence',
    accent: 'bg-safe',
    links: [
      { href: '/explore', label: 'Explore', description: 'Recent audit reports', icon: Compass },
      { href: '/trends', label: 'Trends', description: 'Saved-report patterns', icon: ChartNoAxesColumnIncreasing },
      { href: '/proof', label: 'Proof', description: 'Submission-ready proof pack', icon: ShieldCheck },
    ],
  },
  {
    label: 'For builders',
    accent: 'bg-evidence',
    links: [
      { href: '/developer', label: 'Developer Portal', description: 'API keys and webhooks', icon: Code2 },
      { href: '/docs/api-reference', label: 'API Docs', description: 'Headless audit API', icon: KeyRound },
      { href: '/docs/automations', label: 'Automations', description: 'n8n, Make, LangChain', icon: Network },
      { href: '/docs/sdk', label: 'SDK', description: 'Typed integration client', icon: BookOpen },
    ],
  },
  {
    label: 'Advanced',
    accent: 'bg-caution',
    links: [
      { href: '/lab', label: 'Agent Lab', description: 'Agent reasoning demo', icon: Cpu },
      { href: '/pricing', label: 'Self-hosting / Plans', description: 'BYOK and hosting options', icon: CreditCard },
    ],
  },
]

export function SiteHeader() {
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isActive = (href: string) => href === '/docs' ? pathname.startsWith('/docs') : pathname === href
  const resourceLinks = resourceGroups.flatMap((group) => group.links)
  const hasActiveResource = resourceLinks.some((link) => isActive(link.href))

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMenuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const renderMenuLink = (link: NavLink) => {
    const Icon = link.icon

    return (
      <Link
        key={link.href}
        href={link.href}
        role="menuitem"
        className={`hireproof-focus flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
          isActive(link.href)
            ? 'bg-foreground text-background'
            : 'text-muted hover:bg-safe/10 hover:text-foreground'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block font-black leading-tight">{link.label}</span>
          {link.description && (
            <span className="block text-xs font-semibold leading-tight opacity-75">{link.description}</span>
          )}
        </span>
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-soft bg-background/92 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-6 md:px-12 lg:px-20 xl:px-32 py-2">
        <Link href="/" className="hireproof-focus flex min-w-0 items-center gap-3 rounded-sm group">
          <BrandMark className="h-9 w-9 shrink-0 transition-transform group-hover:scale-110 glitch-hover" />
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <BrandWordmark className="text-lg" />

            </div>
          </div>
        </Link>
        <div ref={menuRef} className="flex min-w-0 items-center gap-2">
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 rounded-full border border-border-soft bg-surface/75 p-1 text-sm font-semibold shadow-sm lg:flex">
            {primaryLinks.map((link) => {
              const Icon = link.icon

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`hireproof-focus flex min-h-[38px] items-center gap-2 rounded-full px-4 transition-colors ${
                    isActive(link.href)
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted hover:bg-safe/10 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            <button
              type="button"
              onClick={openHireProofCommandMenu}
              className="hireproof-focus flex min-h-[38px] items-center gap-2 rounded-full px-3 text-muted transition-colors hover:bg-safe/10 hover:text-foreground"
              aria-label="Search site. Opens command palette."
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Search</span>
              <kbd className="rounded-md border border-border-soft bg-background px-1.5 py-0.5 text-[10px] font-black text-muted">Ctrl K</kbd>
            </button>
            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
                className={`hireproof-focus flex min-h-[38px] items-center gap-2 rounded-full px-3 transition-colors ${
                  hasActiveResource
                    ? 'bg-safe/10 text-foreground shadow-sm'
                    : 'text-muted hover:bg-safe/10 hover:text-foreground'
                }`}
              >
                <Activity className="h-4 w-4" aria-hidden="true" />
                <span>Resources</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {isMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-[60] mt-2 w-72 rounded-2xl border border-border-soft bg-surface p-3 text-sm font-semibold shadow-lg"
                >
                  {resourceGroups.map((group) => (
                    <div key={group.label} className="mb-3 last:mb-0">
                      <div className="px-2 pb-1">
                        <span className="inline-flex items-center gap-2 rounded-full border border-safe/25 bg-safe/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${group.accent}`} aria-hidden="true" />
                          {group.label}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {group.links.map((link) => renderMenuLink(link))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </nav>
          <div className="flex items-center rounded-full border border-border-soft bg-surface/75 p-1 shadow-sm">
            <div className="relative lg:hidden">
              <button
                type="button"
                aria-label="Open site navigation"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="hireproof-focus flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-safe/10 hover:text-foreground"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              {isMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-[60] mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-border-soft bg-surface p-3 text-sm font-semibold shadow-lg"
                >
                  <div className="mb-3">
                    <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-normal text-muted">
                      Start here
                    </div>
                    <div className="space-y-1">
                      {primaryLinks.map((link) => renderMenuLink(link))}
                    </div>
                  </div>
                  {resourceGroups.map((group) => (
                    <div key={group.label} className="mb-3 last:mb-0">
                      <div className="px-2 pb-1">
                        <span className="inline-flex items-center gap-2 rounded-full border border-safe/25 bg-safe/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${group.accent}`} aria-hidden="true" />
                          {group.label}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {group.links.map((link) => renderMenuLink(link))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ThemeToggle />
            <button
              type="button"
              onClick={openHireProofCommandMenu}
              className="hireproof-focus flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-safe/10 hover:text-foreground lg:hidden"
              aria-label="Search site"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            <Link href="/audit" className={`hireproof-focus ml-1 flex min-h-[38px] items-center gap-2 rounded-full px-3 text-sm font-black transition-colors sm:px-4 ${
              isActive('/audit')
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted hover:bg-safe/10 hover:text-foreground'
            }`}>
              <SearchCheck className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Audit</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
