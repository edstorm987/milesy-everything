# `@aqua/plugin-ai-builder` — Round 9 (T3)

R7 shipped the AI page builder; R8 added SSE streaming + LivePreview
iframe. R9 closes the AI loop: image generation for hero/product
imagery and per-agency cost ceilings so the AI plugin can't run away
on bills.

## What shipped

### Goal A — AI image generation

- `src/server/imageService.ts` (NEW). `ImageService` + pluggable
  `ImageProviderPort` + `setImageProviderPort()` injection point +
  `stubImageProvider` default. Stub returns picsum.photos URLs keyed
  by a deterministic dbj2-style hash of the prompt — identical
  prompts surface the same placeholder so operators can A/B prompts
  without churn. Real OpenAI gpt-image-1 provider wired in by the
  foundation at boot when an OpenAI key is configured (no source
  coupling — port lives behind the same dependency-injection seam
  T2's plugins use for Stripe / Postmark).
- `POST /api/portal/ai-builder/image` — body `{prompt, size?, count?}`,
  returns `{ok, images: [{url, width, height}]}`. Over-ceiling
  returns HTTP 429 + `{ok:false, error:"ceiling-reached", kind:"images",
  resetsOn:<ISO>}` so the modal can surface a friendly banner.
- `GenerateModal.tsx` extended — when the streamed `complete` frame
  lands, walks the returned tree for image-bearing blocks
  (`hero`, `image`, `productCard`, `product-card`, `gallery`, `banner`)
  whose `props.src` is empty, requests one image per block from
  `/api/portal/ai-builder/image`, soft-fails to leaving src empty if
  the call fails or hits a ceiling. Per-block prompt derives from
  `props.alt` / `props.title` / `props.heading` / the operator's
  original prompt — whichever is present first.

### Goal B — Per-agency cost ceilings + circuit breaker

- `AiBuilderConfig` extended with `monthlyTokenCeiling` (default
  10 000 000), `monthlyImageCeiling` (default 200), `imageProvider`
  (`"stub"` | `"openai"`), `openaiApiKey`. Defaults landed in
  `DEFAULT_CONFIG`.
- New domain types `MonthlyUsage { monthKey, tokens, images }` +
  helpers `monthKeyForDate(d)` (`YYYY-MM` UTC) + `nextMonthResetIso(d)`
  (first-of-next-month UTC).
- Storage layout `t/<agency>/<client>/ai-builder/metrics/usage/<YYYY-MM>`.
  A new month auto-rolls a fresh counter; old months kept for
  historical lookup. **No cron required** — first call of a new month
  reads `undefined` and writes a fresh `{tokens:0, images:0}` record.
- `GenerationService.checkTokenCeiling(config)` + `usageThisMonth()`
  + `bumpUsageTokens(by)`. `generate()` and `generateStream()` both
  call `checkTokenCeiling` *before* the Anthropic round-trip; if
  over budget, return a synthetic `rejected` Generation record with
  `validationError: "ceiling-reached: tokens used N >= ceiling M;
  resets <ISO>"` — UI parses the `ceiling-reached:` prefix to swap
  the modal banner from "schema error" → "ceiling reached, resets
  <date>". After every successful Anthropic call both paths bump the
  per-month counter by `inputTokens + outputTokens +
  cacheReadInputTokens + cacheCreationInputTokens` so the ceiling
  consults the same number Anthropic billed.
- `ImageService.generate()` consults `monthlyImageCeiling` before
  each call — over budget throws `CeilingReachedError(kind:"images",
  resetsOn)`. The image handler catches it and maps to HTTP 429.
- `GET /api/portal/ai-builder/usage` — `{monthKey, tokens, images,
  tokenCeiling, imageCeiling, resetsOn}`. The Settings page consumes
  this for the live Usage panel.
- `SettingsPage.tsx` gains **Image generation** + **Usage + ceilings**
  panels. Usage meters render emerald (<70%), amber (70–89%), red
  (≥90%) with a 0-100% bar. Ceiling inputs `min` is set to current
  usage so the operator can't drop the ceiling below what's already
  billed this month.

### Goal C — Smoke + chapter

`src/__smoke__/ai-builder.test.ts` — three new R9 cases (now 8/8 total):
1. **R9 image: stub provider returns picsum URLs + bumps usage** —
   asserts URL prefix, returned width/height match requested size
   (`1024x768`), counter bumped by 2 after `count: 2`.
2. **R9 image: ceiling-reached throws CeilingReachedError + reset is
   next month** — first call uses up the 2-image ceiling; second call
   throws `CeilingReachedError(kind:"images")` with `resetsOn` parsing
   to a future ISO timestamp.
3. **R9 ceilings: token ceiling reached → generate returns rejected
   w/ ceiling-reached error** — pre-seeds the per-month usage counter
   at the ceiling, asserts the next `generate()` short-circuits to
   `status:"rejected"` + `validationError` starts with `ceiling-reached:`.

ai-builder smoke **8/8** pass via `npm run smoke`. Website-editor
smoke unchanged at **92/92**. `tsc --noEmit` clean across both plugins.

## Cross-team handoffs

- **T1**: encrypt `install.config.openaiApiKey` at rest alongside
  `anthropicApiKey` (R7 ask). Foundation broker wires the real
  `OpenAiImageProviderPort` via `setImageProviderPort()` at boot when
  an OpenAI key is configured for a given install — port id must be
  `"openai"` so the service routes correctly.
- **T2**: no work owed.
- **T4**: when polishing the editor topbar, the new ceiling-reached
  banner in `GenerateModal` needs the same focus-ring + `role="alert"`
  treatment as the existing schema-error banner (the new path reuses
  the existing red `<div role="alert">` so this is automatic).

## Deferred to R10+

- Real OpenAI gpt-image-1 provider impl (R10 — needs a sandbox key
  for smoke; the port is in place + the stub proves the contract).
- Image editing / inpainting + variations (R10 candidate per prompt).
- Multi-user undo/redo across AI generations.
- Usage charts (sparkline of last-12-months tokens/images on
  Settings) — current Usage panel shows a single-month snapshot.
- Per-client (vs per-agency) ceilings for sub-budget allocation.
