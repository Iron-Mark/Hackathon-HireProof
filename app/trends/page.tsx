import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { TrendingUp, Globe, AlertCircle, ShieldCheck, Map, ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Global Scam Trends | HireProof Intelligence',
  description: 'Real-time macro trends in recruitment fraud across global job markets.',
}

const TREND_DATA = [
  { country: 'Philippines', scamRate: '+12%', status: 'high', activeScams: 2402, industries: ['BPO', 'Tech'] },
  { country: 'India', scamRate: '+8%', status: 'high', activeScams: 1850, industries: ['Remote Admin', 'Customer Support'] },
  { country: 'United States', scamRate: '-2%', status: 'safe', activeScams: 920, industries: ['Freelance', 'Marketing'] },
  { country: 'Nigeria', scamRate: '+15%', status: 'high', activeScams: 1200, industries: ['Data Entry', 'Crypto'] },
]

export default function TrendsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        <div className="mb-12">
          <div className="mb-3 inline-flex rounded-full bg-risk-bg px-3 py-1 text-xs font-black uppercase tracking-normal text-risk-text">
            Security Intelligence
          </div>
          <h1 className="text-4xl font-black lg:text-5xl">Global Scam Trends</h1>
          <p className="mt-4 max-w-2xl text-lg font-medium text-muted leading-relaxed">
            Real-time macro signals identifying the shifting landscape of recruitment fraud. We track patterns across millions of data points to protect global talent.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <StatCard title="Total Audits" value="842,000+" icon={Globe} />
          <StatCard title="Prevention Rate" value="99.4%" icon={ShieldCheck} color="text-safe" />
          <StatCard title="Active Scams" value="12,402" icon={AlertCircle} color="text-risk-text" />
          <StatCard title="Trend Index" value="High" icon={TrendingUp} color="text-caution-text" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div className="rounded-3xl border border-border-soft bg-surface p-8">
            <h2 className="mb-6 text-2xl font-black flex items-center gap-2">
              <Map className="h-6 w-6" />
              Regional Risk Analysis
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border-soft bg-background">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-soft bg-surface/50 text-[10px] font-black uppercase tracking-widest text-muted">
                    <th className="px-6 py-4">Market</th>
                    <th className="px-6 py-4 text-center">Trend</th>
                    <th className="px-6 py-4">Top Targets</th>
                    <th className="px-6 py-4 text-right">Activity</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold">
                  {TREND_DATA.map((item) => (
                    <tr key={item.country} className="border-b border-border-soft last:border-0 hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-4">{item.country}</td>
                      <td className={`px-6 py-4 text-center ${item.status === 'high' ? 'text-risk-text' : 'text-safe'}`}>
                        {item.scamRate}
                      </td>
                      <td className="px-6 py-4 text-muted text-xs">{item.industries.join(', ')}</td>
                      <td className="px-6 py-4 text-right">{item.activeScams.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border-soft bg-surface p-6">
              <h3 className="mb-4 text-lg font-black uppercase tracking-tight">Active Alerts</h3>
              <div className="space-y-4">
                <AlertItem 
                  title="Telegram Scam Wave" 
                  desc="New surge in PH-based 'Data Entry' scams targeting students on Telegram." 
                />
                <AlertItem 
                  title="LGU Impersonation" 
                  desc="Increase in fake government jobs requiring upfront processing fees." 
                />
              </div>
            </div>
            
            <div className="rounded-3xl bg-foreground p-8 text-background">
              <h3 className="mb-2 text-xl font-black">Get the Report</h3>
              <p className="mb-6 text-sm font-medium opacity-80">Full monthly threat intelligence report for recruiting agencies.</p>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-safe py-3 font-black text-background">
                Download PDF <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color = "text-foreground" }: any) {
  return (
    <div className="rounded-3xl border border-border-soft bg-surface p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-background text-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs font-black uppercase tracking-widest text-muted mb-1">{title}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  )
}

function AlertItem({ title, desc }: any) {
  return (
    <div className="rounded-xl border-l-4 border-risk-bg bg-background p-4">
      <div className="text-sm font-black text-risk-text mb-1">{title}</div>
      <p className="text-xs font-medium text-muted leading-relaxed">{desc}</p>
    </div>
  )
}
