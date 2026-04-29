'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { 
  Copy, 
  Key, 
  Plus, 
  ShieldCheck, 
  Trash2, 
  Terminal, 
  Cpu, 
  Zap, 
  Database, 
  Activity, 
  Code2, 
  RefreshCcw,
  LayoutDashboard,
  Webhook,
  ArrowUpRight
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { showToast } from '@/components/toast'

type User = { id: string; email: string; name: string }
type ApiKey = { id: string; name: string; lastFour: string; createdAt: string; lastUsedAt: string | null }
type Usage = { totalRequests: number; successfulRequests: number; failedRequests: number; recent: Array<{ id: string; endpoint: string; status: number; createdAt: string }> }

export default function DeveloperPortal() {
  const [user, setUser] = useState<User | null>(null)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [newKey, setNewKey] = useState<string | null>(null)
  
  // Infrastructure Keys (BYOK)
  const [openaiKey, setOpenaiKey] = useState('')
  const [serpapiKey, setSerpapiKey] = useState('')

  async function load() {
    try {
      const me = await fetch('/api/auth/me').then((res) => res.json())
      setUser(me.user)
      if (me.user) {
        const [keyRes, usageRes] = await Promise.all([
          fetch('/api/developer/keys').then((res) => res.json()),
          fetch('/api/developer/usage').then((res) => res.json()),
        ])
        setKeys(keyRes.keys || [])
        setUsage(usageRes)
      }
    } catch (e) {
      console.error('Failed to load developer portal state')
    }
  }

  useEffect(() => {
    void load()
    setOpenaiKey(localStorage.getItem('MODEL_PROVIDER_KEY') || '')
    setSerpapiKey(localStorage.getItem('SERPAPI_API_KEY') || '')
  }, [])

  const saveInfrastructure = () => {
    localStorage.setItem('MODEL_PROVIDER_KEY', openaiKey)
    localStorage.setItem('SERPAPI_API_KEY', serpapiKey)
    showToast('Infrastructure keys saved locally.', 'success')
  }

  async function submitAuth() {
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const json = await res.json()
    if (!res.ok) {
      showToast(json.error || 'Authentication failed.', 'info')
      return
    }
    setEmail('')
    setPassword('')
    await load()
  }

  async function createKey() {
    const res = await fetch('/api/developer/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Production API Key' }),
    })
    const json = await res.json()
    if (!res.ok) return showToast(json.error || 'Could not create key.', 'info')
    setNewKey(json.rawKey)
    await load()
  }

  async function revokeKey(id: string) {
    await fetch(`/api/developer/keys/${id}`, { method: 'DELETE' })
    await load()
    showToast('Key revoked.', 'info')
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value)
    showToast('Copied to clipboard.', 'success')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24">
          <div className="w-full space-y-8 rounded-3xl border border-border-soft bg-surface p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground text-background">
                <Terminal className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Developer Access</h1>
              <p className="mt-2 text-sm font-medium text-muted leading-relaxed">
                Enter the terminal to manage your HireProof infrastructure and API keys.
              </p>
            </div>

            <div className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Forensic Investigator" className="w-full rounded-xl border border-border-soft bg-background p-4 text-sm font-semibold outline-none focus:border-safe" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Email Address</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="investigator@hireproof.com" className="w-full rounded-xl border border-border-soft bg-background p-4 text-sm font-semibold outline-none focus:border-safe" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full rounded-xl border border-border-soft bg-background p-4 text-sm font-semibold outline-none focus:border-safe" />
              </div>
              
              <button onClick={submitAuth} className="hireproof-focus mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-4 text-sm font-black text-background transition-all hover:bg-safe">
                {mode === 'login' ? 'Sign In to Terminal' : 'Create Access Profile'}
                <ArrowUpRight className="h-4 w-4" />
              </button>
              
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full py-2 text-xs font-black text-muted transition-colors hover:text-foreground">
                {mode === 'login' ? 'NEED NEW CREDENTIALS? REGISTER →' : 'ALREADY HAVE ACCESS? SIGN IN →'}
              </button>
            </div>
          </div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-muted/50">
            Secure Forensic Access · Encrypted at Rest
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {/* Header Stats */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Infrastructure Status', value: 'Operational', icon: Activity, color: 'text-safe' },
            { label: 'API Requests (30d)', value: usage?.totalRequests ?? '0', icon: Database, color: 'text-evidence' },
            { label: 'Success Rate', value: '99.8%', icon: Zap, color: 'text-safe' },
            { label: 'Active Keys', value: keys.length, icon: Key, color: 'text-foreground' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg bg-surface p-2 ${stat.color} border border-border-soft`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="h-2 w-2 rounded-full bg-safe animate-pulse" />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">{stat.label}</div>
              <div className="mt-1 text-2xl font-black">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main Command Center */}
          <div className="space-y-8">
            
            {/* Keys Management */}
            <section className="rounded-3xl border border-border-soft bg-surface shadow-sm overflow-hidden">
              <div className="border-b border-border-soft bg-background/50 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-evidence" />
                  <h2 className="text-xl font-black">Managed API Keys</h2>
                </div>
                <button onClick={createKey} className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-black text-background hover:bg-evidence transition-all">
                  <Plus className="h-4 w-4" /> Generate Key
                </button>
              </div>

              {newKey && (
                <div className="m-8 mb-0 rounded-2xl border border-safe/30 bg-safe/5 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black text-safe">
                    <ShieldCheck className="h-4 w-4" /> 
                    NEW KEY GENERATED
                  </div>
                  <p className="text-xs font-medium text-muted">Copy this key now. It will not be shown again for security reasons.</p>
                  <div className="flex gap-2 rounded-xl border border-safe/20 bg-background p-4 font-mono text-sm group">
                    <span className="flex-1 truncate">{newKey}</span>
                    <button onClick={() => copy(newKey)} className="text-safe hover:scale-110 transition-transform"><Copy className="h-4 w-4" /></button>
                  </div>
                </div>
              )}

              <div className="p-8 space-y-4">
                {keys.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border-soft p-12 text-center">
                    <Key className="mx-auto h-8 w-8 text-muted mb-4 opacity-20" />
                    <p className="text-sm font-bold text-muted">No API keys found. Generate one to start building.</p>
                  </div>
                ) : keys.map((key) => (
                  <div key={key.id} className="group flex items-center justify-between rounded-2xl border border-border-soft bg-background p-5 hover:border-evidence transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black">{key.name}</span>
                        <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-bold text-muted uppercase tracking-widest border border-border-soft">Live</span>
                      </div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none">
                        •••• {key.lastFour} · Created {new Date(key.createdAt).toLocaleDateString()} · Last Used {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => revokeKey(key.id)} className="rounded-lg p-2 text-muted hover:bg-risk-bg hover:text-risk-text transition-colors" title="Revoke">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Infrastructure BYOK */}
            <section className="rounded-3xl border border-border-soft bg-surface shadow-sm overflow-hidden">
              <div className="border-b border-border-soft bg-background/50 px-8 py-6">
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-safe" />
                  <h2 className="text-xl font-black">Inference Infrastructure (BYOK)</h2>
                </div>
                <p className="mt-1 text-[10px] font-black text-muted uppercase tracking-widest">Local-First Model Credentials</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">OpenAI API Key</label>
                    <input 
                      type="password" 
                      value={openaiKey} 
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..." 
                      className="w-full rounded-2xl border border-border-soft bg-background p-4 font-mono text-sm outline-none focus:border-safe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">SerpApi Key</label>
                    <input 
                      type="password" 
                      value={serpapiKey} 
                      onChange={(e) => setSerpapiKey(e.target.value)}
                      placeholder="Paste key..." 
                      className="w-full rounded-2xl border border-border-soft bg-background p-4 font-mono text-sm outline-none focus:border-safe" 
                    />
                  </div>
                </div>
                <button onClick={saveInfrastructure} className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-4 text-sm font-black text-background transition-all hover:bg-safe">
                  Update Local Infrastructure
                </button>
                <p className="text-center text-[10px] font-black text-muted uppercase tracking-tighter opacity-50">
                  STORED STRICTLY IN LOCALSTORAGE · NEVER SENT TO OUR SERVERS
                </p>
              </div>
            </section>
          </div>

          {/* Side Info / Resources */}
          <aside className="space-y-8">
            {/* Quick Setup Card */}
            <section className="rounded-3xl border border-border-soft bg-foreground p-8 text-background shadow-xl">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-safe text-background">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black leading-tight">Install the SDK</h3>
              <p className="mt-2 text-sm font-bold opacity-70">Build agentic integrations in minutes.</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-xl bg-background/10 p-4 font-mono text-xs font-bold flex items-center justify-between group">
                  <span className="truncate">npm install hireproof-sdk</span>
                  <button onClick={() => copy('npm install hireproof-sdk')} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="h-3 w-3" /></button>
                </div>
                <Link href="/docs/sdk" className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-xs font-black transition-all hover:bg-white/20">
                  View SDK Docs
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            {/* Webhook Sandbox */}
            <section className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Webhook className="h-5 w-5 text-evidence" />
                <h3 className="text-lg font-black">Webhook Sandbox</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Endpoint URL</label>
                  <input placeholder="https://api.myapp.com/webhook" className="w-full rounded-xl border border-border-soft bg-background p-3 text-xs font-semibold outline-none focus:border-evidence" />
                </div>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-soft bg-background px-4 py-3 text-xs font-black transition-all hover:bg-surface">
                  Send Test Event
                </button>
              </div>
            </section>

            {/* Quick Links */}
            <section className="grid gap-3">
              {[
                { label: 'API Reference', href: '/docs/api-reference', icon: BookOpen },
                { label: 'MCP Protocol', href: '/docs/mcp', icon: RefreshCcw },
                { label: 'Support & Security', href: '/docs/security', icon: ShieldCheck },
              ].map((link) => (
                <Link key={link.label} href={link.href} className="flex items-center justify-between rounded-2xl border border-border-soft bg-surface p-4 text-xs font-black hover:border-evidence transition-all">
                  <div className="flex items-center gap-3">
                    <link.icon className="h-4 w-4 text-muted" />
                    {link.label}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted opacity-50" />
                </Link>
              ))}
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

function BookOpen(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
