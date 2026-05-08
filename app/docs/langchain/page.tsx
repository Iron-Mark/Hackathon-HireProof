import { Metadata } from 'next'
import { CodeBlock } from '@/components/ui/code-block'
import { Bot, MessageSquare, ShieldCheck, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'LangChain & Custom Agents | HireProof Docs',
  description: 'Integrate HireProof as a custom Tool inside your LangChain or Vercel AI SDK agents.',
}

export default function LangchainPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">LangChain & Custom Agents</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Turn HireProof into a published <strong className="text-foreground">LangChain tool</strong> for your own AI agents. Let application or sourcing agents verify a job post before they draft, apply, message, or continue an automation.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Bot className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Install the Published Tool</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          The official package is live on npm as <a href="https://www.npmjs.com/package/@hireproof/langchain" className="font-black text-safe hover:underline">@hireproof/langchain</a>. It exports a ready-to-use DynamicStructuredTool helper, input schema, audit runner, and threshold helper.
        </p>
        <CodeBlock title="Terminal" code="npm install @hireproof/langchain @langchain/core zod" />

        <div className="hireproof-card space-y-6 rounded-3xl border border-border-soft p-8">
          <h3 className="text-lg font-black">TypeScript Implementation</h3>
          <p className="text-sm font-medium text-muted">Create a HireProof audit tool and call it directly, or pass it into a LangChain agent.</p>
          
          <CodeBlock
            language="typescript"
            code={`import { createHireProofAuditTool, isSafeEnough } from '@hireproof/langchain'

const hireProofTool = createHireProofAuditTool({
  apiKey: process.env.HIREPROOF_API_KEY,
  baseUrl: 'https://hireproof.tech',
  safeRiskThreshold: 40,
})

const report = await hireProofTool.func({
  text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
  location: 'Philippines',
  mode: 'demo',
})

if (!isSafeEnough(report)) {
  console.log('Stop the workflow and show the user the evidence.')
}`}
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Zap className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Vercel AI SDK Example</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          If you are using the Vercel AI SDK, you can achieve the exact same behavior using the <code className="rounded bg-surface px-1.5 py-0.5 text-sm text-foreground">tool()</code> function.
        </p>
        <div className="hireproof-card space-y-6 rounded-3xl border border-border-soft p-8">
          <CodeBlock
            language="typescript"
            code={`import { tool } from 'ai';
import { z } from 'zod';
import HireProof from 'hireproof-sdk';

const hireproof = new HireProof({ apiKey: process.env.HIREPROOF_API_KEY });

export const verifyJobTool = tool({
  description: 'Investigate a job post to see if it is a scam.',
  parameters: z.object({
    text: z.string().describe('The job description'),
  }),
  execute: async ({ text }) => {
    const report = await hireproof.audit.investigate({ text });
    return report;
  },
});

// Later in your generateText call:
// const result = await generateText({
//   model: openai('gpt-4o'),
//   tools: { verifyJobTool },
//   prompt: 'Should I apply to this job? [JOB_DESCRIPTION]'
// });`}
          />
        </div>
      </section>

      <div className="rounded-2xl border border-safe/30 bg-safe/5 p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-safe" />
          <strong className="text-sm font-black uppercase tracking-wider text-safe">System Prompts</strong>
        </div>
        <p className="text-sm font-medium leading-relaxed text-safe/80">
          When injecting this tool into an agent, ensure you add a system prompt enforcing its usage: <em>"You are a job application assistant. You MUST use the `verifyJobTool` on every job description before you agree to write a cover letter. If the tool returns a `high-risk` verdict, you must refuse to apply and warn the user."</em>
        </p>
      </div>
    </div>
  )
}
