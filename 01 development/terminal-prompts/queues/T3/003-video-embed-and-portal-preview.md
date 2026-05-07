/loop

# T3 — Round 003: Video embed block + portal preview polish

R002 (Incubator template) deferred two items the Notion-style template
needs feeling complete: a real Vimeo/loom/YouTube embed block, and
cover-asset upload pipeline so operators can swap the gold-marble
placeholder covers for their own imagery. Ship both + a couple of
ergonomic improvements to the LivePreview iframe (R8) that the Incubator
template surfaced as friction.

## HARD BOUNDARIES — never touch

- `04-the-final-portal/milesymedia website/` (T4).
- `04-the-final-portal/business-os/` (T4).
- `04-the-final-portal/clients/compass-coaching/` (shipped).
- `02 felicias aqua portal work/` + `03 old portal/` — read-only.

## Mandatory pre-read

1. Chapter `04-incubator-template.md` (R002) — the deferred items list.
2. Chapter `04-plugin-website-editor-round8.md` (R8 LivePreview).
3. `02 felicias aqua portal work/src/components/editor/blocks/` — Felicia's
   prior `VideoBlock.tsx` (lift if present; faithful port).

## Scope

**Goal A — `videoEmbed` block**
- Add to website-editor block registry. Props: `{ provider:
  "vimeo"|"youtube"|"loom"|"raw", url: string, aspectRatio?: number,
  autoplay?: boolean, controls?: boolean, caption?: string }`.
- Auto-detect provider from URL on paste (regex match), fall back to
  `raw` (`<iframe src=...>`).
- Same-origin sandbox attrs; no analytics leak.
- Replace any stub `videoEmbed` placeholders shipped in R002.

**Goal B — Cover-asset upload pipeline**
- Operator can upload a custom cover image from the editor
  toolbar / `cover` block properties panel. POST to existing
  `/api/portal/website-editor/assets` (or wherever assets land
  per R2 chapter), persists into the page's `assets` map, replaces
  the placeholder URL inline.
- Drag-and-drop onto the `cover` block target also works.
- Gracefully degrade when no upload backend (return a warning chip).

**Goal C — LivePreview ergonomics**
- "Open in new tab" button on the LivePreview panel — opens the
  same URL in a separate window for full-screen review.
- Auto-refresh on save (postMessage handshake already exists; just
  wire the editor's `saveSuccess` event to ping the iframe).
- Remember the panel's open/closed state per-page in localStorage
  so it doesn't reset on every navigation.

**Goal D — Smoke + chapter**
- Smoke: video embed renders for each provider, auto-detect URL
  correctly, cover upload round-trips, LivePreview "open in new
  tab" target attribute is set, auto-refresh fires on save.
- Chapter `04-website-editor-round-003.md` (or append to existing
  R8 chapter as "Round 11 polish"). MASTER row.

## NOT in scope

- WYSIWYG inline-text formatting (still parked).
- Multi-user collab cursors (still parked).
- Video transcoding / hosting — operators bring their own CDN-hosted
  URLs.
- Touching milesymedia / business-os (HARD BOUNDARY).

## When done

DONE referencing `003-video-embed-and-portal-preview.md`.
