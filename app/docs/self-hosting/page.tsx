import { Metadata } from 'next'
import { CodeBlock } from '@/components/ui/code-block'
import { Server, ShieldCheck, Cpu, Terminal, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Self-Hosting Guide | HireProof Docs',
  description: 'Learn how to self-host HireProof on your own infrastructure with Bring Your Own Key (BYOK) support.',
}

export default function SelfHostingPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Self-Hosting HireProof</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          HireProof is designed to be fully portable. You can host it yourself on <strong className="text-foreground">Vercel</strong>, <strong className="text-foreground">Docker</strong>, or any Node.js environment.
        </p>
      </section>

      {/* Why Self-Host Marketing Section */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-soft bg-surface p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-safe/10 text-safe">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mb-1 font-black">Total Privacy</h3>
          <p className="text-xs font-medium text-muted leading-relaxed">
            Audit data and PII never leave your infrastructure. Perfect for sensitive job offer letters.
          </p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-surface p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-safe/10 text-safe">
            <Globe className="h-5 w-5" />
          </div>
          <h3 className="mb-1 font-black">Zero Cost</h3>
          <p className="text-xs font-medium text-muted leading-relaxed">
            No per-scan fees. A $5 VPS can handle thousands of audits using your own API keys.
          </p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-surface p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-safe/10 text-safe">
            <Server className="h-5 w-5" />
          </div>
          <h3 className="mb-1 font-black">Independence</h3>
          <p className="text-xs font-medium text-muted leading-relaxed">
            No vendor lock-in. You own the database (Redis or local) and the execution logic.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Cpu className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Architecture Portability</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          Thanks to our <strong className="text-foreground">Hybrid Storage Engine</strong>, the application does not strictly require a centralized database to function.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-background text-muted">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-black">Edge Ready</h3>
            <p className="text-sm font-medium text-muted">Optimized for Vercel Edge Functions and global distribution.</p>
          </div>
          <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-background text-muted">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-black">Zero-DB Fallback</h3>
            <p className="text-sm font-medium text-muted">Uses localStorage and local filesystem if Redis is unavailable.</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Terminal className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Quick Install</h2>
        </div>
        <div className="space-y-4">
          <p className="font-medium text-muted">1. Clone the repository and install dependencies:</p>
          <CodeBlock 
            language="bash"
            code={`git clone https://github.com/your-repo/hireproof.git
cd hireproof
npm install`}
          />
          
          <p className="font-medium text-muted">2. Configure your environment variables:</p>
          <CodeBlock 
            language="bash"
            code={`cp .env.example .env.local`}
          />
          
          <p className="font-medium text-muted">3. Add your own API keys for the BYOK model:</p>
          <CodeBlock 
            language="env"
            code={`# Required for Live Mode
MODEL_PROVIDER_KEY=your_openai_or_groq_key
SERPAPI_API_KEY=your_serpapi_key

# Optional: For global persistence
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=`}
          />
          
          <p className="font-medium text-muted">4. Build and run locally:</p>
          <CodeBlock 
            language="bash"
            code={`npm run build
npm run start`}
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Server className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Deployment Options</h2>
        </div>
        
        <div className="space-y-8">
          <div className="hireproof-card rounded-3xl border border-border-soft p-8">
            <h3 className="mb-4 text-xl font-black text-safe flex items-center gap-2">
              <Server className="h-5 w-5" />
              Docker & docker-compose
            </h3>
            <p className="mb-6 font-medium text-muted leading-relaxed">
              We provide a multi-stage Dockerfile that creates an ultra-lightweight standalone image. To start HireProof with one command:
            </p>
            <CodeBlock 
              language="bash"
              code={`# Start the container
docker-compose up -d

# View logs
docker logs -f hireproof`}
            />
            <p className="mt-4 text-sm font-medium text-muted italic">
              Note: Ensure your .env.local file is configured before running docker-compose.
            </p>
          </div>

          <div className="hireproof-card rounded-3xl border border-border-soft p-8">
            <h3 className="mb-4 text-xl font-black">Vercel (Managed)</h3>
            <p className="mb-6 font-medium text-muted leading-relaxed">
              HireProof is optimized for Vercel. Simply push your repository to GitHub and connect it to a new Vercel project. All Edge functions and rate-limiting middleware will work out of the box.
            </p>
            <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="hireproof-focus inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 font-black text-background transition-colors hover:bg-safe">
              Deploy to Vercel
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
