/loop

# T2 — Round 007: `@aqua/plugin-agency-finance`

Build the agency-finance plugin: invoices, lock-in payments, P&L,
founder dashboard. Mirrors `agency-hr` shape.

## Mandatory pre-read

1. T2 `agency-hr` plugin chapter — manifest + foundation adapter shape.
2. `04-aqua-internals-reference.md` §1 Aqua HQ sections — Finance.
3. T1 R002 R+1 deferral (`metadata.planTier`, `metadata.lockInPaid`).

## Scope

**A** — Plugin scaffold: manifest (`scopePolicy: "agency"`,
`requires: []`), foundation adapter, ports, server index. ActivityCategory
extended with `"finance"`.

**B** — Domains: `Invoice` (date / clientId / amount / currency /
status / lineItems), `Payment` (invoiceId / amount / paidAt / method),
`Plan` (tier / monthlyAmount / clients[]).

**C** — Services: `InvoiceService` (CRUD + idempotent status
transitions), `PaymentService` (record payment, mark invoice paid),
`PnLService` (computed monthly P&L from invoices + payments).

**D** — 6 admin pages: Invoices · Payments · Plans · P&L · Lock-in
tracker · Founder dashboard. Founder dashboard = MRR / ARR / churn /
top clients.

**E** — Honesty contract: no fabricated numbers; "Connect billing to
see live numbers" empty state when no data.

**F** — 8 API routes (CRUD on each domain + P&L summary endpoint).

**G** — Smoke + chapter `04-plugin-agency-finance.md` + MASTER row.

## NOT in scope

- Stripe integration (T6 prod gate).
- Multi-currency conversion.
- T4 territory.

## When done
DONE referencing `007-agency-finance.md`.
