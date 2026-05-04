# Agency-finance plugin (T2 R6)

`@aqua/plugin-agency-finance` — invoices, expenses, revenue dashboard.
Internal finance for the agency operating the portal. Companion to
agency-HR; together they own the agency-internal admin surface.
Per-agency install (`scopePolicy: "agency"`, `core: false`, opt-in).

> Built by T2 on 2026-05-04 alongside Goal A (ecommerce
> `order.created` event extension). tsc-clean standalone; 9/9 smoke
> pass.

## 1. Package shape

```
04 the final portal/plugins/agency-finance/
├── index.ts                          default-exports the AquaPlugin manifest
├── package.json                      @aqua/plugin-agency-finance@0.1.0
├── tsconfig.json
├── src/
│   ├── lib/
│   │   ├── aquaPluginTypes.ts        vendored AquaPlugin contract
│   │   ├── domain.ts                 Invoice + Expense + ExpenseCategory + RevenueSnapshot + inputs/filters
│   │   ├── tenancy.ts                Mirror types (+ "finance" added to ActivityCategory)
│   │   ├── ids.ts                    makeId + formatInvoiceNumber("INV-YYYY-NNNN")
│   │   └── time.ts                   stubable clock + date helpers
│   ├── server/
│   │   ├── ports.ts                  Storage · Tenant · User · ActivityLog · EventBus · PluginInstallStore
│   │   ├── categories.ts             CategoryService (CRUD + idempotent seedDefaults — 6 defaults)
│   │   ├── invoices.ts               InvoiceService (CRUD + state machine + markPaid + renderInvoiceHtml + per-year sequence)
│   │   ├── expenses.ts               ExpenseService (CRUD + approve/reject/reimburse + secondary indexes by category and staff)
│   │   ├── reports.ts                ReportService (revenueSnapshot — invoices + expenses + per-category + monthly aggregate)
│   │   ├── foundationAdapter.ts      registerAgencyFinanceFoundation + containerFor + containerWithDeps + _containerFromCtx
│   │   └── index.ts                  buildAgencyFinanceContainer + barrel
│   ├── api/
│   │   ├── handlers.ts               15 handlers
│   │   └── routes.ts                 ROUTES (per-route visibleToRoles)
│   ├── components/
│   │   ├── InvoicesList.tsx          (status filter + search + Mark-paid action)
│   │   └── ExpensesList.tsx          (status filter + Approve/Reject/Reimburse + NewExpenseForm)
│   ├── pages/
│   │   ├── InvoicesPage.tsx          mounted at "" + "invoices"
│   │   ├── InvoiceDetailPage.tsx     "invoices/:id" — renders renderInvoiceHtml output
│   │   ├── ExpensesPage.tsx
│   │   ├── ReportsPage.tsx           trailing 12-month snapshot
│   │   └── SettingsPage.tsx          inline category management + install state
│   └── __smoke__/
│       └── finance.test.ts           9 node:test cases via tsx --test
└── package-lock.json
```

22 source files, ~3300 LOC, zero runtime deps.

## 2. Manifest (key fields)

```ts
{
  id: "agency-finance",
  category: "core",                    // agency-internal
  status: "alpha",
  core: false,                         // opt-in via marketplace
  scopePolicy: "agency",               // never installed per-client
  navItems: [Invoices · Expenses · Revenue · Settings],   // 4 items, panel "agency-finance"
  pages: [Invoices (×2), InvoiceDetail (":id"), Expenses, Reports, Settings],   // 6 entries
  api: ROUTES,                         // 15 routes
  features: [invoice-html-export, expense-approvals, revenue-report],
  settings.groups: [
    general (defaultCurrency, defaultPaymentTermsDays, agencyTaxId),
    approval (expenseApprovalThresholdCents — stored, not yet enforced),
  ],
  onInstall: seeds 6 default expense categories,
  healthcheck: invoices outstanding + pending expenses count,
}
```

NO storefront blocks — agency-finance is internal.

## 3. Domain model (v1)

