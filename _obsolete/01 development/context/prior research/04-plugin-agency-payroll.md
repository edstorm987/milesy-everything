# `@aqua/plugin-agency-payroll` — internal-team payroll surface

T2 R015 · agency-scope · alpha · `core: false` · soft-pairs `agency-hr` + `agency-finance`

## Why

Per Ed's Aqua HQ chapter §1 the operator runs a payroll cadence —
employee runs + contractor invoices + monthly totals. Existing plugins
cover staff records (`agency-hr`) and client invoicing (`agency-finance`)
but not the operator↔payee pay flow. R015 fills that gap. Real bank /
Stripe wiring is intentionally out of scope — the plugin lives behind
operator-paste amounts until T6 prod-deploy gates expose payment
rails. Tax / NI calculations are also flagged R+1.

## Shape

```
id:           "agency-payroll"
scopePolicy:  "agency"
core:         false
requires:     ["agency-hr", "agency-finance"]
status:       alpha
category:     "ops"
```

`requires` is declared per the prompt; engine soft-handles missing deps
(matches the established R013/R014 pattern — strict-require enforcement
is a foundation concern, not a per-plugin one).

## Domain

### `PayPeriod`

```
{ id, agencyId, year (≥2000 ≤2200, integer), month (1..12, integer),
  startedAt, closedAt?, status: "open"|"closed", notes? }
```

Idempotent open keyed on `payroll/periods/by-key/<YYYY-MM>` rev-index —
re-opening the same year/month returns the existing row, no duplicate
index entries. Closed → reopened is intentionally NOT supported (close
is a one-way state transition; reopen would be a R+1 explicit flow).
`close` itself is idempotent — second call returns the row, no
re-emit of `payroll.period.closed`.

### `Payslip`

```
{ id, agencyId, periodId, payeeId, payeeKind: "employee"|"contractor",
  payeeName (snapshot — survives staff renames/archives),
  gross, net (integer minor-units; pence/cents),
  currency (ISO upper, default "GBP" — operator-set via settings),
  notes?, paidAt?, createdAt, updatedAt }
```

- `payeeName` is **snapshotted** at create-time — if a staff member is
  later renamed or archived in `agency-hr`, the payslip still shows
  the original name. The audit trail must not silently rewrite history.
- `gross` / `net` are minor-units integers; zero is allowed (zero-net
  unpaid-leave slips); negatives reject.
- `currency` uppercases on write so casing in API input doesn't matter.
- Creating a payslip on a **closed** period throws `PayrollClosedError`
  → HTTP 409 — the close transition freezes the period.

### `Contractor`

```
{ id, agencyId, staffId? (optional pointer into agency-hr Staff),
  name, email?, hourlyRate? (minor-units), currency? (ISO upper),
  archived, createdAt, updatedAt }
```

Stored separately from `agency-hr` Staff because the operator may pay
contractors who aren't (and shouldn't be) on the staff roster.
`staffId` is the soft-link for contractors who ARE on staff.

### `PeriodTotals` (honesty contract)

```
{ periodId, paidGross, paidNet, paidCount, totalCount,
  hasData,                ← paidCount > 0
  byKind: { employee: {paidGross,paidNet,paidCount},
            contractor: {paidGross,paidNet,paidCount} } }
```

