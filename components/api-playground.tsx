'use client'

import { useState } from 'react'
import { CodeBlock } from './ui/code-block'
import { Play, Terminal, Zap, Loader2 } from 'lucide-react'

export function ApiPlayground() {
  const [text, setText] = useState('Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)

  const handleTest = async () => {
    setLoading(true)
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500))
    
    // Use the demo logic to return a JSON response
    const mockRes = {
      id: "audit_98231",
      verdict: "high-risk",
      riskScore: 92,
      analysis: "Listing displays multiple scam patterns including unrealistic salary and non-standard communication.",
      flags: [
        { type: "salary", severity: "high", message: "Pay is 10x market rate for role" },
        { type: "contact", severity: "high", message: "Telegram used for primary hiring" }
      ],
      metadata: {
        latency: "1.2s",
        model: "hireproof-agent-v1"
      }
    }
    setResponse(mockRes)
    setLoading(false)
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
