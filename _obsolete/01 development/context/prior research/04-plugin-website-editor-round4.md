# Round-4 chapter — Website-editor plugin (T3)

Round 4 closes the last two big admin lifts deferred from R2/R3:
SitesPage (3,264 lines — the biggest single admin page in the editor)
and PageDetailPage + the underlying customPages backend (a separate
localStorage block system distinct from EditorPage). After R4 the
website-editor plugin's admin surface is parity-with-02.

Outcome:

- `pages/SitesPage.tsx` — 3,264-line faithful port. List + per-site
  settings (domains/branding/UX toggles/custom head/body/sitenav
  JSON-LD) + theme picker + portal-variant overrides + embed + GitHub
  repo → all wired through new + extended plugin libs.
- `lib/customPages.ts` — faithful port of 02's localStorage block
  system (9 typed block kinds + CustomPage CRUD + onCustomPagesChange).
- `pages/PageDetailPage.tsx` — faithful port of 02's per-page editor
  consuming the customPages backend. RichEditor stub.

tsc clean. Smoke 40/40 pass (unchanged — Goals B/C touch admin pages
that aren't part of the smoke surface; Goal A's per-site sites store
is separate from BLOCK_REGISTRY/RENDERER_REGISTRATIONS).

---

## Goal A — SitesPage

`pages/SitesPage.tsx` is a faithful 3,264-line port of
`02/src/app/admin/sites/page.tsx`. Sections covered:

| Section | What |
|---|---|
| Site list | Cards per site with create/duplicate/delete/set-primary, draft↔live status flag, active-site highlight |
| Per-site settings | Name, slug, tagline, description, logo URL, favicon URL, social handles (instagram/twitter/tiktok), `enabledProductRanges` filter |
| Domain manager | `domains[]` CRUD + `primaryDomain` selector. Each domain entry shows attached/pending/verified status (mocked via `lib/domains.ts`). |
| Theme picker | Per-site `themeVariantId` chosen from `lib/themeVariants.ts` — Default / Light / Dark / Sand / Midnight catalogue + custom variants |
| UX toggles (X-1) | `smoothScroll`, `customCursor` (default/dot/ring/blur), `cursorColor` |
| Custom head/body (P-3) | Free-form HTML injected into `<head>` and at the end of `<body>` — used for GA / Meta Pixel / Hotjar / custom CSS without touching the codebase |
| SEO sitelinks (SEO-A2) | `siteNavigationJsonLd` blob, hand-editable + auto-seeded from visual-editor pages elsewhere |
| GitHub repo URL | Read from portal settings (`lib/portalSettings.ts`) |
| Embed config | When this site is the iframe target, embed-specific options (preview base URL, iframe sandbox flags) |

### New plugin libs (Goal A)

| File | Source / origin | Purpose |
|---|---|---|
| `lib/sitesAdmin.ts` | 02/src/lib/admin/sites.ts | Faithful port. Synchronous, localStorage-backed, full CRUD + domain helpers + active-site cursor + per-org listing. **Sits alongside** `lib/sites.ts` (the API-backed cache used by canvas + properties panel) — they manage the same conceptual store but via different transports until foundation server-side wiring lands. |
| `lib/portalSettings.ts` | 02/src/lib/admin/portalSettings.ts | Cloud-architected: tries `/api/portal/website-editor/settings`; falls back to defaults when the route is missing. github + database + deployment sections. |
| `lib/themeVariants.ts` | 02/src/lib/admin/themeVariants.ts (re-shaped) | Catalogue + per-site default cursor. 5 built-in variants (Default/Light/Dark/Sand/Midnight); custom-variant CRUD (R5+ when full editor lands). Round-1 light/dark/system selector preserved as `ThemeAppearance`. |
| `lib/portalEditMode.ts` | 02/src/lib/portalEditMode.ts | `buildEditorUrl(host, path)` collapses to plugin-namespaced `../editor` route in R4. `isExcludedPath`, `isEditModeFlagged`, `setEditMode`, `onEditModeChange`. |
| `lib/domains.ts` | new (R4 stub) | `attachDomain` / `detachDomain` / `getDomainStatus` / `verifyDomain` / `listAttachedDomains`. Q-ASSUMED until T1 wires `/api/portal/website-editor/domains/*` proxy to Vercel — falls back to localStorage with optimistic-success. |

