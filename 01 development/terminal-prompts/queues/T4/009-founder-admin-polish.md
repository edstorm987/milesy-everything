/loop

# T4 — Round 009: Founder admin polish — full dashboard

Current `admin.html` has tabs Overview/Leads/Reports/Questions. Expand
into a real founder dashboard pulling from BOS + HC + Incubator state.
All from localStorage aggregation — no API.

## Mandatory pre-read

1. T4 chapter #69 (admin questions editor — current admin shape).
2. T4 chapter #66 (full localStorage schema).
3. T4 R001-R008.

## Scope

**A** — New Overview KPIs: Leads (HC complete) · Active in Incubator
(by phase) · BOS engagement (lesson completion / time-spent) ·
Marketplace clicks (top add-ons clicked).

**B** — Per-lead drill-down: HC results · Incubator phase · last
activity · note field. Export-CSV button.

**C** — Reports tab: weekly snapshot (run-anytime button) listing
counts + 7-day deltas. Honesty: small `n` flagged.

**D** — Questions editor (existing) gets phase-scope tags so Q's can
target specific Incubator phases.

**E** — Auth: existing prompt() password gate stays; flag TODO for
real auth at T6 prod gate.

**F** — Chapter update + MASTER row delta.

## NOT in scope

- Real BI / chart library (use small CSS sparklines).
- Multi-user admin.

## When done
DONE referencing `009-founder-admin-polish.md`.