```ts
type Invoice = {
  id, agencyId, clientId,
  number,                              // INV-YYYY-NNNN, per-year sequence
  issuedAt, dueAt,                     // epoch ms
  lineItems: { description, quantity, unitCents, totalCents }[],
  subtotalCents, taxCents, totalCents,
  currency: "usd"|"gbp"|"eur",
  status: "draft"|"sent"|"paid"|"overdue"|"void"|"refunded",
  notes?, externalRef?,
  paidAt?, paidVia?: "stripe"|"bank-transfer"|"cash"|"manual",
  createdAt, updatedAt,
};

type Expense = {
  id, agencyId,
  staffId?,                            // optional foundation User id
  categoryId,                          // FK → ExpenseCategory
  vendor?, description?,
  amountCents, currency,
  incurredAt,
  status: "pending"|"approved"|"reimbursed"|"rejected",
  receiptUrl?,
  approvedBy?, approvedAt?, reimbursedAt?, decisionNote?,
  createdAt, updatedAt,
};

type ExpenseCategory = {
  id, agencyId, name,
  isDefault: boolean,                  // seeded vs agency-added
  status: "active"|"archived",
  description?, createdAt, updatedAt,
};
```

### Invoice state machine

`update()` permits these transitions (markPaid is the sole path
into "paid" — keeps the side-effects atomic):

```
draft   → sent | void
sent    → overdue | void | refunded
overdue → void
paid    → refunded | void                  (via update — manual write-down)
void    → (terminal)
refunded→ (terminal)

markPaid: sent → paid · overdue → paid     (idempotent on already-paid)
```

### Validation rules (in services)

| Service | Rule |
|---------|------|
| CategoryService | name unique per-agency (case-insensitive); seedDefaults idempotent |
| InvoiceService | at least one line item; client must resolve in this agency; per-year sequence numbers; only draft invoices can be deleted (others use status:"void"); status:"paid" forbidden via update — must use markPaid |
| ExpenseService | amountCents > 0; category must be active; only pending expenses are editable; reimburse requires approved-first |

## 4. Storage layout (per-install plugin storage)

```
categories/by-id/<id>            → ExpenseCategory
categories/index                 → string[] of category ids

invoices/by-id/<id>              → Invoice
invoices/by-client/<cid>         → string[] of invoice ids
invoices/index                   → string[] of all invoice ids
invoices/seq/<year>              → integer (next sequence number)

expenses/by-id/<id>              → Expense
expenses/by-category/<catId>     → string[] of expense ids
expenses/by-staff/<staffId>      → string[] of expense ids
expenses/index                   → string[] of all expense ids
```

Per-year `invoices/seq/<year>` keeps invoice numbers
human-friendly (`INV-2026-0042`) without a global counter that
risks gaps from races. Each year's sequence resets at January 1st.

## 5. API surface (15 routes mounted at `/api/portal/agency-finance/`)

| Method · Path | Handler | Roles |
|--------------|---------|-------|
| GET `invoices` | listInvoicesHandler | viewers |
| POST `invoices` | createInvoiceHandler | admins |
| PATCH `invoices` | updateInvoiceHandler | admins |
| DELETE `invoices?id=…` | deleteInvoiceHandler | admins |
| POST `invoices/mark-paid` | markInvoicePaidHandler | admins |
| GET `expenses` | listExpensesHandler | viewers |
| POST `expenses` | createExpenseHandler | viewers (staff submit own) |
| PATCH `expenses` | updateExpenseHandler | viewers |
| POST `expenses/approve` | approveExpenseHandler | admins |
| POST `expenses/reject` | rejectExpenseHandler | admins |
| POST `expenses/reimburse` | reimburseExpenseHandler | admins |
| GET `categories` | listCategoriesHandler | viewers |
| POST `categories` | createCategoryHandler | admins |
| PATCH `categories` | updateCategoryHandler | admins |
| GET `report?from=&to=&currency=` | reportHandler | viewers |

Roles: `viewers` = agency-owner / agency-manager / agency-staff;
`admins` = agency-owner / agency-manager.

## 6. RevenueSnapshot (the report)

`reports.revenueSnapshot({ from, to, currency })` walks invoices +
expenses in the window and returns:

```ts
{
  from, to, currency,
  invoicesIssued, invoicesPaid,
  totalIssuedCents, totalPaidCents, totalOverdueCents,
  totalExpensesCents,                    // only reimbursed expenses count
  netCents,                              // totalPaidCents - totalExpensesCents
  expensesByCategory: [{ categoryId, categoryName, amountCents, count }],
  monthly: [{ year, month, paidCents, expenseCents }],
}
```

V1 simplifications (called out in service comment):
- Only **reimbursed** expenses count as actual outflow. Pending and
  approved-but-not-paid don't hit the bank yet.
