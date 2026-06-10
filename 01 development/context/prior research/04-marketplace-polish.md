# 04 — Marketplace + template gallery polish (T3 R016)

T3 Round 016. Polish R006 portal-template marketplace: category
families, fuzzy search, install-count tracking, featured row,
auto-generated thumbnails reusing R014's OG-card endpoint, sort
selector.

## 1. Category families

NEW `TemplateCategory` union: `Incubator | Brand | Storefront |
Member-area | Affiliate | Misc`. Tags are still per-template fine-
grained labels; categories are the gallery's top-level filter
chips. NEW `categoryForTags(tags[])` derives category from the
existing tag set:

- `"Aqua Incubator"` → `Incubator`
- `"Brand Pack"` → `Brand`
- `"Storefront"` → `Storefront`
- `"Service Portal"` → `Member-area`
- `"Affiliate Site"` → `Affiliate`
- otherwise → `Misc`

When a template carries multiple matching tags, the priority order
above wins (Aqua Incubator > Brand > Storefront > …).

Every `TemplateEntry` now carries `category: TemplateCategory` —
both builtin and operator-saved templates. `listSavedTemplates`
runs the same `categoryForTags` over the operator's tag list so
saved templates land in the right category automatically.

## 2. Install-count tracking

NEW per-agency sidecar `_install-counts` map keyed by templateId.
`bumpInstallCount(storage, agencyId, templateId)` increments by 1;
`listInstallCounts(storage, agencyId)` returns the full map.
`listAllTemplates` merges counts onto every entry's `installCount`
field so the gallery can render and sort by usage in one read.

NEW endpoint `POST /templates/install-tick?id=…` exposes the bump
to the operator UI. Hosts call this whenever they
`applyStarterVariant` (or directly when an operator picks a
template via the gallery's "Use this template" CTA).

## 3. Featured row

NEW per-agency `_featured` ordered list (max 8 ids) of hand-picked
templates the gallery surfaces above the main grid.
`listFeaturedIds(storage, agencyId)` returns the list;
`setFeaturedIds(storage, agencyId, ids)` persists with dedup +
trim + 8-id cap.

Endpoints:

- `GET /templates/featured` → `{ featured: string[] }`.
- `POST /templates/featured` body `{ ids: string[] }` → cleaned
  list. Missing ids → 400.

## 4. Search + sort

NEW `filterTemplates(templates, filter)` pure utility:

```ts
interface TemplateFilter {
  query?: string;            // case-insensitive substring on label + description + tags
  category?: TemplateCategory;
  tag?: string;
  sort?: "newest" | "most-installed";
}
```

The `GET /templates` endpoint now reads `?q=`, `?category=`,
`?tag=`, `?sort=` query params and runs them through
`filterTemplates`. Response shape extended to include the
`categories: TEMPLATE_CATEGORIES` array so the gallery doesn't
need to hardcode the chip list.

## 5. Auto-generated thumbnails

`TemplateGallery.tsx` now defaults to a generated thumbnail via
the OG-card endpoint (R014) when `coverUrl` is not set:

```ts
function autoThumbUrl(t, brandColor = "#0ea5e9") {
  if (t.coverUrl) return t.coverUrl;
  return `/api/portal/website-editor/og?title=<label>&color=<brandColor>`;
}
```

Operators get a per-template branded preview tile for free; manual
covers still win. `brandColor` flows through a new `brandColor`
prop on the gallery so the host page can pass the per-tenant
primary colour.

## 6. Gallery UI

`TemplateGallery.tsx` extended:

- Search bar (existing) + sort `<select>` (Newest / Most-installed,
  R016) on the search row.
- NEW Category chip row below search (`All` + 6 categories, emerald
  active).
- Existing tag chip row moved below categories with cyan active.
- NEW Featured strip at top of the grid (only renders when no
  query/category/tag filter is active and >0 featured): up to 4
  hand-picked templates rendered in a 2-col grid with amber
  highlight.
- Cards now use `autoThumbUrl` — every card shows a real
  thumbnail, no more text-only fallback tiles.
- Cards display `installCount` (`↳ N× used`) when ≥ 1.

`listSavedTemplates` now skips sidecar records (`_install-counts`,
`_featured`) so the gallery's saved feed stays clean.

## 7. Smoke

NEW `__smoke__/r016-marketplace-polish.test.ts` 34/34 pass:

- `TEMPLATE_CATEGORIES` has 6 families.
- `categoryForTags` maps every family + priority tie-break +
  fall-through to Misc.
- `listAllTemplates` carries category + installCount on every
  entry.
- `filterTemplates` honours category / tag / query / sort.
- Install-count round-trip + listAll merge + most-installed sort.
- Featured round-trip with dedup + trim + 8-id cap.
- `listSavedTemplates` skips sidecar records.
- HTTP shape: `GET /templates?category=…` filters; response
  includes `categories[]`; `?q=` works; `POST /templates/install-
  tick` 200 + 400 missing id; `GET /templates/featured` 200 empty;
  `POST /templates/featured` 200 + 400 missing ids.

R006's existing 25/25 marketplace smoke still passes (no
regression). package.json test chain extended. website-editor
tsc-clean.

## 8. Files

- `plugins/website-editor/src/server/templateMarketplace.ts` patch
  (category type + categoryForTags + install counts + featured +
  filterTemplates + sidecar skip).
- `plugins/website-editor/src/api/handlers/templates.ts` patch
  (extended GET filters + install-tick + featured GET/POST).
- `plugins/website-editor/src/api/routes.ts` patch (3 new routes).
- `plugins/website-editor/src/components/editor/TemplateGallery.tsx`
  patch (category row + sort selector + featured strip + auto
  thumbnails + install count surface + brandColor prop).
- `plugins/website-editor/src/__smoke__/r016-marketplace-polish.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 9. Q-ASSUMED / deviations

- "Live render against current brand-kit" preview drawer (Goal C)
  is intentionally not shipped this round — the existing right-
  side preview pane in `TemplateGallery` already shows the cover
  + description + tags + Use-this-template CTA, and a true live
  BlockTree render requires the storefront's `BlockRenderer`
  injected from the host page. The auto-thumbnail closes the
  visual gap; full live preview lands when the host page wires
  `window.__aquaRenderBlocks` (same pattern as
  `BlogPostBlock` from R008).
- Featured list is operator-edited via the API endpoint today;
  a visual editor (drag-to-reorder + checkbox to add) is R+1.
- Fuzzy match is a substring search across label + description +
  tags. True fuzzy (Levenshtein / fuse.js-style) wasn't worth
  the dependency for the small expected template count
  (~20-100 per agency).
- `categoryForTags` priority: Aqua Incubator wins over Brand. If
  a template ever wants both surfaces, an explicit `category`
  field on `PageTemplate` is R+1.
- `applyStarterVariant` doesn't auto-call `bumpInstallCount` —
  the host page POSTs `/templates/install-tick` after a successful
  apply. Keeps the install-count semantics about *operator
  intent* not *system-internal seeding*.

## 10. R+1 candidates

- Live preview drawer with the host's BlockRenderer (host injects
  `window.__aquaRenderBlocks`).
- Visual featured-list editor (drag-to-reorder + checkbox-to-add).
- Real screenshot capture for cover URLs (canvas → image upload,
  mirrors saved-template R+1 from R006 #6).
- Per-phase featured packs (Epic Intro / Diagnostics / Brand /
  Traffic / Mastery) — single `featured` list grows into a
  `featuredByPhase: Record<phase, string[]>` shape.
- Hot-swap `applyStarterVariant` → auto-bump install count (or
  surface as an opt-in event in the foundation activity feed).
