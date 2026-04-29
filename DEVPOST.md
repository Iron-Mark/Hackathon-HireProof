# HireProof - Devpost Submission Draft

## 💡 Inspiration
Job scams are becoming increasingly sophisticated. Scammers clone real job posts, create fake company websites, and conduct fraudulent interviews to steal identities and money from desperate job seekers. We realized that simply "Googling the company" wasn't enough anymore—people needed a dedicated, AI-powered investigator to cross-reference claims, find the real hiring channels, and verify local footprints in seconds. We built **HireProof** to act as a personal security detail for every applicant.

## 🚀 What it does
HireProof is an Omni-Modal AI Agent that acts as an automated background checker for job listings. 
When a user pastes a job description, a recruiter's message, or a URL into the platform (or uses our Chrome Extension directly on LinkedIn/Indeed), the HireProof Agent wakes up. 
It instantly decomposes the text to extract the core claims (Company, Role, Salary, Location) and then utilizes a suite of concurrent external tools to:
1. **Verify Company Presence:** Cross-references official domains against known scam registries.
2. **Check Reputation Signals:** Searches news outlets for "scam" or "fraud" reports related to the company.
3. **Compare Market Rates:** Benchmarks the offered salary against legitimate listings to detect "too good to be true" bait.
4. **Verify Local Footprint:** Checks map directories for a physical business footprint.

It then compiles all this visible evidence into a comprehensive **Audit Report**, returning a final verdict of **SAFE**, **CAUTION**, or **HIGH-RISK**, complete with a verifiable risk score and receipts.

## 🛠️ How we built it
We built HireProof with an unapologetic focus on modern architecture, security, and agentic AI.

- **Frontend & Core Framework:** Next.js 16 (App Router), React 19, Tailwind CSS 4.0, and Framer Motion for a premium, native-feeling UI.
- **Agentic AI Engine:** Powered by the Vercel AI SDK and Groq (Llama-3/Gemini) for hyper-fast reasoning, combined with SerpApi for live web intelligence.
- **Omni-Modal Architecture:** We didn't just build a web app. We built a headless `v1/audit` API, an **MCP (Model Context Protocol) Server**, a TypeScript SDK, and a Chrome Extension, meaning HireProof can be accessed anywhere.
- **Security Middleware for AI Agents:** Developers building automated job-hunting pipelines (via n8n, Make.com, or LangChain) can plug HireProof into their workflows as a mandatory security filter. If the AI detects a `high-risk` verdict, the pipeline halts, protecting the user's resume and PII from being automatically submitted to phishing scams.
- **Enterprise Infrastructure:** Deployed on Vercel Edge. We implemented a **Hybrid Database Architecture** using Upstash Redis for global rate-limiting and permanent storage of shareable investigation links, perfectly gracefully degrading to local storage for zero-cost local development.

## 🚧 Challenges we ran into
The hardest part was managing "AI Hallucinations" versus "Hard Evidence." In early iterations, the AI would sometimes guess if a job was real based on the tone of the text. We had to strictly enforce a "Receipts Only" policy, stripping the AI of its autonomy to guess and forcing it to rely *only* on the JSON evidence returned by our concurrent web-scraping tools. 

Additionally, securing the platform against abuse was a massive undertaking. We had to implement deep IP-resolved SSRF protection to prevent malicious webhooks, and distributed L7 rate-limiting across serverless cold-starts to prevent "Denial of Wallet" attacks on our LLM billing.

## 🎉 Accomplishments that we're proud of
1. **The Architecture:** We built a genuinely secure, production-ready platform. It features global security middleware, strict CSP headers, and protection against CSRF, SSRF, and Prototype Pollution. It isn't just a prototype; it's an enterprise-grade fortress.
2. **The Speed:** By leveraging Groq and running our evidence-gathering functions concurrently, complex multi-vector investigations complete in under 5 seconds.
3. **The Omni-Modal Approach:** The fact that the same core AI engine powers the Web App, the Chrome Extension, and the Headless API proves the flexibility of our design.
4. **B2C Automation Protection:** Empowering developers to safely build automated job application agents without the fear of their AI carelessly leaking PII to scammers.

## 📚 What we learned
Building an "Agent" is less about prompt engineering and more about strict orchestrations and security boundaries. We learned how to securely expose internal tools via the Model Context Protocol (MCP) while maintaining absolute control over the execution environment.

## ⏭️ What's next for HireProof
1. **WAF Integration:** Moving our edge rate-limiter behind a dedicated Web Application Firewall (WAF) for deeper packet inspection.
2. **Automated Takedowns:** Integrating with domain registrars to automatically file abuse reports for confirmed scam domains.
3. **Enterprise Dashboard:** A B2B portal for recruiting agencies to bulk-verify their inbound vendor requests.