### Q-ASSUMED — server-side persistence

T1's foundation hasn't yet exposed:

- A `TenantPort` sites store (the plugin's admin sites + the
  authoritative server-rendered sites are still two stores).
- A Vercel domain proxy (`/api/portal/website-editor/domains/*`).
- A portal-settings endpoint (`/api/portal/website-editor/settings`).

R4 keeps SitesPage fully interactive against localStorage while
flagging each as a Round-5 follow-up. Each lib is structured for a
single-file swap when the foundation route lands — callers don't
change.

### Activity logger pluggability

02's `sites.ts` calls `logActivity` directly into the foundation
activity log. The plugin lift doesn't have direct access to the
foundation's activity logger; `lib/sitesAdmin.ts` exposes
`setActivityLogger(fn)` so the foundation (or the editor admin shell)
can register a logger and have all sites mutations routed through it.
Default is a no-op.

### Type-fix patches

The lifted SitesPage referenced fields the plugin libs didn't ship in
R3:

- `portalSettings.github.pat` — added to the GitHub section
- `portalSettings.deployment.previewBaseUrl` — added to the deployment
  section
- `prompt({ multiline: true })` — `multiline` flag added to
  `lib/prompt.ts` PromptOpts; native fallback ignores it, styled hosts
  can switch to a textarea
- `Site` re-export from `lib/sitesAdmin.ts` so 02-style callers
  (`import type { Site } from "../lib/sitesAdmin"`) compile

---

## Goal B — customPages backend

`lib/customPages.ts` is a faithful port of
`02/src/lib/admin/customPages.ts`. **Distinct from EditorPage**:
EditorPage manages site-level pages with versioning + publish flow +
portal variants (R1/R2 server runtime); customPages is a simpler
"ad-hoc page" system — each page is a sequence of typed blocks
rendered at `/p/[slug]`.

### Block kinds (9)

`hero`, `richText`, `image`, `gallery`, `quote`, `embed`, `divider`,
`cta`, `html`. Each carries an `id` for stable re-ordering; the
discriminated union covers their type-specific fields (`hero` →
title/eyebrow/intro/image; `cta` → headline/buttonLabel/buttonHref;
`gallery` → images[] with src+alt; etc.).

### Public API

| Function | Notes |
|---|---|
| `listCustomPages` / `loadCustomPages` | Sorted by updatedAt desc |
| `getCustomPage(id)`, `getCustomPageBySlug(slug)` | Lookup |
| `createCustomPage(title?)` | Seeds with a single hero block |
| `saveCustomPage(page)` | Whole-record save |
| `updateCustomPage(id, patch)` | Partial; auto-uniquifies slug |
| `deleteCustomPage(id)` | |
| `duplicateCustomPage(id)` | New ids + "(copy)" suffix |
| `addCustomBlock(pageId, type)` | Per-kind defaults |
| `updateCustomBlock(pageId, blockId, patch)` | |
| `deleteCustomBlock(pageId, blockId)` | |
| `moveCustomBlock(pageId, blockId, dir)` | dir: -1 \| 1 |
| `publishCustomPage(id)` / `unpublishCustomPage(id)` | |
| `toggleCustomPageHidden(id)` | |
| `getPublishedCustomPage(slug)` | Returns page only when published + not hidden |
| `onCustomPagesChange(handler)` | localStorage + event listener |

### Round-1 compat shims preserved

