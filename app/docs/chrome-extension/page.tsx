import { Puzzle, Zap, ShieldCheck, ArrowRight, Info, MousePointer2 } from 'lucide-react'

export const metadata = { 
  title: 'Chrome Extension — HireProof Docs',
  description: 'Learn how to use the HireProof Chrome Extension to scan job posts directly from your browser.'
}

export default function ChromeExtensionPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Chrome Extension</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          The fastest way to verify a job post. Scan any listing on LinkedIn, Indeed, or Telegram without ever leaving the page.
        </p>
      </section>

      {/* Installation */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Puzzle className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Getting Started</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm">
            <h3 className="mb-2 font-black">1. Install</h3>
            <p className="text-sm font-medium text-muted leading-relaxed">
              Download the extension from the Chrome Web Store or load it locally from the <code className="bg-background px-1 rounded">/extension</code> directory in the repo.
            </p>
          </div>
          <div className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm">
            <h3 className="mb-2 font-black">2. Pin it</h3>
            <p className="text-sm font-medium text-muted leading-relaxed">
              Pin HireProof to your toolbar for instant access to the investigation console.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Zap className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Core Features</h2>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4 rounded-2xl border border-border-soft bg-surface p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-safe/10 text-safe">
              <MousePointer2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-black">Right-Click to Scan</h4>
              <p className="text-xs font-medium text-muted leading-relaxed">
                Highlight any text on a webpage, right-click, and select <strong>"Scan with HireProof"</strong>. The extension will automatically extract claims and start the investigation.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-border-soft bg-surface p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-evidence/10 text-evidence">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-black">Forensic Popup</h4>
              <p className="text-xs font-medium text-muted leading-relaxed">
                Open the extension popup to see the live Risk Score and Verdict without switching tabs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Spec */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Info className="h-6 w-6 text-muted" />
          <h2 className="text-2xl font-black">Technical Specifications</h2>
        </div>
        <p className="font-medium text-muted leading-relaxed">
          The extension is built on <strong>Manifest V3</strong>, ensuring compatibility with the latest browser privacy standards. It utilizes a background service worker to handle API communications securely.
        </p>
      </section>
    </div>
  )
}
