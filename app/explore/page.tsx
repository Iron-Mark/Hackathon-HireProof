import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { AlertTriangle, ShieldCheck, Zap, ArrowRight, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { DEMO_FIXTURES } from '@/lib/fixtures'

export const metadata: Metadata = {
  title: 'Explore Recent Audits | HireProof',
  description: 'Browse recent job investigations and scam trends detected by the HireProof community.',
}

// Mock community feed based on fixtures
const MOCK_FEED = [
  { ...DEMO_FIXTURES.highRisk, id: '1', company: 'Global Remote Ops', category: 'Remote' },
  { ...DEMO_FIXTURES.caution, id: '2', company: 'TechStart Solutions', category: 'Software' },
  { ...DEMO_FIXTURES.safe, id: '3', company: 'Microsoft', category: 'Enterprise' },
  { ...DEMO_FIXTURES.highRisk, id: '4', company: 'Telegram Crypto Jobs', category: 'Web3' },
]

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        <div className="mb-12">
          <div className="mb-3 inline-flex rounded-full bg-safe/10 px-3 py-1 text-xs font-black uppercase tracking-normal text-safe">
            Risk Intelligence
          </div>
          <h1 className="text-4xl font-black lg:text-5xl">Intelligence Feed</h1>
          <p className="mt-4 max-w-2xl text-lg font-medium text-muted leading-relaxed">
            Real investigations from the HireProof network. Browse detected patterns and stay one step ahead of recruitment fraud.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input 
              placeholder="Search by company or role..."
              className="w-full rounded-xl border border-border-soft bg-surface py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-safe/50 focus:ring-4 focus:ring-safe/5"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button className="flex items-center gap-2 rounded-full border border-border bg-foreground px-4 py-2 text-xs font-black text-background">
              All
            </button>
            <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-bold text-muted hover:bg-background">
              Remote
            </button>
            <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-bold text-muted hover:bg-background">
              High-Risk
            </button>
            <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-bold text-muted hover:bg-background">
              Verified Safe
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_FEED.map((item) => (
            <Link 
              key={item.id}
              href={`/audit?demo=${item.verdict === 'high-risk' ? 'high-risk' : item.verdict === 'caution' ? 'caution' : 'safe'}`}
              className="group flex flex-col rounded-2xl border border-border-soft bg-surface p-6 transition-all hover:-translate-y-1 hover:border-safe/30 hover:shadow-xl hover:shadow-safe/5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                  item.verdict === 'high-risk' ? 'bg-risk-bg text-risk-text' : 
                  item.verdict === 'caution' ? 'bg-caution-bg text-caution-text' : 
                  'bg-safe-bg text-safe-text'
                }`}>
                  {item.verdict}
                </span>
                <span className="text-[10px] font-bold text-muted">2h ago</span>
              </div>
              <h3 className="mb-1 text-lg font-black group-hover:text-safe transition-colors">{item.extractedClaims.role}</h3>
              <p className="mb-6 text-sm font-semibold text-muted">{item.company}</p>
              
              <div className="mt-auto flex items-center justify-between border-t border-border-soft pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-muted/20">
                    <div 
                      className={`h-full rounded-full ${
                        item.verdict === 'high-risk' ? 'bg-high-risk' : 
                        item.verdict === 'caution' ? 'bg-caution' : 'bg-safe'
                      }`} 
                      style={{ width: `${item.riskScore}%` }} 
                    />
                  </div>
                  <span className="text-xs font-black text-muted">{item.riskScore}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted group-hover:translate-x-1 transition-transform group-hover:text-safe" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
