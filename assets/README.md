# HireProof Brand Assets

This folder contains source and reusable brand assets for HireProof. The current app icon direction is the HP shield-bot mark: an AI bot, a shield frame, a white `H`, and a single green checked `P` for Proof.

Use [`docs/assets-index.md`](../docs/assets-index.md) as the current asset map for logos, social previews, platform avatars, Chrome Web Store graphics, and review helpers.

## Current App Icon Files

- `public/downloads/hireproof-hp-shield-bot-icon.png`: saved 1024x1024 source for the current shield-bot HP mark.
- `public/downloads/hireproof-hp-favicon-source.png`: favicon source copy used to regenerate browser and PWA icons.
- `assets/brand/current/hireproof-logo-horizontal.png`: horizontal dark-background lockup for README, docs, and headers.
- `assets/brand/current/hireproof-logo-horizontal-light.png`: horizontal light-background lockup for white docs and decks.
- `app/icon.png`: Next.js app icon source.
- `public/favicon.png`: full-size browser favicon fallback.
- `public/favicon-32x32.png` and `public/favicon-16x16.png`: small browser favicon sizes.
- `public/icon-192.png` and `public/icon-512.png`: PWA install icons.
- `public/apple-touch-icon.png`: iOS home-screen icon.
- `public/og-image.png`: current social preview image using the HP shield-bot identity.

## Archived Legacy Assets

- `brand/legacy/hireproof-logo.svg`: original horizontal logo, archived for reference only.
- `brand/legacy/hireproof-mark.svg`: original compact mark, archived for reference only.
- `brand/legacy/hireproof-wordmark.svg`: original text-only wordmark, archived for reference only.
- `brand/legacy/favicon.svg`: legacy favicon source, no longer wired as the active favicon.
- `brand/legacy/og-image.svg`: legacy Open Graph source, superseded by `public/og-image.png`.
- `brand/legacy/showcase-card.svg`: legacy showcase graphic, archived for reference only.
- `patterns/evidence-grid.svg`: background pattern for hero sections or presentation pages.
- `tokens/hireproof-brand.css`: CSS custom properties for app theming.
- `tokens/hireproof-brand.json`: structured brand tokens for design tools or docs.

## Brand Direction

HireProof should feel like an AI trust-and-safety agent for job seekers. The visual system uses:

- dark ink backgrounds
- safety green as the primary proof/action color
- warm white for high-contrast lettering
- shield, document, evidence-card, and verified-check motifs
- restrained glows that support trust rather than generic neon styling

## Usage Notes

- Use the HP shield-bot mark for favicons, app icons, Discord bot avatars, and compact logo placements.
- Use `assets/brand/current/hireproof-logo-horizontal.png` on dark backgrounds and `assets/brand/current/hireproof-logo-horizontal-light.png` on white docs or decks.
- Keep exactly one `P` in compact HP marks; the green checked `P` is the Proof symbol.
- Do not recolor verdict semantics: green means Safe, amber means Caution, red means High-Risk.
