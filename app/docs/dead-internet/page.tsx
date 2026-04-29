import Link from 'next/link'
import { ShieldAlert, Cpu, Bot, UserCheck, AlertTriangle, Zap } from 'lucide-react'

export default function DeadInternetPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-risk-bg text-risk-text">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">The Dead Internet Theory</h1>
          <p className="text-muted font-medium">Why 40% of job listings are no longer human.</p>
        </div>
      </div>

      <div className="prose prose-slate prose-invert max-w-none">
        <p className="text-lg leading-relaxed text-muted font-medium">
          The <span className="text-foreground font-bold">Dead Internet Theory</span> suggests that the internet has been almost entirely overtaken by artificial intelligence, bots, and automated content. In the world of recruitment, this is no longer a theory—it is a reality.
        </p>

        <div className="my-10 rounded-2xl border border-risk-bg bg-risk-bg/20 p-6">
          <h2 className="mt-0 flex items-center gap-2 text-xl font-black text-risk-text">
            <ShieldAlert className="h-5 w-5" />
            The Automated Scam Crisis
          </h2>
          <p className="mb-0 text-sm font-medium leading-relaxed">
            Scammers are now using Large Language Models (LLMs) to generate thousands of unique, convincing job descriptions every hour. These bots post to LinkedIn, Indeed, and Telegram, then use automated chat scripts to "interview" candidates and steal their data or money.
          </p>
        </div>

        <h3 className="text-xl font-black">How HireProof Detects the "Dead Internet"</h3>
        <p>
          Our investigation engine looks for specific "Bot Signatures" that distinguish automated recruitment from human hiring:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-4 bg-surface">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-background">
              <Cpu className="h-5 w-5 text-evidence" />
            </div>
            <h4 className="font-bold">LLM Pattern Matching</h4>
            <p className="text-xs text-muted leading-relaxed">Detects the specific "polite-but-vague" linguistic patterns common in GPT-generated job descriptions.</p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-surface">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-background">
              <Bot className="h-5 w-5 text-risk-text" />
            </div>
            <h4 className="font-bold">Deployment Speed</h4>
            <p className="text-xs text-muted leading-relaxed">Cross-references identical listings appearing across 50+ domains in under 60 seconds—a physical impossibility for human recruiters.</p>
          </div>
        </div>

        <h3 className="mt-10 text-xl font-black">Reclaiming the Human Internet</h3>
        <p>
          HireProof serves as a "Proof of Human" filter. When we verify a company, we aren't just checking their registration; we are verifying a human footprint. 
        </p>

        <ul className="space-y-4 list-none p-0">
          <li className="flex gap-3">
            <UserCheck className="h-5 w-5 text-safe shrink-0 mt-1" />
            <div>
              <span className="font-bold block">Verified Human Recruiters</span>
              <span className="text-sm text-muted">We verify LinkedIn profiles against historical activity to ensure a real person is behind the desk.</span>
            </div>
          </li>
          <li className="flex gap-3">
            <Zap className="h-5 w-5 text-caution shrink-0 mt-1" />
            <div>
              <span className="font-bold block">Zero-Bot Guarantee</span>
              <span className="text-sm text-muted">Companies with the HireProof Seal have passed our manual and algorithmic "Human-in-the-loop" audit.</span>
            </div>
          </li>
        </ul>

        <div className="mt-12 rounded-2xl border border-border bg-background p-8 text-center">
          <h3 className="mt-0 font-black">Don't apply to a bot.</h3>
          <p className="text-muted">Use HireProof to filter out the noise of the dying internet.</p>
          <Link href="/audit" className="mt-4 inline-flex items-center justify-center rounded-lg bg-foreground px-6 py-2 text-sm font-bold text-background hover:bg-safe transition-colors">
            Run a Human-Check Audit
          </Link>
        </div>
      </div>
    </div>
  )
}
