# Components organization

This folder is grouped by responsibility so the app-level imports stay readable.

- `audit/`: audit form, investigation result UI, risk charts, screenshot/voice helpers, and audit visuals.
- `brand/`: reusable HireProof brand marks and trust badges.
- `docs/`: interactive components used by documentation pages.
- `layout/`: global shell pieces such as header, footer, and command menu.
- `marketing/`: homepage/product education sections and demo marketing widgets.
- `system/`: app-wide providers, theme controls, toasts, boundaries, and global feedback.
- `ui/`: low-level shared UI primitives.

Prefer adding new components to the narrowest feature folder first. Use `ui/` only for generic primitives that do not know about HireProof product behavior.