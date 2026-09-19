# AGOZI official website

Static official site for AGOZI, designed for deployment on Vercel and the canonical domain `www.agozi.eu`.

Key public pages: `/`, `/en/`, `/fonctionnement/`, `/usages/entretien-maison/`, `/usages/entretien-voiture/`, their English equivalents, and the legal/support pages.

No analytics, advertising or third-party font scripts are intentionally included.

## Design and assets

The homepages use the same quiet product-led design in French and English. The three screenshots in `assets/screenshots/` are authentic, unmodified user-supplied Android captures. CSS clips the system bars for presentation; clicking a screenshot opens the full original. English pages explicitly label the screenshots as French. No generated app UI is used.

Inter Variable is self-hosted in `assets/fonts/`, with its SIL Open Font License alongside it. The font is sourced from https://rsms.me/inter/. No font provider receives visitor requests.

## Checks

Run `node --test tests/site.test.mjs` for local asset and link integrity, canonical/hreflang checks, JSON-LD validation and mobile menu state tests. Browser verification is still needed for visual layout and real interactions.
