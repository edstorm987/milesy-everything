# 04 — Portal template marketplace (R006)

T3 Round 006. Wires R002's Aqua Incubator template + R004's brand-
page presets into a single editor-side gallery. Operators pick from
builtin starters + per-agency operator-saved templates when creating
a new page or site, and can capture any current page back into the
agency's library via "Save as template".

## 1. Server registry

`@aqua/plugin-website-editor/src/server/templateMarketplace.ts`:

- `listBuiltinTemplates()` — surfaces every entry of `PAGE_TEMPLATES`
  (generic + Aqua Incubator + brand-page presets + login starters)
  plus the `brand-page-pack` composite as a single gallery card.
  Each entry carries inferred tags ("Login" / "Aqua Incubator" /
  "Brand Pack" / "Composite" / "Affiliate Site" / "Service Portal" /
  "Storefront" / "Generic page" / "Marketing"); the inference covers
  every existing id with at least one tag, so the gallery's filter
  chips stay in sync as `PAGE_TEMPLATES` grows.
- `listSavedTemplates(storage, agencyId)` — operator-saved per-agency
  templates stored under
  `t/<agencyId>/_agency/website-editor/templates/<id>`. Sorted by
  `savedAt` descending so newest appears first.
- `listAllTemplates(storage, agencyId)` — saved + builtin merged
  (saved first).
- `saveTemplate(storage, agencyId, input)` — creates a record with id
  `saved-<slug>-<base36-ts>`; defaults description to empty,
  defaults tag to `["Operator template"]` when none provided.
- `deleteSavedTemplate(storage, agencyId, id)` — removes the record;
  returns `true` on hit, `false` on miss.

Cross-agency isolation falls out of the per-agency storage prefix —
`ag_other` never sees `ag_smoke`'s saves.

## 2. API endpoints

`src/api/handlers/templates.ts` mounts at:

- `GET /api/portal/website-editor/templates` → `{ ok, templates }`
  (full feed: saved + builtin).
- `POST /api/portal/website-editor/templates` body
  `{ label, description?, tags?, coverUrl?, blocks }` → `{ ok,
  template }` 201; missing `label` or `blocks` → 400.
- `DELETE /api/portal/website-editor/templates?id=…` → `{ ok, id }`;
  unknown id → 404; missing id → 400.

Tenancy comes from `ctx.agencyId` (handlers fail 400 without it).

## 3. Editor UI

`src/components/editor/TemplateGallery.tsx` — modal opened by the
editor's "+ New page" / "+ New site" CTA (host page wires
`onPick(id, kind)` to its existing applyStarterVariant flow):

- Search input + tag filter chips (auto-derived from the feed's
  union of tags so adding new builtins surfaces new chips for
  free).
- 3-column card grid; each card carries a cover (image if set,
  label-fallback strip otherwise), label, description, up to three
  tag pills, and a "Saved" badge for operator templates.
- Right-side preview pane updates on hover/click — bigger cover,
  full description, all tags, "Saved by … · YYYY-MM-DD" line for
  saved templates, and a "Use this template" CTA that calls
  `onPick(id, kind)`.

`src/components/editor/SaveAsTemplateButton.tsx` — captures the
current page's BlockTree (caller passes `getBlocks: () => Block[]`)
into the agency registry. Modal: label (required), description,
tags (comma-separated), cover URL. POSTs to `/templates`, surfaces
the saved id briefly on success, auto-closes after 1.2s. Both
components accept a `fetchImpl` override for tests.

Wiring into the host editor topbar/page-picker is intentionally a
host-side concern — the gallery and save-button are pure components
ready to be mounted.

## 4. Smoke

`src/__smoke__/template-marketplace.test.ts` — 25 tests:

Registry:
- listBuiltinTemplates returns >0 entries
- composite `brand-page-pack` surfaces with `Brand Pack` tag
- every builtin has ≥1 tag and `kind: "builtin"`
- Aqua Incubator entries surface under their tag
- listSavedTemplates empty pre-save
- saveTemplate kind/id/blocks shape
- listSavedTemplates surfaces saved entry
- listAllTemplates merges saved-first + builtin
- per-agency isolation
- deleteSavedTemplate returns true/false correctly

HTTP:
- GET 200 + templates array
- POST 201 happy path with kind=saved
- POST 400 missing label
- POST 400 missing blocks
- DELETE 200 happy path
- DELETE 404 unknown id
- DELETE 400 missing id

`@aqua/plugin-website-editor` smoke now 25 + earlier suites; tsc
clean.

## 5. Files

- `plugins/website-editor/src/server/templateMarketplace.ts` (NEW).
- `plugins/website-editor/src/api/handlers/templates.ts` (NEW).
- `plugins/website-editor/src/api/routes.ts` patch (3 new routes).
- `plugins/website-editor/src/components/editor/TemplateGallery.tsx`
  (NEW).
- `plugins/website-editor/src/components/editor/SaveAsTemplateButton.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/template-marketplace.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test script chain).

## 6. Q-ASSUMED / deviations

- Tag inference happens by id-prefix match. Future growth in
  `PAGE_TEMPLATES` may need explicit tag declaration — for now the
  inference covers every existing id with at least one tag, so the
  gallery never shows an untagged card.
- Operator-saved templates default tag is `Operator template` when
  the operator provides none, so the agency's library is filterable
  out of the box.
- Preview pane uses a card-based fallback (label string) when no
  `coverUrl` is set. Screenshot-based previews against the live
  iframe (R+1) would be a richer fix.
- Host editor topbar wiring (where the "+ New page" CTA actually
  opens the gallery, where the save-button mounts) is intentionally
  out of scope — the components are pure and ready to mount; the
  host page already owns its applyStarterVariant flow.

## 7. R+1 candidates

- Real screenshot-based cover capture (canvas → image upload) for
  saved templates rather than operator-typed URLs.
- Cross-agency template sharing (curated marketplace).
- Paid templates / monetisation.
- Composite-pack handling for saved templates (today only the
  builtin `brand-page-pack` triggers sibling-seeding via
  applyStarterVariant; a saved template seeds a single page).
- Wire `TemplateGallery` into the editor topbar's "+ New page"
  control + into the agency-shell "+ New client" flow so adding a
  client lets the operator pick a starting site template.
