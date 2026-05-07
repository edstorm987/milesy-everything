# Website-editor R003 — videoEmbed + asset upload + LivePreview polish

T3's queue-Round-003 closes two R002 deferrals (Vimeo/loom embed,
operator cover-asset upload) and adds three LivePreview ergonomics
the Incubator template surfaced as friction.

## Goal A — `videoEmbed` block

NEW `components/blocks/VideoEmbedBlock.tsx` + helper
`lib/videoEmbed.ts`. The helper is framework-free so smoke can
exercise every branch without React.

- Props: `{ provider: "vimeo"|"youtube"|"loom"|"raw", url, aspectRatio?,
  autoplay?, controls?, caption? }`. Empty URL renders a friendly
  placeholder.
- `detectVideoProvider(url)` — regex-matches against
  `vimeo.com/<id>` (and `/video/<id>`), `youtu.be/<id>`,
  `youtube.com/(watch?v=|embed/|shorts/)<id>`, `loom.com/(share|embed)/
  <hex>`. Falls back to `raw` (`<iframe src=...>`).
- `toEmbedUrl(url, provider, opts)` rewrites to the canonical
  embed URL — `player.vimeo.com/video/<id>`,
  `youtube.com/embed/<id>`, `loom.com/embed/<id>`. Honours
  `autoplay` (appends `?autoplay=1` + `&muted=1` for Vimeo /
  YouTube — required for browser autoplay) and `controls=false`
  (appends `controls=0`).
- Iframe sandbox: `allow-scripts allow-same-origin
  allow-presentation`. No analytics leak — no
  `allow-top-navigation`.
- Operators paste any link → provider auto-detects. Manual
  override via the `provider` field.
- The Aqua Incubator onboarding template (R002) was using `video`;
  swapped to `video-embed` so operators paste a Vimeo / Loom URL
  directly.

## Goal B — Cover-asset upload pipeline

Replaces R1's 501 stubs in `api/handlers/assets.ts` with a real
implementation against `ctx.storage`.

- Storage: `assets/index` (string[] of ids, most-recent first) +
  `assets/by-id/<id>` (PortalAsset record). Per-tenant isolation
  via the existing `requireClientScope` helper.
- `dataUrl` persisted inline (`data:image/...;base64,...`). Cap:
  **8 MiB per file** + **64 MiB per client**. Over-cap returns
  413. Final CDN-backed pipeline lands when T1 ships a real
  storage adapter — drop-in replacement for the inline `dataUrl`.
- `decodeDataUrlSize(dataUrl)` exported pure helper — base64
  payload length × 3/4 minus padding. Used by the upload-cap
  guard + the smoke.
- `handleListAssets` returns `{ ok, assets, usedBytes, capBytes }`
  matching the existing client-side `loadAssets` shape so the
  `AssetPicker` round-trip works without client changes.
- `handleDeleteAsset` reads id from `/assets/<id>` (path) or
  `?id=<id>` (query). Returns 404 + `not found` when id doesn't
  belong to the caller's scope.

The existing `AssetPicker.tsx` (and the `lib/media.ts` client) was
already wired — uploads now actually land instead of returning 501.

## Goal C — LivePreview ergonomics

`components/editor/LivePreview.tsx` extended:

- **"↗ New tab" button** in the panel header — opens the same
  `?preview=1` URL via `window.open(...)` with
  `noopener,noreferrer`.
- **Auto-refresh on save** — new `lastSaveAt?: number` prop. The
  iframe's `key` includes both `reloadKey` and `lastSaveAt`, so
  bumping either re-mounts the iframe. Wired in `EditorPage.tsx`:
  the existing `data.type === "saved"` postMessage handler now
  also `setLastSaveAt(Date.now())`.
- **Per-page open/closed state** — new
  `useLivePreviewOpenState(pageId)` hook persists to
  `localStorage["lk-live-preview-open:<pageId>"]`. EditorPage
  uses it instead of in-memory `useState(false)`, so navigating
  across pages (or refreshing the editor) preserves the
  operator's choice.

Inline preview iframe sandbox unchanged
(`allow-same-origin allow-scripts`).

## Smoke — `__smoke__/video-and-preview.test.ts` (32 cases)

- `detectVideoProvider`: vimeo / vimeo /video/, youtu.be /
  youtube.com/watch / /embed, loom share + embed, unrecognised
  host, empty (9).
- `toEmbedUrl`: per-provider rewrites, autoplay+muted appendage,
  controls=0, raw passthrough, invalid-url passthrough (7).
- `BLOCK_REGISTRY["video-embed"]` registered + default provider
  `raw` + has url/provider/autoplay fields (3).
- Asset upload handler with in-memory `PluginStorage`: list-empty,
  upload happy path with id+filename+size, list-after-upload
  contains the id + usedBytes>0, bad body (non-data URI) → 400,
  > per-file cap → 413, delete by path-id → ok+deleted, delete
  non-existent → 404 (8).
- `decodeDataUrlSize` edge cases (3).
- LivePreview localStorage key shape (1).

Touches `incubator-template.test.ts` (`video` → `video-embed`)
and `blocks.test.ts` (counts 60→61, storefront 60→61). Plugin
total **199/199** (52 + 25 + 25 + 26 + 39 + 32). `tsc --noEmit`
clean.

## Cross-team handoffs

- **T1 / Foundation** — When the real CDN-backed storage adapter
  lands, swap the inline-dataUrl persistence in
  `api/handlers/assets.ts` for the adapter (the API surface is
  stable; only the storage write changes).
- **Operators** — Cover assets uploaded via the editor are
  scoped per-client. The Aqua Incubator default cover paths
  (`/aqua-incubator/...`) still resolve from
  `04-the-final-portal/portal/public/aqua-incubator/`; per-client
  overrides via the editor properties panel write to the
  per-tenant assets store.

## Deferred to next round

- Drag-and-drop onto the `cover` block target (the current path
  goes through the AssetPicker upload button — works, but not
  drag-and-drop on the block itself).
- Real CDN-backed storage adapter (foundation territory).
- Vimeo Showcase / playlist embeds (single-video URLs only for
  v1).
- LivePreview "split mode" alongside the canvas (currently a
  fixed-width right rail).

## Files

- `src/components/blocks/VideoEmbedBlock.tsx` (NEW)
- `src/lib/videoEmbed.ts` (NEW)
- `src/components/blockRegistry.ts` (registry entry)
- `src/types/block.ts` (BlockType union)
- `src/api/handlers/assets.ts` (REWRITE — replaces R1 stubs)
- `src/lib/ids.ts` (`assetId` helper)
- `src/components/editor/LivePreview.tsx` (REWRITE — new-tab
  button + lastSaveAt prop + `useLivePreviewOpenState` hook)
- `src/pages/EditorPage.tsx` (hook adoption + `lastSaveAt`
  bump in saved-message handler)
- `src/components/pageTemplates.ts` (`video` → `video-embed`
  in incubator-onboarding sub-page)
- `src/__smoke__/video-and-preview.test.ts` (NEW, 32 cases)
- `src/__smoke__/blocks.test.ts` (counts 60→61)
- `src/__smoke__/incubator-template.test.ts` (`video` → `video-embed`)
- `package.json` (test wires new smoke)

HARD BOUNDARY honoured throughout.
