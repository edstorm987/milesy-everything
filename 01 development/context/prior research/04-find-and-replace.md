# 04 — Site-wide find-and-replace (T3 R023)

T3 Round 023. Operator searches across all pages of a portal-
variant for text content + replaces. Useful for brand-name swaps,
copy refresh.

## 1. Pure search lib

NEW `lib/findReplace.ts`:

- `findInTree(blocks, query, { caseSensitive?, wholeWord? })` →
  `Match[]` walking BlockTree, only inspecting props whose name
  matches the text-content allowlist (TEXT_PROP_KEYS): `text /
  html / label / heading / subheading / subhead / headline /
  title / description / body / caption / ctaLabel / submitLabel /
  thankYouMessage / message / fallbackTitle / inlineThankYou /
  tagline / summary / content`. Image `src` / `alt` and link
  `href` are explicitly excluded per prompt's "alt-text + attribute
  values out-of-scope" gate.
- `replaceInTree(blocks, query, replacement, opts)` → `{ blocks,
  replacements }` deep-clone with substitutions applied right-to-
  left so positions stay valid; original tree untouched.
- `findAcrossPages(pages, query, opts)` → `PageMatchSummary[]`
  drops pages with 0 matches.
- `totalMatches(summaries)` → number.
- `Match { blockId, blockType, path, prop, index, snippet,
  matchLength }` — `path` is JSON-pointer-style `[0].children[2]`
  for editor jump; `snippet` is ≤80 chars centred on the match
  with `…` truncation marks; whitespace collapsed.

Search semantics:

- Default: case-insensitive substring scan via `indexOf`.
- `caseSensitive`: case-sensitive substring scan.
- `wholeWord`: `\b`-anchored regex respecting case sensitivity;
  query is regex-escaped.
- Matches inside the same string don't overlap (`from = i +
  Math.max(1, needleLength)`).

## 2. FindReplaceModal

NEW `components/editor/FindReplaceModal.tsx`. Pure UI — operator
flow:

- `Cmd-Shift-F` opens (host page binds via R018 shortcut registry).
- Find + Replace inputs side-by-side; case-sensitive + whole-word
  toggles; scope chips (This page / This variant / All pages)
  with `aria-pressed`.
- Live results list grouped by page, page header shows match
  count, each row shows `<blockType>.<prop>` + path + snippet.
  Click → fires `onJump(pageId, blockId)`.
- "Replace all (N)" footer button disabled at zero; opens a
  confirm modal showing `M matches across N pages` plus an amber
  warning row when `total > 50` per prompt.
- Confirm calls `onReplaceAll(changes)` with a per-page array
  `{ pageId, blocks, replacements }`. Host commits via existing
  page PATCH endpoints (atomic-from-the-host's-POV — fire all
  PATCHes in parallel and reload on success).

Keyboard: autoFocus on Find input. CSS-var driven (R011 surface).

## 3. R018 wiring

R018 ships `editorShortcuts.ts` but `Cmd-Shift-F` isn't a default
binding. Host page can either add a custom binding via the
registry's `bindings` arg or wire a one-off `keydown` listener
that opens the modal. R+1 candidate: add `find:open` to
`DEFAULT_BINDINGS` keyed `f` + meta + shift.

## 4. Smoke

NEW `__smoke__/r023-find-replace.test.ts` 22/22 pass:

- Substring case-insensitive scan picks up text/heading/sub-
  heading/label across the tree (skips image src/alt + link href
  per allowlist).
- Match shape (blockType + prop + path + centred snippet).
- `caseSensitive: true` matches only capital "Aqua".
- `wholeWord: true` excludes "aquatic" but matches "AQUA".
- Empty query → `[]`.
- `replaceInTree` returns count + only swaps in text props (image
  src / button href untouched); leaves input untouched (deep
  clone); empty query → no-op + same reference.
- `findAcrossPages` drops zero-match pages; `totalMatches` sums.
- `FindReplaceModal` open=false → empty; open=true → dialog +
  Find/Replace inputs + 3 scope chips (`aria-pressed`) + Replace
  all button + brand-kit CSS-var token.

`react-dom/server` import via @ts-expect-error + typed wildcard
(R009 pattern). package.json test chain extended.
website-editor tsc-clean.

## 5. Files

- `plugins/website-editor/src/lib/findReplace.ts` (NEW —
  findInTree + replaceInTree + findAcrossPages + totalMatches +
  TEXT_PROP_KEYS allowlist).
- `plugins/website-editor/src/components/editor/FindReplaceModal.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/r023-find-replace.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 6. Q-ASSUMED / deviations

- TEXT_PROP_KEYS allowlist is the prompt's "text content only"
  gate. Adding new text-bearing props (e.g. a future block's
  `bodyText`) requires extending the set; alt-text and attribute
  values stay out per prompt.
- Atomic transaction across pages — the lib computes the
  per-page replacement bundle synchronously; the host commits
  via N parallel PATCHes. Failure mid-batch is the host's
  problem (current behaviour: best-effort, partial replace
  visible). True atomicity needs a foundation transaction
  endpoint — R+1.
- "Jump to result" relies on the host's existing block-selection
  + page-navigation path (R012 portal-variant editor + page
  picker). Pure modal fires `onJump(pageId, blockId)` and lets
  the host route.
- Whole-word semantics use JS `\b` which is ASCII-only —
  Unicode word boundaries (e.g. é-bordered) treated as word
  characters by JS spec. Acceptable for English-first portal
  copy; Unicode-aware variant is R+1.
- Cmd-Shift-F binding not added to R018 DEFAULT_BINDINGS — host
  page wires the open trigger today (R+1 to standardise).
- Regex search explicitly out of scope per prompt.

## 7. R+1 candidates

- `find:open` shortcut binding in R018 `DEFAULT_BINDINGS`
  (Cmd-Shift-F) so host doesn't need a one-off listener.
- Atomic transaction endpoint at the foundation layer that
  accepts an array of page patches; rollback on partial
  failure.
- Regex-mode search.
- Find / replace in alt-text + attribute values via a checkbox
  ("Include attributes") that opens up the allowlist.
- Per-page diff preview (shows the blocks that would change
  side-by-side before commit) — reuses R020 `compareTrees`.
- Highlight in iframe — when a result row is hovered, host
  scrolls + flashes the matching block in the live preview.
- Unicode-aware word boundaries for non-English copy.
