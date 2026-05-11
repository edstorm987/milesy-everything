/loop

# T1 — Round 008: Per-client client-tasks kanban tab

Wire T2's `@aqua/plugin-kanban` `client-tasks` template into each
per-client overview as the **Kanban** tab. Aqua's real columns:
Backlog · This Week · Doing · Waiting On Client · Review · Done.

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §6 (kanban templates — exact column labels).
2. T2 kanban plugin chapter (latest) — board API + template machinery.
3. `04-agency-shell.md` R1 — current Kanban tab placeholder.

## Scope

**A** — `_KanbanTabClient.tsx` renders the kanban plugin's board UI for
the per-client `client-tasks` board (one auto-created per client at
phase advance to Blueprint Setup). On first load, lazily create the
board if missing via `POST /api/portal/kanban/boards`.

**B** — Quick-add card affordance pinned in Backlog column, with
keyboard-first input. Drag-between-columns delegates to plugin.

**C** — "Waiting On Client" column shows a soft amber treatment +
auto-emails the client (deferred to T2 R009 wiring; for now just
visual). Cards in this column count toward a per-client KPI on the
overview header ("3 waiting on client").

**D** — Smoke + chapter `04-client-tasks-kanban.md` + MASTER row.

## NOT in scope

- Building kanban from scratch (T2 owns the plugin).
- Cross-client kanban view.
- T4 territory.

## When done
DONE referencing `008-client-tasks-kanban-tab.md`.
