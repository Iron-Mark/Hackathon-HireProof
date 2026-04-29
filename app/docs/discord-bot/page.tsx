import { Metadata } from 'next'
import { CodeBlock } from '@/components/ui/code-block'
import { MessageSquareWarning, ShieldCheck, Webhook } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Discord & Slack Bots | HireProof Docs',
  description: 'Build a Discord or Slack bot that automatically verifies job postings shared in your community.',
}

export default function DiscordBotPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Discord & Slack Bots</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Communities are the first line of defense. Integrate HireProof into a <strong className="text-foreground">Discord</strong> or <strong className="text-foreground">Slack</strong> bot to automatically scan jobs shared in your <code className="rounded bg-surface px-1.5 py-0.5 text-sm text-foreground">#job-board</code> channels.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <MessageSquareWarning className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Community Protection</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          When alumni networks, university clubs, or developer groups share jobs, scammers often sneak in. By setting up a bot that listens for URLs or job descriptions, you can automatically reply to messages with a HireProof Risk Score.
        </p>

        <div className="hireproof-card space-y-6 rounded-3xl border border-border-soft p-8">
          <h3 className="text-lg font-black">Node.js Discord.js Example</h3>
          <p className="text-sm font-medium text-muted">Here is a simple example using <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">discord.js</code> and the <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">hireproof-sdk</code>:</p>
          
          <CodeBlock
            language="typescript"
            code={`import { Client, GatewayIntentBits } from 'discord.js';
import HireProof from 'hireproof-sdk';

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});
const hireproof = new HireProof({ apiKey: process.env.HIREPROOF_API_KEY });

client.on('messageCreate', async (message) => {
  // Ignore bots and only listen in the job-board channel
  if (message.author.bot || message.channel.name !== 'job-board') return;

  // Simple heuristic: Does the message look like a job or contain a URL?
  if (message.content.length > 100 || message.content.includes('http')) {
    const loadingMsg = await message.reply('🔍 *HireProof Agent is investigating this post...*');
    
    try {
      // Send the Discord message text to the HireProof API
      const report = await hireproof.audit.investigate({
        text: message.content
      });

      // Format the response based on the verdict
      let replyText = \`**HireProof Verdict:** \${report.verdict.toUpperCase()}\\n\`;
      replyText += \`**Risk Score:** \${report.riskScore}/100\\n\\n\`;

      if (report.verdict === 'high-risk') {
        replyText = \`🚨 **WARNING: SCAM DETECTED** 🚨\\n\` + replyText;
        replyText += \`**Red Flags Found:**\\n\`;
        report.redFlags.forEach(flag => {
          replyText += \`- \${flag.description}\\n\`;
        });
      }

      await loadingMsg.edit(replyText);
    } catch (error) {
      await loadingMsg.edit('❌ *HireProof investigation failed.*');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);`}
          />
        </div>
      </section>

      <div className="rounded-2xl border border-evidence/30 bg-evidence/5 p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Webhook className="h-5 w-5 text-evidence" />
          <strong className="text-sm font-black uppercase tracking-wider text-evidence">Advanced Webhook Method</strong>
        </div>
        <p className="text-sm font-medium leading-relaxed text-evidence-text">
          If your Discord bot runs on serverless functions (like Cloudflare Workers or Vercel Edge) where keeping a WebSocket open is difficult, use the HireProof <strong>Async Webhooks</strong> feature. You can send the job to <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">/api/v1/audit</code> with a <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">webhook_url</code> pointing back to your Discord Interaction endpoint to follow up the slash command response!
        </p>
      </div>
    </div>
  )
}
