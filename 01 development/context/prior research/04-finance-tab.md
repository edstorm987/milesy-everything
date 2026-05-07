# `04` Per-client Finance tab (T1 R11)

> Authored 2026-05-07. Replaces the placeholder Finance tab on the
> per-client overview with a real surface that pulls from T2's
> `agency-finance` plugin (T2 R007), with a graceful empty-state CTA
> when no invoices exist. Honesty contract from chapter #68 enforced —
> no fabricated MRR / numbers when there's no data.

## Files touched

- `portal/src/app/portal/clients/[clientId]/_FinanceTabClient.tsx` (NEW)
  - Client component. Three sections:
    1. **Header strip**: Plan tier chip (Foundational Flow / Expansion
       Plan / Mastery Plan from `metadata.planTier`); lock-in pill
       (`£100 paid` emerald or `Unpaid` muted from
       `metadata.lockInPaid`); right-aligned `Open Stripe ↗` anchor
       when `metadata.stripeLink` is set.
    2. **MRR strip**: 12-month rollup over PAID invoices only. When
       any data exists, renders a 12-bar SVG sparkline (240×40,
       brand-primary fill) + the cumulative total. When empty,
       renders an italic chapter-#68-honesty paragraph + a `Connect
       billing →` link to `/portal/agency/agency-finance` rather
       than a fake number.
    3. **Invoices table**: `GET /api/portal/agency-finance/invoices?
       clientId=` on mount. Loading / empty / populated states. Empty
       state shows a `Connect billing → Open agency-finance` CTA.
       Plugin-not-installed surfaces as the same empty state with
       different copy ("agency-finance plugin not installed").
  - **Manual invoice quick-add**: `+ Manual invoice` toggles an
    inline form (number + amount in £ + due date + status select);
    submit POSTs `/invoices` with a single-line-item payload
    (`unitPriceCents = subtotalCents = totalCents = round(amount*100)`,
    `taxCents=0`, `currency="GBP"`, `dueAt = parsed-or-default-14d`)
    then refreshes the table.
  - Money formatter handles GBP/USD/EUR symbol prefix; falls back to
    `<currency> ` for unknown ISO codes.
- `portal/src/app/portal/clients/[clientId]/page.tsx`
  - Imports `FinanceTabClient`. The R7 `<RequirePermission requires=
    {["finance.view"]}>` wrapper stays; the inline placeholder
    section ("Per-client rollup from agency-finance") is replaced
    with `<FinanceTabClient clientId initial={{planTier, lockInPaid,
    stripeLink}}>`.
- `portal/scripts/smoke.mjs`
  - NEW `§ Finance tab` block: `?tab=finance` 200 +
    `client-finance-tab` testid + `Plan` header strip + `12-month
    paid total` strip + `agency-finance/invoices?clientId=` 200.

## MRR / sparkline math

12 buckets (oldest → newest, indexed `[0..11]`). For each PAID
invoice with `paidAt`, compute `monthsAgo = (now.year - paid.year) *
12 + (now.month - paid.month)`. When `0 ≤ monthsAgo ≤ 11`, accrue
`totalCents` into `buckets[11 - monthsAgo]`. Render only when total
> 0. Chapter #68 honesty: zero data = no chart, just a
"connect-billing" call-to-action — the agency operator never sees a
number that wasn't measured.

## Q-ASSUMED log

1. **GBP default** — Aqua is UK-based (chapter §6 hints £100 lock-in).
   Currency override = R+1 polish; manual-invoice form forces GBP.
2. **Server permissions handle finance.edit** — manual-invoice POST
   gates on `AGENCY_ADMINS` server-side via the plugin's route
   visibility. T1 R7's `RequirePermission` wraps the tab on
   `finance.view`; doubling up on `finance.edit` for the inner
   button would just hide it from agency-staff who already can't
   see the parent tab.
3. **Sparkline is paid-only**, not "MRR" in the strict sense (it's
   really 12-month paid revenue). Distinguishing recurring vs one-
   off requires plan-tier metadata on each invoice — out of scope
   for this round; "12-month paid total" label is honest.
4. **Plugin missing fallback = empty-state CTA**, not a deeper
   degraded-mode. The per-client tab assumes agency-finance is
   reachable in production; the missing-plugin path is a developer
   convenience.
5. **Stripe quick-link** uses pre-existing `metadata.stripeLink`
   from R002 Aqua reskin; the prompt's `metadata.stripeUrl` alias
   would need a tenants migration — kept the `stripeLink` field
   name for v1, document `stripeUrl` as a synonym for follow-on.

## NOT in scope

- Real Stripe sync (T6 prod gate).
- Multi-currency.
- Per-invoice line-item editor (use agency-finance plugin's full
  surface for that).
- Auto-overdue computation (status field is operator-managed).
- Editing or deleting invoices from the per-client tab — read +
  add only; full CRUD lives on the plugin's own surface.

## Smoke results

`§ Finance tab` block adds 5 checks. tsc clean. HARD BOUNDARY
honoured.
