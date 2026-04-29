import { Metadata } from 'next'
import { CodeBlock } from '@/components/ui/code-block'
import { Mail, Webhook, Zap, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Email Forwarding Integration | HireProof Docs',
  description: 'Set up an inbound parse webhook to automatically verify forwarded recruiter emails.',
}

export default function EmailForwardingPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Email Forwarding</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Scammers almost always operate via email. By combining HireProof with an <strong className="text-foreground">Inbound Parse Webhook</strong>, you can allow users to simply forward suspicious emails to receive an automated safety report.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Mail className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">How Inbound Parsing Works</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          Services like <strong>SendGrid</strong>, <strong>Postmark</strong>, and <strong>Mailgun</strong> allow you to receive emails at a custom domain (e.g., <code className="rounded bg-surface px-1.5 py-0.5">scan@hireproof.app</code>) and instantly forward the parsed email body as a JSON payload to your server.
        </p>
        
        <div className="my-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex w-full flex-col items-center rounded-2xl border border-border-soft bg-surface p-6 sm:w-1/3">
            <Mail className="mb-3 h-8 w-8 text-muted" />
            <span className="text-sm font-bold">1. User Forwards Email</span>
            <span className="text-xs text-muted">To scan@yourdomain.com</span>
          </div>
          <div className="hidden h-0.5 w-12 bg-border-soft sm:block" />
          <div className="flex w-full flex-col items-center rounded-2xl border border-safe/30 bg-safe/5 p-6 sm:w-1/3">
            <Webhook className="mb-3 h-8 w-8 text-safe" />
            <span className="text-sm font-bold text-safe">2. Inbound Webhook</span>
            <span className="text-xs text-safe/80">Extracts text and hits API</span>
          </div>
          <div className="hidden h-0.5 w-12 bg-border-soft sm:block" />
          <div className="flex w-full flex-col items-center rounded-2xl border border-border-soft bg-surface p-6 sm:w-1/3">
            <Zap className="mb-3 h-8 w-8 text-muted" />
            <span className="text-sm font-bold">3. Auto-Reply</span>
            <span className="text-xs text-muted">Emails back the verdict</span>
          </div>
        </div>

        <div className="hireproof-card space-y-6 rounded-3xl border border-border-soft p-8">
          <h3 className="text-lg font-black">Implementation Example (Next.js Route Handler)</h3>
          <p className="text-sm font-medium text-muted">Here is how you would handle an incoming SendGrid Parse webhook, pass it to HireProof, and email the user back:</p>
          
          <CodeBlock
            language="typescript"
            code={`// app/api/webhooks/inbound-email/route.ts
import { NextResponse } from 'next/server';
import HireProof from 'hireproof-sdk';
import sgMail from '@sendgrid/mail';

const hireproof = new HireProof({ apiKey: process.env.HIREPROOF_API_KEY });
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(req: Request) {
  try {
    // 1. SendGrid sends the parsed email as multipart/form-data
    const formData = await req.formData();
    const fromStr = formData.get('from') as string;
    const textBody = formData.get('text') as string;
    
    // Extract the sender's email address using regex
    const senderEmail = fromStr.match(/<([^>]+)>/)?.[1] || fromStr;

    // 2. Send the raw email text to HireProof
    const report = await hireproof.audit.investigate({
      text: textBody,
      mode: 'live' // Skip cache for fresh emails
    });

    // 3. Format the automated reply
    let replySubject = \`HireProof Verdict: \${report.verdict.toUpperCase()}\`;
    if (report.verdict === 'high-risk') replySubject = \`🚨 SCAM DETECTED: Do Not Apply\`;

    const replyBody = \`
Hello,

We have investigated the job opportunity you forwarded.
Verdict: \${report.verdict.toUpperCase()} (Risk Score: \${report.riskScore}/100)

Summary: \${report.summary}

Red Flags:
\${report.redFlags.map(f => \`- \${f}\`).join('\\n')}

Stay safe,
The HireProof Team
    \`.trim();

    // 4. Send the reply back to the user
    await sgMail.send({
      to: senderEmail,
      from: 'scan@hireproof.app',
      subject: replySubject,
      text: replyBody,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Inbound email error:', error);
    return NextResponse.json({ error: 'Failed to process email' }, { status: 500 });
  }
}`}
          />
        </div>
      </section>

      <div className="rounded-2xl border border-evidence/30 bg-evidence/5 p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-evidence" />
          <strong className="text-sm font-black uppercase tracking-wider text-evidence">Best Practice</strong>
        </div>
        <p className="text-sm font-medium leading-relaxed text-evidence-text">
          Because LLMs can be vulnerable to Prompt Injection, ensure that you strip out potentially malicious HTML tags from the inbound email before passing it to the <code className="rounded bg-evidence/20 px-1.5 py-0.5 font-bold text-evidence">hireproof-sdk</code>. We recommend only using the plain <code className="rounded bg-evidence/20 px-1.5 py-0.5 font-bold text-evidence">text</code> body, rather than the <code className="rounded bg-evidence/20 px-1.5 py-0.5 font-bold text-evidence">html</code> body provided by your email parser.
        </p>
      </div>
    </div>
  )
}
