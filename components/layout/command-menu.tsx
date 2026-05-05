'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Home,
  ShieldCheck,
  History,
  BookOpen,
  DollarSign,
  Terminal,
  Compass,
  TrendingUp,
  Code2,
  FlaskConical,
  Settings,
  FileText,
  Webhook,
  Network,
  KeyRound,
  Puzzle,
  LockKeyhole,
  MessageSquare,
  Bot,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const COMMAND_MENU_EVENT = 'hireproof:open-command-menu'

type SearchItem = {
  id: string
  title: string
  description: string
  href: string
  category: 'Audit' | 'Docs' | 'Builder' | 'Proof' | 'Product' | 'Settings'
  icon: LucideIcon
  keywords: string[]
  priority?: number
}

export function openHireProofCommandMenu() {
  window.dispatchEvent(new Event(COMMAND_MENU_EVENT))
}

const SEARCH_INDEX: SearchItem[] = [
  { id: 'home', title: 'Home', description: 'Landing page and product overview for HireProof.', href: '/', category: 'Product', icon: Home, keywords: ['landing', 'overview', 'job scam', 'verify'], priority: 3 },
  { id: 'audit', title: 'New Audit', description: 'Paste a job post, recruiter message, URL, or screenshot for verification.', href: '/audit', category: 'Audit', icon: ShieldCheck, keywords: ['investigation', 'scan', 'job scam', 'verify', 'high risk'], priority: 10 },
  { id: 'explore', title: 'Explore Reports', description: 'Search public audit reports and recruitment scam examples.', href: '/explore', category: 'Audit', icon: Compass, keywords: ['database', 'reports', 'public', 'evidence'], priority: 7 },
  { id: 'trends', title: 'Pattern Trends', description: 'Review saved-report patterns, verdicts, and recurring scam signals.', href: '/trends', category: 'Audit', icon: TrendingUp, keywords: ['patterns', 'analytics', 'signals', 'intelligence'], priority: 6 },
  { id: 'history', title: 'Investigation History', description: 'Open locally saved investigations and report archive.', href: '/history', category: 'Audit', icon: History, keywords: ['archive', 'saved reports', 'past audits'], priority: 6 },
  { id: 'proof', title: 'Proof Pack', description: 'Submission-ready proof, platform status, and honest boundaries.', href: '/proof', category: 'Proof', icon: ShieldCheck, keywords: ['submission', 'demo', 'evidence', 'workflow', 'slack'], priority: 7 },
  { id: 'developer', title: 'Developer Portal', description: 'Manage API keys, webhooks, usage, and provider credentials.', href: '/developer', category: 'Builder', icon: Code2, keywords: ['api keys', 'byok', 'webhooks', 'credentials'], priority: 7 },
  { id: 'pricing', title: 'Self-hosting / Plans', description: 'Plans for individuals, teams, job boards, schools, and communities.', href: '/pricing', category: 'Product', icon: DollarSign, keywords: ['pricing', 'plans', 'self hosting', 'enterprise'], priority: 5 },
  { id: 'lab', title: 'Agent Lab', description: 'Inspect the live audit stream and agent reasoning demo.', href: '/lab', category: 'Builder', icon: FlaskConical, keywords: ['lab', 'agent', 'stream', 'telemetry'], priority: 4 },
  { id: 'settings', title: 'Settings', description: 'Local preferences, history controls, and app settings.', href: '/settings', category: 'Settings', icon: Settings, keywords: ['preferences', 'local', 'controls'], priority: 2 },
  { id: 'docs', title: 'Documentation', description: 'Main documentation index and getting-started resources.', href: '/docs', category: 'Docs', icon: BookOpen, keywords: ['docs', 'guide', 'start'], priority: 9 },
  { id: 'docs-use-cases', title: 'Use Cases', description: 'Real-world workflows for applicants, AI apply agents, automations, and communities.', href: '/docs/use-cases', category: 'Docs', icon: Bot, keywords: ['ai hiring automation', 'apply agent', 'workflow', 'integration'], priority: 9 },
  { id: 'docs-how-it-works', title: 'How It Works', description: 'Current audit behavior, live evidence flow, demo boundaries, and trust controls.', href: '/docs/how-it-works', category: 'Docs', icon: ShieldCheck, keywords: ['evidence', 'demo fixture', 'scoring', 'serpapi'], priority: 8 },
  { id: 'docs-quickstart', title: 'Quickstart', description: 'Run HireProof locally and try the demo API key.', href: '/docs/quickstart', category: 'Docs', icon: Terminal, keywords: ['install', 'local', 'setup', 'demo key'], priority: 7 },
  { id: 'docs-self-hosting', title: 'Self-Hosting Guide', description: 'Host HireProof on your own infrastructure with BYOK support.', href: '/docs/self-hosting', category: 'Docs', icon: LockKeyhole, keywords: ['docker', 'byok', 'hosting', 'infrastructure'], priority: 6 },
  { id: 'docs-verified-badge', title: 'Verified Business Badge', description: 'Embed a HireProof verified badge on an owned careers domain.', href: '/docs/verified-badge', category: 'Docs', icon: ShieldCheck, keywords: ['badge', 'dns', 'career page', 'verified'], priority: 5 },
  { id: 'docs-dead-internet', title: 'AI-Generated Recruitment Scams', description: 'Patterns for AI-generated job scams and suspicious recruiter messages.', href: '/docs/dead-internet', category: 'Docs', icon: Bot, keywords: ['ai scam', 'fake jobs', 'recruitment fraud'], priority: 6 },
  { id: 'docs-architecture', title: 'Architecture', description: 'System architecture across web app, API, MCP, and extension package workflow.', href: '/docs/architecture', category: 'Docs', icon: Network, keywords: ['architecture', 'system', 'mcp', 'api'], priority: 7 },
  { id: 'docs-triple-track', title: 'Triple-Track Coverage', description: 'How HireProof maps across v0 + MCPs, ChatSDK Agents, and Vercel Workflow.', href: '/docs/triple-track-coverage', category: 'Docs', icon: Network, keywords: ['chat sdk', 'workflow', 'wdk', 'mcp'], priority: 7 },
  { id: 'docs-roadmap', title: 'Competitive Roadmap', description: 'Judge-safe positioning, proof boundaries, and next milestones.', href: '/docs/competitive-roadmap', category: 'Docs', icon: TrendingUp, keywords: ['roadmap', 'positioning', 'competition'], priority: 4 },
  { id: 'docs-investigation', title: 'AI Investigation Engine', description: 'Claim extraction, OCR, URL enrichment, evidence tools, and transparent scoring.', href: '/docs/investigation-engine', category: 'Docs', icon: Search, keywords: ['ocr', 'claim extraction', 'evidence tools', 'scoring'], priority: 8 },
  { id: 'docs-omni-modal', title: 'Omni-Modal Input', description: 'Submit job posts through text, URLs, screenshots, pasted images, and voice.', href: '/docs/omni-modal', category: 'Docs', icon: FileText, keywords: ['screenshot', 'ocr', 'voice', 'url'], priority: 6 },
  { id: 'docs-risk-scoring', title: 'Risk Scoring', description: 'Transparent evidence-weighted safety policy and score explanations.', href: '/docs/risk-scoring', category: 'Docs', icon: TrendingUp, keywords: ['score', 'risk', 'policy', 'red flags'], priority: 7 },
  { id: 'docs-streaming', title: 'Real-Time Streaming', description: 'Server-Sent Events for live audit progress in the browser.', href: '/docs/streaming', category: 'Docs', icon: FlaskConical, keywords: ['sse', 'stream', 'timeline', 'progress'], priority: 5 },
  { id: 'docs-mcp', title: 'MCP Server', description: 'Expose company, news, jobs, and local footprint tools to AI agents.', href: '/docs/mcp', category: 'Docs', icon: Network, keywords: ['mcp', 'tools', 'search_company', 'agents'], priority: 8 },
  { id: 'docs-api-reference', title: 'API Reference', description: 'Endpoints, schemas, headless audit API, SSE, and MCP calls.', href: '/docs/api-reference', category: 'Docs', icon: KeyRound, keywords: ['api', 'schema', 'auditrequest', 'auditreport', 'headless'], priority: 9 },
  { id: 'docs-api-audit-sse', title: 'POST /api/audit SSE stream', description: 'Browser audit endpoint with Server-Sent Events and live investigation progress.', href: '/docs/api-reference#audit-sse', category: 'Docs', icon: Search, keywords: ['api audit', 'sse', 'streaming', 'server sent events', 'browser audit'], priority: 10 },
  { id: 'docs-api-headless-webhook-url', title: 'webhook_url async audit', description: 'Headless audit endpoint that accepts webhook_url and returns 202 for async delivery.', href: '/docs/api-reference#audit-headless', category: 'Docs', icon: Webhook, keywords: ['webhook_url', 'webhook url', 'async', 'callback', '202 accepted', 'headless audit', '/api/v1/audit'], priority: 12 },
  { id: 'docs-api-mcp-call', title: 'POST /api/mcp tools/call', description: 'Execute MCP investigation tools like search_company, news_check, jobs_compare, and local_presence.', href: '/docs/api-reference#mcp-call', category: 'Docs', icon: Network, keywords: ['mcp call', 'tools call', 'search_company', 'news_check', 'jobs_compare', 'local_presence'], priority: 11 },
  { id: 'docs-api-mcp-list', title: 'GET /api/mcp tools/list', description: 'List available MCP tools and schemas for agent integrations.', href: '/docs/api-reference#mcp-list', category: 'Docs', icon: Network, keywords: ['mcp list', 'tools list', 'tool schema', 'available tools'], priority: 10 },
  { id: 'docs-api-schema-request', title: 'AuditRequest schema', description: 'Request fields for text, url, image, mode, location, and webhook_url.', href: '/docs/api-reference#schema-request', category: 'Docs', icon: FileText, keywords: ['auditrequest', 'request schema', 'webhook_url', 'image', 'mode', 'location', 'url'], priority: 11 },
  { id: 'docs-api-schema-report', title: 'AuditReport schema', description: 'Report fields for verdict, riskScore, evidence, claims, alternatives, and next steps.', href: '/docs/api-reference#schema-report', category: 'Docs', icon: FileText, keywords: ['auditreport', 'report schema', 'verdict', 'riskScore', 'evidence', 'claims'], priority: 10 },
  { id: 'docs-api-errors', title: 'API error responses', description: 'Status codes for invalid requests, missing API keys, rate limits, and server failures.', href: '/docs/api-reference#errors', category: 'Docs', icon: LockKeyhole, keywords: ['errors', '400', '401', '429', '500', 'rate limit'], priority: 8 },
  { id: 'docs-headless-api', title: 'Headless Agent API', description: 'Synchronous and async audit behavior for external agents and products.', href: '/docs/headless-api', category: 'Docs', icon: Code2, keywords: ['api', 'headless', 'webhook_url', 'agents'], priority: 8 },
  { id: 'docs-webhooks', title: 'Webhooks', description: 'Async investigations with signed callback delivery.', href: '/docs/webhooks', category: 'Docs', icon: Webhook, keywords: ['webhook', 'callback', 'async', 'signature'], priority: 7 },
  { id: 'docs-chrome-extension', title: 'Chrome Extension', description: 'Local extension ZIP, install flow, listing notes, and pending store review.', href: '/docs/chrome-extension', category: 'Docs', icon: Puzzle, keywords: ['extension', 'browser', 'chrome', 'zip'], priority: 7 },
  { id: 'docs-sdk', title: 'SDK Overview', description: 'Official TypeScript SDK for HireProof integrations.', href: '/docs/sdk', category: 'Docs', icon: BookOpen, keywords: ['sdk', 'typescript', 'client'], priority: 8 },
  { id: 'docs-sdk-quickstart', title: 'SDK Quickstart', description: 'Build the first SDK-based agent integration in minutes.', href: '/docs/sdk-quickstart', category: 'Docs', icon: Code2, keywords: ['sdk', 'quickstart', 'typescript'], priority: 7 },
  { id: 'docs-cli', title: 'CLI', description: 'Run HireProof audits from terminal, CI, scripts, or the branded TUI.', href: '/docs/cli', category: 'Docs', icon: Terminal, keywords: ['cli', 'terminal', 'tui', 'npm'], priority: 8 },
  { id: 'docs-automations', title: 'n8n & Automations', description: 'n8n, Make, LangChain, CLI, SDK, webhooks, and workflow templates.', href: '/docs/automations', category: 'Docs', icon: Network, keywords: ['automation', 'n8n', 'make', 'langchain', 'workflow'], priority: 9 },
  { id: 'docs-email-forwarding', title: 'Email Forwarding', description: 'Verify forwarded recruiter emails through inbound parse webhooks.', href: '/docs/email-forwarding', category: 'Docs', icon: MessageSquare, keywords: ['email', 'forwarding', 'recruiter'], priority: 5 },
  { id: 'docs-langchain', title: 'LangChain & Agents', description: 'Integrate HireProof as a custom tool inside LangChain or AI SDK agents.', href: '/docs/langchain', category: 'Docs', icon: Bot, keywords: ['langchain', 'agents', 'tool', 'sdk'], priority: 7 },
  { id: 'docs-chat-sdk', title: 'ChatSDK Agents', description: 'Shared bot wrapper for Slack, Discord, Telegram, and WhatsApp/Zernio paths.', href: '/docs/chat-sdk-agents', category: 'Docs', icon: MessageSquare, keywords: ['chat sdk', 'slack', 'discord', 'telegram', 'whatsapp'], priority: 7 },
  { id: 'docs-slack-bot', title: 'Slack Bot', description: 'Slack webhook workflow and live-tested ChatSDK proof notes.', href: '/docs/slack-bot', category: 'Docs', icon: MessageSquare, keywords: ['slack', 'chat', 'bot'], priority: 6 },
  { id: 'docs-discord-bot', title: 'Discord Bot', description: 'Discord slash command and credential-ready webhook workflow.', href: '/docs/discord-bot', category: 'Docs', icon: MessageSquare, keywords: ['discord', 'chat', 'bot'], priority: 6 },
  { id: 'docs-telegram-bot', title: 'Telegram Bot', description: 'Telegram ChatSDK webhook workflow and live delivery proof notes.', href: '/docs/telegram-bot', category: 'Docs', icon: MessageSquare, keywords: ['telegram', 'chat', 'bot'], priority: 6 },
  { id: 'docs-ide-skills', title: 'Cursor / IDE Skills', description: 'Add the HireProof agent skill to local AI development environments.', href: '/docs/ide-skills', category: 'Docs', icon: Bot, keywords: ['cursor', 'ide', 'skill', 'codex', 'claude'], priority: 6 },
  { id: 'docs-skills', title: 'Agent Skills', description: 'MCP investigation skills for Claude, Codex, Gemini CLI, Cursor, and others.', href: '/docs/skills', category: 'Docs', icon: Bot, keywords: ['skills', 'mcp', 'agents', 'codex'], priority: 8 },
  { id: 'docs-security', title: 'Security Whitepaper', description: 'Data flow, BYOK storage, webhooks, rate limits, and operational responsibilities.', href: '/docs/security', category: 'Docs', icon: LockKeyhole, keywords: ['security', 'privacy', 'byok', 'rate limits'], priority: 7 },
  { id: 'docs-authentication', title: 'Authentication', description: 'Account and API-key authentication behavior.', href: '/docs/authentication', category: 'Docs', icon: KeyRound, keywords: ['auth', 'login', 'api keys'], priority: 5 },
  { id: 'docs-rate-limiting', title: 'Rate Limiting', description: 'Multi-tier abuse and cost controls for audits and APIs.', href: '/docs/rate-limiting', category: 'Docs', icon: LockKeyhole, keywords: ['rate limit', 'quota', 'abuse'], priority: 5 },
  { id: 'docs-legal', title: 'Legal, Terms, and Privacy', description: 'Terms, privacy policy, AI limitations, and dispute process.', href: '/docs/legal', category: 'Docs', icon: FileText, keywords: ['legal', 'terms', 'privacy', 'disclaimer'], priority: 4 },
  { id: 'docs-legal-privacy', title: 'Privacy Policy', description: 'What HireProof processes, provider calls, storage, and privacy boundaries.', href: '/docs/legal#privacy-policy', category: 'Docs', icon: FileText, keywords: ['privacy', 'data', 'storage', 'provider calls'], priority: 8 },
  { id: 'docs-legal-terms', title: 'Terms of Service', description: 'Acceptable use, no guarantees, accounts, API keys, and automations.', href: '/docs/legal#terms-of-service', category: 'Docs', icon: FileText, keywords: ['terms', 'acceptable use', 'api keys', 'automations'], priority: 7 },
  { id: 'docs-legal-disputes', title: 'Business and false-positive disputes', description: 'How businesses can dispute incorrect or outdated HireProof findings.', href: '/docs/legal#business-disputes', category: 'Docs', icon: FileText, keywords: ['dispute', 'false positive', 'business', 'appeal'], priority: 7 },
]

