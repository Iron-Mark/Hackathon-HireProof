# HireProof Security Audit & Hardening

HireProof is built with a **Zero-Trust AI Architecture**. Every layer of the stack—from the network edge to the LLM orchestration—is hardened against modern attack vectors.

## 1. Network & Transport Security

### 🔒 Strict-Transport-Security (HSTS)
We enforce HTTPS at the browser level. Once a user visits HireProof, their browser is cryptographically instructed to never use unencrypted HTTP for a full year, neutralizing SSL Stripping and MitM attacks.

### 🛡️ Content Security Policy (CSP)
Our CSP is configured to block almost all external asset loading except for trusted domains.
- `frame-ancestors 'none'`: Completely prevents Clickjacking by blocking the app from being embedded in iframes.
- `object-src 'none'`: Blocks the execution of plugins like Flash.
- `frame-src 'none'`: Prevents the app from embedding untrusted external frames.

### 🚫 Information Disclosure
We have disabled the `X-Powered-By: Next.js` header to hide our technology stack from automated vulnerability scanners.

---

## 2. API & Authentication

### ⏱️ Timing Attack Resistance
API key verification utilizes `crypto.timingSafeEqual()`. This ensures that key comparisons take exactly the same amount of time regardless of whether the key is correct or partially correct, neutralizing nanosecond-level side-channel attacks.

### 🔗 Webhook HMAC Signing
All outgoing webhooks are cryptographically signed using `HMAC-SHA256` with the user's `AGENT_API_KEY`. This allows third-party integrators to verify that the payload originated from HireProof and hasn't been tampered with in transit.

### 🕵️ SSRF Protection (Deep IP Verification)
The headless API implements multi-layer SSRF protection for outgoing webhooks:
- **Hostname Blacklisting:** Blocks literal requests to `localhost`, `127.0.0.1`, and `.local` domains.
- **DNS Resolution Check:** Before every webhook call, we resolve the target hostname to its IP address and verify it against private/local IP ranges (`10.x`, `192.168.x`, etc.). This prevents DNS Rebinding and obfuscated IP encoding bypasses.

### 🚦 Hybrid Distributed Rate Limiting
We implement a multi-layer rate limiting strategy to protect against "Denial of Wallet" and credential stuffing attacks.
- **Enterprise Layer (Upstash Redis):** If configured, HireProof uses distributed sliding-window rate limiting via Upstash Redis. This ensures that limits are synchronized across all serverless edge instances, providing global protection.
- **Portability Layer (In-Memory):** If Redis is not configured, the app gracefully degrades to an in-memory token bucket. This maintains the "zero-cost" portability model for local developers while still providing per-instance protection.

---

## 3. AI & Prompt Engineering

### 🧱 Cryptographic Prompt Delimiters
User-provided text is wrapped in randomized, cryptographic delimiters (e.g., `<|SYSTEM_BOUNDARY_ID|>`). The system prompt is explicitly instructed to never interpret text between these boundaries as instructions, neutralizing standard Prompt Injection attacks.

### 📉 Token Striping
We implement strict token and length limits on all LLM inputs. This prevents "Denial of Wallet" attacks and ensures that oversized malicious payloads are truncated before processing.

### 🚥 Global Security Middleware
We implement a top-level `middleware.ts` that filters all incoming traffic before it reaches our routes.
- **Bot Blocking:** Automatically detects and blocks requests from known vulnerability scanners (sqlmap, nikto, etc.).
- **Header Size Limits:** Enforces a 16KB limit on total header size to prevent "Large Header" Denial of Service attacks.
- **Anti-Sniffing:** Enforces `X-Content-Type-Options: nosniff` globally.

### 🛡️ CSRF Mandatory Origin Verification
Our standard audit API enforces a mandatory `Origin` or `Referer` check for all non-GET requests. If both headers are missing or originate from an untrusted source, the request is rejected with a `403 Forbidden`, neutralizing Cross-Site Request Forgery even in older or misconfigured browsers.

---

## 4. Application Logic & Persistence

### ☣️ ReDoS Mitigation
All Regular Expressions used for role, salary, and claim extraction are strictly bounded (e.g., `{0,40}` quantifiers instead of `*`). This prevents Catastrophic Backtracking (Regex Denial of Service) attacks.

### 🛡️ Prototype Pollution Defense
The database layer (`lib/db.ts`) utilizes `Object.create(null)` for in-memory stores. This ensures that malicious data containing keys like `__proto__` or `constructor` cannot inject properties into the base Javascript `Object` prototype, neutralizing Prototype Pollution attacks.

### 🔐 Atomic DB Persistence
The filesystem database (`reports.json`) uses a mutex-locked atomic write pattern. Data is written to a temporary file and renamed to the target file, ensuring that concurrent writes or server crashes never result in a corrupted or partial database state.

### 📁 Path Traversal Guards
All dynamic routes and database lookups implement strict regex guards and character stripping (`/`, `\`, `..`) to ensure that an attacker cannot read arbitrary files from the server environment.

### 🆔 High-Entropy UUIDs
Report IDs are generated using `crypto.randomUUID()`. With 128-bit entropy, these IDs are mathematically impossible to guess or brute-force, ensuring the privacy of user investigations.

---

## 5. UI & Extensions

### 🧪 XSS Sanitization
- **URL Protocols:** All AI-generated links are passed through a protocol validator that strictly allows `http:` and `https:`, blocking `javascript:` URI attacks.
- **DOM Isolation:** The Chrome Extension uses `textContent` instead of `innerHTML` for all AI-provided flags, ensuring the browser treats the output as non-executable text nodes.
- **MIME Blacklisting:** File uploads are strictly validated for raster image MIME types (`jpeg`, `png`, `webp`), blocking malicious SVG XSS and binary payload drops.

---

## 🏗️ Future Hardening
- **JWT Rotation:** Moving from static API keys to rotating JWTs for the Headless API.
- **WAF Integration:** Deploying behind a Cloudflare WAF for deeper L7 protection.
- **Formal Audit:** Engaging third-party penetration testers for the v1.0 release.
