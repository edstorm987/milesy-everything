# 04 — Pro upgrade flow mockup (T4 R011)

Mock paywall + checkout + entitlement-unlock-on-confirm. Real Stripe
wires later via T6. Honesty contract: every surface labelled DEMO;
no card data is collected; "purchase" is localStorage-only.

> Single source of truth introduced: `bos.entitlement`. Existing
> `bos.mode === 'customer'` semantics preserved as legacy unlock
> signal so installs don't regress.

## Storage contract — `bos.entitlement`

```js
{
  tier: 'free' | 'pro-trial' | 'pro',
  startedAt: ISO,
  expiresAt?: ISO,           // pro-trial only — +14d from startedAt
  expiredAt?: ISO            // set on auto-rollback when trial expires
}
```

`bos.js getEntitlement()` runs the expiry check on every read — a
`pro-trial` entitlement past its `expiresAt` auto-rolls to `free`,
sets `expiredAt`, and flips legacy `bos.mode = 'free'`. **Data is
preserved** (notes, lessons, HC, brand, all stay intact).

## `isPro()` — single check

```js
function isPro() {
  var e = getEntitlement();
  if (e && (e.tier === 'pro' || e.tier === 'pro-trial')) return true;
  return getMode() === 'customer';
}
```

Pro lockups consult `isPro()`. Currently:

- `maybeProLock()` — was `getMode() === 'customer'` → now `isPro()`. ✓
- All other `bos.mode` reads (sidebar render, marketplace render,
  tier-pill toggle, dev-bar) still use `getMode()` — they're rendering
  the *legacy mode* dimension, not gating Pro features. The R011
  approach treats `bos.entitlement` as **the new authoritative gate**
  and `bos.mode` as a derived view that the trial / checkout writers
  flip alongside for back-compat. R+1 can fully migrate readers off
  `getMode()` once entitlement has bedded in.

Exposed on `window.BOS`: `getEntitlement`, `isPro` (in addition to
existing `getMode` / `setMode`).

## Pages

### `/business-os app/upgrade.html`

- **DEMO banner** at top — explicit "billing is mocked".
- Active-entitlement banner — renders when on Pro / Pro-trial with
  remaining days.
- 3 pricing tiers side by side:
  - **Free** (£0 forever) — HC + 5 lessons + niche pack + scripted Aqua AI.
  - **Pro** (£49 / mo · 14-day trial) — Marketplace 9 add-ons,
    Custom roadmap, Pro pages, Full Aqua AI when wired.
  - **Agency-managed** (£POA per cohort) — Incubator + Live custom
    portal at graduation.
- Feature comparison matrix — 10-row table.
- "Start Pro trial" click handler:
  - Writes `bos.entitlement = { tier:'pro-trial', startedAt:now, expiresAt:+14d }`.
  - Flips legacy `bos.mode = 'customer'` for back-compat.
  - Redirects to `checkout.html`.
- "Talk to us" mailto for Agency-managed.
- "You're on Free" pill button is a noop.

### `/business-os app/checkout.html`

- DEMO banner at top.
- Card-fields fieldset is `disabled` + placeholder text "Demo only ·
  field disabled" — **literally cannot type a card number**.
- Order summary: £49 line · −£49 trial credit · Today £0.00.
- Submit handler:
  - Writes `bos.entitlement = { tier:'pro', startedAt:now }` (no expiry).
  - Flips legacy `bos.mode = 'customer'`.
  - Appends `bos.activity[]` log entry `pro-confirmed-demo`.
  - Redirects to `app.html` after a 1.2s "✓ Pro active — redirecting…" status.

## Trial banner — `mountTrialBanner()`

Added to `bos.js` boot sequence. Renders at top of `<body>` (before
the existing Incubator strip):

- **Pro-trial, ≤2 days remaining** → amber banner "Pro trial ends in
  N day(s). Confirm Pro to keep the unlock shelf live." + "Upgrade →"
  link.
- **Pro-trial day-of-expiry** → "Pro trial ends today. Confirm Pro…"
- **Just expired** (within 7 days of `expiredAt`) → blue info banner
  "Your Pro trial ended. You're on Free again — your data is preserved.
  Re-upgrade any time."

Writes nothing; reads from `getEntitlement()` (which itself runs the
expiry-rollback). Idempotent (skips if `[data-bos-trial-banner]`
exists).

## CSS

`business-os app/styles.css` appended (~140L):

- `.bos-upgrade-demo-banner` — gold-on-dark notice.
- `.bos-upgrade-tiers` — 3-col grid (1-col under 880px), Pro tier
  ribbon + gold border.
- `.bos-upgrade-matrix` — comparison table with center-aligned cells.
- `.bos-checkout-grid` — 1.5fr/1fr (form / summary) collapses to 1fr
  under 760px. Disabled `<fieldset>` styled as a dashed-bordered
  "demo" zone.
- `.bos-upgrade-active` — green entitlement-status banner.

## Smoke (verified 2026-05-07)

- `upgrade.html`, `checkout.html`, `app.html` all 200.
- `upgrade.html` renders 3 tiers + matrix + DEMO banner.
- Click "Start Pro trial" → `bos.entitlement.tier === 'pro-trial'` set
  + `expiresAt` 14d out + redirected to `checkout.html`.
- Submit checkout → `bos.entitlement.tier === 'pro'` set + redirected
  to `app.html`.
- Manually setting a stale `expiresAt` (past date) and reloading any
  BOS page → entitlement auto-rolls to `free`, blue "trial ended"
  banner renders, data (notes/lessons/HC) intact.
- Setting `expiresAt` to +1 day → amber "Pro trial ends in 1 day"
  banner shows.

## Q-ASSUMED + R011 follow-ups

- **Source-of-truth migration**: `bos.entitlement` is the new gate;
  `bos.mode` is derived/legacy. `isPro()` covers both. Full reader
  migration to `getEntitlement()` is R+1 — sidebar / marketplace
  cards still use `getMode()` for the "Installed" / "free vs customer"
  rendering dimension, which works because we flip mode alongside
  entitlement on every state change.
- **Real Stripe** explicitly out of scope per prompt — T6 prod gate.
- **Refunds / proration / multi-seat / VAT** explicitly out.
- **Trial reminder emails** would be R+1 once T6 ships email-sender.
- **Activity log** uses the `bos.activity[]` array introduced in R010
  (handoff flow). R+1 admin Activity tab will surface "trial started",
  "pro confirmed (demo)", "trial expired" rows.
- **Plan changes / downgrades** — clicking Free in Pro state is a
  noop today; UI affordance for self-downgrade left for R+1.

## Cross-refs

- Chapter #70 free-vs-Pro gating (this round implements the trial /
  upgrade leg the contract anticipated).
- Chapter #67 plugin handoff (entitlement spec — the eventual server-
  side shape this localStorage stub mirrors).
- Chapter #71 open follow-ups (billing line-item resolved here, with
  R+1 stubs noted).
- R010 (#86) `bos.activity[]` log used for `pro-confirmed-demo`.
- R009 (#85) admin (future Activity tab consumer).
- Chapter `04-incubator-phase-portal.md` — Incubator Agency-managed
  tier surfaces here.
