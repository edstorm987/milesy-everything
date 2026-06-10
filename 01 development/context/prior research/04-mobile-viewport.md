# 04 — Multi-device viewport + mobile preview (T3 R019)

T3 Round 019. Editor topbar viewport switcher (Desktop/Tablet/
Mobile) + per-block visibility flags + overflow detection helper.
Pure components ready for host-page mount.

## 1. Viewport spec

NEW `lib/viewport.ts` (pure, SSR-safe). `Viewport = "desktop" |
"tablet" | "mobile"` is the canonical category — topbar switcher,
BlockStyles `hideOn*` flags, and the overflow detector all key
off these three values.

`VIEWPORT_SPECS`:

| id      | label   | width | icon |
|---------|---------|-------|------|
| desktop | Desktop | 1280  | 🖥   |
| tablet  | Tablet  | 768   | 📱   |
| mobile  | Mobile  | 390   | 📲   |

Helpers:

- `widthForViewport(v)` — returns the canonical CSS-pixel width.
- `isHiddenOn(styles, v)` — true when the matching `hideOn*` flag
  is set.
- `pruneForViewport(blocks, v)` — recursively deep-clones the
  BlockTree, dropping every block whose `styles.hideOn*` matches
  the viewport. Storefront renderer + editor preview both call
  this.
- `detectOverflows(doc, viewportWidth)` — DOM walker that returns
  `OverflowReport[]` for every `[data-block-id]` element wider
  than the viewport (1px tolerance for sub-pixel rounding).
  SSR-safe — returns `[]` when `doc` is null/undefined.

## 2. BlockStyles extension

`types/block.ts::BlockStyles` gains 3 optional booleans:
`hideOnDesktop` / `hideOnTablet` / `hideOnMobile`. Foundation +
storefront renderers must call `pruneForViewport` before render
to honour them. Editor preview honours them when the matching
viewport is selected so the operator sees what end-users see.

## 3. ViewportSwitcher

NEW `components/editor/ViewportSwitcher.tsx`. Three-chip toolbar:

- `Desktop / Tablet / Mobile` chips with icon + label + width hint.
- Active chip highlighted via `--brand-primary`.
- `aria-pressed` on every chip; `data-viewport` + `data-active`
  attributes on the buttons for testing + CSS hooks.
- Optional `flags?: Partial<Record<Viewport, number>>` prop —
  emits an amber 8×8 dot when count > 0 (overflow warnings).
- CSS-var driven (R011 surface).

Host page wires `current={state}` + `onChange={setState}` and
swaps the preview iframe `width` attribute on change.

## 4. Smoke

NEW `__smoke__/r019-mobile-viewport.test.ts` 26/26:

- 3 viewport specs with correct widths.
- `isHiddenOn` flag matrix (undefined styles, every flag-viewport
  combination).
- `pruneForViewport` filters at every depth + honours every flag
  + leaves input untouched (deep clone) + nested deep prune.
- `detectOverflows` returns `[]` for null/undefined doc; flags
  blocks wider than viewport; tolerates 1px sub-pixel.
- `ViewportSwitcher` emits 3 chips, marks active correctly,
  surfaces width hints (1280/768/390), emits flag dot when
  count > 0, brand-kit CSS-var token present.

`react-dom/server` import via `@ts-expect-error` + typed wildcard
(R009 pattern). package.json test chain extended.
website-editor tsc-clean.

## 5. Files

- `plugins/website-editor/src/types/block.ts` patch (BlockStyles
  +3 optional booleans).
- `plugins/website-editor/src/lib/viewport.ts` (NEW —
  VIEWPORT_SPECS + widthForViewport + isHiddenOn +
  pruneForViewport + detectOverflows).
- `plugins/website-editor/src/components/editor/ViewportSwitcher.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/r019-mobile-viewport.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 6. Q-ASSUMED / deviations

- Touch simulation is a host-page concern — the iframe-width swap
  is the contract; mobile-only event simulation (touchstart vs
  mousedown) is the foundation editor's responsibility.
- Per-block-per-viewport styling (e.g. mobile-specific paddings)
  already lives on `BlockStyles.mobile / .tablet` (R002+ pattern,
  out of scope per prompt).
- Overflow detection is DOM-based — runs at editor preview time
  inside the iframe. SSR-render of the storefront doesn't run
  the detector (no DOM). Foundation can run it client-side post-
  hydration if it wants the warnings on live pages.
- Tablet width chosen 768 (iPad portrait), mobile 390 (iPhone 14
  Pro). Both common test sizes. Operator can drag-resize the
  preview iframe for in-between widths.
- `existing devicePresets.ts` (full Chrome-DevTools-style device
  list) coexists with R019's simpler 3-chip toolbar — they
  serve different audiences (devicePresets for power users,
  ViewportSwitcher for everyday operator).

## 7. R+1 candidates

- Host editor topbar wire-up — mount `ViewportSwitcher`, swap
  preview iframe width on change, run `detectOverflows` on each
  switch + render warnings inline on flagged blocks.
- Touch event simulation when viewport is mobile/tablet (foundation
  editor inside the iframe).
- Foundation storefront renderer wires `pruneForViewport` per
  detected client viewport (CSS would also work but JS-prune
  keeps the DOM clean — no `display: none` artefacts).
- `hideOn*` properties in `EditorPropertiesSidebar` so operators
  toggle visibility without hand-editing JSON.
- "Auto-fix overflow" suggestion: when a block is flagged, suggest
  setting `width: 100%` or a `mobile.width` override.
