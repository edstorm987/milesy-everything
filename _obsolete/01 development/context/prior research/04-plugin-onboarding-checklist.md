# `@aqua/plugin-onboarding-checklist` — T2 R018

Per-client agency-customisable onboarding checklist for the first two
phases (Epic Intro + Blueprint). Distinct from the foundation
onboarding dashboard (which surfaces phase-canonical milestones); this
plugin captures bespoke "do X for THIS client" items split by who owns
them — agency-side (welcome calls, gifts, contracts) vs customer-side
(brand questionnaire, asset upload, ad-account access).

## Manifest

- `id: "onboarding-checklist"`, `version: "0.1.0"`, `status: "alpha"`,
  `category: "ops"`.
- `scopePolicy: "client"`, `core: false`, no required deps.
- Soft-pairs with `@aqua/plugin-kanban` via OPTIONAL `KanbanPort`
  (foundation injects when both installed at client scope; absent →
  no-op gracefully).
- Activity category `"onboarding"` (vendored ActivityCategory union
  appends it; foundation `_registry.ts` will need the same append at
  wire-up time — flagged in foundation-pending).
- Two pages: admin (`""`) + customer (`"customer"`).
- Two nav items: agency tools panel for staff, customer panel for
  end-customer/client roles.
- Two settings toggles: `seedDefaultsOnInstall` + `emitMoveToDiagnosticsOnComplete`.
- Three feature flags: `default-seed`, `customer-block`, `kanban-handoff`.

## Domain

```ts
ChecklistItem {
  id, agencyId, clientId, title, description?,
  ownerKind: "agency" | "customer",
  status: "todo" | "done" | "skipped",
  dueAt?, completedAt?, completedBy?,
  ordering, createdAt, updatedAt
}
```

`completionPct` returns `{ total, done, skipped, todo, pct }` where
`pct = round((done + skipped) / total * 100)` — skipped counts as
"handled" so checklists with N/A items can still hit 100%.

## Default seed (8 items, idempotent)

Seeded on `onInstall` when `default-seed` feature is on. A
`seed/done` flag prevents re-seeding even after operator deletes:

| # | Title | Owner |
|---|---|---|
| 1 | Welcome call booked | agency |
| 2 | Welcome gift sent | agency |
| 3 | Brand questionnaire | customer |
| 4 | Asset upload | customer |
| 5 | Ad-account access granted | customer |
| 6 | Comms-channel confirmed | agency |
| 7 | Scope agreement signed | agency |
| 8 | Kickoff scheduled | agency |

5 agency-owned · 3 customer-owned.

## Service surface

`ChecklistService`:

- `list({ ownerKind?, status? })` — sorted by ordering ascending.
- `get(id)` / `completionPct()`.
- `create(actor, { title, description?, ownerKind, dueAt? })` — appends
  with `ordering = max+1`. Emits `onboarding.item.created`.
- `update(actor, id, patch)` — flipping `todo → done` stamps
  `completedAt/By` + emits `onboarding.item.completed`. Flipping
  `done → todo` clears stamps. `dueAt: null` clears.
- `tick(actor, id, status)` — convenience over update.
- `bulkTick(actor, entries[])` — missing ids skipped silently (caller
  diffs).
- `reorder(idsInOrder)` — renormalises to `[0, 1, 2, …]`. Missing ids
  appended at tail in their existing order; unknown ids dropped.
- `delete(actor, id)` — emits `onboarding.item.deleted`.
- `seedDefaults(actor)` — idempotent install hook. Returns
  `{ seeded: bool, itemCount }`. Refuses if any items exist OR if
  `seed/done` flag set.

## 100% completion side-effect

When `completionPct.pct === 100` AND `completion/done` flag unset:

1. Set `completion/done = 1` (one-shot guard).
2. Log `onboarding.completed` activity.
3. Emit `onboarding.completed` event with the full pct payload.
4. If `KanbanPort.postCardToClientTasksBoard` is wired, post a card
   titled `"Move to Diagnostics phase"` with description prompting
   the operator to advance the client. Soft-fail wrapped in try/catch.

Re-ticking after 100% does NOT re-emit. Untick + re-tick does not
reset the guard either — the round explicitly states the event fires
"on 100%" once.

