# `04` Agency Shell — Founder Todos widget (T1 R5)

> Authored 2026-05-07. Surfaces T2's `founder-todos` kanban template
> (T2 R2, agency-scope, role-gated) on `/portal/agency` home so Ed
> sees his personal task layer the moment he logs in. Chapter §11
> "Ed's mythos register".

## Files touched

- `portal/src/app/portal/agency/_FounderTodosWidget.tsx` (NEW)
  - Client component. `useEffect` mounts when `isFounder` prop is
    true; non-Founder renders `null` (zero space, not a hidden div).
  - Boot sequence: `GET /api/portal/kanban/boards?role=founder` →
    find `templateId === "founder-todos"`; if absent, `POST /boards`
    with `{name:"Founder to-dos", scope:"agency", templateId:"founder-todos"}`
    so first-load isn't empty (kanban plugin's `requiresRole` +
    `requiresScope` guards enforce role/scope at server).
  - `GET /boards/cards?boardId=<id>&status=active` → filter cards
    whose `columnId` matches the "Today" or "This Week" columns,
    sort by `updatedAt` desc, slice(0, 5).
  - Inline `+ Add quest to Today` form `POST /boards/cards` with
    Today columnId + `tags:["founder"]`. Optimistic append on
    success.
  - Click row → `/portal/agency/kanban/boards/<id>#card-<cardId>`
    (kanban manifest mounts BoardDetailPage at `boards/:id`).
- `portal/src/app/portal/agency/page.tsx`
  - Imports widget; renders `<FounderTodosWidget isFounder={session.role === "agency-owner"} />`
    above the clients-grid section, between the welcome banner and
    the empty-state / clients-grid.
- `portal/scripts/smoke.mjs`
  - NEW `§ Founder todos widget` block: home 200 (founder POV) +
    "Today's Quests" + `founder-todos-widget` testid + boards
    endpoint 200.

## Mythos copy (Goal B)

| Slot           | Copy                                |
| -------------- | ----------------------------------- |
| Header title   | `Today's Quests`                    |
| Subtitle       | `Founder-only · Today + This Week` (or `loading…`) |
| Empty state    | `No quests today. Forge one.`       |
| Add-input ph.  | `+ Add quest to Today`              |
| Open-board CTA | `Open board →`                      |

Tone matches Ed's vault register (mythos / strategic / sacred) —
"quest" + "forge" not "task" + "create".

## Q-ASSUMED log

1. **Auto-create founder-todos board** when one doesn't exist for the
   agency. The widget would otherwise be permanently empty until Ed
   manually creates it via the kanban surface — defeats the
   single-glance discoverability goal. POST is gated server-side by
   `requiresRole: "founder"` so non-Founders can never trigger it.
2. **Founder = `agency-owner`** for v1. Foundation has no separate
   "founder" role enum; agency-owner is the canonical solo-founder
   role. Kanban plugin's role gate accepts the literal string
   "founder" via the `?role=founder` query param (see
   `listTemplatesForRoles` case-insensitive matcher) — the widget
   passes that literal regardless of actual session.role string.
3. **No zero-space wrapper for non-Founders.** Component returns
   `null` directly per prompt's "otherwise hidden (zero space)"
   bullet, not an empty div with hidden classes.
4. **Click target = anchor with `#card-<id>` fragment.** BoardDetailPage
   doesn't yet auto-scroll to a fragment; documented as a
   nice-to-have for a future kanban polish round. The link still
   lands on the right board.

## NOT in scope

- Calendar / scheduling integration.
- Kanban plugin internals (T2 owns).
- Drag/reorder / column-move from the widget — surface is read-mostly,
  Today-column write only.
- Touching milesymedia / business-os.

## Smoke results

`§ Founder todos widget` block adds 4 checks. tsc clean. HARD
BOUNDARY honoured.
