# `04` Founder home dashboard (T1 R18)

> Authored 2026-05-07. Expands `/portal/agency` from "clients grid +
> Founder Todos" into a single-page Founder dashboard with a 5-tile
> KPI strip + an across-the-agency activity feed. Read-only.
> Honesty-contract on every empty/missing surface (chapter #68).

## Files touched

- `portal/src/app/portal/agency/_FounderDashboardKpis.tsx` (NEW)
  - Client component. 5-tile responsive grid (1-col → 5-col):
    1. **Active clients** — server-rendered count of non-`churned`
       clients (passed in as prop).
    2. **Tasks · This Week** — fetches every `templateId ===
       "client-tasks"` board, sums cards in the `"This Week"`
       column with `status === "active"`. Plugin-not-installed →
       `—` + "Connect kanban to see".
    3. **Lock-in collected** — server-rendered count of clients
       whose `metadata.lockInPaid === true`.
    4. **Touchpoints / 7d** — fetches `/api/portal/agency-marketing/
       leads`, counts those with `lastContactedAt` in the last 7
       days. Plugin missing → `—` + "Connect agency-marketing to
       see".
    5. **Stale clients (>7d)** — server-rendered count of clients
       with no `metadata.lastContactedAt` OR delta > 7d.
  - Loading state surfaces `…` (no premature 0). Empty / fallback
    tiles render with muted background + grey value to make the
    distinction visually unambiguous.
- `portal/src/app/portal/agency/_AgencyActivityFeed.tsx` (NEW)
  - Client component. Fetches `/api/portal/activity-inbox/list?limit=
    15` once on mount; renders one `<li>` per entry with category
    chip + message + relative timestamp. Plugin missing surfaces an
    explicit "Connect activity-inbox to see events" line. Empty
    array renders "No activity yet today."
- `portal/src/app/portal/agency/page.tsx`
  - Imports both components. Page layout now flows:
    1. Welcome banner + New-client CTA (existing).
    2. **`<FounderDashboardKpis>`** (NEW).
    3. **`<FounderTodosWidget>`** (R005).
    4. **`<AgencyActivityFeed>`** (NEW).
    5. Clients grid / empty state (existing).
  - Three KPI tiles compute server-side from already-loaded clients
    list (no extra round-trip):
    - active = `clients.filter(c => c.stage !== "churned").length`
    - lockIn = `clients.filter(metadata.lockInPaid).length`
    - stale = `clients.filter(no-lastContactedAt || >7d).length`
- `portal/scripts/smoke.mjs`
  - NEW `§ Founder dashboard` block: home shows
    `founder-dashboard-kpis` testid + each of the 5 `kpi-tile-…`
    testids + `agency-activity-feed` testid + activity-inbox list
    endpoint 200.

## Honesty-contract surface (chapter #68)

| Surface | Empty source | What renders |
| ------- | ------------ | ------------ |
| `tasks-week` tile, plugin missing | `/api/portal/kanban/boards` 404 | `—` + "Connect kanban to see" |
| `tasks-week` tile, no boards | empty kanban list | `0` (real zero — boards exist but no tasks) |
| `touchpoints` tile, plugin missing | marketing 404 | `—` + "Connect agency-marketing to see" |
| `touchpoints` tile, no recent leads | empty filtered set | `0` |
| Activity feed, plugin missing | activity-inbox 404 | "Connect activity-inbox to see events" |
| Activity feed, no entries | empty list | "No activity yet today." |
| `clients` tile when empty | `clients.length === 0` | `0` + "Add your first therapist to begin." |
| `lockin` tile when empty + clients exist | nobody marked paid | `0` + "Mark a client's £100 deposit paid…" |
| `stale` tile when stale exist | `count > 0` | `<count>` + "Reach out — chapter §7 SOP." |

No tile ever shows a fabricated number. The `…` placeholder only
appears during the brief loading window.

## Q-ASSUMED log

1. **Server-side aggregation only for already-loaded data** — kanban
   + marketing + activity all fetch client-side because foundation
   server can't easily reach plugin storage at request time (same
   precedent: R8 KanbanTabClient, R9 SOPs). Avoids per-pageview
   ctx-build overhead.
2. **Tasks-this-week counts active cards only** — archived cards
   are explicitly excluded; `?status=active` query.
3. **Touchpoints metric = leads.lastContactedAt** — agency-marketing
   doesn't expose a foundation-canonical "touchpoint" event; leads
   are the closest stand-in. Documented for replacement when a
   richer metric lands.
4. **Layout order** — KPI strip first, then Founder Todos, then
   activity feed, then clients grid. Founder's eye flows top-down
   from "what changed" → "what I owe" → "what just happened" →
   "who's onboarded".

## NOT in scope

- Editable widgets (read-only this round).
- Custom KPI library / per-Founder layout.
- Cross-agency views.
- Live polling / websocket updates (mount-time fetch only).
- Touching milesymedia / business-os / plugin internals.

## Smoke results

`§ Founder dashboard` block adds 8 checks. tsc clean. HARD BOUNDARY
honoured.
