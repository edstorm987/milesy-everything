# `@aqua/plugin-aqua-resources` — per-phase resource shelf (T2 R013)

Round-013 of the queue-based T2 worker. Per-Aqua-phase resource shelf
that pulls SOPs by tag-family + Incubator modules + tutorials.
Surfaces in T4's Incubator "Aqua Resources Lite" sub-page (read
endpoint at `GET /resources?phase=<phase>`) and in the agency portal's
left nav.

## Shape

| Area | Decision |
| --- | --- |
| `id` | `aqua-resources` |
| `scopePolicy` | `agency` |
| `core` | false |
| `requires` | (soft only — pairs with `@aqua/plugin-sops` for live SOP refs; engine no-ops gracefully when absent) |
| Storage layout | `collections/index` · `collections/by-id/<id>` (items embedded — collection bounded enough to fit) |
| API routes | `resources` (read) · `collections/{create,update,delete,seed}` · `items/{add,update,remove,reorder}` — 9 total |
| Pages | ResourcesEditorPage — phase-chip filter + collection cards + add-item details + new-collection form |

## Domain

```
ResourceCollection { id, agencyId, name, description?, phaseScope: AquaPhase[],
                     items: ResourceItem[], builtIn, order, createdBy?,
                     createdAt, updatedAt }

ResourceItem      { id, kind: sop|module|tutorial|video|link, ref, title,
                    coverImg?, notes?, order }

AquaPhase         = epic-intro | blueprint-setup | diagnostics |
                    brand-builder | traffic | mastery
```

`phaseScope: []` means "**all phases**" — collections always visible
no matter what phase the consumer asks for. Non-empty arrays narrow
to those phases.

## Default seeded collections

Per chapter §15c, `seedDefaults(actor)` ships **5 starter
collections** as `builtIn: true`:

1. **Incubator Modules** — phaseScope: epic-intro/blueprint-setup/diagnostics
   (4 items: 2 modules + 2 SOPs).
2. **Personal AI Assistants** — all phases (3 items).
3. **AquaSuite GHL Tutorial** — phaseScope: brand-builder/traffic
   (3 items).
4. **My Business OS Tutorial** — all phases (3 items).
5. **Where Time Is No Longer Tied To Income** — phaseScope: mastery
   (3 items).

Idempotent — second call returns `seeded: 0, existed: <count>`. Match
is by `name` (the operator's identifier; renaming a built-in then
re-seeding will create a duplicate — flagged R+1 to use a stable id).

`onInstall` invokes the seeder when `seedDefaultsOnInstall` setup
answer is true (default).

## Built-in protection

Built-in collections (`builtIn: true`) cannot be deleted —
`delete()` throws `BuiltInDeleteError` (HTTP 409). Non-built-in
("operator-created") collections can be freely deleted.

The protection is intentional: built-ins are part of the operator
runbook + Incubator surface, so accidental deletion would tear
T4 cards out from under the user. Operators who don't want a built-in
can update its `phaseScope` to `[]` (all phases) and then add their
own filter on the consumer side, or delete its items individually.

## Item ordering & reorder

`addItem` appends with monotonic `order` (0, 1, 2, …). `removeItem`
**compacts** the remaining items so order stays contiguous (test 5).
`reorderItems(actor, collectionId, itemIds)` applies the caller's
id-list as the new sort; missing ids land at the end (sentinel
`Number.MAX_SAFE_INTEGER`).

`resourcesForPhase(phase)` returns collections matching the phase
**with items already sorted by order** so the consumer (T4 Incubator
Resources-Lite cards) can render straight without extra work.

## Smoke (12/12)

`tsx --test src/__smoke__/aqua-resources.test.ts`. Cases:

1. `seedDefaults` seeds 5 built-in collections; second call no-op
   (idempotent on `name`).
2. `create` stores non-built-in collection; emits
   `aqua-resources.collection.created`.
3. `create` rejects empty name.
4. `delete` on built-in throws `BuiltInDeleteError`; delete on
   user-created succeeds.
5. `addItem` appends with monotonic order; `removeItem` compacts
   `order` to remain contiguous (3 items → remove middle → orders
   `[0,1]`).
6. `addItem` rejects invalid kind + empty title.
7. `updateItem` patches fields; `removeItem` on missing item throws
   `ItemNotFoundError`.
8. `reorderItems` applies caller-supplied id order; missing ids land
   at the end.
9. `list({ phase })` filters by `phaseScope`; empty `phaseScope`
   means "all phases" (always visible).
10. `list({ query })` searches `name + description`
    case-insensitively.
11. `resourcesForPhase` returns collections sorted by order with
    items **pre-sorted** by item order.
12. Activity events — collection.created + item.added + item.removed
    all log under `category: "settings"` with `aqua-resources.*`
    action prefix.

## Files

```
04-the-final-portal/plugins/aqua-resources/
├── index.ts                            (manifest + onInstall seedDefaults)
├── package.json + tsconfig.json
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          (vendored)
    │   ├── tenancy.ts                  (vendored)
    │   ├── domain.ts                   (ResourceCollection, ResourceItem, AquaPhase, RESOURCE_KINDS, DEFAULT_COLLECTIONS, PHASE_LABELS)
    │   ├── ids.ts · time.ts
    ├── server/
    │   ├── ports.ts                    (StoragePort, ActivityLogPort, EventBusPort, AquaResourcesEventName)
    │   ├── service.ts                  (AquaResourcesService — list/get/create/update/delete + items add/update/remove/reorder + seedDefaults + resourcesForPhase)
    │   ├── foundationAdapter.ts
    │   └── index.ts                    (barrel + container)
    ├── api/
    │   ├── handlers.ts                 (9 handlers)
    │   └── routes.ts
    ├── pages/
    │   └── ResourcesEditorPage.tsx     (phase-chip filter + per-collection card + add-item details + new-collection form)
    └── __smoke__/aqua-resources.test.ts (12 cases)
```

## NOT in scope

- Hosting actual videos (links only — operator points the `ref` at
  whichever video host they use).
- Per-resource analytics.
- Touching milesymedia / business-os / compass-coaching.

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- Stable IDs for built-in collections so renames don't re-seed
  duplicates (today: matched by `name`).
- Per-resource analytics — view counts, time-on-page from T4
  Incubator hooks.
- Direct integration with `@aqua/plugin-sops` so `kind:"sop"` items
  pull live SOP titles + cover images instead of operator-pasted
  values.
- Cover-image upload via `@aqua/plugin-client-files` (R010) external
  refs.
- Drag-to-reorder UI on the editor page (today: API-driven only).
- Bulk import / export (JSON) for sharing collections across agencies.
- Foundation `ActivityCategory` extension to add `resources`
  (currently rides on `settings`); coordinated R+1 diff with T1 /
  R007 / R009 / R010 / R011 / R012.
- Per-collection role-gating beyond the manifest's `visibleToRoles`
  (e.g. "founder-only" collections separate from `agency-staff`).
