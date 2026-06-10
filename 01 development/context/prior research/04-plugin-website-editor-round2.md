# Round-2 chapter — Website-editor plugin (T3)

Round-2 lifted the real implementations from `02 felicias aqua portal
work/` into the plugin shell scaffolded in Round 1. The plugin is now
tsc-clean with 31/31 smoke tests green and ships:

- 58 fully-implemented block components (faithful 1:1 ports of 02's
  block library, including click-to-edit, asset pickers, animated
  scroll, split-test resolution)
- A real visual editor (`pages/EditorPage.tsx`, 1,429 lines) with
  Live / Block / Code modes, Simple / Full / Pro complexity tiers,
  outliner left rail, properties right panel, topbar with mode
  switcher + device emulator + undo/redo, publish modal with the
  GitHub PR flow
- Real portal-variants admin (`pages/PortalsPage.tsx`, 444 lines) with
  per-role tabs, variant CRUD, active-tab indicator, starter-seeded
  variant creation
- Faithful ports of `pages/SectionsPage`, `pages/AssetsPage`,
  `pages/PopupsPage`, `pages/ThemesPage`
- Editor canvas (`components/canvas/{Canvas,PropertiesPanel,Sidebar,
  BlockToolbar,blockTreeOps,touchDnd}.tsx`) — drag-drop builder
- Editor sibling components (`components/editor/{EditorTopBar,
  EditorPropertiesSidebar,EditorOutliner,EditorBlockStage,
  EditorFunnelStage}.tsx`)

Files lifted: 70+. Lines lifted: ~10,000 (block library + admin pages
+ canvas + libs). Stub modules introduced for missing dependencies
(`ecommerceBridge`, `confirm`, `notify`, `prompt`, `pluginRequired`,
`AdminTabs`, `Tip`, `tabSets`, `splitTests`, `funnels`, `sections`,
`popup`) — each documented inline with the contract it replaces and
the conditions for unwinding the shim.

---

## Phase A — 58 block components

Source: `02 felicias aqua portal work/src/components/editor/blocks/*.tsx`.

Each block:
- Default export with `export default function XxxBlock`
- Props shape `{ block, editorMode?, renderChildren? }` (matches 02's
  `BlockRenderProps`)
- Reads `block.props`, `block.styles` (typed via `BlockStyles`),
  composes `blockStylesToCss(block.styles)` via the shared helper,
  uses `renderChildren?.(block.children)` for container blocks
