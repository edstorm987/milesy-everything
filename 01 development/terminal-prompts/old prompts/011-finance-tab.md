/loop

# T1 — Round 011: Per-client Finance tab

Surface plan tier, lock-in payment status, MRR contribution, payment
history. Pulls from T2's `agency-finance` plugin once shipped (R007);
graceful fallback to client `metadata` (already has `planTier`,
`lockInPaid` from R002 Aqua reskin).

## Mandatory pre-read

1. R002 Aqua reskin chapter — `metadata.planTier`, `metadata.lockInPaid`,
   `metadata.stripeUrl`, `metadata.whatsapp`.
2. T2 agency-finance chapter once shipped.

## Scope

**A** — `_FinanceTabClient.tsx` header strip: Plan Tier chip · Lock-in
status (paid £100 / unpaid) · Stripe quick-link.

**B** — Invoices table: date · amount · status (draft / sent / paid /
overdue). Pulls from agency-finance plugin if installed; placeholder
"Connect Stripe to track invoices" CTA otherwise.

**C** — MRR strip — total monthly contribution + 12-month sparkline if
data exists. No fabricated numbers (chapter #68 honesty contract):
"Connect billing to see numbers" if no data.

**D** — Quick-add affordance: "+ Manual invoice" lets operator log a
one-off invoice (saved to plugin storage or metadata fallback).

**E** — Smoke + chapter `04-finance-tab.md` + MASTER row.

## NOT in scope

- Stripe integration (T6 prod gate territory).
- Multi-currency.
- T4 territory.

## When done
DONE referencing `011-finance-tab.md`.
