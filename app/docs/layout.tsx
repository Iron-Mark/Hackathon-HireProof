'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { BookOpen, Code2, Package, ChevronRight } from 'lucide-react'

const docsSidebar = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Overview', href: '/docs' },
      { label: 'Quickstart', href: '/docs/quickstart' },
      { label: 'Architecture', href: '/docs/architecture' },
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
      { label: 'Authentication', href: '/docs/authentication' },
      { label: 'Rate Limiting', href: '/docs/rate-limiting' },
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
  const isApiRef = pathname === '/docs/api-reference'
  const isSdk = pathname.startsWith('/docs/sdk')
  const sidebar = isApiRef ? apiSidebar : docsSidebar
  const activeTab = isApiRef ? 'api' : isSdk ? 'sdk' : 'docs'

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="border-b border-border-soft">
        <div className="mx-auto flex max-w-7xl items-center gap-0 px-4">
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
      </div>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border-soft lg:block">
          <nav className="sticky top-[120px] max-h-[calc(100vh-120px)] overflow-y-auto p-4 space-y-6">
            {sidebar.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-muted">{section.title}</h3>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                          pathname === item.href
                            ? 'bg-safe/10 text-safe font-black'
                            : 'text-muted hover:bg-surface hover:text-foreground'
                        }`}
                      >
                        {pathname === item.href && <ChevronRight className="h-3 w-3" />}
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-6 py-10 lg:px-12">
          <div className="mx-auto max-w-3xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
