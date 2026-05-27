# HireProof SEO implementation

HireProof uses `https://hireproof.tech` as the canonical public origin.

## Source of truth

- `lib/seo.ts` centralizes the canonical site URL, default metadata, shared Open Graph image, structured-data graph, and sitemap entries.
- `app/layout.tsx` owns global metadata and site-level JSON-LD for Organization, WebSite, and SoftwareApplication.
- `app/page.tsx` owns the homepage canonical URL and homepage Open Graph metadata.
- `app/sitemap.ts` exposes public indexable routes and intentionally excludes authenticated, private, report-history, and admin surfaces.
- `app/robots.ts` blocks API, admin, private report, settings, and pilot-admin paths while pointing crawlers to the canonical sitemap.
- `public/manifest.json` gives search surfaces and install surfaces a complete app identity, shortcuts, icons, and screenshot metadata.

## Indexing policy

Index:
- Homepage, audit entrypoint, public intelligence pages, pricing, pilot, proof, portfolio, lab, developer portal, and public docs.

Do not index:
- API routes, admin routes, private report IDs, report history, settings, and pilot-admin/export surfaces.

## Content policy

Keep SEO copy centered on employment fraud and suspicious job opportunities. Do not broaden public metadata into generic fraud detection, continuous learning, or in-house deepfake detection claims unless the implementation is verified.