`hasData=false` until ≥1 paid payslip exists for the period. The
Reports page reads this and renders a real empty-state ("No paid
payslips yet — open a period, add payslips, mark them paid") rather
than fabricating zero totals — matches the honesty pattern used by
R009 agency-ops `HealthService.overview`.

## Services

| Service              | Operations |
|----------------------|------------|
| `PayPeriodService`   | `open(actor,{year,month,notes?})` — idempotent · `close(actor,id)` — idempotent · `get(id)` · `getByMonth(y,m)` · `list()` |
| `PayslipService`     | `create(actor,input)` · `update(actor,id,patch)` · `markPaid(actor,id,paidAt?)` — **idempotent, single emit** · `delete(actor,id)` · `get(id)` · `list(filter)` |
| `ContractorService`  | `create(actor,input)` · `update(actor,id,patch)` · `list({includeArchived})` · `get(id)` |
| `PayrollReports`     | `totalsForPeriod(periodId)` — honesty contract |

### Idempotent `markPaid` — the load-bearing invariant

```
async markPaid(actor, id, paidAtOverride?) {
  const cur = await get(id);
  if (!cur) throw NotFound;
  if (cur.paidAt !== undefined) return cur;   // ← no-op + NO re-emit
  const t = paidAtOverride ?? now();
  await store({ ...cur, paidAt: t });
  log("payroll.payslip.paid", …);
  emit("payroll.payslip.paid", { id, periodId, net, currency });
  return next;
}
```

`agency-finance` will subscribe to `payroll.payslip.paid` and surface
a reconciliation hint on its dashboard ("Pay run for 2026-05 settled —
reconcile against bank statement?"). If `markPaid` re-emitted on
double-click, the operator would get duplicate hint cards — annoying
and undermines trust in the feed. Test 7 verifies the no-emit path.

`paidAt` is set to `now()` by default; the override exists for
back-dating a slip that was paid offline. Once paid the row is
immutable (re-mark is no-op; reverting would be a R+1 admin escape
hatch behind a confirmation flow).

## API (12 routes)

```
GET    periods/list                       VIEWERS
POST   periods/open       {year,month}    ADMINS  201
POST   periods/close      ?id=            ADMINS
GET    payslips/list      ?periodId=&kind=&payeeId=&paid=1&unpaid=1   VIEWERS
POST   payslips/create    body=Create     ADMINS  201    409 if period closed
PATCH  payslips/update    ?id= body=Patch ADMINS
POST   payslips/paid      ?id=            ADMINS
DELETE payslips/delete    ?id=            ADMINS
GET    contractors/list   ?archived=1     VIEWERS
POST   contractors/create body=Create     ADMINS  201
PATCH  contractors/update ?id= body=Patch ADMINS
GET    totals             ?periodId=      VIEWERS
```

VIEWERS: `agency-owner` / `agency-manager` / `agency-staff`. Staff can
read but not mutate — they may need to verify their own slip but
shouldn't be opening/closing periods. Freelancers excluded entirely
from payroll surface (their pay belongs in `agency-finance` invoice
flow if they're externally invoicing the agency).

## Pages (4)

1. **`PeriodsPage`** (default landing) — table of all periods sorted
   year-desc / month-desc, status pill (open=green / closed=neutral),
   Started / Closed dates, deep-link to per-period payslips. Empty
   state when no periods.
2. **`PayslipsPage`** — table filtered by `?periodId=&kind=` query.
   Kind chips (All / Employees / Contractors). Status pill paid/unpaid.
   Currency-aware amount formatting (`{currency} {gross/100}`).
3. **`ContractorsPage`** — table of all contractors (incl archived,
   greyed). Name / Email / Hourly rate / Linked staff / Status.
4. **`ReportsPage`** (admins only) — per-period totals table. Honesty
   empty-state banner when no paid payslips across all periods.

Pages match the R013/R014 inline-styling pattern — no design-system
abstraction yet; visual polish is a T4 concern.

## Cross-plugin events

```
payroll.period.opened     {id,year,month}
payroll.period.closed     {id}
payroll.payslip.created   {id,periodId}
payroll.payslip.updated   {id}
payroll.payslip.paid      {id,periodId,net,currency}   ← agency-finance hooks here
payroll.payslip.deleted   {id}
payroll.contractor.created/updated/archived  {id}
```

`payroll.payslip.paid` is the load-bearing one — agency-finance will
subscribe (R+1 follow-up wiring on its side) to surface a
reconciliation hint. Other events re-broadcast for any future
consumer (e.g. agency-marketing run-rate dashboards).

## Activity log

All entries land under category **`hr`** with the `payroll.*` action
prefix:

```
payroll.period.opened
payroll.period.closed
payroll.payslip.created
payroll.payslip.paid       ← payslip.updated/deleted are event-only (low-noise)
payroll.contractor.created
payroll.contractor.archived
```

The `ActivityCategory` union (vendored from foundation) doesn't yet
include `"payroll"` — flagged **R+1** to extend the foundation enum
and migrate. Riding on `hr` is the closest semantic fit (payroll is
HR-adjacent; both touch staff records).

## Smoke 12/12

1. `open(year, month)` creates period; idempotent — re-opening same
   year/month returns the existing row, no duplicate index entry.
2. `open` rejects invalid year (1999 / 2.5) + invalid month (0 / 13).
3. `close` transitions open→closed + emits `payroll.period.closed`;
   second close is no-op + no second emit.
4. `createPayslip` stores; `paidAt` undefined initially; emits
   `payroll.payslip.created`.
5. `createPayslip` rejects negative gross/net; allows zero; rejects
   creating on closed period (`PayrollClosedError`).
6. `update` patches gross/net/notes + emits `payslip.updated`;
   rejects negative patch.
7. **`markPaid` sets `paidAt` + emits `payroll.payslip.paid` ONCE;
   second call is no-op (no second emit).** ← load-bearing test.
8. `list` filters by `periodId` + `payeeKind` + `paidOnly` /
   `unpaidOnly` correctly.
9. `totalsForPeriod` — `hasData=false` until ≥1 paid payslip; sums
   gross/net + by-kind buckets.
10. `createContractor` stores + list returns; archive flips +
    emits `payroll.contractor.archived`; no-op archive doesn't
    re-emit.
11. `delete payslip` removes from list + index + emits
    `payslip.deleted`; not-found throws `PayrollNotFoundError`.
12. Activity entries land under category `"hr"` with `payroll.*`
    action prefix; `viewed`/`updated`/`deleted` are event-only
    (low-noise).

## NOT in scope

- **Real bank / Stripe integration** (T6 prod gate; explicitly
  flagged in the prompt).
- **Tax / NI calculations** — operator computes net externally and
  pastes the result.
- Touching `milesymedia website/`, `business-os/`,
  `clients/compass-coaching/` (HARD BOUNDARIES).

## R+1 candidates

- Foundation `ActivityCategory` extension `"payroll"` so the activity
  feed renders a payroll-specific chip; ride on `"hr"` until then.
- Real bank/Stripe integration with reconciliation against bank CSV
  (T6 gate).
- Tax / NI / pension calculator step inside the payslip-create flow
  (`gross → net` derivation given country + tax-code).
- Contractor-invoice ingest from `agency-finance` (when an Invoice's
  vendor matches a Contractor row, auto-suggest a Payslip draft).
- Reverse the `markPaid` no-op into an explicit "void payment" admin
  escape hatch behind a confirmation flow + audit metadata.
- Multi-currency aggregation on `PayrollReports` (today: per-payslip
  currency preserved but Reports page sums in raw minor-units —
  display assumes operator-aware mixed currencies; fold in
  conversion-aware totals once a rates source exists).
- Drag-to-reorder / payee groupings on PayslipsPage.
- Bulk import from CSV (mirror sops `seedDefaults` pattern).
- Per-period PDF / CSV export (today: JSON via api `payslips/list`
  filter only).
- agency-finance subscriber wiring for `payroll.payslip.paid` →
  reconciliation hint card on its dashboard (this round emits;
  consumer is its own R+1 on the agency-finance side).
- agency-hr Contractor↔Staff bidirectional sync (today: optional
  `staffId` is one-way; could surface "Pay history" tab on a Staff
  detail page).

## HARD BOUNDARIES honoured

Zero touches to `milesymedia website/`, `business-os/`,
`clients/compass-coaching/`. No edits in T1/T3/T4/T5/T6 scopes.
