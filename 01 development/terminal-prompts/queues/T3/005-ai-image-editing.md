/loop

# T3 — Round 005: AI image editing — variations + inpainting

T3 R9 shipped image generation; this extends it. Operators frequently
want to tweak generated images: regenerate variations, inpaint a region
(replace background, swap a detail). Closes the AI loop for visual edits.

## HARD BOUNDARIES

- Standard.

## Mandatory pre-read

1. Chapter `04-plugin-ai-builder-round9.md` — the existing imageService
   + ImageProviderPort.
2. `@aqua/plugin-ai-builder/src/server/imageService.ts` — current shape.

## Scope

**Goal A — Variations endpoint**
- `POST /api/portal/ai-builder/image/variations` — body
  `{ sourceImageUrl, count?, strength? }`. Returns N new variations
  (default 4) using OpenAI image-variations API (when key configured)
  or stub (returns 4 different picsum URLs derived from a seed +
  source hash).

**Goal B — Inpainting endpoint**
- `POST /api/portal/ai-builder/image/inpaint` — body
  `{ sourceImageUrl, mask: base64-png, prompt }`. Returns one edited
  image. Stub returns sourceImageUrl unchanged with a flag noting "stub".

**Goal C — Editor UI**
- Image-block context menu: "Generate variations" + "Edit with mask".
- Variations modal shows 4 thumbs + "Use this" replace.
- Inpaint modal: simple brush tool over the image, prompt textarea,
  preview the masked region, generate.

**Goal D — Cost ceilings**
- Both endpoints consult `monthlyImageCeiling` (existing R9). Each
  variation counts as 1; each inpaint as 1.

**Goal E — Smoke + chapter**
- Smoke: variations stub returns 4, inpaint stub round-trips, ceilings
  honoured (over → 429), editor UI mounts cleanly.
- Chapter `04-ai-image-editing.md`. MASTER row.

## NOT in scope

- Real OpenAI image variations integration (port shape only — operator
  brings their own provider impl).
- Video editing.
- Touching milesymedia / business-os.

## When done

DONE referencing `005-ai-image-editing.md`.
