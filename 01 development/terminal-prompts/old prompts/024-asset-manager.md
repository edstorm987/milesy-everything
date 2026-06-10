/loop

# T3 — Round 024: Image library + asset manager

Per-install asset surface. Upload + browse + replace images across
the portal. Editor's image picker pulls from this library.

## Mandatory pre-read

1. T3 R005 ai-image-editing chapter.
2. Existing image surfaces in editor.

## Scope

**A** — `assetLibrary.ts` server domain: `Asset` (id, name, url,
mimeType, sizeBytes, tags[], uploadedAt). Stored in plugin storage.

**B** — `/admin/assets` page — grid view + upload dropzone + tag
filter + bulk-tag + delete. Replace-with-URL also supported.

**C** — Image picker modal across all blocks pulls from
assetLibrary; "+ Upload new" inline.

**D** — Auto-tag on upload by mimeType + filename keywords (logo,
hero, product, etc.).

**E** — Smoke + chapter `04-asset-manager.md` + MASTER row.

## NOT in scope

- CDN / cloud upload (T6 prod gate).
- Image transforms (T3 R005 covered).

## When done
DONE referencing `024-asset-manager.md`.
