/loop

# T4 — Round 011: Pro upgrade flow mockup

Mock up the upgrade-to-Pro flow without real Stripe. Paywall + checkout
placeholder + entitlement-unlock-on-confirm. Honesty contract: clearly
labelled DEMO until real billing wires in via T6.

## Mandatory pre-read

1. T4 chapter #70 (free vs Pro gating contract).
2. T4 chapter #67 (BOS plugin handoff — entitlement spec).
3. T4 chapter #71 (open follow-ups — billing).

## Scope

**A** — `/upgrade.html` new page: pricing tiers (Free / Pro / Agency-
managed), feature comparison matrix, primary CTA "Start Pro trial".

**B** — Trial start sets `bos.mode = "pro"` + `bos.entitlement = {
tier: "pro-trial", startedAt, expiresAt: +14d }`. Pro lockups across
BOS unlock for trial duration.

**C** — Trial expiry banner at +12d / +13d / +14d. After expiry, mode
flips back to `free`; data preserved.

**D** — Mock checkout page: card fields stubbed (DO NOT collect real
card data; show "Demo mode — no charge" banner). Submit just flips
`bos.entitlement.tier = "pro"` (no expiry).

**E** — Audit existing Pro lockups — ensure all read `bos.entitlement`
not `bos.mode` directly (single source of truth).

**F** — Chapter `04-upgrade-flow-mockup.md` + MASTER row.

## NOT in scope

- Real Stripe (T6 prod gate explicitly).
- Refunds / proration / multi-seat.
- Tax / VAT.

## When done
DONE referencing `011-pro-upgrade-mockup.md`.