- **Single-currency** per snapshot — invoices / expenses in other
  currencies are excluded. Multi-currency consolidation is future.
- Overdue inferred from `status === "overdue"` OR (`status === "sent"` AND
  `dueAt < now`).

## 7. Smoke test (9 cases)

`src/__smoke__/finance.test.ts` — `node:test` via `tsx --test`. Builds
an in-memory foundation (Tenant resolves a stub agency + Felicia mirror,
User resolves a staff projection, ActivityLog/EventBus push to arrays),
walks:

| Step | Asserts |
|------|---------|
| 0 | `seedDefaults` ×2: first seeds 6 (Marketing/Office/Other/Salaries/Software/Travel), second is no-op; `isDefault: true` on seeded rows |
| 1 | `create` rejects duplicate (case-insensitive); R&D adds with `isDefault: false` |
| 2 | Invoice create with line items + tax → totals correct, status `draft`; draft → sent works; delete on sent rejected ("Only draft"); `update({status: "paid"})` rejected ("Use markPaid") |
| 3 | `markPaid` records payment + activity + event; second markPaid is idempotent (preserves first externalRef) |
| 4 | `renderInvoiceHtml` returns HTML with INV-YYYY-NNNN + line items + client name |
| 5 | Expense submit (`pending`) → reimburse-without-approve rejected → approve → second approve idempotent → reimburse works |
| 6 | Reject path: pending → rejected with decisionNote; rejected expenses can't be edited |
| 7 | `revenueSnapshot` aggregates correctly: 1 invoice paid (280000), 1 expense reimbursed (30000), netCents = 250000; per-category Software has 1 expense (rejected one filtered out) |
| 8 | Activity log + event bus carry all 7 finance verbs |

```
▶ agency-finance smoke
  ✔ step 0: seed default categories (idempotent)
  ✔ step 1: create category fails on duplicate name
  ✔ step 2: invoice create + status transitions + markPaid
  ✔ step 3: markPaid records payment + activity + event
  ✔ step 4: invoice HTML render
  ✔ step 5: expense submit → approve → reimburse
  ✔ step 6: expense reject path
  ✔ step 7: revenueSnapshot aggregates
  ✔ step 8: side-effects — activity + event bus
ℹ tests 9   ℹ pass 9   ℹ fail 0
```

`npm run smoke` from `04 the final portal/plugins/agency-finance/`.

## 8. Foundation pending (orchestrator brokerage)

| # | Task | File / Surface |
|---|------|---------------|
| 1 | Workspace dep + transpilePackages | `portal/package.json` + `portal/next.config.ts` |
| 2 | Side-effect-import file at `portal/src/plugins/foundation-adapters/agencyFinanceFoundation.ts` calling `registerAgencyFinanceFoundation({ tenant, user, activity, events, pluginInstalls })` | new file |
| 3 | `_registry.ts` append (`agencyFinanceManifest as unknown as AquaPlugin`) | `portal/src/plugins/_registry.ts` |
| 4 | `ActivityCategory` union += `"finance"` | `portal/src/server/types.ts` |
| 5 | **`UserPort.getUser` projection** — same projection memberships + affiliates need (foundation already shipping for those rounds) | shared with memberships / affiliates |

## 9. Cross-team integration TODOs

- **agency-HR cross-read**: when an expense carries `staffId`, the
  detail UI ideally shows the Staff record's name + department. v1
  resolves via `UserPort.getUser` (foundation Users projection); a
  richer cross-read into the agency-HR plugin is foundation-side
  brokerage if Ed wants it. Out of scope for this round.
- **Stripe Invoice sync**: deferred. v1 generates + tracks invoices
  manually; `paidVia: "stripe"` field is reserved for the future
  round that will sync with Stripe Invoicing API.
- **PDF export**: deferred. `renderInvoiceHtml` returns HTML; a
  future round can pipe through `puppeteer` or similar.

## 10. NOT in scope (per the prompt)

- Payroll integration / hourlyRate-based salary calc — agency-HR or a
  future agency-payroll plugin.
- Stripe Invoicing API integration for v1 — manual tracking only.
- PDF generation library — return raw HTML for now.
- Storefront block contributions — agency-finance is internal.

## 11. Verification commands

```bash
cd "04 the final portal/plugins/agency-finance"

# tsc clean
npx tsc --noEmit

# 9/9 smoke pass
npm run smoke
```
