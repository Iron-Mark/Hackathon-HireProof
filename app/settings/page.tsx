'use client'

import { useState, useEffect } from 'react'
import { SiteHeader } from '@/components/site-header'
import { 
  Key, 
  Shield, 
  Terminal, 
  Zap, 
  Database, 
  Copy, 
  Check, 
  AlertTriangle,
  RefreshCcw,
  Webhook
} from 'lucide-react'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('hp_live_928374928374928374')
  const [copied, setCopied] = useState(false)
  const [openaiKey, setOpenaiKey] = useState('')
  const [serpapiKey, setSerpapiKey] = useState('')
  const [isSaved, setIsSaved] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedOpenAI = localStorage.getItem('MODEL_PROVIDER_KEY') || ''
    const savedSerp = localStorage.getItem('SERPAPI_API_KEY') || ''
    setOpenaiKey(savedOpenAI)
    setSerpapiKey(savedSerp)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveKeys = () => {
    localStorage.setItem('MODEL_PROVIDER_KEY', openaiKey)
    localStorage.setItem('SERPAPI_API_KEY', serpapiKey)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="mx-auto max-w-4xl px-4 py-20 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight">Developer Portal</h1>
          <p className="mt-2 font-medium text-muted">Manage your API credentials and infrastructure settings.</p>
        </div>

        <div className="space-y-8">
          
          {/* Headless API Key */}
          <section className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-evidence/10 text-evidence">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Headless API Key</h2>
                  <p className="text-xs font-bold text-muted uppercase tracking-widest">Managed Cloud Key</p>
                </div>
              </div>
              <button 
                onClick={() => setApiKey(`hp_live_${Math.random().toString(36).substring(7)}`)}
                className="flex items-center gap-2 text-xs font-black text-muted hover:text-foreground transition-colors"
              >
                <RefreshCcw className="h-3 w-3" />
                Rotate Key
              </button>
            </div>

            <div className="relative flex items-center gap-2 rounded-2xl border border-border-soft bg-background p-4">
              <code className="flex-1 font-mono text-sm text-foreground overflow-hidden whitespace-nowrap">
                {apiKey}
              </code>
              <button 
                onClick={handleCopy}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background hover:bg-safe transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="mt-6 rounded-xl border border-caution/20 bg-caution/5 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-caution shrink-0" />
              <p className="text-xs font-medium text-muted leading-relaxed">
                This key grants full access to the HireProof Headless API. Do not share it in public repositories. 
                Managed users have a quota of 1,000 requests/month.
              </p>
            </div>
          </section>

          {/* BYOK Settings */}
          <section className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-safe/10 text-safe">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black">Bring Your Own Key (BYOK)</h2>
                <p className="text-xs font-bold text-muted uppercase tracking-widest">Local-First Inference</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted">OpenAI API Key</label>
                <input 
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-2xl border border-border-soft bg-background p-4 font-mono text-sm focus:border-safe focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted">SerpApi Key</label>
                <input 
                  type="password"
                  value={serpapiKey}
                  onChange={(e) => setSerpapiKey(e.target.value)}
                  placeholder="Paste SerpApi key..."
                  className="w-full rounded-2xl border border-border-soft bg-background p-4 font-mono text-sm focus:border-safe focus:outline-none"
                />
              </div>

              <button 
                onClick={handleSaveKeys}
                className="flex w-full items-center justify-center rounded-xl bg-foreground px-6 py-4 text-sm font-black text-background hover:bg-safe transition-colors"
              >
                {isSaved ? 'Keys Saved Locally ✓' : 'Save Credentials'}
              </button>
              
              <p className="text-[10px] text-center font-bold text-muted uppercase tracking-tighter">
                Stored strictly in your browser&apos;s localStorage. We never see these keys.
              </p>
            </div>
          </section>

          {/* Webhook Sandbox */}
          <section className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-caution/10 text-caution">
                <Webhook className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black">Webhook Sandbox</h2>
                <p className="text-xs font-bold text-muted uppercase tracking-widest">Async Pipelines</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="https://your-app.com/webhook"
                  className="flex-1 rounded-2xl border border-border-soft bg-background p-4 text-sm focus:border-caution focus:outline-none"
                />
                <button className="rounded-2xl bg-foreground px-6 py-4 text-sm font-black text-background hover:bg-caution transition-colors">
                  Test URL
                </button>
              </div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                Latest Event: <span className="text-foreground">None</span>
              </p>
            </div>
          </section>

          {/* Usage Stats (Mock) */}
          <section className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm">
            <h2 className="mb-6 text-xl font-black">Usage Statistics</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border-soft bg-background p-6">
                <div className="text-xs font-black uppercase text-muted mb-1">API Requests</div>
                <div className="text-3xl font-black">842 / 1,000</div>
              </div>
              <div className="rounded-2xl border border-border-soft bg-background p-6">
                <div className="text-xs font-black uppercase text-muted mb-1">Success Rate</div>
                <div className="text-3xl font-black text-safe">99.8%</div>
              </div>
              <div className="rounded-2xl border border-border-soft bg-background p-6">
                <div className="text-xs font-black uppercase text-muted mb-1">Credits</div>
                <div className="text-3xl font-black text-evidence">$12.40</div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
