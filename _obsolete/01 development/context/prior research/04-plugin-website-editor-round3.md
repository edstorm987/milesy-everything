# Round-3 chapter — Website-editor plugin (T3)

Round 3 closes two outstanding gaps from Round 2: the two biggest
deferred admin pages (CustomisePage + ThemeDetailPage) and the
cross-team handoff that's been parked since T2 R2 — registering React
renderers for the block ids declared by other plugins (ecommerce,
memberships).

Outcome:

- `pages/CustomisePage.tsx` — 898-line faithful port from
  `02/admin/customise/page.tsx`. Branding / Sidebar / Custom-tabs /
  Login / Export tabs.
- `RENDERER_REGISTRATIONS` cross-plugin renderer map exported from
  `components/blockRegistry.ts`. 58 native + 8 ecommerce + 3
  memberships + 3 affiliates renderers wired.
- `pages/ThemeDetailPage.tsx` — clean rewrite against the plugin's
  per-site `lib/theme.ts` contract (the architectural fit is wrong
  for a 1:1 port from 02's localStorage singleton).
- `pages/PagesPage.tsx` — re-pointed at the EditorPage list via
  `lib/editorPages.ts`.

tsc clean. Smoke 37/37 (was 31, +6 cross-plugin renderer tests).

---

## Goal A — CustomisePage

`pages/CustomisePage.tsx` is a faithful 898-line port of
`02/src/app/admin/customise/page.tsx` with five tabs:

| Tab | Source | Contents |
|---|---|---|
| Branding | 02 lines 143–225 | Panel name, short name, logo URL, accent colour, sidebar bg/text, panel bg/text, custom CSS, GitHub repo URL, reset-to-default action |
| Sidebar | 02 lines 227–233 + the SidebarEditor function (~310 LOC) | Up-to-5-deep panel + folder + link CRUD with drag-to-reorder. Panels and folders can hold further folders, capped at `MAX_SIDEBAR_DEPTH = 5`. |
| Custom tabs | 02 lines 236–283 | iframe-embedded sidebar tabs — admin pastes a URL, picks an icon + group, the foundation can render it as a sidebar item. |
| Login | 02 lines 284–380 | Public-login customisation: layout / hero image / headlines / CTA labels / toggles (Google / signup / forgot-password / social proof) / footer links / colours / custom CSS. |
| Export | 02 lines 381–420 | Export-code endpoint placeholder + GitHub repo link reading from Branding tab's repo URL. |

### New plugin libs (Goal A)

| File | Source | Purpose |
|---|---|---|
| `lib/customise.ts` | 02/src/lib/admin/adminConfig.ts | AdminBranding + CustomTab + AdminMode CRUD. Drops 02's cross-org brand-plugin resolver (org-scoped branding is foundation territory). localStorage-cached, change-event broadcast. |
| `lib/sidebarLayout.ts` | 02/src/lib/admin/sidebarLayout.ts | 5-deep panel/folder/link tree with `Resource` opened to plain string (foundation owns permissions). DEFAULT_LAYOUT seeds Store / Website / Users / Settings panels. |
| `lib/loginCustomisation.ts` | 02/src/lib/admin/loginCustomisation.ts | Upgraded from R1 stub. Full `LoginCustomisation` shape (24 fields including layout / hero / headlines / CTAs / toggles / footer / colours / customCSS). |

### Q-ASSUMED — server-side persistence

T1's TenantPort doesn't yet expose a brand-kit getter/setter or a
`PATCH /api/portal/website-editor/customise` route. Round-3 keeps
customise state in localStorage (matches 02 1:1) — when T1 ships the
route, swap the localStorage reads/writes in `lib/customise.ts` for a
fetch call. Single-file change; callers don't notice. Logged in T3
outbox at `[2026-05-04T23:36:00Z] Q-ASSUMED`.

### Authority boundary preserved

The Sidebar tab edits the **plugin's** localStorage view of the
sidebar layout. The foundation's chrome reads its own data; nothing in
this round changes the actual server-rendered sidebar. When T1 ships a
TenantPort sidebar getter, the plugin can write through to it via a
new lib and the chrome will pick up the operator's customised layout.

---

## Goal B — RENDERER_REGISTRATIONS (cross-plugin renderer map)

The architecture decision in T2 R2 (ecommerce plugin) was: ecommerce
declares block ids in its manifest's `storefront.blocks` but delegates
rendering to T3 (this plugin). Same pattern in T2 R4 (memberships).

Round 3 formalises this with three additions to
`src/components/blockRegistry.ts`:

### 1. `RENDERER_REGISTRATIONS: Record<string, BlockComponentType>`

Single source of truth keyed by block id, exported from the registry.
Seeded with:

- **58 native renderers** — derived from BLOCK_REGISTRY entries
  (`Object.fromEntries(... [type, def.Component])`)
- **8 ecommerce renderers** — `product-card`, `product-grid`,
  `cart-summary`, `checkout-summary`, `payment-button`,
  `order-success`, `variant-picker`, `product-search` (all already
  lifted in R2 Phase A as components; R3 adds them to the cross-plugin
  map under their block-ids)
- **3 memberships renderers** — `membership-paywall`,
  `membership-signup`, `membership-tier-grid` (NEW in R3, since T2 R4
  shipped during this round). Stubs that fetch from
  `/api/portal/memberships/*` with editor-mode placeholders.
- **3 affiliates renderers** — `affiliate-signup`,
  `affiliate-payout-meter`, `affiliate-leaderboard` (NEW in R3, since
  T2 R5 shipped during this round). Stubs that POST to
  `/api/portal/affiliates/me/enroll` and fetch from
  `/api/portal/affiliates/me` + `/api/portal/affiliates/leaderboard`
  with editor-mode placeholders.

### 2. `getBlockRenderer(type: string): BlockComponentType | undefined`

Plain lookup helper. Used by `BlockRenderer.tsx` to resolve the
component for a given block id — consults `RENDERER_REGISTRATIONS`
first, falls back to `BLOCK_REGISTRY[type].Component` for the native
58 (which are also in RENDERER_REGISTRATIONS, but the fallback path
keeps the editor-only metadata surface usable when external block ids
need to render in editor mode).

### 3. `registerExternalBlockRenderers(plugins: PluginWithBlocks[])`

Validation helper. Foundation can call this once at boot to walk every
installed plugin's `storefront.blocks` and assert each contributed id
has a renderer registered above. Logs a clear console warning for any
missing one and returns the missing-ids array (useful for
boot-time health checks and integration tests). Idempotent.

```ts
import { registerExternalBlockRenderers } from "@aqua/plugin-website-editor/components";

const missing = registerExternalBlockRenderers(installedPlugins);
if (missing.length > 0) {
  console.warn(`[boot] ${missing.length} block ids have no renderer:`, missing);
}
```

### Adding a new external block renderer

When a new plugin (e.g. blog, reviews, forum) ships block ids:

1. Lift the React component into
   `src/components/blocks/<NewBlock>.tsx`.
2. Import it at the top of `blockRegistry.ts`.
3. Add `"<block-id>": <NewBlock>` to the `RENDERER_REGISTRATIONS`
   literal.
4. Done — no other wiring needed. The contract is one map entry per
   block id.

### BlockRenderer change

The lookup in `BlockRenderer.tsx` now reads:

```ts
const externalRenderer = getBlockRenderer(block.type);
const def = getBlockDefinition(block.type);
const Component = externalRenderer ?? def?.Component;
```

Missing-renderer fallback unchanged: visible warning in editor mode,
silent fragment on live.

### New smoke assertions

`src/__smoke__/blocks.test.ts` adds 6 cross-plugin tests:

- `RENDERER_REGISTRATIONS covers all 58 native blocks`
- `getBlockRenderer("membership-paywall")` returns a function
- Same for `membership-signup` and `membership-tier-grid`
- `registerExternalBlockRenderers reports missing renderers` — feeds
  a synthetic plugin with `missing-block-xyz`, expects it surfaces
- `all 8 ecommerce block ids are registered` — feeds the real
  ecommerce manifest's contributed ids, expects empty missing-list

Total smoke: **37/37 pass**.

---

## Goal C — ThemeDetailPage + PagesPage

### ThemeDetailPage (clean rewrite, not lift)

02's `theme/page.tsx` (1063 lines) is built around a localStorage
singleton ThemeConfig with nested colors / typography / effects /
components sections, deep-merge defaults, and draft / publish flow.
The plugin's theme model is fundamentally different:

- **02**: one global theme, localStorage-backed, deep-nested
- **plugin**: many per-site `ThemeRecord`s, server-persisted via
  `/api/portal/website-editor/themes`, flat `ThemeTokens` shape

A 1:1 port would either (a) duplicate the localStorage singleton in
the plugin and disconnect from per-site themes, or (b) wedge 02's UI
onto the wrong data shape and need extensive rewiring.

The prompt explicitly says "Wires through your existing
`lib/theme.ts`", so Round 3 ships a clean rewrite that matches the
plugin's architecture:

- Loads ThemeRecord via `loadThemes(siteId, true) → list` then picks
  by `?themeId=...` search param
- Token editor for the 13 flat fields:
  - **Palette** (7): primary, surface, surfaceAlt, ink, inkSoft,
    border, shadow
  - **Typography** (3): fontHeading, fontBody, fontMono
  - **Sizing** (2): radius, spacingUnit
  - **Custom CSS** (1): customCss escape hatch
- Live preview pane (sticky on lg+ viewports) with sample heading +
  body + button + card + divider + mono code, all driven by inline
  styles from current tokens
- Actions: Save changes (disabled when not dirty), Set as default
  (when not already), Duplicate (prompts for a name, calls
  `createTheme` with current tokens), Delete (refuses default theme,
  confirms danger)
- Color inputs gracefully fall back when the user enters non-hex
  values (rgba, named colours) — the native `<input type="color">`
  only handles 6-digit hex, so `normaliseHex` synthesises a reasonable
  swatch and the freeform text input always shows the actual value

### Round-4 follow-up

02's deeper `ThemeConfig` exposes per-component overrides (button
radius, card border, focus ring colour, container max-width, etc.).
The plugin's flat ThemeTokens doesn't model these. When the plugin
needs them, extend both this page's `<TokenGrid>` and the storefront
CSS-variable injector together.

