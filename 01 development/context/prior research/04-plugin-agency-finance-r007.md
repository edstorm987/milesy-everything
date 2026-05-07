# `@aqua/plugin-agency-finance` — R007 extension (Payments / Plans / P&L)

Round-007 of the queue-based T2 worker. Additive extension of the
existing R6 plugin (Invoice + Expense + Reports) — adds the Payment
+ Plan domains, three new services, four new admin pages, an honesty-
contract founder dashboard, and seven new API routes.

## Why additive

The R6 plugin already shipped Invoices + Expenses + a trailing
revenue snapshot. Rather than rewriting, R007 layers on the missing
bits: **money-in events** (Payment), **recurring plan tiers** (Plan),
and **founder-grade projections** (MRR / ARR / churn / lock-in
tracker). The chapter-§1 Aqua-HQ Finance section is now functionally
complete in v1 v0.1.0 alpha.

## What's added

### Domains

```
Payment  { id, agencyId, invoiceId, clientId, amountCents, currency,
           method: stripe|bank-transfer|cash|manual|other, paidAt,
           notes?, externalRef?, createdAt }

Plan     { id, agencyId, tier: starter|growth|scale|custom, label,
           monthlyAmountCents, currency, lockInMonths, lockInFeeCents,
           clientIds[], active, createdAt, updatedAt }

PnLMonth { year, month, revenueCents, expensesCents, netCents }

FounderSnapshot { currency, mrrCents, arrCents, activeClients,
                  churnRate, churnedClientIds[], topClients[],
                  trailingMonths[], hasData }
```

### Services

- `PaymentService` — `list / get / listForInvoice / record(actor,
  input)`. `record` settles the linked Invoice (`markPaid`) when the
  rolling sum of payments reaches `invoice.totalCents` and the
  invoice is currently `sent`/`overdue`. Currency mismatch with the
  invoice rejects.
- `PlanService` — `list / get / getForClient / create / update /
  assignClient(actor, clientId, planId|null)`. v1: a client belongs
  to ONE plan at a time; reassignment moves the id between plans'
  `clientIds` arrays.
- `PnLService` — composed over Invoice + Payment + Expense + Plan
  services. `trailingMonths(refNow, count=12)` returns
  contiguous-month P&L; `founderSnapshot(refNow, windowDays=30)`
  surfaces MRR/ARR/churn/topClients/trailing-12; `lockInRows()`
  surfaces clients on lock-in plans with paid/unpaid status.

### Honesty contract

`founderSnapshot.hasData` is `true` iff there's at least one Invoice
**or** at least one Plan. The `FounderDashboardPage` renders an
empty-state ("Connect billing to see live numbers") when `hasData` is
false rather than fabricated zeroes. The same page has tile cards for
MRR / ARR / Active clients / Churn% — each derived from real data:

- **MRR** = sum of `plan.monthlyAmountCents × plan.clientIds.length`
  for active plans (true subscription view, not realised payments).
- **ARR** = MRR × 12.
- **Active clients** = unique clientIds across all active plans.
- **Churn (30d)** = clients_with_last_payment_outside_window /
  (active_clients ∪ churned). Returns 0 when starting cohort is empty
  (avoids NaN).
- **Top clients** = lifetime payment sum, top 10.
- **Trailing 12 months** = (revenue from payments in month) − (approved
  expenses incurred in month).

### Lock-in tracker

`pnl.lockInRows()` walks plans with `lockInMonths > 0`, picks up each
assigned client's payments where `notes` contains "lock-in" or
`externalRef` starts with `lockin_`, and reports paid vs outstanding
fee status. Convention is documented in the operator runbook; T1 R002
R+1 will move this onto invoice `metadata.lockInPaid` for a tighter
contract.

### Admin pages (4 new)

- `PaymentsPage` — list + record-payment form.
- `PlansPage` — list (tier / label / monthly / lock-in / clients /
  active) + create-plan form.
- `LockInPage` — table of clients on lock-in plans with paid/outstanding
  pill + total collected / total due summary.
- `FounderDashboardPage` — tile grid + trailing-12 table + top-clients
  ranked list, with the honesty empty-state when `hasData` is false.

