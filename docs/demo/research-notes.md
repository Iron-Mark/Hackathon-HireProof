# Research Notes

These notes support the HireProof demo narrative. Use them for speaker confidence, not as dense slide content.

## Key Findings

### 1. Job scams are a growing loss category

The FTC reported that job-scam losses more than tripled from 2020 to 2023 and exceeded $220 million in the first half of 2024. The same FTC data spotlight estimated that task scams accounted for 38.8% of job-scam reports in the first half of 2024, up from 5.6% in 2023.

Presentation implication: lead with urgency. This is not a novelty demo; it is a trust-and-safety problem.

### 2. The Philippines angle is credible

The UN Philippines warned in June 2025 that fake job vacancies were impersonating UN entities and targeting job seekers in the Philippines. The warning described vague job offers, upfront fees, false urgency, and realistic-looking documents.

BusinessWorld also reported that the Philippine SEC warned job seekers about job-offer scams spreading through Viber, Messenger, and Telegram, including tasking and recharging schemes that ask victims to deposit money to access paid tasks.

Presentation implication: the sample should use a messaging-app handoff and unrealistic compensation.

### 3. The product needs proof, not advice

The current user workflow is fragmented: search, news, local footprint, job comparisons, and recruiter-contact checks. A generic chatbot answer is less persuasive than a visible investigation timeline and evidence cards.

Presentation implication: do not demo chat. Demo a report.

### 4. Runtime MCP is technically relevant

v0 supports MCP integrations for connecting external tools during the build workflow. The AI SDK supports connecting to MCP servers and recommends HTTP transport for production deployments. It also supports schema-based structured outputs.

Presentation implication: describe HireProof as a runtime evidence pipeline, not just a v0-generated UI.

### 5. SerpApi fits the evidence loop

SerpApi Google Jobs returns structured job results, while Google News returns structured news results. Those fit HireProof's comparison and reputation checks. SerpApi also supports cache behavior for repeated Jobs queries, which is useful for demo reliability.

Presentation implication: name the exact evidence sources: Search, News, Jobs, and Local.

## Recommended Slide Proof Points

- "Job-scam losses topped $220M in the first half of 2024." - FTC
- "Task scams were estimated at 38.8% of job-scam reports in H1 2024." - FTC
- "Fake job vacancies impersonated UN entities in the Philippines." - UN Philippines
- "Philippine SEC warned about job scams through Viber, Messenger, and Telegram." - BusinessWorld report on SEC warning

## Sources

- FTC: [Paying to get paid: gamified job scams drive record losses](https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2024/12/paying-get-paid-gamified-job-scams-drive-record-losses)
- UN Philippines: [Fraudulent website impersonating UN agencies and posting fake job vacancies](https://philippines.un.org/en/295913-notification-fraudulent-website-impersonating-un-agencies-and-posting-fake-job-vacancies)
- BusinessWorld: [SEC cautions public against job offer scams](https://www.bworldonline.com/corporate/2025/07/21/686315/sec-cautions-public-against-job-offer-scams/)
- FBI: [Cryptocurrency Job Scams](https://www.fbi.gov/how-we-can-help-you/victim-services/national-crimes-and-victim-resources/cryptocurrency-job-scams)
- v0: [MCP Integrations](https://v0.app/docs/MCP)
- AI SDK: [Model Context Protocol tools](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
- AI SDK: [Generating structured data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- SerpApi: [Google Jobs API](https://serpapi.com/google-jobs-api)
- SerpApi: [Google News API](https://serpapi.com/google-news-api)
