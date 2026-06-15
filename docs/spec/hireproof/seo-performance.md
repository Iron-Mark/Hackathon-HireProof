# HireProof SEO and Performance Plan

## Source Files
- `PDFs/Web Audits and SEO/HireProof.tech - Performance and SEO Review.pdf` - seo-performance-audit - HireProof.tech performance & SEO review Overview
- `PDFs/Web Audits and SEO/HireProof.tech - SEO Performance and Roadmap Audit.pdf` - roadmap - HireProof.tech Audit - SEO, Performance & Roadmap

## Performance Thesis
The source documents treat performance as product quality. SEO metadata alone is not enough; implementation must protect Core Web Vitals, canonical clarity, crawlable content, image discovery, and low client-side JavaScript cost.

## Requirements From Sources
- `HireProof.tech - Performance and SEO Review.pdf`: integrations. It uses a public manifest to make the site installable (PWA) and centralizes SEO metadata in
- `HireProof.tech - Performance and SEO Review.pdf`: lib/seo.ts for canonical URLs and structured data【filecite†turn5file0†L9-L17】. The repository
- `HireProof.tech - Performance and SEO Review.pdf`: preloaded if referenced via CSS .Without explicit image
- `HireProof.tech - Performance and SEO Review.pdf`: preloading or
- `HireProof.tech - Performance and SEO Review.pdf`: fetchpriority , the
- `HireProof.tech - Performance and SEO Review.pdf`: uses heavy client-side JavaScript. Web.dev
- `HireProof.tech - Performance and SEO Review.pdf`: browser to respond sooner .Client-side tasks such as
- `HireProof.tech - Performance and SEO Review.pdf`: Web.dev emphasises that images must
- `HireProof.tech - Performance and SEO Review.pdf`: SEO and metadataThe documentation centralizes canonical
- `HireProof.tech - Performance and SEO Review.pdf`: URLs, Open Graph metadata and
- `HireProof.tech - Performance and SEO Review.pdf`: description【filecite†turn6file0†L4-L23】.Centralizing metadata is
- `HireProof.tech - Performance and SEO Review.pdf`: alt-text on critical images
- `HireProof.tech - Performance and SEO Review.pdf`: highlights that tasks longer than 50 ms block interactions and degrade INP . Combining multiple
- `HireProof.tech - Performance and SEO Review.pdf`: add kilobytes of JavaScript. Each added script increases main-thread work and download time.
- `HireProof.tech - Performance and SEO Review.pdf`: If the hero uses a background image in CSS, explicitly preload it via <link rel="preload"
- `HireProof.tech - Performance and SEO Review.pdf`: fetchpriority="high" as="image" href="/path-to-hero.webp"> . For Next.js, use the
- `HireProof.tech - Performance and SEO Review.pdf`: <Image> component with priority and fetchPriority="high" to hint that the image is the
- `HireProof.tech - Performance and SEO Review.pdf`: Avoid lazy loading above-the-fold images - Do not set loading="lazy" on the hero image.
- `HireProof.tech - Performance and SEO Review.pdf`: Inline critical CSS - Large global style sheets can block rendering even after the image is ready .
- `HireProof.tech - Performance and SEO Review.pdf`: Reduce Interaction to Next Paint (INP)
- `HireProof.tech - Performance and SEO Review.pdf`: tasks. For example, update UI and show spinners immediately, then defer network calls or analytics
- `HireProof.tech - Performance and SEO Review.pdf`: computations on the client; offload analysis to API endpoints or serverless functions.
- `HireProof.tech - Performance and SEO Review.pdf`: Reduce JavaScript bundle size - Audit dependencies and remove unused icons, animations or
- `HireProof.tech - Performance and SEO Review.pdf`: them to avoid re-downloads on each visit. If using next/font/local , self-host fonts and preload
- `HireProof.tech - Performance and SEO Review.pdf`: SEO & metadata improvements
- `HireProof.tech - Performance and SEO Review.pdf`: Accessible images - Add descriptive alt attributes to hero images and icons. Use meaningful
- `HireProof.tech - Performance and SEO Review.pdf`: Optimize sitemaps and robots - Ensure private pages (report history, settings, API routes) remain
- `HireProof.tech - Performance and SEO Review.pdf`: sitemaps to Google Search Console after deploying major changes.
- `HireProof.tech - Performance and SEO Review.pdf`: Monitor Web Vitals in the field - Integrate Google’s web-vitals library or Vercel’s Analytics to
- `HireProof.tech - Performance and SEO Review.pdf`: metadata and a comprehensive PWA manifest. However , the dynamic nature of the audit interface and the
- `HireProof.tech - Performance and SEO Review.pdf`: heavy use of client-side scripts risk degrading Core Web Vitals. By preloading and prioritizing hero assets,
- `HireProof.tech - Performance and SEO Review.pdf`: metadata, the site can deliver faster , more stable pages and improved search visibility. These changes will
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: HTML head, and the canonical URL points to hireproof.tech rather than www. A large amount of
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: content is served through Next.js client components, including a complex nav bar , interactive scanning
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: bundles and degrade Core Web Vitals, especially Interaction to Next Paint (INP) . A phased plan below
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: prioritizes SEO fixes, reduction of client-side work and progressive enhancement.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Meaningful meta tags & JSON-LD - The <head> includes meta description, keywords, canonical
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: canonicalThe canonical tag references https://hireproof.tech , but there is no
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: 301 redirect to enforce the preferred URL. www.hireproof.tech should
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: permanently redirect to hireproof.tech to prevent duplicate indexing and
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: navigationThe header ( site-header.tsx ) is a client component with imports of
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: clientThe LabClient component orchestrates an audit workflow: it tracks steps,
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: client increases JS load and complexity; unused code ships to all users.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: these animations add ~20KB+ to the bundle.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: if JS is disabled. Search engines can crawl Next.js routes, but unnecessary client
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: hydration can hurt SEO and accessibility.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Permanent redirect - Configure a 301 redirect from www.hireproof.tech to hireproof.tech
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: (and ensure HTTP→HTTPS) to consolidate signals. Keep the canonical pointing to the apex domain
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Robots & sitemap - Generate a dynamic sitemap.xml and robots.txt via Next.js API route.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: private/dynamic demo routes. Submit the sitemap to Google Search Console.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: renders static HTML and CSS. Only the theme toggle and search/command menu should be client
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: URL; avoid usePathname in most cases. This will shrink the JS bundle significantly.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: demonstration pages into a /demo subdirectory and mark them as client components. Use next/
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: them. Do not include their scripts in the main bundle.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Move the lab workflow server-side - The LabClient component handles the entire audit
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: workflow on the client . Migrate this logic to an API route and handle stream parsing server-side.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: On the client, show a <form> that posts to the API and returns a full report; if progressive
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: to avoid blocking the main thread. This will improve INP and reduce user CPU usage.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Optimize images and icons - Replace inline SVG icons imported from lucide-react with next/
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: image and next/font icons or a sprite sheet. Use priority for hero images and
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: loading="lazy" for below-the-fold content. Preload only critical assets in the <head>.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Defer non-critical scripts - Use defer on analytics scripts and load chat or third-party widgets
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Phase 5 - Continuous monitoring & experimentation
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: the site’s reliance on heavy client-side components and animations harms performance and could hurt
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: search rankings. By following the phased plan above-starting with domain canonicalization, simplifying
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: improved Core Web Vitals , and better crawlability while retaining a polished user experience. Each phase

## Implementation Checks
- Confirm canonical host, redirects, robots, sitemap, Open Graph/Twitter metadata, and structured data where the source docs require them.
- Identify the real LCP element and ensure it is discoverable early, sized correctly, compressed, and preloaded or fetch-prioritized only when appropriate.
- Reduce client-side JavaScript by moving static content to server-rendered output and isolating interaction into small client islands.
- Audit hydration, long tasks, animations, wallet/Web3 code, analytics scripts, and third-party scripts for INP/TBT risk.
- Record measurements with Lighthouse/PageSpeed/Web Vitals/field telemetry when available; do not claim pass/fail without evidence.

## Acceptance Criteria
- Each source recommendation above is implemented, explicitly deferred with reason, or marked blocked by missing external data.
- Core Web Vitals targets are tracked: LCP under 2.5s, INP under 200ms, CLS under 0.1 at the 75th percentile when field data exists.
- SEO checks include canonical URL behavior, sitemap/robots status, metadata, crawlable content, and social preview behavior.
