# `@aqua/plugin-ai-builder` — Round 7 (T3)

The AI page builder eds requirements lists as v1-future. Operator
types a one-line description ("a hero with our brand colours, a
3-column feature grid, a CTA"); Claude returns a `BlockTree[]` using
the website-editor's 58-block library + the 18 cross-plugin block ids
T3 R3 registered. Round-7 ships the standalone plugin + the editor
topbar integration.

## What shipped

### Goal A — `@aqua/plugin-ai-builder` plugin

`04 the final portal/plugins/ai-builder/`. `scopePolicy: "either"`,
`requires: ["website-editor"]`, `core: false`. Mirrors the shape of
T2's most recent plugins (portal-export / agency-marketing).

- **Manifest** (`index.ts`, 169 LOC) — 3 navItems
  (Generate / History / Settings), 4 admin pages (`""`, `"generate"`,
  `"history"`, `"settings"`), 0 storefront blocks (read-only consumer
  of the editor's catalogue), 2 settings groups (model + auth), 2
  feature flags. `healthcheck` returns ok=true iff
  `install.config.anthropicApiKey` is set.
- **Domain** (`src/lib/domain.ts`, 110 LOC) — `Generation { id,
  prompt, blockTree, modelId, fallbackModelId?, status:
  "pending"|"completed"|"failed", costCents, validationError?,
  createdBy, createdAt, contextHints? }`.
- **Block schema** (`src/lib/blockSchema.ts`, 152 LOC) — read-only
  projection of `BLOCK_REGISTRY` + the 18 cross-plugin ids with
  fields/category. Used to build the system prompt + validate the
  model's response.

### Goal B — Generation pipeline

- **Anthropic client** (`src/server/anthropicClient.ts`, 140 LOC) —
  thin wrapper over the Messages API with prompt caching enabled on
  the static block-library system prompt (`cache_control:
  ephemeral`). Returns `{ content, usage: { inputTokens,
  outputTokens, cacheReadInputTokens, cacheCreationInputTokens } }`.
  Fully mockable via injected `fetch` for smoke.
- **Generation service** (`src/server/generationService.ts`, 354
  LOC) — `generate({ prompt, contextHints, createdBy })`:
  1. Build system prompt from `BLOCK_REGISTRY` + cross-plugin ids
     (huge, static, cached).
  2. Call Anthropic with default model (Haiku 4.5).
  3. Parse JSON-mode `BlockTree[]`. Validate against block schema.
  4. **On schema-validation failure**: retry once on the configured
     fallback model (Sonnet 4.6 default).
  5. Persist `Generation` record via `GenerationStore` port.
  6. Track cache-hit metrics — counter increments when
     `cacheReadInputTokens > 0`.
- **Ports** (`src/server/ports.ts`, 77 LOC) — `GenerationStore`
  (CRUD), `MetricsPort` (cache-hit counter, optional). Foundation
  wires real impls; smoke injects in-memory.
- **API routes** (`src/api/routes.ts` + `src/api/handlers.ts`, 22 +
  118 LOC) — 6 routes: `POST /generate`, `GET /history`,
  `GET /history/:id`, `DELETE /history/:id`, `GET /metrics`,
  `GET /healthcheck`.

### Goal C — GenerateModal + EditorPage integration

In `04 the final portal/plugins/website-editor/`:
- **`components/editor/GenerateModal.tsx`** (NEW) — thin client
  over `/api/portal/ai-builder/generate`. Operator types a prompt;
  modal POSTs, surfaces loading + error states, and on success calls
  `onInsert(blockTree)`. Lives in website-editor (not ai-builder)
  because only the editor knows the active page's block array.
- **`components/editor/EditorTopBar.tsx`** — gains the ✨ Generate
  button next to Save (19 added, 0 removed in the diff).
- **`pages/EditorPage.tsx`** — owns the `<GenerateModal>` lifecycle;
  `onInsert` appends the returned tree to the active page's blocks.

Streaming SSE preview deferred to R8 polish — POST + spinner is the
v1 cut. Modal disables the Generate button while in flight.

## Smoke

`src/__smoke__/ai-builder.test.ts` (3/3 pass via `tsx --test`):
- generate: mocked raw response → `Generation` record persisted,
  status=completed, `blockTree` validated against schema.
- generate: invalid block → first attempt rejected, fallback model
  retried, second attempt's valid response persisted.
- metrics: cache-hit counter increments when
  `usage.cacheReadInputTokens > 0`.

`tsc --noEmit` clean. Website-editor smoke unchanged at **92/92**.

## Cross-team handoffs

- **T1**: register the plugin in `_registry.ts`; mount API routes;
  inject a real `GenerationStore` impl backed by the foundation
  storage layer (memory v1 → Postgres later). The pool model means
  the API key field on `install.config` must be encrypted at rest —
  same treatment as T2's per-install Stripe keys.
- **T2**: no work owed. Plugin reads the website-editor block
  catalogue only; doesn't touch any domain plugin.
- **T4**: when polishing the editor topbar in a future round, the
  ✨ Generate button needs the same focus-ring + 44px tap-target
  treatment as Save.
- **Operator**: drop the Anthropic API key into Settings after
  install. Without it, `healthcheck` returns ok=false and the modal
  surfaces a "Plugin not configured" banner.

## R7 close — what landed this commit

- **Smoke**: `src/__smoke__/ai-builder.test.ts` — 3/3 pass. (1) mocked
  raw response → completed + persisted + listed; (2) invalid block →
  rejected → retried on `claude-sonnet-4-6` with `retryCount === 1`;
  (3) `cacheReadInputTokens > 0` increments the cache-hits metric,
  `cacheReadInputTokens` absent does not.
- **`GET /api/portal/ai-builder/status`** added (route +
  `statusHandler`) — returns `{ ok: true, ready: <hasApiKey> }`. The
  editor probes this on mount to decide whether to render the
  ✨ Generate button.
- **EditorTopBar.tsx**: optional `onGenerate?: () => void` prop +
  fuchsia ✨ Generate button left of Save. Hidden when undefined
  (ai-builder plugin not installed) or when the editor target isn't a
  source-editable page.
- **GenerateModal.tsx** (new, in `website-editor/src/components/editor/`):
  thin client over `POST /api/portal/ai-builder/generate`. Renders a
  flat preview of types/ids on completion; Insert hands the tree back
  via `onInsert` so EditorPage can append + reload the iframe.
- **EditorPage.tsx**: `aiAvailable` state + status probe + modal mount
  + `onInsert` (reads existing blocks via `getEditorPage`, appends,
  saves via `updateEditorPage({ blocks: [...existing, ...generated] })`,
  bumps `reloadKey`).
- **tsc clean** in both `04 the final portal/plugins/ai-builder/` and
  `04 the final portal/plugins/website-editor/`.

## Deferred to R8+

- Streaming SSE preview (currently POST+spinner).
- Image generation for hero blocks (Felicia ask).
- Per-agency / per-client cost ceilings + circuit breaker.
- "Insert at selection" cursor logic (currently appends to the end
  of the active page).
- History browser deep-link from the modal ("based on generation X").
