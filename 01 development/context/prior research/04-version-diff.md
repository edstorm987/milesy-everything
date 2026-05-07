# Version diff view (T3 R034)

## What

R022 saved snapshots of every page; R034 lets the operator compare
two of them. Pick a row in the Versions dropdown, click "Diff" — a
side-by-side panel opens with the chosen version on the left and
the current draft on the right. Top strip: summary chips
(`added` / `removed` / `modified`). Mode toggle: **Visual** (block
tree, recoloured per id-status) or **JSON** (line-by-line text diff
for power users).

## Files

- `src/lib/blockTreeDiff.ts` (NEW) — pure helpers:
  - `diffTrees(a, b)` → `{ added, removed, modified }` keyed by
    block id, recursive over `children`.
  - `summariseDiff(d)` → counts + `unchanged` flag.
  - `jsonLineDiff(a, b)` → LCS-based unified diff over two
    strings, returns `{ kind: "same"|"add"|"remove", text, lineA,
    lineB }` rows.
- `src/components/editor/VersionDiffPanel.tsx` (NEW) — 2-pane
  visual + JSON-mode toggle, summary chips, close button.
- `src/components/editor/VersionsDropdown.tsx` — adds optional
  `onDiff(versionId)` prop and a per-row "Diff" button. No
  behaviour change when host doesn't pass `onDiff`.
- `src/__smoke__/r034-version-diff.test.ts` (NEW) — 32 assertions
  spanning helper correctness + panel render.
- `package.json` test chain extended.

## Algorithm

`diffTrees` flattens both trees into id→Block maps via recursive
walk, then walks the union:

- in B, not in A → **added**.
- in A, not in B → **removed**.
- in both → compare `type`, `props`, `styles`, `a11y`, `seo`, and
  `children.length`; record fields that differ on the modified
  entry's `propChanges`.

Stable id-sort on every output list so the UI doesn't shuffle on
re-render.

`jsonLineDiff` is a textbook LCS: O(m·n) DP table over the line
arrays, then a single backwards walk emitting same/remove/add rows.
Quadratic but fine for two formatted JSON trees up to ~5k lines —
the editor never holds more than a handful of versions at a time.

## Q-ASSUMED

- Block-id is the diff key. Cloned/duplicated blocks (R028 group-
  reuse) keep their unique ids per the existing block-tree
  contract — same id across versions = same block, period.
- Recursive flatten over id-map (positional walk would falsely
  flag a moved block as removed+added; id-keyed catches the move
  as an unchanged entry under whichever parent sits in the new
  tree).
- "Diff vs..." in the prompt = "diff against current draft tree"
  v1. The host wires both trees in; a future round can let the
  operator pick a second version from the same dropdown.
- JSON-mode line diff over `JSON.stringify(blocks, null, 2)` is
  good enough for power users — adopting a fancy JSON-aware diff
  would force a parser dep we don't need yet.
- `propChanges` lists field names, not the deep delta. The
  operator wanting the full delta opens JSON mode.
- "children" entry on `propChanges` only flags **count** mismatch.
  The deeper id-aware flatten catches the actual structural move
  on the children themselves, so this is just a UX hint — "the
  shape under this block changed."

## NOT in scope

- Cross-page diffs (per prompt).
- 3-way merge (per prompt).
- Inline conflict resolution / cherry-pick UI.
- Per-prop deep-delta visualiser (R+1 opens a 3rd pane on
  modified-row click).

## R+1 candidates

- "Diff vs another version" — second selector in the dropdown so
  operators can compare any two snapshots, not just one-vs-current.
- Inline per-prop delta panel on modified-row click (`diff` prop:
  `{ before: 'Hi', after: 'Hello' }` rendered as a tiny string
  diff).
- Wire VersionDiffPanel into the host EditorPage via a sliding
  drawer (today: pure component, host composes the modal/drawer).
- Keyboard navigation: `j` / `k` to step through changed blocks,
  `Enter` to scroll the canvas to the highlighted block.
- Export-as-patch: emit a JSON Patch (RFC 6902) document from a
  diff so external tools can apply it elsewhere.
