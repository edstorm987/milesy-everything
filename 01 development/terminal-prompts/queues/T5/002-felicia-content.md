/loop

# T5 — Round 002: Felicia content (WS-F R002)

Real product catalog + homepage + about + brand-page templates.
Populated from `ed-dropbox/luvandker/` source assets.

Plan: chapter #124 WS-F R002. Sprint 3.

## Pre-read

- T5 R001 portal scaffold.
- `ed-dropbox/luvandker/` (product photos, copy, brand assets).
- T2 ecommerce plugin (Product domain shape).

## Scope

**A** — Seed Felicia client's website-editor with:
- Homepage: hero (heritage tagline + product image) + 3-column features
  + product grid (top 3 sellers) + CTA + footer.
- About: story + brand pillars + founder photo.
- Product detail template (consumed by every Product page auto-generated
  from ecommerce).
- Contact page.

**B** — Seed Felicia ecommerce with 3+ real products (SKU, name,
description, price, images) — operator inputs from ed-dropbox/luvandker
during onboarding.

**C** — Brand-page templates (per chapter #67 brand-page-templates) —
ensure Felicia's brand kit drives every CSS-var so the look is hers.

**D** — SEO defaults per page (T3 R026 / R037 already shipped).

**E** — Manual smoke checklist in chapter — operator can browse the
storefront, view products, see brand consistency.

**F** — Chapter `04-felicia-content.md` + MASTER row.

## NOT in scope
- End-customer purchase flow (R003 + post-ship Stripe charges).
- Real Stripe checkout (post-ship).

## When done
DONE referencing `002-felicia-content.md`.
