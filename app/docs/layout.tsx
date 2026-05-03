'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { BookOpen, Code2, Package, ChevronRight, FileText, Menu, X } from 'lucide-react'
import { showToast } from '@/components/system/toast'
import { motion, AnimatePresence } from 'framer-motion'

const docsSidebar = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Overview', href: '/docs' },
      { label: 'Quickstart', href: '/docs/quickstart' },
      { label: 'Self-Hosting', href: '/docs/self-hosting' },
      { label: 'Verified Badge', href: '/docs/verified-badge' },
      { label: 'AI Scam Patterns', href: '/docs/dead-internet' },
      { label: 'Architecture', href: '/docs/architecture' },
      { label: 'Triple-Track Coverage', href: '/docs/triple-track-coverage' },
      { label: 'Competitive Roadmap', href: '/docs/competitive-roadmap' },
    ],
  },
  {
    title: 'Core Features',
    items: [
      { label: 'AI Investigation Engine', href: '/docs/investigation-engine' },
      { label: 'Omni-Modal Input', href: '/docs/omni-modal' },
      { label: 'Risk Scoring', href: '/docs/risk-scoring' },
      { label: 'Real-Time Streaming', href: '/docs/streaming' },
    ],
  },
  {
    title: 'Agent Platform',
    items: [
      { label: 'MCP Server', href: '/docs/mcp' },
      { label: 'Headless API', href: '/docs/headless-api' },
      { label: 'Webhooks', href: '/docs/webhooks' },
      { label: 'Chrome Extension', href: '/docs/chrome-extension' },
    ],
  },
  {
    title: 'SDK',
    items: [
      { label: 'Overview', href: '/docs/sdk' },
      { label: 'Quickstart', href: '/docs/sdk-quickstart' },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Security Whitepaper', href: '/docs/security' },
      { label: 'Authentication', href: '/docs/authentication' },
      { label: 'Rate Limiting', href: '/docs/rate-limiting' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { label: 'n8n & Automations', href: '/docs/automations' },
      { label: 'Email Forwarding', href: '/docs/email-forwarding' },
      { label: 'LangChain & Agents', href: '/docs/langchain' },
      { label: 'ChatSDK Agents', href: '/docs/chat-sdk-agents' },
      { label: 'Discord / Slack Bots', href: '/docs/discord-bot' },
      { label: 'Cursor / IDE Skills', href: '/docs/ide-skills' },
    ],
  },
  {
    title: 'Open Skills',
    items: [
      { label: 'Agent Skills', href: '/docs/skills' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Disclaimer & Disputes', href: '/docs/legal' },
    ],
  },
]

const apiSidebar = [
  {
    title: 'Endpoints',
    items: [
      { label: 'Overview', href: '/docs/api-reference' },
      { label: 'POST /api/audit', href: '/docs/api-reference#audit-sse' },
      { label: 'POST /api/v1/audit', href: '/docs/api-reference#audit-headless' },
      { label: 'POST /api/mcp', href: '/docs/api-reference#mcp-call' },
      { label: 'GET /api/mcp', href: '/docs/api-reference#mcp-list' },
    ],
  },
  {
    title: 'Schemas',
    items: [
      { label: 'AuditRequest', href: '/docs/api-reference#schema-request' },
      { label: 'AuditReport', href: '/docs/api-reference#schema-report' },
      { label: 'Error Responses', href: '/docs/api-reference#errors' },
    ],
  },
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const isApiRef = pathname === '/docs/api-reference'
  const isSdk = pathname.startsWith('/docs/sdk')
  const sidebar = isApiRef ? apiSidebar : docsSidebar
  const activeTab = isApiRef ? 'api' : isSdk ? 'sdk' : 'docs'

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [pathname])

  const renderSidebarContent = () => (
    <nav className="p-4 space-y-6">
      {sidebar.map((section) => (
        <div key={section.title}>
          <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-muted">{section.title}</h3>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-safe/10 text-safe font-black shadow-sm'
                      : 'text-muted font-semibold hover:bg-surface hover:text-foreground hover:shadow-sm'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    pathname === item.href ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'
                  }`} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* Sub-header Navigation */}
      <div className="sticky top-[72px] z-20 border-b border-border-soft bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 md:px-12 lg:px-20 xl:px-32">
          <div className="flex items-center gap-0">
            <Link
              href="/docs"
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
                activeTab === 'docs' ? 'border-safe text-foreground' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Docs
            </Link>
            <Link
              href="/docs/api-reference"
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
                activeTab === 'api' ? 'border-safe text-foreground' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <Code2 className="h-4 w-4" />
              API Reference
            </Link>
            <Link
              href="/docs/sdk"
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition-colors ${
                activeTab === 'sdk' ? 'border-safe text-foreground' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <Package className="h-4 w-4" />
              SDK
            </Link>
          </div>
          
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground lg:hidden"
            aria-label="Open documentation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px]">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border-soft lg:block xl:w-72">
          <div className="sticky top-[136px] max-h-[calc(100vh-136px)] overflow-y-auto">
            {renderSidebarContent()}
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border-soft bg-background lg:hidden"
              >
                <div className="flex items-center justify-between border-b border-border-soft p-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-safe" />
                    <span className="text-sm font-black uppercase tracking-widest">Documentation</span>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[calc(100vh-65px)] overflow-y-auto">
                  {renderSidebarContent()}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-6 md:px-12 lg:px-20 xl:px-32 py-10">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Copy Docs Button for DX */}
      <button
        onClick={async () => {
          const mainContent = document.querySelector('main')?.innerText
          if (mainContent) {
            try {
              await navigator.clipboard.writeText(mainContent)
              showToast('Page content copied to clipboard!', 'success')
            } catch (err) {
              showToast('Failed to copy content.', 'info')
            }
          }
        }}
        className="hireproof-focus group fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-border bg-foreground px-5 py-3 text-sm font-black text-background shadow-2xl transition-all hover:-translate-y-1 hover:bg-safe hover:shadow-safe/20"
        title="Copy page text for AI Prompting"
        aria-label="Copy page text for AI Prompting"
      >
        <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
        <span className="hidden sm:inline">Copy for AI</span>
      </button>
    </div>
  )
}
