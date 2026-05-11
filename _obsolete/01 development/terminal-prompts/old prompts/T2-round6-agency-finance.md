/loop

# T2 — Round 6: Agency-finance plugin + ecommerce affiliates wiring

Round 5 you shipped (A) the ecommerce↔memberships discount integration
and (B) `@aqua/plugin-affiliates` (`a5b4abc`, 9/9 smoke). Round 6 closes
two open loops: (A) wire ecommerce's `order.created` event to emit
`referralCodeId` so affiliates' listener can actually attribute, and
(B) ship `@aqua/plugin-agency-finance` — invoices + expenses + revenue
dashboard, the agency-internal companion to your agency-HR plugin.
Together with agency-HR (and a future agency-marketing), this completes
the Milesy-internal trio.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-2/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-2/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-architecture.md`
3. `01 development/context/prior research/04-plugin-ecommerce.md` (your R2 — order.created event lives here)
4. `01 development/context/prior research/04-plugin-agency-hr.md` (your R3b — agency-internal pattern to mirror)
5. `01 development/context/prior research/04-plugin-affiliates.md` (your R5b — Attribution listener)
6. `01 development/context/prior research/04-foundation-round3.md` (T1 wire-up pattern)
7. `01 development/eds requirments.md` (agency-internal expectations)

## Two goals

### Goal A: ecommerce emits `referralCodeId` on order.created

In your ecommerce plugin's `OrderService`, when an order is created (via
Stripe checkout completion or any other path), the `order.created` event
must carry the `referralCodeId` if the order had one. Affiliates'
`AttributionService.recordOrder` listener (already shipped in R5)
expects this field; without it, attributions never record.

1. Find the existing `eventBus.emit("order.created", { ... })` call site
   in `OrderService` (or wherever order creation completes).
2. Extend the event payload to include `referralCodeId?: string` and
   `endCustomerUserId?: string` (the latter is also useful for affiliates'
   own customer identification + memberships' downstream cross-checks).
3. Document the new event payload shape in `04-plugin-ecommerce.md` (or
   write a small `04-plugin-ecommerce-round6.md` chapter if the change
   is significant enough — your call).
4. Smoke: extend the existing ecommerce smoke (or affiliates' smoke) to
   verify the event-bus subscription end-to-end: ecommerce creates an
   order with referralCodeId → affiliates' container records an
   Attribution.

If the event-bus path needs foundation help to actually route between
plugins (it might — depends on how T1's `eventBus` adapter handles
cross-plugin pub/sub), log a `Q-ASSUMED` proposing the simplest workable
shape and continue. T1 will broker on their next foundation round.

### Goal B: `@aqua/plugin-agency-finance`

Mirror your fulfillment + ecommerce + agency-HR + memberships + affiliates
shape. Self-contained package, vendored types, ports, container builder,
foundation adapter, tsc-clean standalone.

Manifest:
- `id: "agency-finance"`
- `category: "core"` (agency-internal)
- `scopePolicy: "agency"` — installed at agency level, NOT per-client (mirrors agency-HR)
- `core: false` — opt-in
- ~5 navItems: Invoices · Expenses · Revenue · Reports · Settings (panel `agency-finance`)
- ~5 admin pages
- ~12 API routes at `/api/portal/agency-finance/*`
- `onInstall` seeds default expense categories (Salaries, Software, Travel, Marketing, Office, Other) + default invoice template

### Domain model

```ts
type Invoice = {
  id, agencyId, clientId,           // billed to a client
  number,                           // human-readable, e.g. "INV-2026-0042"
  issuedAt, dueAt,
  lineItems: InvoiceLineItem[],     // { description, quantity, unitCents, total }
  subtotalCents, taxCents, totalCents,
  currency,                         // ISO 4217
  status: "draft"|"sent"|"paid"|"overdue"|"void"|"refunded",
  notes?, externalRef?,             // e.g. Stripe Invoice id if synced
  paidAt?, paidVia?,
  createdAt, updatedAt,
};

type Expense = {
  id, agencyId,
  staffId?,                         // optional; expense incurred by a person
  categoryId,                       // foreign key → ExpenseCategory
  vendor?, description?,
  amountCents, currency,
  incurredAt,
  status: "pending"|"approved"|"reimbursed"|"rejected",
  receiptUrl?,                      // stored on plugin storage, not foundation files
  approvedBy?, approvedAt?, reimbursedAt?,
  createdAt, updatedAt,
};

type ExpenseCategory = {
  id, agencyId, name,
  isDefault: boolean,
  status: "active"|"archived",
};
```

### Services

- **InvoiceService** — CRUD + status transitions + simple PDF export
  (HTML stringified for now; real PDF lib is a future round). `markPaid(id, externalRef?)` flips sent → paid.
- **ExpenseService** — CRUD + approval workflow + cycle detection for
  category parent graphs (mirror agency-HR's department cycle prevention).
- **CategoryService** — CRUD on ExpenseCategory + idempotent seedDefaults.
- **ReportService** — `revenueSnapshot({from, to})` walks paid invoices,
  expenses by category, simple monthly aggregate. No graphs — return raw
  data; T3's website-editor blocks could later visualise.

### Ports needed from foundation

- `StoragePort` — per-install plugin storage
- `TenantPort` — `getClient(clientId)` for invoice billing-to lookups
- `UserPort` — `getUser(userId)` to resolve staff (cross-read with agency-HR for staff names)
- `ActivityLogPort` — `"finance"` ActivityCategory; T1 extends foundation enum (note for cross-team)
- `EventBusPort` — emits `invoice.created`, `invoice.sent`, `invoice.paid`, `invoice.voided`, `expense.created`, `expense.approved`, `expense.reimbursed`, `expense.rejected`
- `PluginInstallStorePort`

### API routes (~12, mounted at `/api/portal/agency-finance/*`)

Admin (`visibleToRoles: ["agency-owner", "agency-manager"]` for write;
`+"agency-staff"` for read where appropriate):
- `GET /invoices` · `POST /invoices` · `PATCH /invoices/:id` · `DELETE /invoices/:id` · `POST /invoices/:id/mark-paid`
- `GET /expenses` · `POST /expenses` · `PATCH /expenses/:id` · `POST /expenses/:id/approve` · `POST /expenses/:id/reject` · `POST /expenses/:id/reimburse`
- `GET /categories` · `POST /categories` · `PATCH /categories/:id`
- `GET /report` — query `?from=&to=`, returns revenue + expense aggregates

### Admin pages (~5)

`InvoicesPage`, `InvoiceDetail`, `ExpensesPage`, `ExpenseDetail`,
`ReportsPage`, `SettingsPage`. Inline category management can live on
SettingsPage.

### NO storefront blocks

Agency-finance is internal. Don't contribute storefront block ids.

## Foundation integration

Same pattern as agency-HR + memberships + affiliates:
- `tsc --noEmit` clean inside `04-the-final-portal/plugins/agency-finance/`.
- Ports declared in `src/server/ports.ts`.
- Export `buildAgencyFinanceContainer(deps)`.
- Export `registerAgencyFinanceFoundation(deps) + containerFor(storage)` for side-effect-import.
- Document Foundation pending list in chapter (workspace dep, transpilePackages, side-effect-import file, _registry.ts append, ActivityCategory += "finance").

## NOT in scope

- Don't build payroll integration or hourlyRate-based salary calc — that
  belongs in agency-HR or a future agency-payroll plugin.
- Don't build Stripe Invoicing integration for v1 — invoices are
  generated-and-tracked, not billed-through-Stripe. Real Stripe Invoice
  sync is a future round.
- Don't build PDF generation library — return raw HTML/JSON for now;
  PDF lift is a future round.
- Don't touch fulfillment / website-editor / ecommerce (except Goal A's
  event-bus emit edit) / agency-HR / memberships / affiliates plugin source.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end.

## When done

Goal A:
1. ecommerce `order.created` event payload includes `referralCodeId` + `endCustomerUserId`.
2. Smoke verifies the cross-plugin event flow.

Goal B:
1. `tsc --noEmit` clean inside `04-the-final-portal/plugins/agency-finance/`.
2. Smoke (`src/__smoke__/finance.test.ts`) — node:test cases:
   - `seedDefaults` idempotent.
   - Invoice CRUD + status transitions.
   - Expense submit → approve → reimburse flow.
   - `revenueSnapshot` returns correct aggregates.
   - Activity log + event bus side-effects.
3. Chapter `04-plugin-agency-finance.md` documenting domain, services,
   API surface, Foundation pending list.
4. MASTER.md row.
5. `tasks.md` row done.
6. Final `DONE` + `COMMIT`.

Goal A first (small + closes affiliates loop). Goal B is the meat. If
the loop runs out before Goal B completes, commit per service landed.
