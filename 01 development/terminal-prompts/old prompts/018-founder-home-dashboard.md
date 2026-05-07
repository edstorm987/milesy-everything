/loop

# T1 — Round 018: Founder home dashboard — single-page overview

`/portal/agency` currently shows clients grid + Founder Todos.
Expand into a richer founder dashboard pulling KPIs from across
plugins (clients, finance, kanban, comms, marketing) — read-only,
honesty-contract for empty states.

## Mandatory pre-read

1. T1 R001 home page (clients grid).
2. T1 R005 Founder Todos widget.
3. T2 agency-finance R007 PnL service, agency-marketing R008
   Performance service.
4. Chapter #68 honesty contract.

## Scope

**A** — Above clients grid: KPI strip (5 tiles). Active clients ·
This week's tasks (sum of all client-tasks "This Week" cards) ·
Lock-in payments collected · Marketing touchpoints / 7d · Stale
clients (>7d no contact).

**B** — Each tile reads from the relevant plugin endpoint;
empty/missing returns "—" with "Connect ___ to see" subtext per
honesty contract. No fabrication.

**C** — Below Founder Todos: "Today across the agency" feed pulled
from `/api/portal/activity?role=agency&limit=15` (uses T2 activity
inbox).

**D** — Smoke + chapter `04-founder-home-dashboard.md` + MASTER row.

## NOT in scope

- Editable widgets (read-only this round).
- Custom KPI library.
- Cross-agency views.

## When done
DONE referencing `018-founder-home-dashboard.md`.
