# 04 — Undo/redo history (T3 R021)

T3 Round 021. Snapshot-based undo/redo per page-edit session,
capped at 50 snapshots. Pure state machine + React hook + topbar
toolbar with History dropdown.

## 1. Pure state machine

NEW `lib/editorHistory.ts`. Pure module — no React imports at
module scope so the smoke can exercise the state machine without
rendering.

```ts
interface Snapshot { ts, tree: Block[], action: string }
interface HistoryState { pageId, entries: Snapshot[], cursor, capacity }

createHistory(pageId, initial, action="open page", capacity=50, ts?) → HistoryState
pushSnapshot(state, tree, action, ts?) → HistoryState
undo(state) → HistoryState
redo(state) → HistoryState
jumpTo(state, index) → HistoryState
currentSnapshot(state) → Snapshot | null
canUndo(state) / canRedo(state) → boolean
undoActionLabel(state) / redoActionLabel(state) → string | null
```

Behaviour:

- `pushSnapshot` truncates the redo-tail (entries past `cursor`)
  before append — no orphan branches when the operator hits undo
  then makes a fresh edit. Capacity trim drops oldest entries when
  over `capacity`; cursor lands at the new head every push.
- `undo` / `redo` clamp at the array bounds (no-op when at edge).
- `jumpTo` ignores out-of-range indexes.
- `undoActionLabel` returns `entries[cursor].action` (the action
  the operator would *undo*); `redoActionLabel` returns
  `entries[cursor + 1].action`.
- `DEFAULT_CAPACITY = 50` per prompt.

## 2. React hook

NEW `lib/useEditorHistory.ts` — `useEditorHistory(pageId,
initialTree, capacity?)` wraps the pure machine in a React
`useState`. Returns `EditorHistoryHandle`:

```ts
{
  state: HistoryState;
  current: Snapshot | null;
  tree: Block[];
  push: (tree, action) => void;
  undo: () => void;
  redo: () => void;
  jumpTo: (index) => void;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
}
```

Resets the history when `pageId` changes (operator switched
pages). Host page calls `push(tree, action)` after every
mutating action — labels feed the toolbar tooltips.

## 3. HistoryToolbar

NEW `components/editor/HistoryToolbar.tsx` — Undo / Redo /
History dropdown. Props: `{ history: HandleLike, renderThumb? }`.

- Undo / Redo buttons disabled when `canUndo` / `canRedo` false;
  `title` reads "Undo: insert hero" / "Nothing to undo".
- History dropdown lists the last 20 snapshots, newest-first,
  click-to-jump (calls `history.jumpTo(realIndex)`); current
  cursor highlighted with a primary-coloured background and
  `●` glyph.
- `renderThumb?(snapshot)` callback lets host render a
  thumbnail per row (preview-on-hover).
- CSS-var driven (R011 surface).

## 4. R018 wiring

R018 already shipped `editorShortcuts.ts` with `undo` / `redo`
bindings (`⌘Z` / `⌘⇧Z`). Host page resolves the binding id and
calls `history.undo()` / `history.redo()` — no new shortcut
registration in R021.

## 5. Smoke

NEW `__smoke__/r021-undo-redo.test.ts` 36/36 pass:

- `createHistory` seeds 1 snapshot at cursor 0; `currentSnapshot`
  returns it; `canUndo`/`canRedo` false initially.
- `pushSnapshot` extends entries + moves cursor to head;
  `canUndo` flips true.
- 3-snapshot stack: undo moves cursor back, two undos lands at
  start, undo at start is no-op; redo from start advances, redo
  past head is no-op.
- Push after undo truncates redo-tail (length stays at cursor+1
  + new entry).
- `undoActionLabel` / `redoActionLabel` return the right snapshot
  actions; null at edges.
- `jumpTo(0)` moves cursor; out-of-range indexes are no-ops.
- Capacity trim: 10 pushes against capacity=5 yields 5 entries
  (newest retained); cursor stays at head.
- HistoryToolbar SSR: Undo + Redo buttons + History dropdown
  trigger + brand-kit CSS-var token; `title="Undo: <action>"`
  on Undo button when `canUndo`; "Nothing to undo" / "Nothing
  to redo" titles when disabled; `disabled` attribute on
  buttons when `can*` false.

`react-dom/server` import via @ts-expect-error + typed wildcard
(R009 pattern). package.json test chain extended.
website-editor tsc-clean.

## 6. Files

- `plugins/website-editor/src/lib/editorHistory.ts` (NEW —
  pure state machine).
- `plugins/website-editor/src/lib/useEditorHistory.ts` (NEW —
  React hook).
- `plugins/website-editor/src/components/editor/HistoryToolbar.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/r021-undo-redo.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- In-memory only per prompt — refresh / new tab clears history.
  Cross-session would require storage + snapshot-diff
  optimisation (50 full BlockTrees in localStorage gets heavy
  fast).
- Per-block history explicitly out of scope per prompt.
- The ⌘Z / ⌘⇧Z shortcut bindings already shipped in R018 — host
  page routes the binding id to `history.undo()` / `history.redo()`.
  No new shortcut registry in R021.
- `pushSnapshot` stores the *whole* tree per snapshot. For
  Felicia-scale BlockTrees this is fine; large pages with deep
  trees would benefit from immer-style structural sharing
  (R+1 — same shape, no API change).
- The renderThumb callback is the host's responsibility — pure
  toolbar can't reach into the host's preview engine.
- `jumpTo` operates on the absolute index in `entries`; the
  toolbar maps `recent[localIdx]` → `realIdx` for the operator
  so the dropdown can show only the last 20 while jumpTo still
  addresses the underlying entry.

## 8. R+1 candidates

- Cross-session persistence (localStorage with structural sharing
  / diff snapshots).
- Immer-style structural sharing so 50 snapshots don't dominate
  memory on large pages.
- Per-snapshot thumbnail capture (canvas-paint of the iframe at
  push time, stored as data URL keyed in `Snapshot.thumb`).
- Branching history (current snapshot tracks parent; redo-tail
  never truncates — operator gets a tree of edits).
- Snapshot collapse: coalesce 50 trivial typing edits into a
  single "edit text" snapshot to keep the history readable.