## API surface

7 routes mounted at `/api/portal/onboarding-checklist/`:

| Path | Method | Roles |
|---|---|---|
| `items` | GET | viewers (agency staff + client staff + end-customer) |
| `items/create` | POST | agency staff+ |
| `items/update` | PATCH | agency staff+ |
| `items/tick` | POST | viewers |
| `items/bulk` | POST | agency staff+ |
| `items/reorder` | POST | agency staff+ |
| `items/delete` | DELETE | agency staff+ |

`items` GET returns `{ ok, items, completion }` so the UI gets the
progress bar inline without a second roundtrip.

## Pages

- `ChecklistAdminPage` (path `""`) — server-rendered. Header shows
  `ProgressBar` (% done · skipped · total). Two grouped lists ("Agency
  owns" / "Customer owns") + an inline `AddItemForm`. Items carry
  `data-item-id` + `data-status` hooks for foundation enhancers.
- `ChecklistCustomerPage` (path `"customer"`) — read-only over agency
  items + tickable customer items. Renders inside
  `/embed/[client]/customer/onboarding-checklist`. Carries
  `data-tickable="true"` on customer rows.

## Soft-pair contract — KanbanPort

```ts
KanbanPort.postCardToClientTasksBoard?({
  agencyId, clientId, title, description?
}): { posted: boolean; cardId? }
```

Foundation will route to `@aqua/plugin-kanban`'s `client-tasks` board
(template id from kanban R2). Absent port → no-op. Errors swallowed
inside the service; the activity + event still fire.

## Smoke

`src/__smoke__/checklist.test.ts` — 13/13 pass via
`npx tsx --test`. 7-second wall clock (one test exercises a 280ms
storage-list code path).

1. seedDefaults installs 8 items idempotently.
2. seed split by ownerKind both > 0 + sum = 8.
3. create appends with monotonic ordering.
4. tick → done emits `onboarding.item.completed` once + sets
   completedAt/By; re-tick same status no re-emit.
5. tick → todo from done clears completedAt/By.
6. completionPct counts done + skipped as handled (pct = 67 then 100
   on a 3-item list).
7. 100% completion emits `onboarding.completed` once + posts kanban
   hand-off card; untick + re-tick does NOT re-emit.
8. Without `kanban` port: 100% still emits event, no card posted.
9. Reorder applies new sequence; missing ids appended in original
   order; ordering renormalised to `[0, 1, 2]`.
10. Delete removes item + de-indexes.
11. bulkTick processes multiple ids; missing ids silently skipped.
12. Activity entries use category `"onboarding"` with `onboarding.*`
    action prefix; create + complete + completed all logged.
13. Tenant isolation — items from `client_other` invisible to
    `client_felicia` container even on the same in-memory storage.

`tsc --noEmit` clean.

## Foundation pending (standard 5-step + extras)

When this plugin is wired:

1. Workspace dep `@aqua/plugin-onboarding-checklist` in
   `milesymedia-website/package.json`.
2. `transpilePackages` += `@aqua/plugin-onboarding-checklist`.
3. Side-effect import calling `registerOnboardingFoundation` at boot
   (with at minimum `activity` + `events`; `kanban` injected only
   when kanban runtime is also registered at client scope).
4. `_registry.ts` append.
5. `ActivityCategory` += `"onboarding"` in foundation.
6. Cross-plugin event router: `onboarding.completed` may fan out to
   the foundation phase advancer in a later round (out of scope here
   — for v1 the kanban card is the operator nudge).
7. KanbanPort projection from `@aqua/plugin-kanban`'s client-tasks
   board (template id `client-tasks`).

## NOT in scope (R+1)

- AI-suggested items (LLM looks at the client's brief and proposes
  per-client extras).
- Templates marketplace — operator-defined seed bundles distinct from
  the 8-item default.
- Phase-aware auto-advance — emitting `onboarding.completed` does NOT
  call the foundation phase advancer in v1.

## R1 commit

T2 R018 single commit. After R018 T2 has shipped 12 plugins
(fulfillment + ecommerce + agency-HR + memberships + affiliates +
agency-finance + agency-marketing + client-crm + forms + portal-export
+ kanban + sops + pre-sales-hq + onboarding-checklist).
