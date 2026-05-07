# 04 — In-editor block catalog (T3 R027)

T3 Round 027. Editor sidebar gets a "Block catalog" tab with every
registered block grouped by category, search filter, JSON-source
expander for Code-mode users (R020), and an Insert callback the
host wires into its block-tree mutation flow.

## 1. Component

NEW `components/editor/BlockCatalog.tsx`:

- Reads `listBlockDefinitions()` from `blockRegistry` (already
  exported, no registry change needed).
- Header: "Block catalog" + Search input + caption
  `N blocks registered` (live count from registry).
- Body: `<details>`-wrapped category sections in canonical order
  (layout / content / media / commerce / auth / advanced).
  Auto-expand when search active.
- Each block card:
  - Icon glyph (registry's icon string).
  - Bold label + monospace `type` id.
  - Heuristic description from def shape (container hint +
    props count + editable fields count) — the registry doesn't
    carry a `description` field today (R+1 to add it).
  - Insert button (primary-tinted) → fires `onInsert(type)`.
  - "▸ View source" expander toggling a `<pre>` JSON snippet of
    the default shape (`{ id, type, props, children? }`)
    formatted at 2-space indent.
- Search filters by `label + type` substring (case-insensitive).
  Empty-state copy "No blocks match." when filter excludes every
  block.

CSS-var driven (R011 surface). Accepts optional `defaultExpanded`
prop to bias which category section opens first.

## 2. Host wiring

Pure component. Host editor mounts in the right or left sidebar
behind a "Catalog" tab; `onInsert(type)` calls the existing
`insertBlock(type)` flow that the toolbar's "+" button uses.
Host then routes the new block into the BlockTree at the current
selection or canvas root.

## 3. JSON snippet

`blockJsonSnippet(def)` emits the canonical default shape:

```json
{
  "id": "<type>_<id>",
  "type": "<type>",
  "props": { …defaultProps },
  "children": [ …defaultChildren ]   // only when isContainer + defaultChildren set
}
```

The `<id>` placeholder in the id field is intentional — operators
copy the snippet, paste into Code-mode (R020), then either fix
the id or rely on the existing block-tree-load id-fix-up. Code-
mode's existing schema validation (R020) will fail on raw
`<id>` placeholders so operators must edit before save —
intentional friction so a copy-paste round-trip prompts an id
swap.

## 4. Smoke

NEW `__smoke__/r027-block-catalog.test.ts` 23/23 pass:

- Emits `data-component="block-catalog"` + header + Search
  input + `N blocks registered` caption.
- Every category in the registry surfaces as a `<details>`
  with `data-category` attribute (layout / content / media /
  commerce / auth / advanced).
- Every block surfaces with `data-block-type` attribute (smoke
  spot-checks first 8).
- Insert button count exactly matches block count
  (`aria-label="Insert <Label>"`).
- Brand-kit `--brand-bg / --brand-text` CSS-var tokens present.
- Container block description includes the
  "Container — accepts nested blocks." sentence.
- "▸ View source" buttons render for every block.

`react-dom/server` import via @ts-expect-error + typed wildcard
(R009 pattern). package.json test chain extended.
website-editor tsc-clean.

## 5. Files

- `plugins/website-editor/src/components/editor/BlockCatalog.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/r027-block-catalog.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 6. Q-ASSUMED / deviations

- `BlockDefinition` doesn't carry a `description` field — heuristic
  description from def shape (container hint + props/fields
  counts) is the v1 surface. R+1 candidate: extend the registry
  with a `description?: string` field and surface it directly.
- Live previews explicitly out of scope per prompt — preview tile
  is the icon glyph; real thumbnail render needs the host's
  BlockRenderer (R+1 same pattern as R008 BlogPostBlock with
  `window.__aquaRenderBlocks`).
- Per-block changelog out of scope per prompt.
- Search is substring on `label + type` only (not description) —
  description is itself derived, so searching it would create
  noisy matches. R+1 candidate: when registry adds `description`,
  include in search.

## 7. R+1 candidates

- Extend `BlockDefinition` with `description?: string`. R027
  consumers fall back to derived description when missing.
- Live preview thumbnails per block — host page injects
  `window.__aquaRenderBlocks` (R008 pattern) and BlockCatalog
  renders a 240×135 sandboxed preview iframe per row.
- Per-block changelog (versions, deprecations) — pairs with the
  block-version registry once that lands.
- Drag-to-insert from catalog row → canvas position (today only
  click-to-insert at default position).
- "Open Code mode with this snippet" CTA on the JSON expander
  routes to R020 with the snippet pre-loaded.
- Host-page wire-up: editor topbar "Catalog" tab + sidebar mount
  + tie Insert-callback to existing `insertBlock(type)` flow.
