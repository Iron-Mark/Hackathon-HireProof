'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BrandMark } from '@/components/brand/brand-mark'
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
  SearchCheck,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Cpu,
  type LucideIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/system/theme-toggle'

type NavLink = {
  href: string
  label: string
  description?: string
  icon: LucideIcon
}

const primaryLinks: NavLink[] = [
  { href: '/audit', label: 'Audit', icon: SearchCheck },
  { href: '/history', label: 'History', icon: History },
  { href: '/docs', label: 'Docs', icon: BookOpen },
]

const resourceGroups: { label: string; links: NavLink[] }[] = [
  {
    label: 'Evidence',
    links: [
      { href: '/explore', label: 'Explore', description: 'Recent audit reports', icon: Compass },
      { href: '/trends', label: 'Trends', description: 'Saved-report patterns', icon: ChartNoAxesColumnIncreasing },
      { href: '/proof', label: 'Proof', description: 'Submission-ready proof pack', icon: ShieldCheck },
    ],
  },
  {
    label: 'For builders',
    links: [
      { href: '/developer', label: 'Developer Portal', description: 'API keys and webhooks', icon: Code2 },
      { href: '/docs/api-reference', label: 'API Docs', description: 'Headless audit API', icon: KeyRound },
      { href: '/docs/automations', label: 'Automations', description: 'n8n, Make, LangChain', icon: Network },
      { href: '/docs/sdk', label: 'SDK', description: 'Typed integration client', icon: BookOpen },
    ],
  },
  {
    label: 'Advanced',
    links: [
      { href: '/lab', label: 'Agent Lab', description: 'Agent reasoning demo', icon: Cpu },
      { href: '/pricing', label: 'Self-hosting / Plans', description: 'BYOK and hosting options', icon: CreditCard },
    ],
  },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleQuickDemoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/audit');
  };

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
            : 'text-muted hover:bg-background hover:text-foreground'
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
              <div className="text-lg font-black tracking-normal">HireProof</div>

            </div>
          </div>
        </Link>
        <div ref={menuRef} className="flex min-w-0 items-center gap-2">
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 rounded-full border border-border-soft bg-surface/75 p-1 text-sm font-semibold shadow-sm md:flex">
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
                      : 'text-muted hover:bg-background hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
                className={`hireproof-focus flex min-h-[38px] items-center gap-2 rounded-full px-3 transition-colors ${
                  hasActiveResource
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted hover:bg-background hover:text-foreground'
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
                      <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-normal text-muted">
                        {group.label}
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
            <div className="relative md:hidden">
              <button
                type="button"
                aria-label="Open site navigation"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="hireproof-focus flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground"
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
                      <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-normal text-muted">
                        {group.label}
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
            <button onClick={handleQuickDemoClick} className="hireproof-focus ml-1 flex min-h-[38px] items-center rounded-full bg-foreground px-3 text-sm font-black text-background hover:bg-safe sm:px-4">
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Quick demo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
