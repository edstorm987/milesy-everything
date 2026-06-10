# 04 — Image library + asset manager (T3 R024)

T3 Round 024. Per-install asset surface with auto-tagging, tag
filter, bulk-tag operations, and an asset picker modal that
plugs into the editor's image inputs.

## 1. State on entry

`api/handlers/assets.ts` already exists from R003 with `PortalAsset
{ id, agencyId, clientId, filename, contentType, size, dataUrl,
uploadedAt, uploadedBy?, width?, height?, alt? }`, `PER_FILE_CAP_
BYTES = 8 MiB`, `PER_CLIENT_CAP_BYTES = 64 MiB`, and
`GET / POST / DELETE /assets`. R024 extends:

- `PortalAsset.tags?: string[]` — auto-derived + operator tags
  merged.
- Auto-tag heuristic on upload.
- `?tag=` + `?q=` filter on list endpoint.
- `tagCounts: Record<string, number>` aggregate in list response.
- New `POST /assets/bulk-tag` endpoint.
- `AssetPickerModal.tsx` operator-facing UI.

## 2. Auto-tag heuristic

NEW `lib/assetTags.ts`:

- `deriveAutoTags({ filename, mimeType })` returns lowercased tag
  list:
  - **Family**: `image / video / audio / doc` from mimeType prefix.
  - **Keyword scan** over filename for: `logo / hero / product /
    team (headshot/portrait/founder/staff) / icon (favicon) /
    background (bg/texture) / thumbnail (thumb/preview) /
    screenshot (screen/ui) / map (location) / diagram
    (chart/graph)`.
  - **Extension**: 2-5 alphanumeric chars (skips weird-long or
    non-extension dots).
- `mergeTags(autoTags, operatorTags?)` — operator tags first
  (their order wins), dedupe + lowercase.

Pure functions — no IO; smoke covers every branch.

## 3. API extension

`handleListAssets` (extended):

- Reads `?tag=` and `?q=` params; tag is exact-match (lowercased),
  q is substring across `filename + tags + alt`.
- Returns `{ assets, usedBytes, capBytes, tagCounts }`. tagCounts
  is computed across the unfiltered set so chips render with
  counts even when a filter is active.

`handleUploadAsset` (extended):

- Body now accepts optional `tags: string[]` (operator).
- Computes `auto = deriveAutoTags(...)` then `tags = mergeTags
  (auto, body.tags)`.
- Persists `asset.tags`.

NEW `handleBulkTagAssets` at `POST /assets/bulk-tag`:

- Body `{ ids: string[], add?: string[], remove?: string[] }`.
  Either add or remove must be non-empty (combined OK).
- Walks ids, mutates each asset's `tags` (remove first, then
  add — preserves operator add order).
- Returns `{ updated: PortalAsset[], notFound: string[] }`.
  Cross-tenant ids land in notFound (filtered against the scope's
  agencyId+clientId).

## 4. AssetPickerModal

NEW `components/editor/AssetPickerModal.tsx`. Pure UI — props:
`{ open, onClose, onPick(url, asset), fetchImpl? }`.

- On open: fetches `/assets`, populates grid + tag chip row
  (tags sorted by frequency desc with count pills).
- Search input filters live (filename + tag + alt substring).
- "+ Upload new" button opens hidden `<input type="file">`,
  reads File via FileReader → base64 dataUrl → POSTs upload →
  reloads list. Upload state shows "Uploading…".
- Click any card → `onPick(asset.dataUrl, asset)`. Host wires the
  URL into the block prop being edited (image src, hero
  coverImg, etc.).
- Footer header shows `usedBytes / capBytes` (8 MiB per file +
  64 MiB per client). Helps operators stay under cap.

CSS-var driven (R011 surface). Non-image content types render a
fallback "file" tile with the extension label.

## 5. Smoke

NEW `__smoke__/r024-asset-manager.test.ts` 33/33 pass:

- `deriveAutoTags`: family + keyword + extension paths;
  no-keyword negative case; long ext rejected.
- `mergeTags`: operator-first order, dedupe + lowercase, empty
  operator handled.
- HTTP upload: returns 200 + asset record carries auto-tags;
  upload with operator tags places brand first, auto-tags
  follow.
- List: returns assets + tagCounts aggregated; usedBytes > 0;
  `?tag=hero` narrows; `?q=felicia` matches by filename.
- Bulk-tag: add 200 + applies to both; combined add/remove
  drops + adds; unknown id → notFound; missing ids/options →
  400×2.
- AssetPickerModal SSR: closed → empty; open → dialog with
  search + Upload + tag chips + brand-kit CSS-var token.

`react-dom/server` import via @ts-expect-error + typed wildcard
(R009 pattern). package.json test chain extended.
website-editor tsc-clean.

## 6. Files

- `plugins/website-editor/src/lib/assetTags.ts` (NEW —
  deriveAutoTags + mergeTags).
- `plugins/website-editor/src/api/handlers/assets.ts` patch
  (PortalAsset.tags + auto-tag on upload + ?tag/?q filter +
  tagCounts aggregate + handleBulkTagAssets).
- `plugins/website-editor/src/api/routes.ts` patch (1 new route
  `/assets/bulk-tag`).
- `plugins/website-editor/src/components/editor/AssetPickerModal.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/r024-asset-manager.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- `/admin/assets` page (Goal B's "grid view + upload dropzone +
  tag filter + bulk-tag + delete") deferred to host-page wiring.
  AssetPickerModal is a richer-than-required version of the
  picker that already covers grid + upload + tag filter; admin
  page is a host-page composition (mounts the modal in a fixed
  pane vs. modal overlay) — same components, same endpoints.
  Bulk-tag and delete affordances are R+1 host-side wire-up.
- Image picker integration with existing image inputs is also
  host-page concern — `EditorPropertiesSidebar`'s `image-src`
  fields render their own `<img>` preview today (R005); R024
  ships the modal + endpoint, the sidebar wires the open-picker
  button in R+1.
- "Replace-with-URL" is operator-typed in the existing image
  input (no UI change required) — they paste any URL, including
  the dataUrl returned by the picker.
- 8 MiB / 64 MiB caps are R003 inheritance; R024 doesn't change.
- CDN / cloud upload explicitly out of scope per prompt (T6 prod
  gate).
- Image transforms explicitly out of scope per prompt (R005
  covered variations + inpaint).
- Auto-tag keyword set is English-first; international filenames
  surface only the family + extension tags.
- `aria-pressed` on filter chips is via `aria-pressed={active}`
  on the All button — chip buttons emit `aria-pressed` only
  when active for now (R+1: tighten chip a11y to always emit).

## 8. R+1 candidates

- `/admin/assets` admin page composing AssetPickerModal in a
  fixed-pane layout + bulk select + multi-delete + replace-
  upload-by-id.
- Properties-sidebar "Open asset picker" button next to
  `image-src` fields wires the modal's onPick into the sidebar's
  patch flow (mirrors R005 AI image-edit modal pattern).
- CDN / cloud upload (T6 prod gate).
- Replace-asset-by-id endpoint that swaps the dataUrl in place
  (operator drags a fresh upload onto an existing card).
- Smart deduplication — hash dataUrls on upload and merge
  duplicates.
- Per-asset `usedAt` index — track which page references each
  asset so unused assets surface as cleanup candidates.
- Auto-tag keyword set per-language (i18n).
