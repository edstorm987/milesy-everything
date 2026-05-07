# Editor live-preview iframe (T3 R040)

## What

The editor admin page used to render its own canvas — a
re-implementation of the storefront renderer that *almost*
matched the published page. R040 ships a side-by-side iframe
pointing at `/<page-slug>?preview=<token>` so editors see the
actual storefront output as they edit. The two views stay in
sync via two `postMessage` frames.

## Files

- `src/lib/editorLivePreview.ts` (NEW)
  - `mintLivePreviewToken(secret, pageId, userId, ttlMs?)` —
    HMAC-SHA256 over a base64url JSON payload `{version:"lp1",
    pageId, userId, exp}`. Default TTL **5 min**, deliberately
    short — the editor refreshes the token as the operator
    keeps editing. Distinct from R035's site-level preview
    token (which carries `{agencyId, clientId, siteId}` and is
    used for stakeholder share links).
  - `verifyLivePreviewToken(secret, token, expect?)` —
    returns `{ok, payload}` or `{ok:false, reason}`. Reasons:
    `malformed`, `bad_signature`, `expired`, `wrong_version`,
    `wrong_page` (when `expect.pageId` doesn't match),
    `wrong_user` (when `expect.userId` doesn't match).
    `expect.now` overridable for deterministic tests.
  - `buildPreviewSrc(pagePath, token)` — composes the iframe
    src. Idempotent: replaces an existing `preview=` rather
    than duplicating. Preserves existing query and fragment.
    URL-encodes the token (`/` → `%2F`).
  - `isTreeChangedMessage(m)` / `isClickMessage(m)` — type
    guards for the two `postMessage` shapes.
  - `PREVIEW_MSG_TREE_CHANGED = "aqua-editor:tree-changed"` /
    `PREVIEW_MSG_CLICK = "aqua-editor:click"` — string
    constants exported so consumers don't fork the literal.
  - `readSplitPref` / `writeSplitPref` — `localStorage`-backed
    "is split view on" toggle. Per-user, persists across
    sessions. Storage interface is injectable for tests; in
    production reads from `globalThis.localStorage`.
- `src/components/EditorLivePreview.tsx` (NEW) — `<iframe>`
  wrapper with two effects:
  1. On `tree` change, posts `aqua-editor:tree-changed { tree }`
     to the iframe contentWindow. The storefront preview-mode
     handler re-fetches its content rather than rerendering
     inline — simplest correct semantics.
  2. Listens to `window.message`, verifies origin (when
     supplied), and forwards `aqua-editor:click { blockId }`
     to the editor's selection callback.
- `src/__smoke__/r040-editor-live-preview.test.ts` (NEW) — 26
  assertions: token roundtrip + version (2) / pageId/userId
  expect mismatch + match (3) / tampered + wrong secret +
  malformed (3) / expired (1) / `buildPreviewSrc` 5 cases / 8
  message-shape guards / 4 split-pref persistence cases.
- `package.json` test chain extended.

## Token shape vs R035

| Token | Module | Payload | TTL | Use |
|-------|--------|---------|-----|-----|
| Site preview (R035) | `server/preview.ts` | `{agencyId, clientId, siteId, expiresAt}` | 24h | Stakeholder share links |
| Live preview (R040) | `lib/editorLivePreview.ts` | `{pageId, userId, exp}` | 5min | Editor iframe |

Both use the same base64url + HMAC-SHA256 frame so the
storefront's preview-mode handler can dispatch on payload
shape: site-level if `siteId` present, page-level if `pageId`
present. Storefront wiring is host work — R040 ships the
helpers; the storefront route handler reads either token kind.

## postMessage contract

Two messages in flight; both prefixed `aqua-editor:` so they
don't collide with other in-frame embed buses (R013). Type
guards are exported from the lib so the iframe-side handler
and the editor-side listener share validation.

```
editor → iframe : { type: "aqua-editor:tree-changed", tree }
iframe → editor : { type: "aqua-editor:click", blockId }
```

`tree` is unknown to the helpers — preserves whatever shape
the editor passes (block array, draft snapshot, debounced
patch). Iframe responds by re-fetching its src; the renderer
stays in charge of applying the new tree.

## Q-ASSUMED

- Token TTL is 5 min, refreshed as the operator keeps editing.
  Long enough for a save → reload cycle, short enough that a
  leaked token is near-useless. R+1 may swap to JWT once T1
  standardises auth.
- `buildPreviewSrc` URL-encodes the token via
  `encodeURIComponent` rather than full-URL-encoding because
  base64url-safe chars are already URL-safe — the encode is
  belt-and-braces for any `/=` that slip through.
- `EditorLivePreview` re-fetches on tree-change rather than
  hot-patching DOM. R+1 hot-reload requires the storefront
  renderer to expose a tree-mount entry point; out of scope
  for this round.
- `origin` prop defaults to `"*"` for the postMessage target.
  The host should pass the actual origin for production
  (typically the same as the editor's window.location.origin);
  smoke verifies the listener-side origin filter works when
  supplied.

## NOT in scope (R+1)

- Hot-reload without iframe re-fetch (needs storefront tree-
  mount API).
- Multiplayer cursors / remote-selection sync.
- Storefront-side wiring of the new token kind into the
  preview-mode route handler (foundation work, T1).
- Editor-side header toggle UI (component skeleton ships;
  page-level wiring on `EditorPage.tsx` is a follow-up).
