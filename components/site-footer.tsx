import Link from 'next/link'
import { BrandMark } from './brand-mark'
import { Code2, Globe, MessageSquare, ShieldCheck } from 'lucide-react'

const footerLinks = {
  product: [
    { label: 'Audit Engine', href: '/audit' },
    { label: 'Exploration', href: '/explore' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'API Portal', href: '/settings' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/docs/api-reference' },
    { label: 'SDK Quickstart', href: '/docs/sdk-quickstart' },
    { label: 'Agent Skills', href: '/docs/skills' },
  ],
  legal: [
    { label: 'Disclaimer', href: '/docs/legal' },
    { label: 'Security Whitepaper', href: '/docs/security' },
    { label: 'Rate Limiting', href: '/docs/rate-limiting' },
  ]
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border-soft bg-background pt-16 pb-12 print:hidden">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
          
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <BrandMark className="h-8 w-8" />
              <span className="text-xl font-black">HireProof</span>
            </Link>
            <p className="text-sm font-medium text-muted leading-relaxed mb-6">
              The human-centric filter for the "Dead Internet." We verify job posts with autonomous agentic forensics.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com/hireproof" target="_blank" rel="noreferrer" aria-label="HireProof GitHub" className="text-muted hover:text-foreground transition-colors">
                <Code2 className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/hireproof" target="_blank" rel="noreferrer" aria-label="HireProof social profile" className="text-muted hover:text-foreground transition-colors">
                <ShieldCheck className="h-5 w-5" />
              </a>
              <a href="https://discord.gg/hireproof" target="_blank" rel="noreferrer" aria-label="HireProof community chat" className="text-muted hover:text-foreground transition-colors">
                <MessageSquare className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-6">Product</h3>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm font-semibold text-muted hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-6">Resources</h3>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm font-semibold text-muted hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-6">Legal</h3>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm font-semibold text-muted hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border-soft flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-safe/20 bg-safe/5 px-3 py-1 text-[10px] font-black text-safe uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-safe"></span>
              </span>
              All Systems Operational
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest">
              <Globe className="h-3 w-3" />
              Vercel Edge
            </div>
          </div>
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">
            © 2026 HireProof. Built for the Hackathon.
          </p>
        </div>
      </div>
    </footer>
  )
}
