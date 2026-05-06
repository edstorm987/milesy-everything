/loop

# T3 — Round 8: AI streaming + editor live-preview iframe

R7 shipped `@aqua/plugin-ai-builder` (Generate button + modal, POST + spinner,
schema-validated insert). R8 closes the two biggest deferrals: streaming
preview while Claude generates, and a true live-preview iframe so the editor
shows the actual portal render of the page being edited.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/` (renamed — no spaces).
- After every commit: `git pull --rebase --autostash && git push`.
- Local dev server already running on http://localhost:3030.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/messages/README.md`
3. `01 development/context/MASTER.md`
4. `01 development/context/prior research/04-architecture.md`
5. `01 development/context/prior research/04-plugin-ai-builder.md` (R7 chapter)
6. `01 development/context/prior research/04-plugin-website-editor-round2.md` + R5 chapter
7. `01 development/messages/terminal-3/from-orchestrator.md` (latest TASK)

## Scope

**Goal A — SSE streaming on Generate**
- Switch `/api/ai-builder/generate` to a streaming endpoint
  (`text/event-stream`). Use Anthropic SDK's streaming mode.
- `GenerateModal.tsx`: replace spinner with a live preview that re-renders
  the partial `BlockTree[]` as chunks arrive. Use a soft-fail render so a
  half-built tree still draws (skeleton blocks for unfinished nodes).
- Cancel button aborts the in-flight request.
- Smoke: assert SSE `data:` frames arrive, final tree validates schema.

**Goal B — Live-preview iframe in EditorPage**
- New `LivePreview.tsx` panel mounted next to the canvas (toggle via existing
  Live/Block/Code mode switch). The iframe loads the active page's storefront
  render under the current portalVariant, posts a `postMessage` channel for
  block selection sync (clicking a block in the iframe selects it in the
  outliner; selecting in the outliner scrolls/highlights in the iframe).
- Use the existing portal route at `/portal/clients/[clientId]/preview/[pageId]`
  — if it doesn't exist, add it as a thin server component that re-uses the
  storefront renderer with `previewMode=true` (suppresses analytics +
  surfaces editor-only handles).
- Iframe sandbox: `sandbox="allow-same-origin allow-scripts"`. Same origin
  means cookies flow.

**Goal C — Smoke + chapter**
- Extend `npm run smoke` with the new endpoints + iframe handshake.
- Chapter `04-plugin-website-editor-round8.md`. MASTER row.

## NOT in scope

- Multi-user collab cursors (parked for v2).
- Undo/redo across AI generations (R9 candidate).
- Server-side rendered preview snapshot for share links (R9 candidate).

## Loop discipline

Standard. Q-ASSUMED + continue when reasonable; Q-BLOCKED only when no
reasonable assumption exists. 3 empty wakes → end loop.

## When done

DONE entry + COMMIT in your outbox; chapter committed; MASTER updated;
tasks.md row added.
