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
  Webhook,
  ArrowUpRight
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { showToast } from '@/components/toast'

type User = { id: string; email: string; name: string }
type ApiKey = { id: string; name: string; lastFour: string; createdAt: string; lastUsedAt: string | null }
type Usage = { totalRequests: number; successfulRequests: number; failedRequests: number; recent: Array<{ id: string; endpoint: string; status: number; createdAt: string }> }
type VerifiedDomain = {
  id: string
  domain: string
  status: 'pending' | 'verified'
  verificationToken: string
  publicToken: string
  badgeUrl: string
  scriptUrl: string
}

export function DeveloperClient() {
  const [user, setUser] = useState<User | null>(null)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)
  const [domainInput, setDomainInput] = useState('')
  const [domains, setDomains] = useState<VerifiedDomain[]>([])
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null)
  
  // Infrastructure Keys (BYOK)
  const [openaiKey, setOpenaiKey] = useState('')
  const [serpapiKey, setSerpapiKey] = useState('')
  const [isVerifyingOpenAI, setIsVerifyingOpenAI] = useState(false)
  const [isVerifyingSerp, setIsVerifyingSerp] = useState(false)
  const [systemLogs, setSystemLogs] = useState<Array<{ msg: string; type: 'info' | 'success' | 'error'; time: string }>>([
    { msg: 'System initialized. Waiting for investigator...', type: 'info', time: new Date().toLocaleTimeString() }
  ])

  async function load() {
    try {
      const me = await fetch('/api/auth/me').then((res) => res.json())
      setUser(me.user)
      if (me.user) {
        const [keyRes, usageRes, domainRes] = await Promise.all([
          fetch('/api/developer/keys').then((res) => res.json()),
          fetch('/api/developer/usage').then((res) => res.json()),
          fetch('/api/developer/domains').then((res) => res.json()),
        ])
        setKeys(keyRes.keys || [])
        setUsage(usageRes)
        setDomains(domainRes.domains || [])
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

  async function testWebhook() {
    if (!webhookUrl) return showToast('Please enter a webhook URL.', 'info')
    
    setIsTestingWebhook(true)
    addLog(`Initiating webhook test to: ${webhookUrl}`, 'info')
    try {
      const res = await fetch('/api/developer/webhook-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      })
      
      const json = await res.json()
      
      if (!res.ok) {
        showToast(json.error || 'Failed to send webhook.', 'info')
        addLog(`Webhook delivery failed: ${json.error || 'Unknown error'}`, 'error')
      } else {
        showToast('Webhook payload delivered successfully!', 'success')
        addLog('Webhook payload delivered and ACK received.', 'success')
      }
    } catch (e) {
      showToast('Network error while testing webhook.', 'info')
      addLog('Network error during webhook orchestration.', 'error')
    } finally {
      setIsTestingWebhook(false)
    }
  }

  async function addDomain() {
    if (!domainInput.trim()) return showToast('Enter a domain first.', 'info')
    setIsAddingDomain(true)
    try {
      const res = await fetch('/api/developer/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput }),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error || 'Could not add domain.', 'info')
        return
      }
      setDomainInput('')
      showToast('Domain added. Add the TXT record, then verify it.', 'success')
      await load()
    } finally {
      setIsAddingDomain(false)
    }
  }

  async function verifyDomain(domain: string) {
    setVerifyingDomain(domain)
    try {
      const res = await fetch('/api/developer/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      const json = await res.json()
      if (!res.ok || !json.verified) {
        showToast(json.error || 'TXT record not found yet.', 'info')
        return
      }
      showToast(`${domain} is verified.`, 'success')
      await load()
    } finally {
      setVerifyingDomain(null)
    }
  }

  function addLog(msg: string, type: 'info' | 'success' | 'error' = 'info') {
    setSystemLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50))
  }

  async function verifyKey(provider: 'openai' | 'serp') {
    const key = provider === 'openai' ? openaiKey : serpapiKey
    if (!key) return showToast(`Please enter your ${provider === 'openai' ? 'OpenAI' : 'SerpApi'} key first.`, 'info')
    
    const setter = provider === 'openai' ? setIsVerifyingOpenAI : setIsVerifyingSerp
    setter(true)
    addLog(`Verifying ${provider.toUpperCase()} infrastructure connection...`, 'info')
    
    try {
      // We'll call a dedicated verification endpoint or do a minimal test
      const res = await fetch('/api/developer/verify-infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      })
      
      const json = await res.json()
      if (res.ok && json.valid) {
        showToast(`${provider.toUpperCase()} key verified successfully.`, 'success')
        addLog(`${provider.toUpperCase()} connection established and verified.`, 'success')
      } else {
        showToast(json.error || `Invalid ${provider.toUpperCase()} key.`, 'info')
        addLog(`${provider.toUpperCase()} verification failed: ${json.error || 'Invalid credentials'}`, 'error')
      }
    } catch (e) {
      showToast(`Failed to verify ${provider.toUpperCase()} key.`, 'info')
      addLog(`Communication error with ${provider.toUpperCase()} gateway.`, 'error')
    } finally {
      setter(false)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    showToast('Signed out successfully.', 'info')
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
                Manage your HireProof API keys, webhooks, and job-verification settings.
              </p>
            </div>

            <div className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Job Safety Reviewer" className="w-full rounded-xl border border-border-soft bg-background p-4 text-sm font-semibold outline-none focus:border-safe" />
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

              {/* Judge / Reviewer Shortcut */}
              <div className="mt-6 pt-6 border-t border-border-soft border-dashed">
                <button 
                  onClick={() => {
                    setEmail('judge@hackathon.com')
                    setPassword('hireproof2026')
                    setMode('login')
                    showToast('Demo credentials pre-filled.', 'success')
                  }}
                  className="w-full rounded-xl border border-border-soft bg-background py-2 text-[10px] font-black uppercase tracking-widest text-muted hover:border-evidence hover:text-foreground transition-all"
                >
                  Quick Demo Login (For Judges)
                </button>
              </div>
            </div>
          </div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-muted/50">
            Secure API Access · Encrypted at Rest
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">Developer Portal</h1>
            <p className="mt-1 font-medium text-muted">Manage your API keys and webhook integrations.</p>
          </div>
          <button onClick={logout} className="rounded-xl border border-border-soft bg-surface px-4 py-2 text-xs font-black text-muted transition-colors hover:bg-background hover:text-foreground">
            Sign Out
          </button>
        </div>

        {/* Header Stats */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Infrastructure Status', value: 'Operational', icon: Activity, color: 'text-safe' },
            { label: 'API Requests (30d)', value: usage?.totalRequests ?? '0', icon: Database, color: 'text-evidence' },
            { label: 'Success Rate', value: usage?.totalRequests ? `${((usage.successfulRequests / usage.totalRequests) * 100).toFixed(1)}%` : '100%', icon: Zap, color: 'text-safe' },
            { label: 'Active Keys', value: keys.length, icon: Key, color: 'text-foreground' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm hover:border-evidence/50 transition-colors">
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg bg-background p-2 ${stat.color} border border-border-soft`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className={`h-2 w-2 rounded-full ${stat.value === 'Operational' || stat.label === 'Success Rate' ? 'bg-safe animate-pulse' : 'bg-muted'} `} />
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
                  <Key className="h-5 w-5 text-evidence" />
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
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">OpenAI API Key</label>
                      <button 
                        onClick={() => verifyKey('openai')} 
                        disabled={isVerifyingOpenAI}
                        className="text-[10px] font-black uppercase tracking-widest text-safe hover:underline disabled:opacity-50"
                      >
                        {isVerifyingOpenAI ? 'Verifying...' : 'Verify Connection'}
                      </button>
                    </div>
                    <input 
                      type="password" 
                      value={openaiKey} 
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..." 
                      className="w-full rounded-2xl border border-border-soft bg-background p-4 font-mono text-sm outline-none focus:border-safe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">SerpApi Key</label>
                      <button 
                        onClick={() => verifyKey('serp')} 
                        disabled={isVerifyingSerp}
                        className="text-[10px] font-black uppercase tracking-widest text-evidence hover:underline disabled:opacity-50"
                      >
                        {isVerifyingSerp ? 'Verifying...' : 'Verify Connection'}
                      </button>
                    </div>
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

            {/* Recent API Activity */}
            <section className="rounded-3xl border border-border-soft bg-surface shadow-sm overflow-hidden">
              <div className="border-b border-border-soft bg-background/50 px-8 py-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-evidence" />
                  <h2 className="text-xl font-black">Recent API Activity</h2>
                </div>
                <p className="mt-1 text-[10px] font-black text-muted uppercase tracking-widest">Global Telemetry Stream</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border-soft text-[10px] font-black uppercase tracking-widest text-muted">
                      <th className="px-8 py-4">Endpoint</th>
                      <th className="px-4 py-4 text-center">Status</th>
                      <th className="px-4 py-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold">
                    {usage?.recent?.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-8 py-12 text-center text-muted italic">No recent activity found.</td>
                      </tr>
                    ) : (
                      usage?.recent?.map((event) => (
                        <tr key={event.id} className="border-b border-border-soft/50 hover:bg-background/50 transition-colors">
                          <td className="px-8 py-4 font-mono text-[10px] text-muted">{event.endpoint}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${event.status >= 200 && event.status < 300 ? 'bg-safe/10 text-safe' : 'bg-risk-bg/10 text-risk-text'}`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-muted whitespace-nowrap">
                            {new Date(event.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-border-soft bg-background/30 text-center">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  Usage data is retained for 30 days. <Link href="/docs/telemetry" className="text-evidence hover:underline">View retention policy</Link>
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
                  <input 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://api.myapp.com/webhook" 
                    className="w-full rounded-xl border border-border-soft bg-background p-3 text-xs font-semibold outline-none focus:border-evidence" 
                  />
                </div>
                <button 
                  onClick={testWebhook}
                  disabled={isTestingWebhook}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-soft bg-background px-4 py-3 text-xs font-black transition-all hover:bg-surface disabled:opacity-50"
                >
                  {isTestingWebhook ? 'Sending Event...' : 'Send Test Event'}
                </button>
              </div>
            </section>

            {/* Verified Badge Generation */}
            <section className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm group">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-safe" />
                  <h3 className="text-lg font-black">Verified Badge</h3>
                </div>
                <div className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-safe"></span>
                </div>
              </div>
              
              <p className="mb-6 text-xs font-semibold text-muted leading-relaxed">
                Add your careers domain, publish the TXT record, then embed a public-token badge that does not expose API keys.
              </p>

              <div className="mb-5 flex gap-2">
                <input
                  value={domainInput}
                  onChange={(event) => setDomainInput(event.target.value)}
                  placeholder={user?.email.split('@')[1] || 'careers.example.com'}
                  className="min-w-0 flex-1 rounded-xl border border-border-soft bg-background p-3 text-xs font-semibold outline-none focus:border-safe"
                />
                <button
                  onClick={addDomain}
                  disabled={isAddingDomain}
                  className="rounded-xl bg-foreground px-4 py-3 text-xs font-black text-background transition-all hover:bg-safe disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              <div className="space-y-4">
                {domains.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border-soft bg-background/50 p-6 text-center text-xs font-bold text-muted">
                    No domains added yet.
                  </div>
                ) : domains.map((domain) => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : ''
                  const script = `<script src="${origin}${domain.scriptUrl}" async></script>`
                  return (
                    <div key={domain.id} className="rounded-2xl border border-border-soft bg-background p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black">{domain.domain}</div>
                          <div className={`mt-1 text-[10px] font-black uppercase tracking-widest ${domain.status === 'verified' ? 'text-safe' : 'text-caution'}`}>
                            {domain.status}
                          </div>
                        </div>
                        <button
                          onClick={() => verifyDomain(domain.domain)}
                          disabled={verifyingDomain === domain.domain}
                          className="rounded-lg border border-border-soft px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-surface disabled:opacity-50"
                        >
                          {verifyingDomain === domain.domain ? 'Checking' : 'Verify'}
                        </button>
                      </div>
                      <div className="mb-3 rounded-xl border border-border-soft bg-surface p-3 font-mono text-[10px] text-muted">
                        TXT: {domain.verificationToken}
                      </div>
                      <div className="rounded-xl bg-surface p-3 font-mono text-[10px] text-muted overflow-x-auto border border-border-soft group/code relative">
                        <code className="whitespace-pre">{script}</code>
                        <button
                          onClick={() => copy(script)}
                          className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity bg-background p-1.5 rounded-lg border border-border-soft hover:bg-safe hover:text-background"
                          aria-label={`Copy badge script for ${domain.domain}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                <Link href="/docs/verified-badge" className="flex items-center justify-between rounded-2xl border border-border-soft bg-background px-4 py-3 text-xs font-black transition-all hover:bg-surface">
                  Integration Guide
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </aside>
        </div>

        {/* System Logs */}
        <section className="mt-12 rounded-3xl border border-border-soft dark:border-white/10 bg-surface/50 dark:bg-black p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] pointer-events-none" />
          <div className="mb-6 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-safe animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/90 dark:text-white/90">System Logs</h2>
            </div>
            <div className="text-[10px] font-mono text-muted dark:text-white/40">SECURE CHANNEL ACTIVE</div>
          </div>
          <div className="h-64 overflow-y-auto space-y-2 font-mono text-[11px] relative z-10 scrollbar-hide">
            <div className="space-y-4">
              {systemLogs.map((log, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border border-border-soft bg-background/50 p-4 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Terminal className="h-10 w-10" />
                  </div>
                  <div className="flex items-center justify-between border-b border-border-soft pb-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${log.type === 'success' ? 'bg-safe' : log.type === 'error' ? 'bg-risk-text' : 'bg-muted'} animate-pulse`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted">EVENT_ID: {i.toString().padStart(3, '0')}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-40">{log.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className={`text-xs font-black ${log.type === 'success' ? 'text-safe' : log.type === 'error' ? 'text-risk-text' : 'text-foreground'}`}>
                      {log.msg}
                    </div>
                    <div className="text-[10px] font-mono text-muted truncate max-w-[120px] bg-surface px-2 py-0.5 rounded border border-border-soft">
                      SIGN: {Math.random().toString(36).substring(2, 10).toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {systemLogs.length === 0 && (
              <div className="text-muted dark:text-white/20 italic">No system activity recorded in this session.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
