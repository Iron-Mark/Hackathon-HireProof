'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark } from '@/components/brand-mark'
import { useLiveMode } from '@/hooks/useLiveMode'
import { MoreHorizontal, ToggleRight, ToggleLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

const primaryLinks = [
  { href: '/audit', label: 'Audit' },
  { href: '/explore', label: 'Explore' },
  { href: '/docs', label: 'Docs' },
]

const secondaryLinks = [
  { href: '/trends', label: 'Trends' },
  { href: '/history', label: 'History' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/settings', label: 'API Portal' },
]

export function SiteHeader() {
  const { isLiveMode, isLoaded, toggleLiveMode } = useLiveMode()
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const isActive = (href: string) => href === '/docs' ? pathname.startsWith('/docs') : pathname === href

  return (
    <header className="sticky top-0 z-20 border-b border-border-soft bg-background/92 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="hireproof-focus flex min-w-0 items-center gap-3 rounded-sm">
          <BrandMark className="h-9 w-9 shrink-0" />
          <div className="min-w-0 leading-tight">
            <div className="text-lg font-black tracking-normal">HireProof</div>
            <div className="hidden text-xs font-semibold text-muted sm:block">Job-post verification with receipts</div>
          </div>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 rounded-full border border-border-soft bg-surface/75 p-1 text-sm font-semibold shadow-sm md:flex">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`hireproof-focus flex min-h-[44px] items-center rounded-full px-4 transition-colors ${
                  isActive(link.href)
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted hover:bg-background hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
                onClick={() => setIsMoreOpen((open) => !open)}
                className={`hireproof-focus flex min-h-[44px] items-center gap-2 rounded-full px-3 transition-colors ${
                  secondaryLinks.some((link) => isActive(link.href))
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted hover:bg-background hover:text-foreground'
                }`}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                <span>More</span>
              </button>
              {isMoreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-border-soft bg-surface p-2 text-sm font-semibold shadow-lg"
                >
                  {secondaryLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setIsMoreOpen(false)}
                      className={`hireproof-focus flex min-h-[44px] items-center rounded-xl px-3 ${
                        isActive(link.href)
                          ? 'bg-foreground text-background'
                          : 'text-muted hover:bg-background hover:text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
          <div className="flex items-center rounded-full border border-border-soft bg-surface/75 p-1 shadow-sm">
            <div className="relative md:hidden">
              <button
                type="button"
                aria-label="Open navigation menu"
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
                onClick={() => setIsMoreOpen((open) => !open)}
                className="hireproof-focus flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground"
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              </button>
              {isMoreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-border-soft bg-surface p-2 text-sm font-semibold shadow-lg"
                >
                  {[...primaryLinks, ...secondaryLinks].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setIsMoreOpen(false)}
                      className={`hireproof-focus flex min-h-[44px] items-center rounded-xl px-3 ${
                        isActive(link.href)
                          ? 'bg-foreground text-background'
                          : 'text-muted hover:bg-background hover:text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {isLoaded && (
              <button
                type="button"
                onClick={toggleLiveMode}
                className={`hireproof-focus flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
                  isLiveMode 
                    ? 'bg-safe/10 text-safe hover:bg-safe/20' 
                    : 'bg-muted/10 text-muted hover:bg-muted/20'
                }`}
                title={isLiveMode ? "Using live API data" : "Using demo fixture data"}
              >
                {isLiveMode ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                <span className="hidden lg:inline">{isLiveMode ? 'Live' : 'Demo'}</span>
              </button>
            )}
            <ThemeToggle />
            <Link href="/audit?demo=high-risk" className="hireproof-focus ml-1 flex min-h-[44px] items-center rounded-full bg-foreground px-3 text-sm font-black text-background hover:bg-safe sm:px-4">
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Quick demo</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