- Editor-mode polish (contentEditable for heading/text; placeholder
  hints when empty; click-to-stop-propagation so the canvas's
  selection handler isn't double-fired)

### Helpers lifted

| Module | Purpose |
|---|---|
| `components/blockStyles.ts` | `blockStylesToCss(styles)` + `overridesToCssText(override)` + `STYLE_FIELD_GROUPS` (used by the properties panel's Styles tab) |
| `components/AnimateOnScroll.tsx` | IntersectionObserver-driven entrance animation for blocks with `styles.animate` set |
| `components/variantResolver.ts` | FNV-1a hash + visitor/session sticky bucketing + `recordExposure`/`recordConversion` beacons |
| `components/themeCss.ts` | `tokensToCssVarsClient(tokens)` — emits `--theme-*` CSS variables; `tokensToCssVars(tokens)` wraps it in a `:root { ... }` block |
| `components/useProducts.ts` | `useCatalog`, `useProductByHandle`, `useProductsByRange`, `formatPrice`, `fetchCatalog` — pointed at `/api/portal/ecommerce/products` (T2's plugin) |
| `components/AssetPicker.tsx` | Inline asset library picker; reads from `lib/media.ts` |
| `components/pageTemplates.ts` | 13 starter page templates (homepage, about, contact, shop, cart, checkout, order-success, landing, pricing, faq, services, blog-index) |

### `BlockRenderer.tsx` — tree contract

Rewritten to match 02's tree contract:

```tsx
<BlockRenderer
  blocks={blocks}
  editorMode={editorMode}
  themeId={themeId}
  splitTestGroups={splitTestGroups}
/>
```

Each block runs through `BlockNode` which:
1. Resolves split-test variant if any group is `running`
2. Layers per-theme overlay (`block.themeStyles[themeId]`)
3. Wraps with optional `<AnimateOnScroll>` outside editor mode
4. Emits scoped responsive `@media` rules for `styles.tablet`/`mobile`
5. Records a `SplitTestExposure` beacon when a variant rendered

The single-block `BlockRenderer({ block })` form was renamed
`BlockTreeRenderer({ blocks })` so the foundation's
`PortalPageRenderer` keeps compiling unchanged.

### `blockRegistry.ts` — single source of truth

Rewritten to use 02's `BlockDefinition` shape (`{ type, label, icon,
category, isContainer, Component, defaultProps, defaultChildren?,
fields: PropField[] }`). The plugin manifest's `BLOCK_DESCRIPTORS:
BlockDescriptor[]` is derived from this map at module load — adding a
new block here automatically updates what the manifest exposes to
other plugins and the foundation editor. Round-1 compat shims kept
(`getBlockEntry`, `BlockComponentProps`) so existing callers (smoke
test) don't break.

### Ecommerce bridge

`components/ecommerceBridge.tsx` — stub for blocks that originally
pulled from `02`'s `@/context/CartContext`, `@/lib/products`,
`@/lib/variants`, and `@/components/ProductVariantPicker`. T2's
`@aqua/plugin-ecommerce` doesn't yet ship a client component surface
(only REST routes), so:

- `useCart()` → empty cart with no-op mutations
- `ProductVariantPicker` → notice div in editor / silent stub live
- Types `Product`, `ProductVariant`, `ResolvedVariant`, `CartItem`,
  `CartSnapshot`, `VariantPickerState` — match 02's shape

Storefront app can call `setCartProvider(fn)` to inject a live
snapshot once T2's ecommerce client surface lands; unwinding this
shim is a one-import-swap per block.

**Tagged in `04-plugin-ecommerce.md` Round-2 TODO.**

---

## Phase B — Visual editor admin page

`pages/EditorPage.tsx` — 1,429-line faithful port of
`02/src/app/admin/editor/page.tsx`. Hosts the storefront in an
iframe (with `?portal_edit=1` so the existing PortalEditOverlay
activates inside) and wraps it in:

- **Topbar** (`components/editor/EditorTopBar.tsx`) — site / page
  picker, mode switcher (Live · Block · Code), edit/view toggle,
  device emulator dropdown, undo/redo, complexity-tier toggle
  (Simple / Full / Pro), publish button
- **Right properties sidebar** (`components/editor/
  EditorPropertiesSidebar.tsx`) — opens when an element is clicked in
  the iframe; exposes Props / Styles / A11y / Split-test / Code tabs
- **Left outliner** (`components/editor/EditorOutliner.tsx`) — pages
  + funnels, click to switch target
- **Block stage** (`components/editor/EditorBlockStage.tsx`) — Block
  mode renders this inline (no iframe), drag-drop canvas + library +
  properties panel, debounce-saves through `editorPages`
- **Funnel stage** (`components/editor/EditorFunnelStage.tsx`) — when
  the operator selects a funnel target

### Live ↔ host message contract

```
iframe → host:  { source: "portal-edit-overlay",
                   type: "ready" | "select" | "unsaved" | "saved", … }
host → iframe:  { source: "editor-host",
                   type: "set-mode" | "patch" | "save" | "revert", … }
```

### Canvas internals

`components/canvas/Canvas.tsx` — wraps `BlockRenderer` with
drop-zone overlays, click-to-select, hover/selected rings.
`components/canvas/PropertiesPanel.tsx` — Props / Styles / A11y /
Split-test / Code tabs.
`components/canvas/Sidebar.tsx` — left rail, block library + layers
tree.
`components/canvas/BlockToolbar.tsx` — floating quick-actions bar
(move-up / move-down / duplicate / settings / delete).
`components/canvas/blockTreeOps.ts` — pure tree mutation helpers
(insertSibling, appendChild, moveBlock, removeBlock, updateBlock,
duplicateBlock, findBlock, createBlock, makeBlockId).
`components/canvas/touchDnd.ts` — `<TouchDndProvider />` mounts a
touch-event shim so the HTML5 drag-drop surfaces work on
mobile/tablet.

### New plugin libraries

| Module | Source | Notes |
|---|---|---|
| `lib/devicePresets.ts` | 02/src/lib/admin/devicePresets.ts | 26 device specs + DeviceState + effectiveViewport |
| `lib/splitTests.ts` | 02/src/lib/admin/splitTests.ts | Re-pointed at `/api/portal/website-editor/split-tests` — server side is Round-3 TODO |
| `lib/funnels.ts` | 02/src/lib/admin/funnels.ts | Re-pointed at `/api/portal/website-editor/funnels` — server side is Round-3 TODO |
| `lib/promote.ts` | 02/src/lib/admin/promote.ts | Re-pointed at plugin-namespaced API path |
| `lib/sections.ts` | 02/src/lib/admin/sections.ts | localStorage homepage section ordering |
| `lib/popup.ts` | 02/src/lib/admin/popup.ts | localStorage discount popup config |
| `lib/theme.ts` | 02/src/lib/admin/themes.ts (rewritten) | Mirrors 02's contract; cache + onThemesChange |
| `lib/sites.ts` | (extended) | localStorage active-site cache + getActiveSiteId/getActiveSite/setActiveSiteId/onSitesChange/refreshSites |
| `lib/editorMode.ts` | (extended) | + COMPLEXITY_OPTIONS table + onEditorComplexityChange listener |

### Shims for missing foundation chrome

| Shim | Replaces |
|---|---|
| `lib/confirm.ts` | `02/src/components/admin/ConfirmHost` — falls through to native `window.confirm` |
| `lib/notify.ts` | `02/src/components/admin/Toaster` — console fallback |
| `lib/prompt.ts` | `02/src/components/admin/PromptHost` — falls through to native `window.prompt` |
| `lib/pluginRequired.tsx` | `02/src/components/admin/PluginRequired` — pass-through (foundation gates upstream) |
| `components/AdminTabs.tsx` | `02/src/components/admin/AdminTabs` — tab strip |
| `components/Tip.tsx` | `02/src/components/admin/Tip` — inline help bubble |

Each shim is documented inline with what it replaces and the
single-file change required when T1 ships the styled host.

### Type widening

- `types/block.ts` now mirrors `02/src/portal/server/types.ts`
  exactly: `Block`, `BlockStyles` (with mobile/tablet/animate
  nested), `BlockA11y`, `BlockSeo`, `BlockVariant`, `SplitTestGroup`,
  `SplitTestStatus`, `SplitTestResult`.
- `types/theme.ts` ThemeTokens uses 02's flat keys
  (`primary`/`surface`/`surfaceAlt`/`ink`/…/`spacingUnit`/`customCss`).
- `types/site.ts` widened to mirror 02's full Site shape (`domains`,
  `primaryDomain`, `logoUrl`, `customHead`, `customBody`,
  `smoothScroll`, `customCursor`, etc.).
- `types/editorPage.ts` gained `publishedBlocks`, `customHead`,
  `customFoot`, `customCss`, `seo` — the additional fields the lifted
  page references.

### `lib/editorPages.ts`

Rewritten to mirror 02's signature shape (`siteId, pageId`) +
`onPagesChange` + `bust(siteId)` cache invalidation pattern + the
portal-variant helpers (`listPortalVariants`,
`setActivePortalVariant`). Re-pointed at
`/api/portal/website-editor/...` namespace.

---

## Phase C — Portal-variants admin

`pages/PortalsPage.tsx` — 444-line faithful port of
`02/src/app/admin/portals/page.tsx`:

- Tabs: Login · Affiliates · Orders · Account · Pages
- Per-role variant CRUD: Make active / Edit in editor / Duplicate /
  Delete / View live ↗ / Preview ↗
- Active-variant tab indicator (the active tab gets a green dot)
- Variant grid + create-variant flow seeded from `starterForRole(role)`

`lib/portalStarters.ts` extended with the `starterForRole` Block-tree
builder lifted from 02 (login → heading + text + login-form,
affiliates → heading + stats-bar + login-form, orders → banner,
account → card-grid).

---

## Phase D — Sections / Assets / Popups / Themes

| Page | Source | Behaviour |
|---|---|---|
| `pages/SectionsPage.tsx` | 02 sections/page.tsx | drag-to-reorder homepage sections + visibility toggles |
| `pages/AssetsPage.tsx` | 02 assets/page.tsx | asset library (drop / paste / pick) — reads/writes plugin's `lib/media.ts` |
| `pages/PopupsPage.tsx` | 02 popup/page.tsx | discount popup editor (trigger conditions + copy + targeting rules) |
| `pages/ThemesPage.tsx` | 02 themes/page.tsx | theme catalogue + create/edit/delete + setAsDefault |

---

## Round-3 TODO (deferred from Round 2)

The Round-2 prompt asked for these but their dependency surface or
file size exceeded one loop's budget; faithful ports remain.

| File | 02 source | Lines | Blocker |
|---|---|---|---|
| `pages/PageDetailPage.tsx` | 02/src/app/admin/pages/[id]/page.tsx | 269 | Depends on 02's `customPages.ts` (a localStorage block system distinct from EditorPage). Lifting requires the whole customPages backend — separate parallel content system. Decision needed: keep both systems (faithful) vs. unify on EditorPage (cleaner). |
| `pages/CustomisePage.tsx` | 02/src/app/admin/customise/page.tsx | 898 | Deps on `adminConfig`, `sidebarLayout`, `loginCustomisation` libs — none lifted yet. |
| `pages/ThemeDetailPage.tsx` | 02/src/app/admin/theme/page.tsx | 1063 | Largest of the deferred admin pages; fully self-contained but big. |
| `pages/SitesPage.tsx` | 02/src/app/admin/sites/page.tsx | 3264 | The largest admin page in 02. Sub-routes `sites/[siteId]/editor` + `sites/[siteId]/pages`. Likely best to lift over multiple Round-3 sub-loops. |
| `pages/PagesPage.tsx` | 02/src/app/admin/pages/page.tsx | 78 | Round-1 stub kept; will be re-pointed at EditorPage list (not customPages) once the spec is clarified. |

Server-side endpoints that exist as Round-2 client lifts but need
real server implementations:

- `/api/portal/website-editor/split-tests/*` — list/create/patch/delete groups + exposure/conversion beacons + results
- `/api/portal/website-editor/funnels/*` — funnel CRUD + stats endpoints
- `/api/portal/website-editor/promote/[siteId]` — currently a Round-1
  stub; needs a real GitHub-app-token resolver + PR-open flow

Ecommerce client-component surface (T2):

- `useCart()`, `ProductVariantPicker`, plus the `Product` /
  `ResolvedVariant` types — currently stubbed in
  `components/ecommerceBridge.tsx`. Once T2 ships
  `@aqua/plugin-ecommerce/components`, swap the imports here (single
  file) without touching the block components.

---

## Smoke test

`src/__smoke__/blocks.test.ts` — 31 assertions covering:

- BLOCK_REGISTRY has 58 entries
- BLOCK_DESCRIPTORS matches BLOCK_REGISTRY size
- Every block component is callable (`typeof def.Component === "function"`)
- 6 starter trees indexed, all load
- `applyStarterVariant` integration: ok, returns pageId, returns
  siteId, echoes variantId, second-variant works, role/variant
  mismatch returns `{ok:false}`, unknown variantId returns
  `{ok:false}`

Run with `npm test` from the plugin directory. **31/31 pass** as of
Round-2 close.

---

## Cross-team handoffs

- **T1 (foundation)**: nothing new for Round 2. Round-3 work is on
  T1 only when it ships the styled `Toaster` / `ConfirmHost` /
  `PromptHost` admin chrome (the plugin's shims will be swapped
  one-file at that point).
- **T2 (ecommerce)**: client-component surface for the commerce
  blocks (`useCart`, `ProductVariantPicker`, types). Tracked in
  `04-plugin-ecommerce.md` Round-2 TODO.
- **T2 (fulfillment)**: `PortalVariantPort.role` swap from `Role` →
  `PortalRole` per Round-1 commander REPLY (still pending T2 commit
  as of Round-2 close).

---

## Round 10 — deep-link contract + page picker (incremental)

T1's agency shell ships an "Edit website" CTA on each per-client tile.
This round (post-R9, post-Lift Inventory) wires the contract end-to-end
so the editor opens at the right context — right client, right portal
variant, right starting page — and adds a minimal page-picker toolbar
so the editor feels like a website manager, not just a single-page
editor.

### Goal A — Deep-link contract

URL surface (T1's CTA target):
`/portal/clients/[clientId]/edit-website?page=<pageId>&variant=<variantKey>`

- `clientId` required (path).
- `page` optional → defaults to the home page (first `isHomepage:true`,
  else `slug==="/"`, else first in pageOrder; create one if none exist
  via "+ New page" toolbar action).
- `variant` optional → defaults to `"default"`. Pages without a
  `variantId` belong to the default variant.

New pure helpers in `lib/editorDeepLink.ts` (Node-testable, no React):
`parseEditorDeepLink` / `buildEditorDeepLink` / `pagesForVariant` /
`availableVariants` / `shouldShowVariantSwitcher` / `resolveStartPage`
/ `slugify` / `uniqueSlug`. EditorPage reads `useSearchParams()` on
mount, hydrates page+variant state, and pushes `router.replace(...)`
on every page/variant switch so the URL stays bookmarkable. The legacy
`/portal/admin/editor` mount still works — `pushDeepLink` no-ops when
the path doesn't match `/portal/clients/[clientId]/`.

### Goal B — Page picker toolbar

`components/editor/PagePickerToolbar.tsx` sits above the canvas. Custom
dropdown of every page in the current variant (title + slug +
relative-time updatedAt). Current selection highlighted. "+ New page"
inline at the dropdown's bottom — prompts for a title via
`window.prompt`, derives a unique slug via `slugify` + `uniqueSlug`
(walks `-2`, `-3`, … on collision), creates the page via
`createEditorPage`, switches + pushes deep link.

Switching pages calls `guardUnsaved()` first — if `unsaved > 0`, opens
the existing `confirm` dialog with "Discard & switch" before swapping.

### Goal C — Variant switcher (compact)

Right of the page picker. Renders only when `availableVariants(pages)`
is `length > 1` (most clients only have `"default"`, so it stays
hidden). Buttons for each variant; selecting one resets target to that
variant's home page + pushes the URL. Same unsaved-changes guard.

### Goal D — Smoke + this section

New smoke `src/__smoke__/deep-link.test.ts` — **26 cases** (≥ 6
required) across:
- `parseEditorDeepLink` 4 (empty / explicit / partial / record-shape)
- `buildEditorDeepLink` 5 (defaults / page-only / variant / drops
  default variant / clientId throws)
- `pagesForVariant` + `availableVariants` + `shouldShowVariantSwitcher`
  5 (filtered counts / variant list / hide-when-1 / show-when-many)
- `resolveStartPage` 5 (explicit hit / explicit miss / no-request /
  no-homepage-flag / empty)
- `slugify` + `uniqueSlug` 6 (lowercase / diacritics / empty fallback
  / unique root / -2 / -3)
- round-trip 1 (build → parse).

`package.json` test chain extended; total smoke now **118/118 pass**
(42 blocks + 25 cross-plugin + 25 save-target + 26 deep-link).

### Cross-team handoffs

- **T1**: deep-link target. The agency-shell "Edit website" CTA
  should call `buildEditorDeepLink({ clientId, pageId, variant })` from
  this plugin (re-exported via `@aqua/plugin-website-editor/server` if
  needed). T1 should NOT hand-roll the URL.
- **T1**: when foundation owns route mounts, ensure the
  `/portal/clients/[clientId]/edit-website` route mounts EditorPage
  (currently mounted at `/portal/admin/editor` via the plugin manifest;
  R10 made the editor itself URL-aware so either mount works).

### Deferred

- Server-side `pageOrder` ordering (currently uses array order from
  `listPages`).
- Per-client homepage creation when none exists (toolbar handles
  ad-hoc creation; auto-creating an empty `/` on first deep-link hit
  is R11 territory, since it needs `createEditorPage` + the client's
  brand-kit defaults).
- Confirm-dialog visual polish — `confirm()` shim still ultimately
  falls through to `window.confirm` until T1 ships the styled host.

## Round 002 — Notion-style blocks added

See chapter [`04-incubator-template.md`](04-incubator-template.md) for
the Aqua Incubator template work. Touches the R2 surface in three
ways: (a) extended `icon` block with image-mode props (`image` /
`offsetY` / `label`); back-compat with glyph mode. (b) extended
`card-grid` with Notion-card mode via `items: [{coverImg, icon, label,
href}]` alongside the existing `cards` shape. (c) two new block types
in the registry — `property-strip` (Notion-style key-value
disclosure) and `toggle` (`▸ Header` disclosure with nested children;
`isContainer: true`). BLOCK_REGISTRY 58→60; RENDERER_REGISTRATIONS
auto-derives via `NATIVE_RENDERERS` so cross-plugin renderer count
unchanged. Smoke `blocks.test.ts` 50→52 (assertions bumped 58→60).
