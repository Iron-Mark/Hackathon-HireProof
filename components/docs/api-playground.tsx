'use client'

import { useState } from 'react'
import { CodeBlock } from '@/components/ui/code-block'
import { Play, Terminal, Zap, Loader2 } from 'lucide-react'

export function ApiPlayground() {
  const [text, setText] = useState('Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.')
  const [apiKey, setApiKey] = useState('hireproof_agent_demo_key')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)

  const handleTest = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ text, mode: 'demo' }),
      })
      setResponse(await res.json())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-border-soft bg-surface overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between border-b border-border-soft bg-background/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-safe" />
          <span className="text-sm font-black uppercase tracking-wider">Live API Playground</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-safe animate-pulse" />
          <span className="text-[10px] font-black uppercase text-muted tracking-widest">Connected</span>
        </div>
      </div>

      <div className="grid gap-px bg-border-soft lg:grid-cols-2">
        {/* Input Side */}
        <div className="bg-surface p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted">Request Body (JSON)</label>
            <textarea
              value={JSON.stringify({ text }, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  if (parsed.text) setText(parsed.text)
                } catch (e) {}
              }}
              className="h-[200px] w-full rounded-xl border border-border-soft bg-background p-4 font-mono text-xs leading-relaxed outline-none focus:border-safe/30 focus:ring-4 focus:ring-safe/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted">API Key</label>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-xl border border-border-soft bg-background p-3 font-mono text-xs outline-none focus:border-safe/30 focus:ring-4 focus:ring-safe/5"
            />
          </div>
          <button
            onClick={handleTest}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-4 font-black text-background transition-all hover:bg-safe disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            {loading ? 'Executing Agent...' : 'Send Request'}
          </button>
        </div>

        {/* Output Side */}
        <div className="bg-background/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted">Response</label>
            {response && (
              <span className="rounded bg-safe/10 px-2 py-0.5 text-[10px] font-bold text-safe tracking-wide">
                200 OK
              </span>
            )}
          </div>
          <div className="h-[250px] overflow-auto rounded-xl border border-border-soft bg-surface/50 p-4 font-mono text-[11px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted animate-pulse font-black uppercase tracking-widest">
                Waiting for Agent...
              </div>
            ) : response ? (
              <CodeBlock 
                language="json"
                code={JSON.stringify(response, null, 2)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted/30 font-black uppercase tracking-widest italic">
                Send a request to see output
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="border-t border-border-soft bg-background/30 p-4 text-center">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
          Powered by the HireProof Headless API v1.0
        </p>
      </div>
    </div>
  )
}
