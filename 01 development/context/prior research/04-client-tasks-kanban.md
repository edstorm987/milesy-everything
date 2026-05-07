# `04` Per-client client-tasks kanban tab (T1 R8)

> Authored 2026-05-07. Wires T2's `@aqua/plugin-kanban` `client-tasks`
> template (Backlog · This Week · Doing · Waiting On Client · Review ·
> Done — chapter §6) into each per-client overview's Kanban tab,
> replacing the dashed-placeholder card.

## Files touched

- `portal/src/app/portal/clients/[clientId]/_KanbanTabClient.tsx` (NEW)
  - Client component. Boots: `GET /api/portal/kanban/boards?clientId=`,
    finds `clientId === <this> && templateId === "client-tasks"`;
    auto-creates one (POST `/boards?clientId=` with
    `{name:"<client> — tasks", scope:"client", templateId:"client-tasks"}`)
    when absent. Then `GET /boards/cards?clientId=&boardId=&status=active`,
    groups by `columnId`, sorts by `order`.
  - Renders horizontal-scroll 6-column grid. Backlog hosts a pinned
    quick-add form (`+ New task` keyboard input + Add button) →
    `POST /boards/cards` with Backlog columnId + `tags:["client"]`.
  - "Waiting On Client" column carries amber palette
    (`border-amber-300 bg-amber-50/60` + amber heading); count
    surfaces as a chip in the tab header (`{N} waiting on client`)
    when >0.
  - Native HTML5 drag/drop: each card `draggable` sets
    `text/x-card-id`; each column is a drop target that POSTs
    `/boards/cards/move` with `{cardId, toColumnId, toIndex}`. Touch
    fallback is a future polish round.
  - Optional `onWaitingCount(count)` callback exposes the waiting
    count for parent components — currently used internally; the
    chip lives in the tab header so the per-client page header
    doesn't need to fetch kanban state itself.
- `portal/src/app/portal/clients/[clientId]/page.tsx`
  - Imports `KanbanTabClient`. Replaces the previous dashed
    "T2's kanban plugin will surface here when shipped" placeholder
    with `<KanbanTabClient clientId={client.id} clientName={client.name} />`.
- `portal/scripts/smoke.mjs`
  - NEW `§ Client tasks kanban` block: per-client `?tab=kanban` 200,
    `client-tasks-kanban` testid present, `boards?clientId=` 200.

## Q-ASSUMED log

1. **Auto-create on first mount.** Prompt says "lazily create the
   board if missing" — wired via the same pattern as the founder-todos
   widget (T1 R5). Server still enforces the kanban plugin's
   `requiresScope: "client"` guard.
2. **Native HTML5 drag, no `react-dnd`.** Keeps the bundle clean.
   Touch-drag is poor on mobile — documented as polish-round
   follow-on (per-card up/down buttons could land alongside).
3. **Waiting-count chip lives inside the tab, not the page header.**
   Prompt suggested header surface; foundation server can't easily
   reach the kanban plugin's storage to compute the count at SSR
   time. Surfaced inside the kanban tab itself (visible whenever
   the operator looks at kanban — same workflow context, no
   double-render).
4. **No "phase advance to Blueprint Setup" auto-create hook yet.**
   Prompt mentions "one auto-created per client at phase advance";
   v1 creates on first kanban-tab visit instead — same effect for
   operators (the board exists by the time they look at it). Wiring
   into fulfillment's `advancePhase` event listener is a follow-on
   when the foundation event-bus exposes a hook surface T1 can attach
   to without modifying the fulfillment plugin.
5. **Auto-email "Waiting On Client" cards** — explicitly deferred to
   T2 R009 wiring per prompt's Goal C bullet; column treatment is
   visual-only here.

## NOT in scope

- Building kanban from scratch (T2 owns).
- Cross-client aggregated kanban view.
- Touch-drag fallback / per-card move buttons.
- Auto-email on column transition.
- Server-rendered waiting-count in the per-client page header.

## Smoke results

`§ Client tasks kanban` block adds 3 checks. tsc clean. HARD
BOUNDARY honoured.
