# 04 — AI image editing (R005)

T3 Round 005. Extends the R9 image-generation loop with two
operator-facing edit affordances: **variations** (regenerate N picks
from an existing image) and **inpaint** (paint a mask, describe the
change, get a single edited image back). Closes the AI loop for
visual edits without leaving the editor.

## 1. Service shape

`@aqua/plugin-ai-builder/src/server/imageService.ts` gained two
methods on `ImageService`:

- `variations({ sourceImageUrl, count?=4, strength?, providerOverride? })`
  → `GeneratedImage[]`. Each variation = 1 image against the monthly
  ceiling.
- `inpaint({ sourceImageUrl, mask, prompt, providerOverride? })` →
  `GeneratedImage & { stub?: boolean }`. Counts as 1 image.

`ImageProviderPort` extended with optional `variations()` + `inpaint()`
so existing real-provider shims stay type-compatible. The default
`stubImageProvider` implements both: variations derive 4 picsum URLs
from a hash of `sourceImageUrl + strength + index` (same source →
stable variant set so re-opening the modal feels deterministic);
inpaint returns the source URL unchanged with `stub: true` so callers
can flag that the mask wasn't applied.

Real OpenAI variations / image-edits integrations are an operator
concern — port shape only. R005 doesn't ship a real-provider impl.

## 2. API endpoints

Added to `routes.ts` + `handlers.ts`:

- `POST /api/portal/ai-builder/image/variations` — body
  `{ sourceImageUrl, count?, strength? }`. 200 → `{ ok, images }`. 429
  on ceiling reached.
- `POST /api/portal/ai-builder/image/inpaint` — body
  `{ sourceImageUrl, mask, prompt }`. 200 → `{ ok, image }`. 400 on
  missing args. 429 on ceiling reached.

Both use `buildImageContainer(ctx)` and surface `CeilingReachedError`
as the standard 429 `{ error: "ceiling-reached", kind, resetsOn }`
shape, matching R9's `/image` endpoint.

## 3. Editor UI

`EditorPropertiesSidebar.tsx` now grows an "AI tools" sub-section
when the selected element is an `image-src` and a draft URL is
present. Two buttons:

- **✨ Generate variations** opens `ImageVariationsModal.tsx` — auto-
  fires the variations request on mount, shows 4 thumbs in a 2×2
  grid; click "Use this" replaces the sidebar's draft (which feeds
  the live iframe via the existing `onPatch` flow). Regenerate
  re-rolls.
- **🖌 Edit with mask** opens `ImageInpaintModal.tsx` — source image
  rendered behind a `<canvas>` overlay; pointer events paint
  white-on-transparent strokes (radius 18px); textarea collects the
  prompt; submit serializes the canvas via `toDataURL("image/png")`
  and POSTs to `/inpaint`. Stub-flag surfaces an honest "configure
  OpenAI key for real edits" hint. Clear-mask + Cancel + Generate
  controls.

Both modals call the existing `handleChange` path inside the
properties sidebar so the iframe and unsaved-state machinery stay
the single source of truth.

## 4. Cost ceilings

Each call consults `monthlyImageCeiling` (R9 default 200) before
hitting the provider. Variations = `count` images; inpaint = 1
image. Over-ceiling raises `CeilingReachedError` which the handlers
surface as 429.

## 5. Smoke

`src/__smoke__/ai-builder.test.ts` extended with 6 new tests:

- variations stub returns 4 + bumps usage
- variations ceiling-reached throws
- inpaint stub returns source unchanged + `stub: true` + bumps usage
- inpaint ceiling-reached throws
- handler shapes (variations + inpaint 200, missing args 400)
- handler ceiling-reached → 429

`@aqua/plugin-ai-builder` now 14/14 pass. `@aqua/plugin-ai-builder` +
`@aqua/plugin-website-editor` both tsc-clean.

## 6. Files

- `plugins/ai-builder/src/server/imageService.ts` — port additions +
  `ImageService.variations` + `ImageService.inpaint` + stub impls.
- `plugins/ai-builder/src/api/handlers.ts` —
  `imageVariationsHandler` + `imageInpaintHandler`.
- `plugins/ai-builder/src/api/routes.ts` — two new POST routes.
- `plugins/ai-builder/src/__smoke__/ai-builder.test.ts` — +6 tests.
- `plugins/website-editor/src/components/editor/EditorPropertiesSidebar.tsx`
  — AI-tools section + modal mounts.
- `plugins/website-editor/src/components/editor/ImageVariationsModal.tsx`
  (NEW).
- `plugins/website-editor/src/components/editor/ImageInpaintModal.tsx`
  (NEW).

## 7. Deviations / Q-ASSUMED

- Variations stub uses 1024×1024 fixed size (matches R9 default).
  Real provider impls choose their own sizing.
- Inpaint canvas is 512×384 — large enough to draw with, small enough
  that the base64-PNG mask payload stays under typical body limits.
- "AI tools" section only renders when a draft URL is set; we don't
  call provider with an empty sourceImageUrl.
- No batch-undo of variation cost spent — each Regenerate burns the
  budget. R+1 candidate.

## 8. Out of scope / R+1 candidates

- Real OpenAI image-variations / image-edits provider implementation.
- Video editing.
- Brush-size + colour controls in inpaint canvas; eraser tool.
- A "history strip" of recent variations stored against the image
  block for quick re-pick later.
- Side-by-side before/after preview in inpaint modal.
