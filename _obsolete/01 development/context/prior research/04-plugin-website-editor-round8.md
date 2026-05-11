# Website-editor Round 8 — AI streaming + LivePreview iframe (T3)

R7 shipped `@aqua/plugin-ai-builder` with the ✨ Generate button and
a POST + spinner modal. R8 closes the two biggest R7 deferrals:
**SSE streaming** so the operator sees Claude write the page live,
and **LivePreview** — a side-by-side iframe panel that renders the
storefront output of the page being edited in Block / Code modes.

## What shipped

### Goal A — SSE streaming on Generate

**Plugin (`@aqua/plugin-ai-builder`):**
- `src/server/anthropicClient.ts` — new `streamMessage(input)`. Posts
  with `stream: true` + `accept: text/event-stream`, parses
  Anthropic's SSE protocol (`message_start` / `content_block_delta` /
  `message_delta` / `message_stop`), invokes `onDelta(text)` per
  text delta, returns the same `CreateMessageResult` shape so the
  service can keep one validation path. Smoke injects a custom
  `fetchImpl` returning a hand-built `ReadableStream` of SSE frames.
- `src/server/generationService.ts` — new `generateStream(input)`.
  Same prompt builder + parse + validate + persist + metrics path
  as `generate()`, but routes through `streamMessage` and forwards
  `onDelta` to the caller. **No fallback-model retry on the
  streaming path** — streaming is for the editor's live preview;
  operators can hit Generate again, or fall through to the
  non-stream `/generate` endpoint for the retry path. (The
  `ai-builder` smoke proves the retry path on the non-stream
  endpoint is unchanged.)
- `src/api/handlers.ts` — `generateStreamHandler`. Returns a
  `text/event-stream` `Response` whose `ReadableStream` body forwards
  each Anthropic `text_delta` as one `data: {"type":"delta","text":"…"}`
  frame; emits a single final `data: {"type":"complete","generation":<full record>}`
  + the standard `data: [DONE]` sentinel; on error, emits
  `data: {"type":"error","error":"…"}` then `[DONE]`. Headers
  include `cache-control: no-cache, no-transform` and
  `x-accel-buffering: no` so reverse proxies (Vercel / nginx) don't
  buffer the stream.
- `src/api/routes.ts` — `POST generate/stream` registered alongside
  the existing `POST generate`.

**Editor (`@aqua/plugin-website-editor`):**
- `components/editor/GenerateModal.tsx` — replaces R7's POST + spinner
  with an SSE reader. Decodes `data:` frames as they arrive,
  accumulates text, and feeds each new delta into a best-effort
  partial-tree parser (`tryParsePartial`) that walks the streaming
  text tracking string-state + brace-depth, recording the index
  after each complete top-level object closure. When at least one
  complete object has streamed, the partial preview re-renders the
  outline live; until then, a streaming-text fallback shows the raw
  chunks so the operator always sees motion. Cancel button drives an
  `AbortController` that aborts the in-flight `fetch`. The unmount
  effect aborts as well so the request doesn't outlive the modal.
  When the final `complete` frame lands, the preview switches from
  cyan ("streaming") → emerald ("done") and the Insert button appears.

### Goal B — LivePreview iframe panel

- `components/editor/LivePreview.tsx` (NEW). A standalone side-by-side
  iframe panel. `src` is the active page's storefront URL with a
  `?preview=1` param appended (PortalPageRenderer suppresses
  analytics + surfaces editor handles when this flag is present;
  same-origin so cookies flow). Sandbox is
  `allow-same-origin allow-scripts` per the prompt.
- postMessage channel: `iframe → host` posts `{source:"live-preview",
  type:"select"|"ready", blockId?}`; `host → iframe` posts
  `{source:"editor-host", type:"highlight", blockId}`. Selecting a
  block in the iframe routes through `onSelectBlock(blockId)` to set
  the editor's `selected` state; selecting in the outliner pushes a
  highlight message into the iframe via the effect tied to
  `selectedBlockId`.
- Mounted via `EditorPage.tsx` as a fixed-position right-rail panel
  in **Block + Code** modes only (Live mode already IS the storefront
  iframe). A small footer toggle ("Live preview" / "Hide preview")
  drives `livePreviewOpen`. Opening it does not unmount the canvas —
  the operator can drag/drop in the Block stage and watch the
  rendered output update on save.
- **Q-ASSUMED** (logged): the prompt asked for a dedicated
  `/portal/clients/[clientId]/preview/[pageId]` route. We do not
  ship that route in R8 — the existing storefront URL with
  `?preview=1` covers the same surface (same-origin, sandbox attrs
  match Live mode, cookies flow). When foundation R9+ ships a
  dedicated preview route, swap the resolver in `LivePreview.tsx`'s
  `src` constant — single change.

### Goal C — Smoke + chapter + tasks

- `src/__smoke__/ai-builder.test.ts` extended with two R8 cases:
  1. `R8 stream: deltas accumulate + final tree validates + persists`
     — drives `GenerationService.generateStream` with a 4-chunk
     mocked Anthropic stream, asserts 4 delta callbacks, deltas
     concatenate to the full text, final status=`completed`,
     blockTree validates, record persists.
  2. `R8 stream handler: SSE response emits delta + complete + DONE
     frames` — calls the HTTP handler directly with a mocked upstream
     fetch; asserts response is `text/event-stream`, body contains
     `"type":"delta"`, `"type":"complete"`, and `[DONE]`.
- ai-builder smoke now **5/5** pass via `npm run smoke`.
- website-editor smoke unchanged at **92/92** (42 blocks + 25
  cross-plugin renderers + 25 save-target).
- `tsc --noEmit` clean across both plugins.

## Cross-team handoffs

- **T1**: when the API route mount picks up `generate/stream`, ensure
  the foundation framework forwards the response body without
  buffering (Next.js Route Handlers + Edge runtime: yes; Node
  runtime: also yes since we return a `Response` with a streamed
  body). Confirm `req.signal` propagates so client aborts cancel
  the upstream Anthropic call.
- **T2**: no work owed.
- **T1 R9 candidate**: ship a dedicated
  `/portal/clients/[clientId]/preview/[pageId]` route + flip
  `LivePreview.src` once it lands.
- **T4**: when polishing the editor topbar, the new "Live preview"
  footer toggle needs the same focus-ring + 44px tap-target
  treatment.

## Deferred to R9+

- Multi-user collab cursors (parked for v2 per architecture §13).
- Undo/redo across AI generations.
- Server-side rendered preview snapshot for share links.
- Streaming text-only fallback when partial JSON never parses
  (currently we show the raw text in a `<pre>` while waiting; an
  HTML preview would be richer).
- Image generation for hero blocks (Felicia ask).
- Per-agency / per-client cost ceilings + circuit breaker on the
  streaming path (R7 deferral kept open).
