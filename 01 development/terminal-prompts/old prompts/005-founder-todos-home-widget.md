/loop

# T1 — Round 005: Founder Todos home widget

Per chapter §11 — Ed's personal task layer. T2's kanban already has the
`founder-todos` template (gated to Founder role). This round surfaces it
as a small widget on `/portal/agency` home so Ed sees his personal tasks
the moment he logs in.

## HARD BOUNDARIES

- Standard (milesymedia / business-os / shipped clients / read-only legacy).

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §11 + §6 (founder-todos template).
2. `04-plugin-kanban.md` R2 — the founder-todos seeded board.
3. Your `04-agency-shell.md` (R1 + R2) for current home layout.

## Scope

**Goal A — `<FounderTodosWidget>` component**
- Compact card on the home grid (above the clients grid, smaller).
- Shows the 5 most recent Today + This Week column cards from the
  Founder-scope `founder-todos` board.
- Inline "+ Add task" appends to the Today column.
- Click card → opens kanban detail drawer.
- Renders ONLY when current user has Founder role; otherwise hidden
  (zero space).

**Goal B — Mythos copy**
- Widget header: "Today's Quests" (matching Ed's mythos register from
  vault — chapter §1 + §11).
- Empty state: "No quests today. Forge one."

**Goal C — Smoke + chapter**
- Smoke: widget renders for Founder, hidden for non-Founder, "+ Add"
  persists, click opens kanban.
- Append "Round 005 — Founder Todos widget" to `04-agency-shell.md`.
  MASTER row.

## NOT in scope

- Kanban plugin changes (T2 owns).
- Calendar / scheduling integration.
- Touching milesymedia / business-os.

## When done

DONE referencing `005-founder-todos-home-widget.md`.