The R1 stub at this path exposed `CustomPageType` /
`CUSTOM_PAGE_TYPES` / `getCustomPageType(id)` / `isCustomPage(page)`.
All four are kept so older imports compile. They aren't called by the
new admin pages but Round-2 helper modules might still touch them.

### R5 follow-up — server-side persistence

localStorage matches 02's behaviour 1:1; foundation server-side
persistence (per `t/{agencyId}/{clientId}/custom-pages` namespace)
lands in R5 once T1 ships the route. The lib is structured for a
single-file swap.

---

## Goal C — PageDetailPage

`pages/PageDetailPage.tsx` is a faithful port of
`02/src/app/admin/pages/[id]/page.tsx`. Wires through `lib/customPages.ts`.

### What it edits

- **Page-level**: title, slug (auto-uniquified), `showInNav` toggle +
  `navLabel` override, status (publish/unpublish), hidden flag,
  duplicate, delete
- **Blocks**: per-kind editors for the 9 customPages block types
  (hero/richText/image/gallery/quote/embed/cta/divider/html). Each
  block card has up/down/delete controls + the appropriate field
  inputs (text/textarea/url) for that kind
- **SEO**: title, description, OG image, canonical, robots, JSON-LD
- **Footer actions**: Preview (opens `/p/{slug}` in new tab), Publish/
  Unpublish toggle, Delete (with confirm)

### `useParams()` / `useSearchParams()` compatibility

The 02 page lived at `/admin/pages/[id]` — `useParams().id`. The
plugin renders at `/portal/clients/[clientId]/pages/[pageId]` — but
the foundation routes plugin admin pages through a generic resolver,
so we accept either `params.id` OR a `?pageId=...` search param. The
`getCustomPage(id)` lookup handles both transparently.

### RichEditor stub

`components/RichEditor.tsx` is a textarea fallback. 02 ships a
contentEditable WYSIWYG; the plugin doesn't have one yet (it's
foundation chrome territory or a separate text-editing plugin). The
shim accepts the same `{ value, onChange, placeholder, minHeight }`
props so callers don't need to change when the real editor lands.

---

## R5 follow-ups

| Item | Why deferred |
|---|---|
| Server-side persistence for `lib/customPages.ts` | R4 keeps localStorage; foundation route + storage namespace pending. |
| Server-side persistence for `lib/sitesAdmin.ts` | Same — TenantPort sites store pending. |
| Vercel domain proxy | `lib/domains.ts` is a stub; real Vercel API integration via foundation proxy. |
| Portal-settings persistence | `lib/portalSettings.ts` falls back to in-memory defaults until the route lands. |
| RichEditor real implementation | When T1 (or a new text-editing plugin) ships a contentEditable host. |
| customise persistence (R3 carry-over) | `lib/customise.ts` + `lib/loginCustomisation.ts` still localStorage. |
| Activity logger wire-up | `setActivityLogger` exists; foundation registration site TBD. |

## Cross-team handoffs

- **T1 (foundation, R5)**: ship a TenantPort sites store + a
  `/api/portal/website-editor/sites` route with the same surface as
  02's REST API. When ready, swap the localStorage ops in
  `lib/sitesAdmin.ts` for fetch calls (single-file change).
- **T1 (foundation, R5)**: ship `/api/portal/website-editor/domains/*`
  proxying Vercel domain attach/detach/verify. Update `lib/domains.ts`
  to call it.
- **T1 (foundation, R5)**: ship `/api/portal/website-editor/settings`
  for the GitHub + database + deployment portal-settings sections.
  Update `lib/portalSettings.ts` to parse real responses.
- **T1 / future text plugin (R5+)**: ship a real RichEditor host;
  swap `components/RichEditor.tsx`.

## Smoke + tsc

- `npx tsc --noEmit` — clean throughout (zero errors after the lift).
- `npm test` — 40/40 pass (unchanged from R3; R4 admin pages aren't
  part of the smoke surface).
