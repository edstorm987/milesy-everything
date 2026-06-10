# 04 — Code mode JSON tree editor (T3 R020)

T3 Round 020. Per chapter 06 the visual editor has Live / Block /
Code modes; Live + Block shipped, Code is missing. R020 ships
Code mode as a JSON tree editor with parse + validate + last-good
preview semantics.

## 1. Validation library

NEW `lib/blockTreeJson.ts` (pure, SSR-safe).

```ts
type ParseResult =
  | { ok: true; blocks: Block[] }
  | { ok: false; error: string; line?: number; col?: number };

parseBlockTreeJson(json) → ParseResult
formatBlockTreeJson(blocks) → string  // 2-space indent
validateBlockTree(blocks) → string | null  // pure shape check
compareTrees(a, b) → TreeDiff { identical, countA, countB, firstDifferenceAt? }
```

`parseBlockTreeJson` runs `JSON.parse` then `validateBlockTree`.
On `JSON.parse` syntax errors it parses out the offset hint
("position N" / "column N") V8 emits and converts to `line/col`
via a tiny linear scan over the source — best-effort, falls back
to undefined when the engine doesn't include a position.

`validateBlockTree` walks `Block[]` recursively asserting
`id: non-empty string`, `type: non-empty string`, `props: object
(optional)`, `children: Block[] (optional)`. Returns the first
error path (e.g. `[0].children[1].type: required string`) or
null.

`compareTrees` counts total nodes (incl. nested) on each side
and walks until first divergence by id / type / props / child-
count. Used for the save-confirm modal so the operator sees a
concrete summary ("Block count 12 → 14. First diff at
[2].children[0].props") before committing.

## 2. CodeModePanel

NEW `components/editor/CodeModePanel.tsx`. Split-view component:

- Left pane: header (label + Reformat / Copy / Paste / Save
  buttons) + textarea seeded with `formatBlockTreeJson(initialTree)`.
- Right pane: header ("Live preview" + amber `(last-good)` flag
  when current text is invalid) + host-rendered preview via
  `renderPreview(lastGood)` callback.

Behaviour:

- On every textarea change, `parseBlockTreeJson` runs. If
  success, updates `lastGoodRef.current` so the preview always
  has a tree to render. If failure, shows the error (with line
  / col when available) inline at the bottom of the left pane;
  preview keeps rendering the last-good tree.
- Save: opens a confirm modal showing the `compareTrees`
  summary. Identical-tree saves no-op. Cancel / Save tree
  buttons.
- Copy: `navigator.clipboard.writeText(text)` + 1.5s "Copied ✓"
  flash; falls back gracefully.
- Paste: `navigator.clipboard.readText()` → replace textarea
  content (operator clicks Save explicitly — no auto-save).
- Reformat: re-stringifies the parsed tree at 2-space indent
  (only enabled when current JSON is valid).
- Errors styled with rgba-red flag + monospace font + line/col
  prefix when available.

CSS-var driven (R011 surface): `--brand-bg / --brand-bg-elevated /
--brand-text / --brand-text-muted / --brand-border / --brand-radius-md /
--brand-radius-sm / --brand-primary`.

## 3. Smoke

NEW `__smoke__/r020-code-mode.test.ts` 24/24 pass:

- `parseBlockTreeJson`: valid → ok+blocks; syntax error → ok:false +
  message; non-array root → "expected an array"; missing id /
  type / non-array children → error mentions path; nested errors
  surface with full path (`[0].children[0]`).
- `validateBlockTree` direct shape assertion.
- `formatBlockTreeJson` round-trips through parse cleanly +
  emits 2-space indent.
- `compareTrees`: identical clone → identical=true; length-diff
  surfaces; props-diff returns firstDifferenceAt; type-diff lands
  at `[0].type`.
- `CodeModePanel` SSR: emits `data-component`, JSON tree label,
  Save/Copy/Paste/Reformat buttons, "Live preview" header,
  textarea seeded with HTML-escaped formatted JSON
  (`&quot;id&quot;: &quot;s1&quot;`), brand-kit CSS-var token,
  custom `renderPreview` callback output appears in right pane.

`react-dom/server` import via @ts-expect-error + typed wildcard
(R009 pattern). package.json test chain extended.
website-editor tsc-clean.

## 4. Files

- `plugins/website-editor/src/lib/blockTreeJson.ts` (NEW —
  parseBlockTreeJson + formatBlockTreeJson + validateBlockTree
  + compareTrees + line/col offset extraction).
- `plugins/website-editor/src/components/editor/CodeModePanel.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/r020-code-mode.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 5. Q-ASSUMED / deviations

- The host editor page wires CodeModePanel into the topbar's
  Code mode tab + passes a `renderPreview` callback that the
  page already uses for Live/Block previews (R+1 host wiring).
- `JSON.parse` line/col extraction is best-effort — V8 emits
  position hints in some error messages, others don't. The
  smoke verifies behaviour on the engines we test with;
  cross-engine fallbacks (no line/col) are already gracefully
  handled by the type signature.
- Diff view is explicitly out of scope per prompt; the
  save-confirm modal shows a single first-difference path
  rather than a full diff.
- TS / Tailwind code editors out of scope per prompt.
- Schema validation is structural (id / type / children shape),
  not registry-level — operator can paste a tree referring to
  an unregistered block id and the renderer will fall back to
  whatever the renderer's missing-block treatment is. Real
  registry lookup would require importing `blockRegistry` here
  and is R+1 (the JSON contract should be reusable across
  storefront-render contexts where the registry isn't loaded).
- Copy/Paste degrade gracefully when `navigator.clipboard` is
  unavailable.

## 6. R+1 candidates

- Syntax highlighting (CodeMirror / Monaco) for the textarea.
  Current setup ships dependency-free; richer highlighting
  drops in cleanly behind the same prop interface.
- Registry-level validation that flags unregistered block ids
  (warning, not error — registries can grow without breaking
  pasted trees).
- Diff view (out of scope today) showing every property diff
  side-by-side.
- Path-jumper — clicking the "first difference at [x].y.z"
  string in the confirm modal scrolls the textarea to that
  position.
- Tree extract / sub-tree copy: select a sub-tree in the
  Block-mode tree, switch to Code mode, paste sub-tree only.
