/loop

# T2 — Round 015: `@aqua/plugin-agency-payroll`

Payroll surface for internal team. Per Aqua HQ chapter §1 mentions
HR + payroll. Track contractor invoices, employee runs, monthly
totals. No real bank/Stripe — operator-paste amounts.

## Mandatory pre-read

1. T2 agency-hr chapter (Employee HQ, Roles).
2. T2 R007 agency-finance chapter.
3. Chapter §1 Aqua HQ sections.

## Scope

**A** — Manifest (`scopePolicy: "agency"`, `requires:
["agency-hr", "agency-finance"]`). ActivityCategory `"payroll"`.

**B** — Domains: `PayPeriod` (id, year, month, startedAt, closedAt,
status), `Payslip` (employeeId/contractorId, periodId, gross, net,
notes, paidAt?). `Contractor` (linked from agency-hr Staff).

**C** — Services: PayPeriodService (open/close periods) +
PayslipService (CRUD + mark-paid + idempotent). Honesty contract on
totals (no fabrication when no paid records).

**D** — 4 admin pages: Periods · Payslips · Contractor list · Reports.

**E** — Cross-plugin: emits `payroll.paid` activity event consumed by
agency-finance for invoice reconciliation hint.

**F** — Smoke + chapter `04-plugin-agency-payroll.md` + MASTER row.

## NOT in scope

- Real bank integration (T6 prod gate).
- Tax / NI calculations.

## When done
DONE referencing `015-agency-payroll.md`.
