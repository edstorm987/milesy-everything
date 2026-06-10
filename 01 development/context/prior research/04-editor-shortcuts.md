# 04 — Editor keyboard shortcuts + Cmd-K palette (T3 R018)

T3 Round 018. Operator productivity layer for the visual editor:
shortcut registry, scope-aware dispatcher, Cmd-K command palette,
shortcuts help modal.

## 1. Shortcut registry

NEW `lib/editorShortcuts.ts`. Pure module — no DOM imports at
module scope; safe in SSR / smoke contexts.

```ts
type ShortcutScope = "global" | "block-selected";

interface KeyBinding {
  id: string;             // dispatch identifier
  label: string;          // help-modal + palette label
  key: string;            // single key OR special ("Escape" / "Delete" / "ArrowUp" / "[" / "]")
  scope: ShortcutScope;
  meta?: boolean;         // Cmd OR Ctrl satisfies — cross-platform
  shift?: boolean;
  alt?: boolean;
}
```

`DEFAULT_BINDINGS` (14 entries):

**Global**: `palette:open` (⌘K), `save` (⌘S), `publish` (⌘⇧P),
`preview:toggle` (⌘E), `undo` (⌘Z), `redo` (⌘⇧Z), `help:open` (?).

**Block-selected**: `block:duplicate` (D), `block:delete` (Del),
`block:move-up` ([), `block:move-down` (]), `block:swap-up` (⌘↑),
`block:swap-down` (⌘↓), `block:deselect` (Esc).

Helpers:

- `matchesBinding(event, binding)` — Cmd OR Ctrl satisfies `meta`
  (cross-platform); single-char keys match case-insensitively;
  modifier sets must exact-match (e.g. `⌘K` doesn't match
  `⌘⇧K`).
- `resolveShortcut(event, { scope })` — returns the matching
  binding (id) or null. Block-selected bindings only candidate
  when scope is `block-selected`; global bindings always
  candidate. Iteration order is `DEFAULT_BINDINGS` order so
  earlier entries win on ambiguity.
- `formatBinding(b)` — pretty-prints for help modal / palette
  hint. Emits ⌘ / ⇧ / ⌥ glyphs + arrow / Esc / Del / Enter / Tab
  symbols. Examples: `⌘K`, `⌘⇧P`, `Esc`, `⌘↑`, `Del`, `?`.

## 2. CommandPalette

NEW `components/editor/CommandPalette.tsx`. Operator-facing
palette opened by `Cmd-K` / `Ctrl-K`.

Props: `{ open, onClose, commands: PaletteCommand[], placeholder? }`.

`PaletteCommand { id, label, hint?, group?, run }`. Host page
composes the command list (Save / Publish / Toggle preview / Undo
/ Redo + "Insert <block>" entries derived from the current
block-registry + "Switch variant" entries derived from R012
portal-variant feed).

Behaviour:

- Focuses the input on open; resets query + active index.
- Fuzzy substring search over `label + group + hint` (lowercased).
- Arrow keys navigate; Enter executes + closes; Esc closes.
- Mouse hover sets the active row.
- Commands grouped under `group` header with uppercase letter-
  spacing chrome.
- Hint pill rendered next to label as `<kbd>`-style monospace.
- Renders nothing when `open=false`.

CSS-var driven (R011 surface): `--brand-bg-elevated / --brand-
border / --brand-radius-md / --brand-text / --brand-text-muted /
--brand-primary / --brand-radius-sm`.

## 3. ShortcutsHelpModal

NEW `components/editor/ShortcutsHelpModal.tsx`. Opens via `?` key
(per `help:open` binding).

Renders all bindings split into Global + "When a block is
selected" sections, each row showing the human label + a `<kbd>`-
styled formatted-binding pill. Footer copy: "Press `?` any time
to reopen this list."

Brand-kit CSS-var driven; `react-dom/server` SSR-safe.

## 4. Host page wiring (Q-FOLLOWUP)

Pure components — host editor page mounts them and binds the
single global `keydown` listener that calls `resolveShortcut`.
Skeleton:

