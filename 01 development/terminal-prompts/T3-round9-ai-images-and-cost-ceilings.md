/loop

# T3 — Round 9: AI image generation + cost ceilings

R7 shipped the AI page builder; R8 added SSE streaming + LivePreview iframe.
R9 closes the AI loop: image generation for hero/product imagery and a
per-agency cost ceiling so the AI plugin can't run away on bills.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.
- Local dev server on http://localhost:3030.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/context/MASTER.md`
3. `01 development/context/prior research/04-plugin-ai-builder.md` (R7)
4. `01 development/context/prior research/04-plugin-website-editor-round8.md` (R8)
5. `01 development/messages/terminal-3/from-orchestrator.md`

## Scope

**Goal A — AI image generation**
- Add an `ImageService` to `@aqua/plugin-ai-builder` that wraps a
  pluggable image provider port (default: stub that returns
  placeholder URLs from `https://picsum.photos/seed/<hash>/<w>/<h>`;
  real provider — Anthropic native image gen if exposed by SDK,
  otherwise OpenAI gpt-image-1 — behind a `setImageProviderPort()`
  injection). Per-install config: `imageProvider: "stub" | "openai"`,
  `openaiApiKey` (encrypted at rest, same treatment as anthropicApiKey).
- New API route `POST /api/portal/ai-builder/image` — body `{prompt,
  size, count}`, returns `{images: [{url, width, height}]}`.
- Editor integration: when `GenerateModal` produces a `BlockTree[]` with
  image blocks (`hero`, `image`, `productCard`...), auto-fill the `src`
  by calling the image endpoint with a per-block prompt derived from
  the surrounding copy. Soft-fail to placeholder if the call fails.

**Goal B — Per-agency cost ceilings + circuit breaker**
- Extend `install.config` with `monthlyTokenCeiling` (default
  10_000_000), `monthlyImageCeiling` (default 200), `currentMonthUsage`
  (resets on first call of a new ISO month).
- `generationService.ts` + `imageService.ts` consult ceilings before
  each call. Over-ceiling → return `{ok: false, error: "ceiling-reached",
  resetsOn: <ISO>}` and surface a friendly banner in `GenerateModal`.
- `SettingsPage.tsx` (existing) gains a Usage panel: this-month tokens,
  this-month images, ceiling, % used, reset date. Editable ceilings
  (validated >= current usage).

**Goal C — Smoke + chapter**
- ai-builder smoke: 3 new cases (image happy path, ceiling hit, ceiling
  reset on new month). Total smoke ≥ 8/8.
- Chapter `04-plugin-ai-builder-round9.md`. MASTER row.

## NOT in scope

- Real image-provider account setup (operators bring their own key).
- Image editing / inpainting (R10 candidate).
- Multi-user undo/redo (still parked).

## Loop discipline

Standard. Q-ASSUMED + continue when reasonable. 3 empty wakes → end loop.

## When done

DONE + COMMIT in outbox; chapter; MASTER row; tasks row.
