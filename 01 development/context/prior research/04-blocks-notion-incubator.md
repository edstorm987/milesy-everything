# 04 — Notion-Incubator blocks (T3 R009)

T3 Round 009. Per chapter §15g, the four blocks T4 prototyped in
the static Incubator app (`incubator app/incubator.css`) get their
canonical home inside `@aqua/plugin-website-editor`:

- `icon` — small chip (max 96px) with image-mode `offsetY` overlap.
- `property-strip` — Notion-style key/value disclosure
  (`▾ N more properties`).
- `toggle` — `▸ Header` collapsible with nested BlockTree children.
- `cardGrid` (registered as `card-grid`) — 2-col responsive grid of
  cover/icon/label/href cards (Notion mode) alongside the existing
  marketing-card mode.

## 1. State on entry

All four block ids were already present in `blockRegistry.ts` from
T3 R002 (Aqua Incubator template) — see `IconBlock` (image-mode +
offsetY), `PropertyStripBlock` (`<details>` disclosure with
`{key, value, type}` rows), `ToggleBlock` (`<details>` with
`renderChildren`), `CardGridBlock` (Notion-mode `items` array
alongside the legacy `cards` array). R009 closes three remaining
gaps from chapter §15g + the prompt's Goal F.

## 2. Changes

**Goal C — `propertyStrip` `url` type**: extended row type union
from `phase | select | date | text` to add `url`. URL rows render
as `<a target="_blank" rel="noreferrer">` so operators can link
booking pages, calendars, etc., directly from a property row
without dropping into a separate block.

**Goal F — Theme overlay (CSS-var driven)**: every hardcoded
chrome colour in the four blocks now flows through a CSS variable
with the existing dark-theme rgba as fallback. New variables (no
breakage — all carry sensible defaults):

- `--inc-text` — body text (defaults `currentColor`).
- `--inc-heading` — heading + label tone.
- `--inc-muted` — secondary copy + chevrons.
- `--inc-divider` — `<details>` summary border.
- `--inc-card-bg` / `--inc-card-border` — card-grid Notion-mode
  card chrome.
- `--inc-chip-bg` / `--inc-chip-text` — propertyStrip chip pills
  (phase / select rows).
- `--inc-link` — propertyStrip url row colour (falls through to
  `--brand-accent` then `#ff6b35`).
- `--inc-icon-ring` / `--inc-icon-shadow` — IconBlock image-mode
  border + shadow.

A theme overlay (e.g. an Incubator dark stylesheet, R+1) only
needs to set these variables on its parent scope to recolor all
four blocks consistently.

## 3. Smoke

NEW `src/__smoke__/r009-notion-incubator-blocks.test.ts` 30/30
pass. Renders each block via `react-dom/server`'s
`renderToStaticMarkup` and asserts the contract surface:

- registry contract (all 4 ids present).
- IconBlock — image-mode `data-mode="image"` + 64×64 img +
  `margin-top:-32px` (cover overlap) + caption surfaces; glyph-
  mode honours custom colour.
- PropertyStripBlock — native `<details>` disclosure surfaces all
  keys, phase/select rows render as chips with `--inc-chip-bg`
  CSS-var, `url` type emits `target="_blank"` external link, and
  the auto-generated collapsed label ("5 more properties") fires.
- ToggleBlock — `<details open>` when `defaultOpen=true`, label
  surfaces, nested children render via `renderChildren`,
  `defaultOpen=false` defaults closed.
- CardGridBlock — Notion mode emits `data-mode="notion"`, anchors
  carry the right href, icons + labels + cover images surface,
  heading uses Playfair var; legacy generic mode still renders
  `<article>` cards with arrow CTAs.
- Theme overlay — every render emits at least one
  `var(--…)` token so an overlay stylesheet has something to
  bind to.

`react-dom/server` types aren't shipped in plugin-scope devDeps —
smoke uses a typed wildcard import with a `@ts-expect-error`
directive so tsc stays clean and the test stays decoupled from
deps updates.

## 4. Files

- `plugins/website-editor/src/components/blocks/PropertyStripBlock.tsx`
  — `url` row type + CSS-var theme overlay.
- `plugins/website-editor/src/components/blocks/ToggleBlock.tsx` —
  CSS-var theme overlay.
- `plugins/website-editor/src/components/blocks/CardGridBlock.tsx`
  — CSS-var theme overlay (Notion mode).
- `plugins/website-editor/src/components/blocks/IconBlock.tsx` —
  CSS-var theme overlay (image-mode ring + shadow + caption).
- `plugins/website-editor/src/__smoke__/r009-notion-incubator-blocks.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 5. Q-ASSUMED / deviations

- The 4 block ids were already registered (R002). This round
  *evolves* them rather than re-creating; that mirrors the cheap-
  iteration pattern in earlier rounds.
- propertyStrip's `rows` field is still hand-edited as JSON in
  the editor — a richer array editor (add row / pick type / drag-
  reorder) is R+1 and lives in the editor admin shell, not in the
  block contribution itself.
- Cover-overlap offsetY remains a free-form `number` — Incubator
  spec uses −32 by default; deeper covers will need different
  values, kept editable.
- Theme overlay variables ship with rgba-white fallbacks so
  existing dark-mode hosts render unchanged. Light-mode hosts
  override the vars in their stylesheet.

## 6. R+1 candidates

- Block-mode editor "add property row" / "edit cards" affordances
  inside the properties sidebar (today operators hand-edit JSON
  for the row + card arrays).
- Auto-detect Incubator scope from `data-block-tree-scope` and
  load an Incubator preset stylesheet that sets the eight CSS
  vars on that scope.
- Cover-block + spacer-overlap helper that auto-positions the
  IconBlock's offsetY so operators don't have to think about it.
- propertyStrip aggregating multiple `url` types into a "Resources"
  cluster with iconography per kind (calendar / form / video).
