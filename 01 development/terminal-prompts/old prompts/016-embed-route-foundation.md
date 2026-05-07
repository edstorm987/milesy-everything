/loop

# T1 — Round 016: `/embed/[clientSlug]/[variant]` foundation route

Q-FOLLOWUP from T3 R013: foundation needs the `/embed/[clientSlug]/
[variant]` route + middleware that reads T3's `getEmbedAllowList` and
emits the `frame-ancestors` CSP. Ships the iframe-embed customer
surface that T3 wired the editor for.

## Mandatory pre-read

1. T3 R013 chapter `04-iframe-embed-surface.md`.
2. T1 R009 OAuth chapter — `EmbedLogin` component (used by this route).
3. Chapter 09 storefront recursion + chapter 12 bridge postMessage.

## Scope

**A** — Route `app/embed/[clientSlug]/[variant]/page.tsx`. Server-
renders: load client by slug, load variant tree, apply brand kit,
render variant blocks via website-editor BlockRenderer. Strip chrome.

**B** — Middleware reads `getEmbedAllowList(storage, agencyId,
clientId)` and emits `Content-Security-Policy: frame-ancestors
<allow-list>` header. Default deny.

**C** — Auth: same-cookie session as main app. If unauthenticated,
render the existing EmbedLogin component scoped to this client.

**D** — `postMessage` bridge (from chapter 12): emits `aqua:auth-ok`,
`aqua:height-changed`, `aqua:navigate` events to host window via
T3's `embedBridge` runtime.

**E** — Smoke `§ Embed route` (allow-listed origin loads → 200; non-
allowed origin → CSP blocks; unauthed render shows EmbedLogin).

**F** — Chapter `04-embed-foundation-route.md` + MASTER row.

## NOT in scope

- Custom-domain provisioning (T6).
- Cross-tenant embed (out of scope per requirements).

## When done
DONE referencing `016-embed-route-foundation.md`.
