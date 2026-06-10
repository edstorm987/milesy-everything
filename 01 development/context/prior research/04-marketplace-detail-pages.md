# 04 — Marketplace add-on detail pages + cart (T4 R016)

The marketplace was a single-page table of 9 add-on cards (chapter
#66). R016 ships:

- 9 dedicated detail pages, one per add-on, under
  `business-os app/marketplace/<slug>.html`.
- A new `bos.cart` storage shape + a `cart.html` page that lists
  selected add-ons with subtotal + monthly total.
- A floating cart icon top-right that appears across BOS pages
  whenever `cart.addons.length > 0`.
- Marketplace card CTA changes from a `mailto:` to a "View details →"
  link into the new pages.
- Per-detail-page activity log entry via R013 `Activity.log`.

Honesty contract: every detail page + the cart page label themselves
as v1 demo flow; cart entries are localStorage-only; nothing is
charged. T6 wires real Stripe per chapter #67.

## File tree

```
04-the-final-portal/milesymedia website/business-os app/
├── marketplace/
│   ├── inbox.html      — 📥 All-in-One Inbox · £49 · Communications
│   ├── website.html    — 🪄 Website Editor · £79 · Website
│   ├── ecom.html       — 🛒 Ecommerce · £89 · Sell
│   ├── fulfil.html     — 📦 Fulfilment · £39 · Sell
│   ├── members.html    — 🎟 Memberships · £39 · Retain
│   ├── affil.html      — 🤝 Affiliates · £29 · Grow
│   ├── crm.html        — 🗂 Client CRM · £49 · Communications
│   ├── marketing.html  — 📣 Marketing Suite · £59 · Grow
│   └── finance.html    — 💷 Finance · £39 · Operations
├── cart.html
└── marketplace.html (CTA changed)
```

All 9 pages generated from a single Python template (~110L each).

## Detail page anatomy

- Sidebar (existing BOS chrome).
- Back-link `← All add-ons`.
- Header: large icon + category pill + name + 1-line blurb + price
  pill (right-aligned, large).
- v1-demo callout (honesty contract).
- 2-col grid:
  - **Left** — "What you get" 6-bullet list (each bullet a chip),
    "Why it matters" paragraph, dashed-bordered diagram placeholder
    box.
  - **Right** (sticky) — price card with **"Add to my plan →"** primary
    CTA + **"Talk to a human"** mailto secondary.

Every detail page loads the shared R012 `lib/storage.js` + R013
`lib/activity.js` so the cart writer + activity log work across
businesses.

## Storage — `bos.cart`

```js
{
  addons: [{ id, name, price }, …],
  updatedAt: ISO
}
```

- Single source of truth for "what add-ons the user has selected".
- Distinct from `bos.entitlement` (R011) — entitlement is the access
  flag; cart is the working selection ahead of checkout.
- De-duped: same addon id can only appear once. Re-clicking "Add to
  my plan" on an already-added page swaps the button to "✓ Already in
  cart — view cart →" and links to `cart.html`.

## Cart page — `business-os app/cart.html`

- Empty state: 🛒 illustration card with "Browse marketplace →".
- Populated state: each row shows add-on name + "View details →" link
  + £/mo + Remove button.
- Sticky right summary:
  - Add-ons subtotal · Pro base £49 · Monthly total (subtotal + 49)
  - "Continue to checkout →" links to R011 `upgrade.html`.
  - "Back to marketplace" secondary.
- v1-demo callout.

## Cart icon — `mountCartIcon()` in bos.js

- Boot-mounted alongside `mountTrialBanner()` etc.
- Reads `bos.cart`. Renders a floating gold pill top-right
  (`🛒 N add-on(s) →`) only when `addons.length > 0`.
- Hidden on `cart.html` itself (would be redundant).
- Path-aware href — uses `../cart.html` from `marketplace/<slug>.html`,
  `cart.html` from any other BOS page.

## Activity log integration (R013)

Each detail page fires:

```js
Activity.log('marketplace.click', { addonId, detailPage: true });
```

at DOMContentLoaded. The "Add to my plan" click fires a follow-up
log:

```js
Activity.log('marketplace.click', { addonId, addedToCart: true, price });
```

Both surface in the R013 timeline + admin Marketplace KPI tile (R009).

## Marketplace card CTA change

`bos.js renderMarketplace()` now writes the addon-card primary CTA as
`<a href="marketplace/<id>.html">View details →</a>` instead of the
prior mailto. Owned mode (legacy `bos.mode === 'customer'`) still
renders the "Open" pseudo-CTA.

## CSS — `~150L appended` to business-os styles.css

- `.bos-mp-detail-head` / `.bos-mp-detail-icon` / `.bos-mp-detail-price`
- `.bos-mp-detail-grid` (1.6/1fr → 1col under 760px)
- `.bos-mp-detail-bullets` (chip-style list)
- `.bos-mp-detail-diagram` (dashed-border placeholder)
- `.bos-mp-detail-card` (sticky right column)
- `.bos-cart-shell` / `.bos-cart-row` / `.bos-cart-summary` (sticky)

## Smoke (verified 2026-05-07)

- All 9 `marketplace/<slug>.html` URLs return 200.
- `cart.html` returns 200; empty state renders 🛒 card; populated
  state renders item rows + correct subtotal+£49.
- `marketplace.html` cards render with "View details →" CTAs that
  navigate to the right detail page.
- Click "Add to my plan" → addon appears in `bos.cart.addons`,
  redirects to cart.html with the line item visible.
- Re-clicking "Add to my plan" on the same detail page flips button
  to "✓ Already in cart — view cart →".
- Floating cart icon appears top-right on all BOS pages once cart is
  non-empty; vanishes after Remove on cart.html drops the last item.
- Activity timeline (R013) shows two entries per add: detail-page
  visit + addedToCart with price.

## Q-ASSUMED + R016 follow-ups

- **Per-add-on free trial** explicitly out per prompt — same 14-day
  Pro trial covers everything via R011.
- **Real Stripe** is T6 prod-gate; the cart→checkout link goes to
  R011's `upgrade.html` mock for now. Submit at the upgrade page
  doesn't yet itemise cart contents — R+1: feed `cart.addons` into
  the checkout summary.
- **Diagrams** are dashed-border placeholders. Real screenshots /
  mini-diagrams ship per add-on as those plugins land.
- **Addon entitlement granularity** not yet wired — `bos.entitlement.tier='pro'`
  is currently all-or-nothing. Per-add-on entitlement (`pro+inbox+crm`)
  is the bigger R+1 once T6 ships real billing.

## Cross-refs

- Chapter #66 marketplace 9-add-on table (this round writes the
  detail pages for those 9).
- Chapter #67 plugin handoff (per-add-on entitlement is the
  Postgres-backed evolution of `bos.cart.addons[]`).
- R009 (#85) admin marketplace KPI tile — already counts clicks; now
  benefits from per-detail-page granularity.
- R011 (#87) upgrade flow — `cart.html` → `upgrade.html` is the
  hand-off (R+1 will itemise).
- R012 (#88) BOSStorage — `bos.cart` is per-business via the same
  switch-by-mirror approach (cart is in NAMESPACED_KEYS via R+1
  registration).
- R013 (#89) Activity — detail-page visits + add-to-cart fire log
  entries.