const DEFAULT_RESULT_IDS = new Set(['audit', 'docs', 'docs-use-cases', 'docs-automations', 'explore', 'proof', 'developer'])

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function scoreItem(item: SearchItem, normalizedQuery: string) {
  if (!normalizedQuery) return DEFAULT_RESULT_IDS.has(item.id) ? 100 + (item.priority ?? 0) : item.priority ?? 0

  const title = normalizeSearch(item.title)
  const href = normalizeSearch(item.href)
  const category = normalizeSearch(item.category)
  const description = normalizeSearch(item.description)
  const keywords = item.keywords.map(normalizeSearch)
  const searchable = [title, href, category, description, ...keywords].join(' ')
  const terms = normalizedQuery.split(/\s+/).filter(Boolean)

  if (!terms.every((term) => searchable.includes(term))) return 0

  let score = item.priority ?? 0
  if (title === normalizedQuery) score += 120
  if (title.startsWith(normalizedQuery)) score += 90
  if (keywords.some((keyword) => keyword === normalizedQuery || keyword.startsWith(normalizedQuery))) score += 70
  if (href.includes(normalizedQuery)) score += 45
  if (description.includes(normalizedQuery)) score += 25
  if (category.includes(normalizedQuery)) score += 15
  score += Math.max(0, 20 - title.length / 4)
  return score
}

