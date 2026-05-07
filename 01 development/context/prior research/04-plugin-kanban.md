# `@aqua/plugin-kanban` — flexible kanban with templates

T2 deliverable. Generic kanban engine with 4 install-time templates.
Coexists with fulfillment's rigid phase-board; kanban is the editable
scratchpad operators can shape per board (add columns, rename, reorder,
drag-drop cards, archive/restore).

## 1. Package shape

- `@aqua/plugin-kanban` at `04-the-final-portal/plugins/kanban/`.
- `core: false`, `scopePolicy: "either"` — installs at agency level
  (e.g. Milesy's internal sales pipeline) or per-client (Felicia's
  customer-tasks board). Decided by where the operator clicks "Install"
  in the registry; foundation passes the matching scope into every
  request via `clientId` (set or undefined).
- No required deps. Vendored `aquaPluginTypes` + `tenancy` + `ids` +
  `time` keep the package tsc-clean standalone (same vendor pattern as
  every prior T2 plugin).
- `package.json` exports map: `.` / `./manifest` / `./server` / `./types`.

## 2. Manifest

- 4 nav items: agency-scope `/portal/agency/kanban`, client-scope
  `/portal/clients/:clientId/kanban`, plus matching `archived` entries
  for each scope. Both scopes get the same 3-page surface (boards list,
  board detail, archived cards).
- 4 features: boards / cards / templates / archived-restore — all
  default-on.
- Settings: `defaultTemplateId` (select, default `client-tasks`) +
  `showArchivedInBoardView` (boolean, default off). Kept minimal —
  config stays in the boards themselves.
- Healthcheck reports `<active>/<total> active boards` plus per-component
  status; reads via `_containerFromCtx` so it returns
  `foundation not registered` cleanly when boot ordering is wrong.

## 3. Domain

- `Board { id, agencyId, clientId?, scope, name, description?, templateId?, columns[], status, createdAt, updatedAt }`
- `Column { id, label, order, color? }` — embedded on the board (no
  separate index — column count is small, board write is one row).
- `Card { id, agencyId, clientId?, boardId, columnId, order, title,
  description?, assigneeUserId?, dueAt?, tags[], metadata, status,
  createdAt, updatedAt }` — `metadata` is open-ended for cross-plugin
  payloads (e.g. lead-pipeline cards may carry `{ leadId }`).
- Order is a renormalized integer (0,1,2…); every move rewrites the
  destination column's full order set. Acceptable for v1 board sizes
  (< ~200 cards/column); fractional ranking is a future optimization.
- Scope contract: agency boards have `clientId === undefined`; client
  boards require `clientId`. `BoardService` rejects creation when
  scope and ctx.clientId disagree. Tenant isolation enforced by
  `inScope()` on every read.

## 4. Templates

Read-only registry in `src/server/templates.ts`. 4 bundled templates:

| id | columns | sample cards |
|----|---------|--------------|
| `fulfillment-mirror` | Discovery / Development / Onboarding / Live | 2 |
| `lead-pipeline` | New / Qualified / Proposal / Won (green) / Lost (red) | 2 |
| `client-tasks` | Backlog / Doing / Review / Done (green) | 2 |
| `blank` | "To do" | 0 |

The operator picks a template per board on creation
(POST `/api/portal/kanban/boards` with `{ name, scope, templateId }`).
The chosen template seeds `columns[]` and (via `CardService._seedCards`)
2 sample cards tagged `["sample"]`. After creation the board's columns
+ cards are fully editable; `templateId` is preserved on the board for
metadata only and never re-applied.

`fulfillment-mirror` deliberately mirrors the fulfillment phase-board's
Discovery/Development/Onboarding/Live progression so a team can keep a
flexible scratchpad alongside the rigid phase lifecycle without re-typing
the column set. It does NOT subscribe to phase events — phase advances
do not move kanban cards; the columns are just visually parallel.

**Real-world template gap (foundation-pending):** chapter #59 (Aqua
internals reference) documents the actual lead-pipeline + client-tasks
column sets Ed uses (`Pre-Sales / Discovery Call Booked / Discovery
Call Done / Invoice Sent / Aqua Incubator Active / Shock & Awe Sent /
System Build / Onboarded` for leads; `Backlog / This Week / Doing /
Waiting On Client / Review / Done` for client tasks). R2 should swap
the v1 generic columns for these Aqua-HQ-aware ones — out of scope for
the current prompt's "fulfillment / lead pipeline / client tasks /
blank" wording.

## 5. Storage layout

```
boards/index                → string[] of board ids (across both scopes)
boards/by-id/<id>           → Board
cards/by-board/<boardId>    → string[] of card ids in this board
cards/by-id/<id>            → Card
```

Per-install plugin storage; foundation routes the right namespace based
on `(agencyId, clientId?)`. No cross-plugin event subscriptions, no
external integrations — kanban is a self-contained tool.

## 6. API surface (16 routes)

Mounted at `/api/portal/kanban/`:

