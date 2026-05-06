/loop

# T5 — Make Luv & Ker real

Ed's first real client demo target. Stop scaffolding; pull Felicia's actual
products + copy + imagery from `02 felicias aqua portal work/` into
`04-the-final-portal/clients/luv-and-ker/`. End-state: open the URL, see a
real-looking ecommerce site with Felicia's vibe.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.

## HARD BOUNDARIES — do NOT touch

- `04-the-final-portal/milesymedia website/` — Ed owns this.
- `04-the-final-portal/business-os/` — Ed owns this.
- `04-the-final-portal/clients/compass-coaching/` — already shipped, don't churn.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/eds requirments.md` (Felicia is THE reference)
3. `01 development/context/prior research/04-client-portal-luv-and-ker.md` (R1)
4. `01 development/context/prior research/04-client-portal-second.md` (R2)
5. `02 felicias aqua portal work/` — read-only reference for SKUs, copy,
   imagery, brand tokens.
6. `01 development/messages/terminal-5/from-orchestrator.md`

## Scope

**Phase A — Real product catalogue**
- Replace placeholder products with Felicia's real SKUs from `02`. 6–10
  products minimum. Real names, prices, descriptions, variants.
- Copy real images from `02` into `clients/luv-and-ker/public/products/`.
  Wire ProductGrid + ProductDetail blocks.

**Phase B — Real copy + sitemap**
- Homepage hero / about / contact / FAQ — pull Felicia's voice from `02`.
  Draft new copy where `02` is silent; flag drafted copy in chapter so
  Felicia can review.
- Working sitemap: `/`, `/shop`, `/shop/[slug]`, `/cart`, `/checkout`,
  `/account`, `/contact`, `/about`. End-to-end `<Link>` graph.

**Phase C — Brand polish**
- Pull real brand tokens from `02` if present. Real favicon + wordmark.
- Adopt T4's polish primitives in-tree (already in compass-coaching for
  reference).

**Phase D — Smoke + chapter**
- Smoke: real product slugs return 200, price renders, images load,
  cart add/remove works, checkout up to Stripe handoff (test mode).
- Chapter `04-client-portal-luv-and-ker-real.md`. MASTER row. Update
  the R1 chapter with a "went real" pointer line.

## NOT in scope

- Real Stripe live mode (test keys throughout).
- Email + domain wiring (T6's job).
- New plugins.
- Touching compass-coaching.

## Loop discipline

Standard. Phase A is the heaviest. Per-phase commit.

## When done

DONE + COMMIT; chapter; MASTER row; tasks row.
