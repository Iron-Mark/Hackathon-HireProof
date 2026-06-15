# HireProof Product Context

## Product Thesis
Job-scam verification service with meaningful SEO/PWA foundations but roadmap pressure around canonical enforcement and client-side weight.

## Audience
Job seekers, recruiters, developers, scam-reporting users, and SEO/performance maintainers.

## Current State From Sources
This context is synthesized from 2 inspected source files. The sources include:

- seo-performance-audit: 1
- roadmap: 1

## North Star
Make the scam-detection product crawlable, fast, canonical, installable, and progressively enhanced without losing the interactive audit/demo value.

## Product and UX Priorities
- Enforce canonical host behavior with permanent redirects and matching metadata.
- Audit heavy client components such as navigation, scanning demos, labs, and animated sections; move static content back to server-rendered output.
- Preserve structured data and PWA metadata while testing Open Graph, Twitter, manifest, and crawl behavior.
- Optimize LCP images/assets and reduce long tasks that hurt INP.
- Create measurement gates for Core Web Vitals and SEO crawl health before more interactive features are added.

## High-Signal Suggestions From Sources
- `HireProof.tech - Performance and SEO Review.pdf`: Web.dev emphasises that images must
- `HireProof.tech - Performance and SEO Review.pdf`: alt-text on critical images
- `HireProof.tech - Performance and SEO Review.pdf`: highlights that tasks longer than 50 ms block interactions and degrade INP . Combining multiple
- `HireProof.tech - Performance and SEO Review.pdf`: means there is no offline caching or controlled network strategy. Critical assets (icons, fonts, API
- `HireProof.tech - Performance and SEO Review.pdf`: fetchpriority="high" as="image" href="/path-to-hero.webp"> . For Next.js, use the
- `HireProof.tech - Performance and SEO Review.pdf`: <Image> component with priority and fetchPriority="high" to hint that the image is the
- `HireProof.tech - Performance and SEO Review.pdf`: Inline critical CSS - Large global style sheets can block rendering even after the image is ready .
- `HireProof.tech - Performance and SEO Review.pdf`: Extract only the CSS required for the hero section and inline it in the document. Defer non-critical
- `HireProof.tech - Performance and SEO Review.pdf`: Suspense to run non-critical updates without blocking user interactions. Avoid heavy
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: bundles and degrade Core Web Vitals, especially Interaction to Next Paint (INP) . A phased plan below
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: than adding more animations. Treat each phase as a main quest ; finish it before starting
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Phase 1 - Foundation & SEO
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Phase 2 - Navigation & common layout
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Phase 3 - Demo & lab refactoring
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Phase 4 - Asset & performance optimisation
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: loading="lazy" for below-the-fold content. Preload only critical assets in the <head>.
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Defer non-critical scripts - Use defer on analytics scripts and load chat or third-party widgets
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: Phase 5 - Continuous monitoring & experimentation
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: search rankings. By following the phased plan above-starting with domain canonicalization, simplifying
- `HireProof.tech - SEO Performance and Roadmap Audit.pdf`: improved Core Web Vitals , and better crawlability while retaining a polished user experience. Each phase

## Constraints
- Preserve source document truth; do not invent features that are not supported by source context.
- Treat SEO/performance recommendations as implementation requirements only when the source docs describe them for this project.
- Treat missing evidence as a blocker or assumption, not as completed work.
