/loop

# T3 — Round 040: Editor live-preview iframe

Editor today re-renders its own canvas — what you see is the editor's
take on the block tree, not the storefront's. Add a side-by-side live
preview iframe pointing at `/<page>?preview=<draft-token>` so editors
see the actual storefront render as they type.

## Pre-read

- T3 R035 draft/published (`?preview=1` already supported via signed
  token from R022).
- Existing editor canvas component.
- T1 R016 embed-route (similar iframe + postMessage pattern).

## Scope

**A** — `<EditorLivePreview>` component (client). Renders an iframe
src `/<page-url>?preview=<token>` where token is short-lived signed
HMAC of `{pageId, userId, exp}`.

**B** — Postmessage bridge:
- Editor → iframe: `aqua-editor:tree-changed { tree }` on every save.
  Iframe re-fetches preview rather than rerendering inline (simplest).
- Iframe → editor: `aqua-editor:click { blockId }` lets clicking a
  block in preview select it in the editor canvas.

**C** — Layout: split view toggle in editor header. Default: hidden
(no perf cost). When shown: 50/50 split; persists in localStorage per user.

**D** — Smoke `§ Editor live preview` (≥10 — token signing roundtrip;
postmessage shape; click-to-select wiring).

**E** — Chapter `04-editor-live-preview.md` + MASTER row.

## NOT in scope
- Hot-reload without re-fetch (post-ship).
- Multiplayer cursors (post-ship).

## When done
DONE referencing `040-editor-live-preview.md`.