```tsx
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    const scope: ShortcutScope = selectedBlockId ? "block-selected" : "global";
    const b = resolveShortcut(e, { scope });
    if (!b) return;
    e.preventDefault();
    switch (b.id) {
      case "palette:open":  setPaletteOpen(true); break;
      case "help:open":     setHelpOpen(true); break;
      case "save":          save(); break;
      case "publish":       publish(); break;
      case "preview:toggle":togglePreview(); break;
      case "undo":          undo(); break;
      case "redo":          redo(); break;
      case "block:duplicate": duplicateBlock(selectedBlockId); break;
      case "block:delete":    deleteBlock(selectedBlockId); break;
      case "block:move-up":   moveBlockUp(selectedBlockId); break;
      case "block:move-down": moveBlockDown(selectedBlockId); break;
      case "block:swap-up":   swapBlockUp(selectedBlockId); break;
      case "block:swap-down": swapBlockDown(selectedBlockId); break;
      case "block:deselect":  setSelectedBlockId(null); break;
    }
  }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [selectedBlockId, /* …handlers */]);
```

Pure dispatch: the editor's existing handlers stay where they
are; R018 just routes keys to them.

## 5. Smoke

NEW `__smoke__/r018-editor-shortcuts.test.ts` 47/47 pass:

- `DEFAULT_BINDINGS` includes every prompt-required shortcut id.
- `matchesBinding` handles meta/Ctrl cross-platform, case-
  insensitive keys, modifier exact-match (⌘K ≠ ⌘⇧K), special
  keys (Escape / ArrowUp).
- `resolveShortcut` respects scope filtering (block-selected
  bindings dormant in global scope; global bindings always
  candidate).
- `formatBinding` emits ⌘/⇧/⌥ + arrow/Esc/Del/?
- `CommandPalette` open=false renders empty; open=true emits
  `role="dialog"` + all commands + group headers + hint pills +
  brand-kit CSS-var token.
- `ShortcutsHelpModal` open=false renders empty; open=true emits
  `role="dialog"` with `aria-label`, Global + Block-selected
  sections, ⌘K kbd, Esc kbd, brand-kit CSS-var token.

`react-dom/server` import via `@ts-expect-error` + typed wildcard
(R009 pattern). package.json test chain extended.
website-editor tsc-clean.

## 6. Files

- `plugins/website-editor/src/lib/editorShortcuts.ts` (NEW —
  registry + matchesBinding + resolveShortcut + formatBinding).
- `plugins/website-editor/src/components/editor/CommandPalette.tsx`
  (NEW).
- `plugins/website-editor/src/components/editor/ShortcutsHelpModal.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/r018-editor-shortcuts.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- Pure components ready to mount; host editor page wires the
  `keydown` listener + composes the commands list (skeleton in
  §4). Direct mount in the existing editor topbar is host-page
  R+1.
- `meta: true` honours both Cmd AND Ctrl so the same bindings
  work on macOS + Windows / Linux. Single source of truth.
- Modifiers are exact-match — `⌘K` matches `metaKey:true,
  shiftKey:false` only. Operators expecting `⌘K` to fire on
  `⌘⇧K` would surface a false positive; explicit-match wins.
- Single-char keys are case-insensitive (`d` ≡ `D`); special
  keys match exact (`ArrowUp`, `Escape`, `Delete`, `[`, `]`).
- Vim mode + multi-select drag explicitly out of scope per
  prompt.

## 8. R+1 candidates

- Host editor topbar wire-up (Cmd-K opens palette button +
  global keydown listener + handler dispatch).
- Custom keybindings per agency (operator can re-bind via a
  settings page; storage layer mirrors R013's allow-list
  pattern).
- "Insert <block>" command-palette entries auto-derived from
  `blockRegistry` (palette stays sync'd with the catalogue).
- Multi-select + bulk operations (out of scope today).
- Macros / scripted command sequences from the palette.
- Vim-style motion / leader-key chord support.
