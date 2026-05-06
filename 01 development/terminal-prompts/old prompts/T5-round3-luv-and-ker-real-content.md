/loop

# T5 — Round 3: Make Luv & Ker real

R1 shipped the Luv & Ker portal scaffold; R2 shipped Compass Coaching as a
contrasting second target. The **multi-client variation pattern is validated**
(2 different industries, 2 plugin sets, 2 brand kits). R3 stops scaffolding
and turns Luv & Ker into a real, demoable Felicia portal — real product
seed, real copy, real images, real navigation flow.

## Working environment

Same as previous rounds. Folder is `04-the-final-portal/clients/luv-and-ker/`.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/eds requirments.md` (Felicia is THE reference customer)
3. `01 development/context/prior research/04-client-portal-luv-and-ker.md` (R1)
4. `01 development/context/prior research/04-client-portal-second.md` (R2)
5. `02 felicias aqua portal work/` — pull real product names + copy + brand
   tokens from Felicia's existing static site. **Read-only reference.**
6. `01 development/messages/terminal-5/from-orchestrator.md`

## Scope

**Phase A — Real product catalogue**
- Replace placeholder products in `clients/luv-and-ker/portal-config.json`
  (or wherever the seed lives) with Felicia's real SKUs from `02`. Names,
  prices, descriptions, variant options. 6–10 products minimum.
- Pull real product images from `02 felicias aqua portal work/` (copy into
  `public/products/`). Wire ProductGrid + ProductDetail blocks.

**Phase B — Real copy + navigation**
- Homepage hero, about copy, contact, FAQ — replace lorem with Felicia's
  voice. Keep tone polished but feel free to draft if `02` is silent on a
  section. Flag drafted copy in chapter so Felicia can review.
- Sitemap: `/`, `/shop`, `/shop/[slug]`, `/cart`, `/checkout`, `/account`,
  `/contact`, `/about`. Working `<Link>` graph end-to-end.

**Phase C — Real brand polish**
- Pull Felicia's actual brand tokens (primary/accent/font-stack/radius)
  from `02` if present; otherwise keep R1's pinks but tighten typography
  + spacing using T4's polish primitives in-tree.
- Real favicon + wordmark from `02`.

**Phase D — Smoke + chapter**
- Extend smoke harness: real product slugs return 200 + price renders
  + image loads. Cart add/remove. Checkout up to Stripe handoff (mock).
- Chapter `04-client-portal-luv-and-ker-real.md`. MASTER row. Update R1
  chapter with a "Round 3 update — went real" pointer line.

## NOT in scope

- Real Stripe live mode (T2 R12's job for Stripe Connect; this round runs
  on test keys).
- Felicia's email + domain wiring (T6's domains plugin handles attach).
- New plugin features — use what's already shipped.

## Loop discipline

Standard. Phase A is the heaviest (real SKU import). Per-phase commit.

## When done

DONE + COMMIT in outbox; chapter; MASTER row; tasks row.
