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
          Turn HireProof into a <strong className="text-foreground">Primitive Tool</strong> for your own AI Agents. Allow your LLMs to autonomously verify job descriptions before taking actions.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Bot className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Building a HireProof Tool</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          If you are building an AI agent using LangChain, you can wrap the <code className="rounded bg-surface px-1.5 py-0.5 text-sm text-foreground">hireproof-sdk</code> into a Custom Tool. When your agent is asked to apply to a job, it can first use this tool to investigate the listing.
        </p>

        <div className="hireproof-card space-y-6 rounded-3xl border border-border-soft p-8">
          <h3 className="text-lg font-black">TypeScript Implementation</h3>
          <p className="text-sm font-medium text-muted">Here is how to create a custom LangChain DynamicStructuredTool for HireProof:</p>
          
          <CodeBlock
            language="typescript"
            code={`import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import HireProof from "hireproof-sdk";

const hireproof = new HireProof({ apiKey: process.env.HIREPROOF_API_KEY });

export const HireProofTool = new DynamicStructuredTool({
  name: "verify_job_post",
  description: "Investigates a job description or URL to determine if it is a scam or a legitimate opportunity. Always use this BEFORE applying to a job.",
  schema: z.object({
    jobText: z.string().describe("The full text of the job description or a URL"),
    location: z.string().optional().describe("The location of the job, if known"),
  }),
  func: async ({ jobText, location }) => {
    try {
      const report = await hireproof.audit.investigate({
        text: jobText,
        location: location
      });
      
      return JSON.stringify({
        verdict: report.verdict, // 'safe', 'caution', or 'high-risk'
        riskScore: report.riskScore,
        redFlags: report.redFlags,
        summary: report.summary
      });
    } catch (error) {
      return "Failed to verify the job post.";
    }
  },
});`}
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
