/loop

# T3 — Round 004: Storefront brand-page templates

Lift inventory chapter (#58) Tier 3: storefront brand-page templates from
`02 felicias aqua portal work/`. Therapists' websites typically need 5–7
brand pages (about / our story / philosophy / sustainability / FAQ /
contact / lab-tests). Ship them as starter block-tree presets so a new
client portal can scaffold a complete website in one click.

## HARD BOUNDARIES

- Standard.

## Mandatory pre-read

1. Chapter `04-lift-inventory.md` (#58) — the brand-page rows under
   `02/storefront marketing`.
2. `02 felicias aqua portal work/src/app/(storefront)/` — read-only
   reference.
3. `04-incubator-template.md` (T3 002) — the existing pageTemplates
   shape.

## Scope

**Goal A — Lift 7 brand-page presets**
Each as a `BlockTree` in `pageTemplates.ts`:
- `brand-about` — hero + paragraph + team grid
- `brand-our-story` — hero + chapters w/ alternating image+text
- `brand-philosophy` — hero + principles list
- `brand-sustainability` — hero + impact metrics + commitments
- `brand-faq` — hero + accordion (toggle blocks)
- `brand-contact` — hero + form-render + map placeholder
- `brand-lab-tests` — hero + cert grid + downloads

Use existing blocks from R2/R5 catalogue plus the 4 Notion-style blocks
from R002 (toggle, cardGrid, etc.).

**Goal B — "Brand pack" composite preset**
- New starter `brand-page-pack` that creates all 7 sibling pages in one
  go. Operator picks once at "+ New page" → "Use brand pack".

**Goal C — Smoke + chapter**
- Smoke: each preset instantiates clean; brand-pack creates 7 pages
  with correct sitemap.
- Chapter `04-brand-page-templates.md`. MASTER row.

## NOT in scope

- Industry-vertical templates beyond therapist/healing brand.
- Real copy — placeholder copy in Felicia's voice (operator overrides).
- Touching milesymedia / business-os.

## When done

DONE referencing `004-brand-page-templates.md`.
