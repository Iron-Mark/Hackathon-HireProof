import { Metadata } from 'next'
import { Shield, Lock, EyeOff, Zap, Server, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Security Whitepaper | HireProof Docs',
  description: 'Detailed breakdown of the HireProof security architecture, threat model, and data privacy strategies.',
}

export default function SecurityPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Security Whitepaper</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          As a security middleware provider, HireProof maintains the highest standards of architectural integrity. This document outlines our threat model and defensive posture.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Shield className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Architecture & Threat Model</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border-soft bg-surface p-6">
            <h3 className="mb-3 flex items-center gap-2 font-black">
              <Lock className="h-4 w-4 text-safe" />
              SSRF Protection
            </h3>
            <p className="text-sm font-medium leading-relaxed text-muted">
              Our webhook engine utilizes a multi-layer egress proxy to prevent <strong>Server-Side Request Forgery (SSRF)</strong>. We block all internal IP ranges (RFC 1918) and cloud metadata endpoints (169.254.169.254) to ensure the agent cannot be used to probe internal infrastructure.
            </p>
          </div>

          <div className="rounded-2xl border border-border-soft bg-surface p-6">
            <h3 className="mb-3 flex items-center gap-2 font-black">
              <Server className="h-4 w-4 text-safe" />
              HMAC Signature Verification
            </h3>
            <p className="text-sm font-medium leading-relaxed text-muted">
              All agent-to-agent (A2A) communications via our Headless API utilize <strong>HMAC-SHA256</strong> signatures. This prevents replay attacks and ensures that only authorized automated pipelines can invoke high-volume investigations.
            </p>
          </div>

          <div className="rounded-2xl border border-border-soft bg-surface p-6">
            <h3 className="mb-3 flex items-center gap-2 font-black">
              <EyeOff className="h-4 w-4 text-safe" />
              Zero-PII Storage Strategy
            </h3>
            <p className="text-sm font-medium leading-relaxed text-muted">
              By default, HireProof utilizes a <strong>Hybrid Storage Engine</strong>. For self-hosted users, investigation data never leaves the local environment. For managed users, we utilize ephemeral storage with a strict 30-day TTL and optional client-side encryption.
            </p>
          </div>

          <div className="rounded-2xl border border-border-soft bg-surface p-6">
            <h3 className="mb-3 flex items-center gap-2 font-black">
              <Zap className="h-4 w-4 text-safe" />
              L7 DDoS Immunity
            </h3>
            <p className="text-sm font-medium leading-relaxed text-muted">
              We leverage <strong>Upstash Edge Rate Limiting</strong> to prevent "Denial of Wallet" attacks. Our middleware blocks high-frequency automated requests at the edge, before they reach the expensive LLM inference layer.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Globe className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Infrastructure Compliance</h2>
        </div>
        <div className="space-y-4">
          <p className="font-medium text-muted leading-relaxed">
            HireProof is designed to run in hardened environments. We enforce <strong>Strict Content Security Policies (CSP)</strong>, block MIME-sniffing, and utilize HSTS to ensure all connections are encrypted via TLS 1.3.
          </p>
          <div className="rounded-2xl border border-border-soft bg-surface p-8 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-muted mb-4">Current Security Status</p>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-safe">100%</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">TLS 1.3 Only</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-safe">256-bit</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">AES Encryption</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-safe">Edge</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Rate Limiting</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-surface p-8 text-center space-y-4">
        <h2 className="text-2xl font-black">Responsible Disclosure</h2>
        <p className="mx-auto max-w-2xl font-medium text-muted">
          Found a vulnerability? We welcome responsible disclosure from the security community. Please contact our security team at <strong className="text-foreground">security@hireproof.com</strong>.
        </p>
      </section>
    </div>
  )
}