### PagesPage — re-pointed at EditorPage list

02's `admin/pages/page.tsx` lists `customPages.ts` rows (a separate
localStorage block system). The plugin's content unit is `EditorPage`,
so PagesPage now consumes `lib/editorPages.ts`:

- `listPages(siteId, true)` → renders rows
- Click a row → opens `../editor?page={id}`
- Inline actions: Publish (when draft), Open in editor, Delete (with
  confirm)
- "+ New page" prompts for a title, creates with auto-slug, pushes
  the operator straight into the editor
- Re-renders on `onPagesChange(sid)` events

CustomPages-style separate content surface (the localStorage block
system 02 uses for `/p/<slug>` pages) is deferred to R4 — it's a
distinct content system that probably becomes its own page-builder
plugin rather than living inside the website-editor.

---

## R4 follow-ups

| Item | Why deferred |
|---|---|
| `pages/PageDetailPage.tsx` | Depends on 02's `customPages.ts` localStorage block system, which is a separate content type from `EditorPage`. Probably becomes its own page-builder plugin in R4. |
| `pages/SitesPage.tsx` | 3,264 lines in 02 — too large for one round. R4 candidate, likely split across multiple sub-loops. Sub-routes `sites/[siteId]/editor` + `sites/[siteId]/pages` need lifting too. |
| Server-side persistence for `lib/customise.ts` | Currently localStorage-only (matches 02). Swap when T1 ships a TenantPort brand-kit getter/setter and a PATCH route. |
| Server-side persistence for `lib/loginCustomisation.ts` | Same as above; per-tenant API. |
| `customPages.ts` backend | Lift the localStorage block system from 02 if and only if a use case for the parallel `/p/<slug>` content surface materialises. Likely best as a separate plugin. |
| Membership block fetch contract | The 3 membership stubs fetch from `/api/portal/memberships/plans` and `/me/subscribe`. T2 R4 ships the server side; if/when those endpoints change shape, the renderers swap-and-go. |

## Cross-team handoffs

- **T1 (foundation)**: optional — call
  `registerExternalBlockRenderers(installedPlugins)` once at boot for
  a health check (logs warnings for unrendered cross-plugin block ids
  in dev). Optional because the BlockRenderer's per-render fallback
  already surfaces unknown block types in editor mode.
- **T2 (ecommerce)**: nothing new. The 8 block ids are now formally
  registered in `RENDERER_REGISTRATIONS`.
- **T2 (memberships)**: nothing new. The 3 block ids are pre-registered
  with stub fetching renderers; refine when the membership server-
  side endpoints firm up.
- **T1 (foundation, R4)**: ship a TenantPort brand-kit getter/setter
  + a `PATCH /api/portal/website-editor/customise` route to persist
  CustomisePage state per-tenant. When ready, swap the localStorage
  ops in `lib/customise.ts` (single-file change).