function getSearchResults(query: string) {
  const normalizedQuery = normalizeSearch(query)

  return SEARCH_INDEX
    .map((item) => ({ item, score: scoreItem(item, normalizedQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, normalizedQuery ? 12 : 7)
    .map((entry) => entry.item)
}

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const results = getSearchResults(query)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    const openFromUi = () => setOpen(true)

    document.addEventListener('keydown', down)
    window.addEventListener(COMMAND_MENU_EVENT, openFromUi)
    return () => {
      document.removeEventListener('keydown', down)
      window.removeEventListener(COMMAND_MENU_EVENT, openFromUi)
    }
  }, [])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  const onSelect = (href: string) => {
    router.push(href)
    setOpen(false)
    setQuery('')
  }

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setQuery('')
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
      return
    }

    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault()
      onSelect(results[activeIndex].href)
    }
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
            role="dialog"
            aria-modal="true"
            aria-label="Site search"
            className="fixed left-1/2 top-[4.75rem] z-[70] w-[min(42rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl ring-1 ring-white/10 sm:top-[16%]"
          >
            <div className="flex items-center border-b border-border-soft px-4">
              <Search className="h-5 w-5 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Search pages, docs, APIs, workflows..."
                className="h-14 w-full bg-transparent px-4 text-sm font-semibold outline-none placeholder:text-muted"
              />
              <div className="flex items-center gap-1 rounded-md bg-muted/20 px-1.5 py-0.5 text-[10px] font-bold text-muted">
                ESC
              </div>
            </div>

            <div className="max-h-[min(30rem,calc(100dvh-12rem))] overflow-y-auto p-2">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted">
                {query.trim() ? 'Search results' : 'Start here'}
              </div>
              {results.map((action, index) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onSelect(action.href)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`group flex w-full items-start justify-between gap-4 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                    activeIndex === index ? 'bg-safe/10 text-safe' : 'hover:bg-safe/10 hover:text-safe'
                  }`}
                >
                  <div className="flex min-w-0 gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted ring-1 ring-border-soft group-hover:text-safe">
                      <action.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-black text-foreground group-hover:text-safe">{action.title}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted">{action.category}</span>
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-muted">{action.description}</span>
                      <span className="mt-1 block truncate text-[11px] font-bold text-muted/70">{action.href}</span>
                    </span>
                  </div>
                </button>
              ))}
              {results.length === 0 && (
                <div className="px-4 py-8 text-center text-sm font-semibold text-muted">
                  <div>No results found for "{query}"</div>
                  <div className="mt-2 text-xs">Try audit, api, mcp, automation, extension, pricing, or use cases.</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border-soft bg-background/50 px-4 py-3 text-[10px] font-bold text-muted">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><Terminal className="h-3 w-3" /> Enter select</span>
                <span className="flex items-center gap-1">↑↓ Navigate</span>
              </div>
              <div>Site search</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
