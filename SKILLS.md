# HireProof Agent Skills

These are the 4 open investigation skills exposed by HireProof via its MCP (Model Context Protocol) server.
Any AI agent or LLM client that supports MCP can call these tools directly.

**MCP Server Endpoint:** `https://hireproof-sigma.vercel.app/api/mcp`
**Authentication:** `x-api-key: hireproof_agent_demo_key` (public demo key)

---

## Skill 1: `search_company`

**Description:** Searches Google for a company's official website, LinkedIn page, domain registration, and overall web presence. Returns a list of evidence items with source URLs and snippets.

**Use when:** You need to verify whether a company legitimately exists on the web and has a credible online footprint.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_name` | `string` | Yes | The company name to investigate |
| `role` | `string` | No | Role title for context-aware search |

### Example Call

```json
{
  "method": "tools/call",
  "name": "search_company",
  "arguments": {
    "company_name": "Accenture",
    "role": "Frontend Developer"
  }
}
```

### Example Response

```json
{
  "content": [{
    "type": "text",
    "text": "[{\"source\":\"Google\",\"snippet\":\"Accenture is a global professional services company...\",\"url\":\"https://accenture.com\",\"type\":\"Company Check\"}]"
  }]
}
```

---

## Skill 2: `news_check`

**Description:** Searches Google News for scam reports, fraud warnings, negative press, and reputation signals about a company. Returns news articles with publication dates and URLs.

**Use when:** You need to check whether a company has been flagged for fraud, scams, or deceptive practices in the public press.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_name` | `string` | Yes | The company name to search news for |
| `keywords` | `string[]` | No | Additional keywords (e.g. `["scam", "fraud"]`) |

### Example Call

```json
{
  "method": "tools/call",
  "name": "news_check",
  "arguments": {
    "company_name": "TechStart Solutions",
    "keywords": ["scam", "fraud", "fake"]
  }
}
```

---

## Skill 3: `jobs_compare`

**Description:** Searches active job boards (LinkedIn, Indeed, Glassdoor via Google) for comparable roles to benchmark the offered salary and requirements against the current market. Detects "too good to be true" salary bait.

**Use when:** You need to verify whether an offered salary is realistic for a given role and location.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `role` | `string` | Yes | The job title to compare |
| `location` | `string` | No | Geographic location for market context |
| `level` | `string` | No | Experience level (e.g. "Entry Level", "Senior") |

### Example Call

```json
{
  "method": "tools/call",
  "name": "jobs_compare",
  "arguments": {
    "role": "Frontend Intern",
    "location": "Philippines",
    "level": "Entry Level"
  }
}
```

---

## Skill 4: `local_presence`

**Description:** Searches Google Maps and business directories for a company's physical office address, registration, and local business footprint. Ghost companies often have no verifiable local presence.

**Use when:** You need to verify whether a company has a real physical address or is operating as a shell entity.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_name` | `string` | Yes | The company name to look up locally |
| `location` | `string` | No | City or region to search within |

### Example Call

```json
{
  "method": "tools/call",
  "name": "local_presence",
  "arguments": {
    "company_name": "Accenture",
    "location": "Philippines"
  }
}
```

---

## Using All Skills Together via curl

```bash
# List all available skills
curl https://hireproof-sigma.vercel.app/api/mcp \
  -H "x-api-key: hireproof_agent_demo_key"

# Call a specific skill
curl -X POST https://hireproof-sigma.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: hireproof_agent_demo_key" \
  -d '{"method":"tools/call","name":"search_company","arguments":{"company_name":"Accenture"}}'
```

## Using with the TypeScript SDK

```typescript
import HireProof from 'hireproof-sdk'

const client = new HireProof({
  apiKey: 'hireproof_agent_demo_key',
  baseUrl: 'https://hireproof-sigma.vercel.app',
})

// Call any individual skill
const result = await client.mcp.callTool('search_company', {
  company_name: 'Accenture',
  role: 'Frontend Developer',
})
console.log(result.content[0].text)
```

## Using with Claude / Cursor / any MCP-compatible client

Add this to your MCP configuration:

```json
{
  "mcpServers": {
    "hireproof": {
      "url": "https://hireproof-sigma.vercel.app/api/mcp",
      "headers": {
        "x-api-key": "hireproof_agent_demo_key"
      }
    }
  }
}
```

---

## License 

These skills are open-source and free to use under the ISC License.
Source: [github.com/Iron-Mark/hackathon-v0-zero_to_agent](https://github.com/Iron-Mark/hackathon-v0-zero_to_agent)
