/loop

# T2 — Flexible Kanban plugin

Ed wants a kanban he can edit (add columns, rename phases) and switch
between board types (fulfillment / lead pipeline / client tasks / blank).
One generic engine, multiple templates. Coexists with fulfillment's
phase-board (which is the rigid lifecycle); kanban is the flexible
scratchpad.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.

## HARD BOUNDARIES — do NOT touch

- `04-the-final-portal/milesymedia website/` — Ed owns this.
- `04-the-final-portal/business-os/` — Ed owns this.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/context/MASTER.md`
3. `01 development/context/prior research/04-architecture.md`
4. The most recent T2 plugin chapter (mirror its shape: `client-crm`,
   `agency-marketing`, etc.)
5. `04-the-final-portal/plugins/fulfillment/` — its phase-board for
   reference; do NOT modify.
6. `01 development/messages/terminal-2/from-orchestrator.md`

## Scope

**Goal A — Generic engine (`@aqua/plugin-kanban`)**
- `scopePolicy: "either"` (works at agency or per-client), `core: false`,
  no required deps.
- Domain: `Board { id, name, scope, columns: Column[] }`,
  `Column { id, label, order, color? }`, `Card { id, boardId, columnId,
  title, description?, assigneeUserId?, dueAt?, tags[], metadata: {...} }`.
- Server: `BoardService` + `CardService` with full CRUD + reorder
  (`moveCard(cardId, toColumnId, toIndex)`, `moveColumn(columnId, toIndex)`,
  `addColumn(boardId, label)`, `renameColumn(columnId, label)`,
  `archiveCard(cardId)`).
- API surface: `/api/portal/kanban/boards/{,:id,:id/cards,:id/columns}` +
  reorder endpoints. ~10 routes total.

**Goal B — Templates**
- 4 board templates seeded as install-time options (operator picks one
  per board on creation):
  - **fulfillment-mirror** — Discovery / Development / Onboarding / Live
    (mirrors phase-board columns; metadata-empty cards).
  - **lead-pipeline** — New / Qualified / Proposal / Won / Lost.
  - **client-tasks** — Backlog / Doing / Review / Done.
  - **blank** — single "To do" column, fully editable.
- Each template defines columns + a couple sample cards. Operator can
  edit columns freely after creation.

**Goal C — Admin UI**
- BoardListPage — list of boards (filter by scope), "+ New board" CTA
  with template picker.
- BoardDetailPage — column-grid layout, drag-drop cards between columns,
  drag-drop columns to reorder, inline edit for column labels, "+ Add
  column" tail button. Card click → side drawer with full edit
  (description, assignee, due date, tags). Use HTML5 drag/drop
  (no new dep), with keyboard fallback (arrow + space-pick semantics).
- ArchivedCardsPage — restore individual cards.

**Goal D — Smoke + chapter**
- Standalone smoke (mirror your recent plugins): board CRUD + column
  reorder + card move + template seeding + scope isolation. ≥10 cases.
- Chapter `04-plugin-kanban.md`. MASTER row.

## NOT in scope

- Replacing fulfillment's phase-board (it stays — kanban is additive).
- Multi-user real-time cursors.
- Recurring cards / dependencies / Gantt.
- Cross-board card linking.

## Loop discipline

Standard.

## When done

DONE + COMMIT in outbox; chapter; MASTER row; tasks row.
