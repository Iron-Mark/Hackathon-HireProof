'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Copy, Trash2, ShieldCheck, Terminal, BarChart3, Clock, Globe, Zap, ExternalLink, Code2, Database, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { SiteHeader } from '@/components/site-header'
import { showToast } from '@/components/toast'
import Link from 'next/link'

interface ApiKey {
  id: string
  key: string
  name: string
  created: string
  lastUsed: string
}

export default function DeveloperPortal() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [externalKeys, setExternalKeys] = useState({
    googleSearch: '',
    gemini: ''
  })

  // Load keys from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('hireproof_api_keys')
    if (savedKeys) {
      setKeys(JSON.parse(savedKeys))
    } else {
      // Default demo key
      const demoKey = {
        id: '1',
        key: 'hp_live_9a2b3c4d5e6f7g8h9i0j',
        name: 'Production Environment',
        created: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      }
      setKeys([demoKey])
      localStorage.setItem('hireproof_api_keys', JSON.stringify([demoKey]))
    }

    const savedExternal = localStorage.getItem('hireproof_external_keys')
    if (savedExternal) {
      setExternalKeys(JSON.parse(savedExternal))
    }
  }, [])

  const saveExternalKeys = () => {
    localStorage.setItem('hireproof_external_keys', JSON.stringify(externalKeys))
    showToast('Infrastructure settings saved!', 'success')
  }

  const generateKey = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const newKey: ApiKey = {
        id: Math.random().toString(36).substr(2, 9),
        key: `hp_live_${Math.random().toString(36).substr(2, 20)}`,
        name: `New Key ${keys.length + 1}`,
        created: new Date().toISOString(),
        lastUsed: 'Never'
      }
      const updatedKeys = [...keys, newKey]
      setKeys(updatedKeys)
      localStorage.setItem('hireproof_api_keys', JSON.stringify(updatedKeys))
      setIsGenerating(false)
      showToast('API Key generated successfully!', 'success')
    }, 800)
  }

  const deleteKey = (id: string) => {
    const updatedKeys = keys.filter(k => k.id !== id)
    setKeys(updatedKeys)
    localStorage.setItem('hireproof_api_keys', JSON.stringify(updatedKeys))
    showToast('API Key revoked.', 'info')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-safe/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-safe">
              <Terminal className="h-3 w-3" />
              B2B Infrastructure
            </div>
            <h1 className="text-4xl font-black">Developer Portal</h1>
            <p className="mt-2 text-lg font-medium text-muted">Manage your API keys and monitor your integration performance.</p>
          </div>
          <button 
            onClick={generateKey}
            disabled={isGenerating}
            className="hireproof-focus flex items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3 font-black text-background hover:bg-safe disabled:opacity-50 transition-colors"
          >
            {isGenerating ? <Clock className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Generate New Key
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {/* API Keys List */}
            <section className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-border-soft pb-4">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <Key className="h-5 w-5 text-safe" />
                  Your API Keys
                </h2>
                <span className="text-xs font-bold text-muted">{keys.length} Active Key{keys.length !== 1 && 's'}</span>
              </div>
              
              <div className="space-y-4">
                {keys.map((key) => (
                  <div key={key.id} className="group relative rounded-xl border border-border-soft bg-background p-4 transition-all hover:border-safe/30 hover:shadow-md">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-black">{key.name}</div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(key.key)} className="rounded-lg p-2 hover:bg-surface text-muted hover:text-safe" title="Copy Key">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteKey(key.id)} className="rounded-lg p-2 hover:bg-surface text-muted hover:text-risk-text" title="Revoke Key">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 font-mono text-sm text-muted">
                      <span className="shrink-0 text-safe">●</span>
                      <span className="truncate">{key.key}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-[11px] font-bold text-muted">
                      <div className="flex items-center gap-1.5">
                        <Plus className="h-3 w-3" /> Created {new Date(key.created).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3" /> Last used: {key.lastUsed}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quickstart / Documentation Snippet */}
            <section className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-black">
                <Code2 className="h-5 w-5 text-evidence" />
                Quickstart Guide
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-sm font-black uppercase text-muted tracking-wide">1. Authenticate</h3>
                  <p className="mb-3 text-sm font-medium">Include your API key in the request headers for all authenticated endpoints.</p>
                  <div className="rounded-xl bg-black p-4 font-mono text-xs text-white/80">
                    <span className="text-risk-text">Authorization:</span> Bearer hp_live_...
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-black uppercase text-muted tracking-wide">2. Run an Audit</h3>
                  <p className="mb-3 text-sm font-medium">Send a job description to the headless audit endpoint to receive a risk verdict.</p>
                  <div className="rounded-xl bg-black p-4 font-mono text-xs text-white/80 overflow-x-auto whitespace-pre">
                    <span className="text-safe">curl</span> -X POST https://api.hireproof.ai/v1/audit \<br/>
                    &nbsp;&nbsp;-H <span className="text-caution">"Authorization: Bearer YOUR_KEY"</span> \<br/>
                    &nbsp;&nbsp;-d <span className="text-evidence">"text=Remote Frontend Intern needed, $8000/week"</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border-soft text-center">
                  <Link href="/docs/api-reference" className="inline-flex items-center gap-2 font-black text-safe hover:underline">
                    View Full API Reference <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>

            {/* Bring Your Own Key (BYOK) Section */}
            <section className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
              <div className="mb-6 border-b border-border-soft pb-4">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <Database className="h-5 w-5 text-evidence" />
                  Custom Infrastructure (BYOK)
                </h2>
                <p className="mt-1 text-xs font-semibold text-muted">
                  Use your own API keys to run audits. These are used if your free tier is exhausted or for high-volume local checks.
                </p>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted tracking-wider flex items-center justify-between">
                    Google Search API Key
                    {externalKeys.googleSearch && <span className="text-safe lowercase">Configured</span>}
                  </label>
                  <input 
                    type="password" 
                    value={externalKeys.googleSearch}
                    onChange={(e) => setExternalKeys({...externalKeys, googleSearch: e.target.value})}
                    placeholder="AIzaSy..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-safe focus:outline-none focus:ring-1 focus:ring-safe/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted tracking-wider flex items-center justify-between">
                    Gemini / LLM API Key
                    {externalKeys.gemini && <span className="text-safe lowercase">Configured</span>}
                  </label>
                  <input 
                    type="password" 
                    value={externalKeys.gemini}
                    onChange={(e) => setExternalKeys({...externalKeys, gemini: e.target.value})}
                    placeholder="Enter your LLM Key"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-safe focus:outline-none focus:ring-1 focus:ring-safe/20 transition-all"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 rounded-xl bg-safe-bg/30 p-3 text-[11px] font-bold text-safe-text">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Keys are stored in your browser's LocalStorage and used for client-side processing.
                </div>
                <button 
                  onClick={saveExternalKeys}
                  className="hireproof-focus shrink-0 rounded-lg bg-foreground px-6 py-2.5 text-sm font-black text-background hover:bg-safe transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            {/* API Usage Analytics (Mock) */}
            <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted">
                <BarChart3 className="h-4 w-4" />
                Monthly Usage
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="mb-1 text-2xl font-black tracking-tight">12,482</div>
                  <div className="text-xs font-bold text-muted">API Requests</div>
                </div>
                <div className="flex h-24 items-end gap-1 px-1">
                  {[40, 65, 30, 85, 45, 90, 75, 55, 60, 95].map((h, i) => (
                    <div key={i} className="flex-1 bg-safe/20 rounded-t-sm group relative">
                      <div 
                        className="absolute bottom-0 w-full bg-safe transition-all group-hover:bg-safe-text" 
                        style={{ height: `${h}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-border-soft">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-muted">Quota Usage</span>
                    <span>84%</span>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden">
                    <div className="h-full bg-safe" style={{ width: '84%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-muted">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">API Gateway</span>
                  <span className="flex items-center gap-1.5 text-xs font-black text-safe">
                    <span className="h-2 w-2 rounded-full bg-safe animate-pulse"></span>
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Audit Workers</span>
                  <span className="flex items-center gap-1.5 text-xs font-black text-safe">
                    <span className="h-2 w-2 rounded-full bg-safe animate-pulse"></span>
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Storage Cluster</span>
                  <span className="flex items-center gap-1.5 text-xs font-black text-safe">
                    <span className="h-2 w-2 rounded-full bg-safe animate-pulse"></span>
                    Operational
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-risk-bg/30 bg-risk-bg/10 p-5">
              <h3 className="flex items-center gap-2 text-sm font-black text-risk-text">
                <ShieldCheck className="h-4 w-4" />
                Security Warning
              </h3>
              <p className="mt-2 text-[11px] font-bold leading-relaxed text-risk-text opacity-80">
                Never share your secret API keys in client-side code. Always use a secure backend proxy to authenticate requests.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-20 bg-background border-t border-border-soft py-12">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-sm font-bold text-muted">© 2026 HireProof Infrastructure. Built for the safe internet.</p>
        </div>
      </footer>
    </div>
  )
}
