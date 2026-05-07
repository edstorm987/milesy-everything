/loop

# T4 — Round 016: Marketplace add-on detail pages

Currently the marketplace is a 9-add-on table (chapter #66). Each
add-on needs a dedicated detail page explaining value + showing what
unlocks + price + CTA to upgrade or "Talk to a human".

## Mandatory pre-read

1. T4 chapter #66 — marketplace 9-add-on table.
2. T4 R011 — Pro upgrade flow mockup (shipped or pending).

## Scope

**A** — `marketplace/<addon-slug>.html` × 9. Each: hero + value-prop
+ "What you get" bullets + screenshot/diagram placeholder + price +
"Add to my plan" CTA (writes `bos.cart.addons[]`) + "Talk to a human"
secondary CTA.

**B** — Marketplace.html links each row to its detail page.

**C** — `bos.cart` storage shape — addons array + total computed.
Cart icon top-right of BOS appears when `cart.addons.length > 0`.

**D** — Cart page `/business-os app/cart.html` lists items + total +
"Continue" CTA (links to upgrade.html mockup from R011).

**E** — Marketplace-click activity event from R013 fires per detail-
page visit.

**F** — Chapter R016 + MASTER delta.

## NOT in scope

- Real Stripe (T6 prod gate).
- Per-addon free trial.

## When done
DONE referencing `016-marketplace-detail-pages.md`.