| Path | Methods | Purpose |
|------|---------|---------|
| `templates` | GET | List bundled templates (preview at create time). |
| `boards` | GET / POST / PATCH / DELETE | List active+archived / create with template / patch / archive. |
| `boards/get` | GET | Read one board by id. |
| `boards/columns` | POST / PATCH / DELETE | Add / rename or recolor / remove column. |
| `boards/columns/move` | POST | Reorder column to `toIndex`. |
| `boards/cards` | GET / POST / PATCH / DELETE | List+filter / create / patch / archive. |
| `boards/cards/move` | POST | Move card to `toColumnId` at `toIndex`. |
| `boards/cards/restore` | POST | Restore archived card. |

Visibility: viewers (agency + client staff) GET; admins (agency-owner /
manager / client-owner / staff) POST/PATCH/DELETE. No public routes.

## 7. Services

- `BoardService` — list / get / create (template-aware) / update /
  archive / addColumn / renameColumn / recolorColumn / moveColumn
  (renormalizes order) / removeColumn (refuses if cards present or last
  column).
- `CardService` — list (filter by board / column / status / tag /
  assignee / query) / get / create (appends to column) / update / move
  (renormalizes both src + dst columns) / archive (closes gap in src
  column) / restore (appends to current column) / delete (hard, used
  rarely) / `_seedCards` (used by `BoardService.create` template flow).

Every mutating call writes a `kanban`-categorized `ActivityLogPort`
entry and emits a `KanbanEventName` event.

## 8. Admin UI

- **BoardListPage** — separates active / archived boards, renders the
  4 templates inline with column counts as the "+ New board" CTA. POST
  to `/api/portal/kanban/boards` with template id picks the seed.
- **BoardDetailPage** — column-grid layout. Each `<div role="listitem"
  draggable>` is a column with editable header (`contentEditable`),
  inline card list, "+ Add card" tail, and a final "+ Add column"
  tail button on the row. Cards are `<li draggable tabIndex={0}>` with
  `data-card-id` for the client-side enhancer to bind drag/drop +
  keyboard handlers (arrow + space-to-pick / enter-to-drop). HTML5
  drag/drop only — no new dep. Server-rendered first so the page reads
  cleanly with JS off; the enhancer is purely additive.
- **ArchivedCardsPage** — cross-board archived listing with per-card
  Restore button POSTing `/api/portal/kanban/boards/cards/restore`.

The drag/drop client enhancer is wired by foundation when these pages
render in the portal shell; the plugin ships the markup + data-attrs,
not the JS (foundation already owns the client runtime).

## 9. Smoke

`src/__smoke__/kanban.test.ts` — 12 node:test cases via `tsx --test`:

1. Templates registry — 4 templates, column counts non-zero, sample
   card `columnIndex` in range for every template.
2. `fulfillment-mirror` create → 4 columns + 2 sample cards seeded;
   `kanban.board.created` event emitted.
3. `blank` template → 1 column "To do", 0 sample cards.
4. Add → rename → move (index 2 → 0) → remove flow with order
   renormalized after each step; events asserted.
5. Cannot remove a column with cards (`/Column still has cards/`);
   cannot remove the last column (`/last column/`).
6. Card create + intra-column move + cross-column move; both source
   and destination columns renormalize order to [0,1,2…].
7. Card update — patch title, tags, dueAt, description; clear assignee
   + dueAt via `null` patch values.
8. Archive a card → src column closes the gap → archived listing
   surfaces it across all boards → restore appends back to its column.
9. Agency-scoped board isolated from client-scoped board; mismatched
   scope on creation rejected; `get()` cross-scope returns null.
10. Tenant isolation — other agency cannot see boards or cards.
11. All 4 templates creatable end-to-end; ids prefixed `brd_` /
    `col_`.
12. Activity log verbs (`kanban.board.created` / `column.added` /
    `card.{created,updated,archived}`) + matching event names emitted;
    every activity row carries `category: "kanban"`.

`npx tsc --noEmit` clean inside `plugins/kanban`. `npx tsx --test
src/__smoke__/kanban.test.ts` → 12/12 pass.

## 10. Foundation pending (T1 wire-up)

Standard 5-step pattern when foundation absorbs this plugin:

1. Workspace dep `"@aqua/plugin-kanban": "*"` in `portal/package.json`.
2. `transpilePackages` += `@aqua/plugin-kanban` in `portal/next.config.ts`.
3. Side-effect-import `import "@aqua/plugin-kanban/server"` in
   `portal/src/plugins/_registerAll.ts` (or whichever file calls
   `registerKanbanFoundation` at boot).
4. Append manifest entry to `portal/src/plugins/_registry.ts`.
5. Extend `ActivityCategory` union with `"kanban"` in
   `portal/src/server/types.ts`.

No cross-plugin event router subscriptions — kanban does not consume
events from other plugins.

## 11. Cross-team handoffs

- T3 — drag/drop client enhancer + side-drawer card editor live in
  foundation's portal shell (T3 already owns the client runtime). The
  plugin ships `data-board-id` / `data-column-id` / `data-card-id` /
  `data-add-card-for` / `data-add-column` / `data-restore-card` hooks
  for the enhancer to bind without coupling.
