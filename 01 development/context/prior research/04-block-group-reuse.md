# 04 — Save block group as reusable component (T3 R028)

T3 Round 028. Operator selects N blocks → "Save as component" →
creates a reusable unit they can drop into any page. Updates to
the source propagate to all instances on next render.

## 1. Component domain

NEW `server/components.ts`:

```ts
type ComponentCategory = "header" | "footer" | "section" | "card" | "form" | "misc";

interface ComponentRecord {
  id; name; category; tree: Block[];
  createdAt; updatedAt; createdBy; description?;
}

createComponent / listComponents / getComponent / updateComponent / deleteComponent
expandComponentRefs(blocks, components, depth?) → Block[]
countComponentRefs(blocks) → Record<componentId, number>
COMPONENT_CATEGORIES: readonly tuple
```

Storage:

- `t/<a>/<c>/website-editor/components/index` — id list newest-first.
- `t/<a>/<c>/website-editor/components/by-id/<id>` — record.

Updates set `updatedAt`; empty-string description on update strips
the field (uses `delete` rather than spread-over so the persisted
record actually loses the key).

## 2. Reference + expansion

`componentRef` block points at a saved component by
`props.componentId`. The storefront renderer (and editor preview)
calls `expandComponentRefs(blocks, components)` before render to
substitute each ref with the latest source tree. Updates to the
source therefore propagate to every reference on next render —
no per-instance copy.

Expansion:

- Each ref's child block id is suffixed with `::<refId>` so two
  refs to the same component on the same page don't collide on
  ids.
- Recurses into ref'd trees (cycle guard caps depth at 5 — even
  pathological cycles return without throwing).
- Missing `componentId` or unknown id → emits a placeholder block
  with `_missing: true` (and `_missingId: <id>` when known) so
  the renderer can surface a visual "broken ref" indicator.
- `expandComponentRefs` is pure — original tree untouched.

`countComponentRefs(blocks)` walks the BlockTree (incl. children)
and returns `Record<componentId, count>` — used by the editor's
Components sidebar to surface usage counts ("Hero — 3 pages").

## 3. API endpoints

`api/handlers/components.ts` mounts 5 routes at
`/api/portal/website-editor/`:

- `GET /components` → `{ components, categories }` (categories =
  `COMPONENT_CATEGORIES` so the host doesn't hardcode).
- `GET /components/get?id=…` → 200 / 404.
- `POST /components` body `{ name, tree, category?, description? }`
  → 201. 400 missing name / non-array tree / invalid category.
- `PATCH /components?id=…` body `{ name?, tree?, category?,
  description? }` → 200 / 404 / 400 invalid category.
- `DELETE /components?id=…` → 200 / 404.

All `requireClientScope`-gated.

## 4. Editor wiring (host-side)

Pure server primitives — host page wires:

- **Save as component**: multi-select N blocks in the editor →
  "Save as component" context-menu item → name prompt → POST
  `/components` with `tree: <selected blocks>`.
- **Components sidebar tab**: GET `/components` populates a
  rail with usage counts via `countComponentRefs(currentTree)`
  inline. Click → host's existing `insertBlock` flow with a
  `componentRef` block payload (`{ type: "componentRef", props:
  { componentId } }`).
- **Edit source**: open the component for editing (clones tree
  into the editor canvas, on save PATCHes the component) — every
  reference picks up the new source on next render.

The renderer pipeline calls `expandComponentRefs(blocks,
componentsById)` before render. Foundation storefront middleware
fetches the components map for the current site once per render
pass, then expansion happens inline.

## 5. Smoke

NEW `__smoke__/r028-block-group-reuse.test.ts` 36/36 pass:

- `COMPONENT_CATEGORIES` has 6 entries including "section".
- create returns `cmp_…` id + default category misc + createdAt/
  updatedAt; list newest-first; getComponent round-trip.
- update name/category/description; updatedAt advances; empty-
  string description strips the field; update unknown → null.
- delete hit/miss + list reflects deletion.
- `expandComponentRefs` preserves non-ref blocks, replaces refs
  with source tree (id-suffixed for collision-free duplicates),
  flags missing componentId / unknown id with `_missing` +
  `_missingId`, two refs to same component get distinct ids,
  source edit propagates to ref expansion, cycle guard caps
  recursion at depth 5.
- `countComponentRefs` walks nested children.
- HTTP shape: POST 201/400 missing name / 400 invalid category;
  GET list 200 + categories[]; GET get 200/404; PATCH 200/400
  invalid category; DELETE 200/404.

`@aqua/plugin-website-editor` package.json test chain extended.
website-editor tsc-clean.

## 6. Files

- `plugins/website-editor/src/server/components.ts` (NEW —
  domain + CRUD + expandComponentRefs + countComponentRefs +
  COMPONENT_CATEGORIES).
- `plugins/website-editor/src/api/handlers/components.ts` (NEW —
  5 handlers).
- `plugins/website-editor/src/api/routes.ts` patch (5 new routes).
- `plugins/website-editor/src/__smoke__/r028-block-group-reuse.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- `componentRef` is a recognised block type but not registered
  in `blockRegistry` today. The renderer expands refs to source
  blocks before render so a registered Component is never
  needed; if the editor's selection-aware UI wants to highlight
  refs as a special block class, that's host-side rendering
  (R+1 — add `componentRef` to the registry with a special
  "Reference" category + render-as-source-tree behaviour).
- Cycle guard caps depth at 5. A self-referencing component
  (A → B → A) returns without infinite-looping but still emits
  whatever the depth-5 expansion produced — operator surface
  feedback for cycles is R+1 (warn on save when a component's
  tree refs another component that already refs it).
- Per-instance overrides explicitly out of scope per prompt
  (Figma-style component variants).
- Cross-tenant component library explicitly out of scope per
  prompt.
- Editing a component while it's in use refreshes every
  consumer on next render — there's no notification surface for
  "this component changed across N pages, reload to see". R+1
  candidate.

## 8. R+1 candidates

- Register `componentRef` in `blockRegistry` with a "Reference"
  category + a custom renderer that visualises the wrapped
  source tree (saves the host from special-casing).
- Cycle-detection at save-time: when operator saves a component
  whose tree refs back into itself, surface a warning and
  prevent the save (Q-ASSUMED today is "depth cap, no warning").
- Per-instance overrides — Figma-like variant props that the
  ref carries and the source applies to its own props on
  expansion.
- Cross-tenant component library (curated Aqua library that
  agencies can fork into their own registry).
- Notify-on-source-change toast surfaced in the editor when a
  page contains refs to a recently-edited component.
- "Detach" affordance — flatten a `componentRef` into its
  current source tree so future source edits don't propagate
  (operator-explicit fork).
- Components sidebar UI (host page composition, mirrors R027
  block catalog pattern).
