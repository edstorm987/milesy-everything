/loop

# T2 — Round 13: Tax + shipping in ecommerce

T2 has shipped 11 plugins through R12 (Stripe Connect + Payouts). R13 is the
last commerce gap before Felicia can really sell: tax calculation and
shipping rate selection at checkout. Both are pluggable so dev runs without
real provider keys.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/context/MASTER.md`
3. `01 development/eds requirments.md` (Felicia's commerce expectations)
4. The 04 ecommerce + R5 + R6 + R12 chapters.
5. `01 development/messages/terminal-2/from-orchestrator.md`

## Scope

**Goal A — Tax**
- Add `TaxPort` to `@aqua/plugin-ecommerce`: `quoteTax({lineItems,
  shippingAddress, billingAddress, currency}) → {breakdown[], total}`.
- Default `stub` provider: 0% (returns empty breakdown). Real provider:
  Stripe Tax (use existing per-install Stripe credentials). Per-install
  config `taxProvider: "stub" | "stripe"` + `taxNexusRegions: string[]`.
- Wire into `OrderService.priceCart()` so order totals include tax. Cart
  + checkout block UIs render the tax line.

**Goal B — Shipping**
- Add `ShippingPort`: `getShippingOptions({lineItems, shippingAddress})
  → {options: [{id, label, price, estimatedDays}]}`.
- Default `stub` provider: 3 flat rates (free over $50, standard $5,
  express $15). Real provider stub for ShipStation / EasyPost (just a
  port shape — no keys required for v1).
- Checkout block: shipping-method picker before payment. Selected
  method persisted on Order. priceCart includes shipping.

**Goal C — Smoke + chapter**
- ecommerce smoke: tax stub returns 0, shipping stub returns 3 options,
  priceCart sums line + tax + shipping correctly. ≥6 new cases.
- Chapter `04-plugin-ecommerce-round13.md`. MASTER row.

## NOT in scope

- Real Stripe Tax registration (operator concern).
- Per-product tax categories (R14 candidate).
- International duties / VAT inclusive pricing (R14 candidate).

## Loop discipline

Standard. Goal A + Goal B are independent — partial DONE acceptable.

## When done

DONE + COMMIT in outbox; chapter; MASTER row; tasks row.