- T1 R2-or-later — R2 should swap the placeholder
  `fulfillment-mirror` / `lead-pipeline` / `client-tasks` columns for
  the Aqua-HQ-aware sets in chapter #59 §5. Storage is already
  template-id-tagged, so a column-set swap won't mutate existing
  boards.

## 12. NOT in scope

- Replacing fulfillment's phase-board (it stays — kanban is additive).
- Multi-user real-time cursors / presence.
- Recurring cards / dependencies / Gantt views.
- Cross-board card linking.
- Webhook integrations / cross-plugin event ingest.

## 13. Verification

```
cd 04-the-final-portal/plugins/kanban
npx tsc --noEmit                            # clean
npx tsx --test src/__smoke__/kanban.test.ts # 12/12 pass
```

---

## R2 — Aqua-real templates + founder-todos (2026-05-07)

Light follow-up. Sourced template column lists from chapter
`04-aqua-internals-reference.md` (MASTER #59) §6 + §11 — replacing the
v1 placeholder column sets with Ed's actual Aqua operating columns and
adding a fifth Founder-only template.

### Changed

| Template | v1 columns | R2 columns |
|----------|-----------|-----------|
| `fulfillment-mirror` | Discovery / Development / Onboarding / Live (4) | Epic Intro / Blueprint Setup / Diagnostics / Brand Builder / Traffic / Mastery (6) |
| `lead-pipeline` | New / Qualified / Proposal / Won / Lost (5) | Pre-Sales / Discovery Call Booked / Discovery Call Done / Invoice Sent / Aqua Incubator Active / Shock & Awe Sent / System Build / Onboarded (8) |
| `client-tasks` | Backlog / Doing / Review / Done (4) | Backlog / This Week / Doing / Waiting On Client / Review / Done (6) |
| `blank` | unchanged | unchanged |
| **`founder-todos` (new)** | — | Today / This Week / Backlog / Done (4) |

### Domain extensions

- `TemplateId` += `"founder-todos"`.
- `TemplateDefinition` gains two optional fields:
  - `requiresRole?: string` — when set, the template is hidden from
    operators whose role doesn't match (case-insensitive). Used for
    `founder-todos` (role = `"founder"`).
  - `requiresScope?: BoardScope` — when set, `BoardService.create`
    refuses to apply the template to a mismatched-scope board. Used
    for `founder-todos` (scope = `"agency"`).

### Service + API

- `BoardService.create` enforces `requiresScope` — throws
  `Template <id> requires scope <required>, got <input>` when the
  caller passes a mismatched scope. Existing scope-mismatch errors
  (agency-vs-client) still fire first.
- New `listTemplatesForRoles(roles?: string[])` helper filters the
  registry by `requiresRole` (case-insensitive). Templates without
  `requiresRole` are always visible.
- `GET /api/portal/kanban/templates` accepts an optional `?role=foo[,bar]`
  query param — when present it routes through `listTemplatesForRoles`,
  otherwise it returns the full registry. Foundation passes the
  operator's role string(s) when rendering the picker so non-founder
  operators never see `founder-todos`.

### Existing-board isolation

Boards store the resolved `Column[]` inline at creation time, so
swapping the registry's column lists does NOT mutate any existing
board state. Smoke case 18 pins this — operator-renamed columns
survive a registry change in either direction.

### Smoke (18 cases total — 12 R1 + 6 R2)

13. `lead-pipeline` seeds Pre-Sales → Onboarded (8 columns).
14. `client-tasks` seeds Backlog / This Week / Doing / Waiting On
    Client / Review / Done (6 columns).
15. `founder-todos` agency-scope creation seeds 4 columns + 2 sample
    cards ("Review week's pipeline" + "Plan next round of social
    posts").
16. `founder-todos` rejected at client scope with explicit
    `/requires scope agency/` error.
17. `listTemplatesForRoles` filters: non-founder roles get 4
    templates, founder gets 5, case-insensitive match works,
    `undefined` roles → 4 ungated templates.
18. Existing boards untouched when registry column lists swap —
    operator-edited columns survive registry changes (template-id-
    tag isolation).

`npx tsc --noEmit` clean. `npx tsx --test src/__smoke__/kanban.test.ts`
→ 18/18 pass.

### Foundation pending — R2 additions

- Foundation's `templates` route call should pass the operator's role
  string(s) via `?role=...` so the picker honours `requiresRole`. v1
  fall-back: omit the param and the picker shows all 5 (founder-todos
  is still scope-guarded at create-time).
- BoardListPage server-renders the unfiltered registry today (no role
  context in `PluginPageProps`); foundation should inject role-aware
  filtering when rendering the picker. Logged as cross-team handoff.

### Cross-team handoffs (additions)

- Foundation — surface `actorRoles: string[]` on `PluginPageProps`
  (or via `services.user.getRoles(actor)`) so the picker can filter
  templates without an extra API roundtrip.
- Foundation — projecting a `"founder"` role for the Founder user
  (Ed) is a foundation concern; the kanban plugin only matches
  whatever role string foundation supplies.