navItems extended (Payments / Plans / Lock-in / Founder dashboard)
between `Revenue` and `Settings`. Founder dashboard is admin-only
(`AGENCY_ADMINS`); the rest are viewer-visible. The default landing
page (path `""`) flips from InvoicesPage → FounderDashboardPage.

### API routes (7 new)

```
GET    /payments                       (viewers)
POST   /payments/create                (admins)
GET    /plans                          (viewers)
POST   /plans/create                   (admins)
PATCH  /plans/update?id=<planId>       (admins)
POST   /plans/assign                   (admins)
GET    /pnl?now=<ts>                   (admins) → FounderSnapshot
```

Handlers live in `src/api/handlers-r007.ts` so the original
`handlers.ts` stays small and reviewable; routes barrel imports both.

## Smoke (20/20 — 9 pre-existing + 11 R007)

`tsx --test src/__smoke__/finance.test.ts`. R007 cases:

1. `PaymentService.record` stores payload + emits
   `agency-finance.payment.recorded`.
2. Payment ≥ total settles the invoice (`status → paid`).
3. Partial payments don't settle; second payment crossing the total
   does.
4. Payment currency mismatch with invoice rejects.
5. `PlanService` CRUD + `assignClient` moves a client between plans;
   `null` unassigns; `getForClient` returns null after unassign.
6. `PlanService` rejects invalid input (empty label / negative
   monthly).
7. `founderSnapshot` honesty contract — empty world returns
   `hasData: false`, all zeroes.
8. `founderSnapshot` — MRR = `sum(monthlyAmountCents ×
   clientIds.length)`; ARR = MRR × 12; activeClients counts unique.
9. `founderSnapshot.topClients` ranks by lifetime payment sum.
10. `trailingMonths` returns 12 contiguous months ending in ref month;
    all-zero when no data seeded.
11. `lockInRows` surfaces only lock-in-plan clients + paid status
    derived from `externalRef: "lockin_*"` heuristic.

## Files

```
04-the-final-portal/plugins/agency-finance/
├── index.ts                              (manifest extended — navItems + pages + landing flip)
├── src/
    ├── lib/
    │   └── domain.ts                     (extended — Payment, Plan, PnLMonth, FounderSnapshot, Filters)
    ├── server/
    │   ├── payments.ts                   (NEW — PaymentService)
    │   ├── plans.ts                      (NEW — PlanService)
    │   ├── pnl.ts                        (NEW — PnLService composing existing services)
    │   └── index.ts                      (extended — barrel + container)
    ├── api/
    │   ├── handlers-r007.ts              (NEW — 7 handlers for R007 routes)
    │   └── routes.ts                     (extended — 7 new routes appended)
    ├── pages/
    │   ├── PaymentsPage.tsx              (NEW)
    │   ├── PlansPage.tsx                 (NEW)
    │   ├── LockInPage.tsx                (NEW)
    │   └── FounderDashboardPage.tsx      (NEW — honesty-contract empty state)
    └── __smoke__/finance.test.ts         (extended — second describe block, 11 cases)
```

## NOT in scope

- Stripe integration (T6 prod gate — operator can already capture
  `externalRef` in payments).
- Multi-currency conversion — payment currency must match invoice
  currency; cross-currency reporting deferred.
- Touching milesymedia / business-os / compass-coaching (T4
  territory).

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/`.
- Zero touches to `04-the-final-portal/business-os/`.
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- Plan-assignment history log so churn ≠ heuristic; today churn is
  derived from "last payment outside window AND not in active plan".
- Move lock-in detection from heuristic (notes/externalRef) to
  invoice `metadata.lockInPaid` per T1 R002 R+1.
- Real Stripe sync for both invoices and payments (status reconcile
  via webhook + `externalRef`).
- Multi-currency dashboards with normalised reporting currency.
- Per-plan upgrade / downgrade flow with proration.
- Budget vs actual on the trailing-12 view.
- Cohort retention tile on the founder dashboard.
- Refunds → `Payment.amountCents` negative path + invoice
  status="refunded" reconciliation.
