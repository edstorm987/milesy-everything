# `04` `/embed/[clientSlug]/[variant]` foundation route (T1 R16)

> Authored 2026-05-07. Closes the Q-FOLLOWUP from T3 R013 — foundation
> ships the iframe-embeddable customer surface paired with a CSP
> middleware that consumes T3's `getEmbedAllowList` registry.

## Files touched

- `portal/src/lib/server/embedAllowResolver.ts` (NEW)
  - `resolveEmbedAllowList(slug)` — scans agencies, finds the first
    client whose slug matches; loads the website-editor install via
    `getInstall(scope, "website-editor")`; builds a `PluginCtx` via
    `makeCtx(install)` and reads
    `getEmbedAllowList(ctx.storage, agencyId, clientId)`. Returns
    `{ found, origins, agencyId?, clientId? }`. Unknown slug or
    missing install → empty origins (default-deny).
  - `frameAncestorsValue(origins)` — empty → `'none'`; populated →
    space-separated list (the source-list shape CSP wants).
- `portal/middleware.ts` (NEW, top-level Next.js middleware)
  - `runtime: "nodejs"` so the resolver can read foundation state +
    plugin storage.
  - Matches `/embed/:slug/:variant` — defensively only acts on
    exactly 3 path segments (so `/embed/login` keeps its own
    headers).
  - Wraps the resolver in try/catch; any error → fail-closed
    `'none'` so a misconfigured tenant never accidentally
    exposes its surface.
  - Sets `Content-Security-Policy: frame-ancestors <list>` on
    every matched response.
- `portal/src/app/embed/[clientSlug]/[variant]/page.tsx` (NEW)
  - Server component, `dynamic = "force-dynamic"`. Validates
    `variant` against `isPortalRole`; 404 on unknown.
  - Slug → client resolution scans `listAgencies()` and picks the
    first match (Q-ASSUMED slug-uniqueness).
  - **Auth fallback**: when `getSession()` returns null, renders a
    bare `<html>` with the existing R9 `<LoginForm embedded
    clientId={...} googleEnabled={...}>` scoped to the resolved
    client. `data-testid="embed-login"` for smoke.
  - **Authed path**: builds a `PluginCtx` for the website-editor
    install, calls `getOrCreateDefaultSite` → `getActivePortalVariant
    (storage, agencyId, clientId, siteId, variant)`. Empty active
    variant → `data-testid="embed-empty"` empty state with a deep-
    link back into the per-client portal tab. Populated variant →
    `<RenderBlocks>` walker that emits one `<li>` per block with
    `props.text`/`props.title`/`props.headline` if present —
    minimal v1 surface (full T3 BlockRenderer integration is the
    polish path; documented below).
  - Brand kit injected via `<ThemeInjector brand={client.brand}
    scope="customer">` so the new 16-var palette (T1 R15) lights up
    the embed.
  - Strips chrome — full `<html><body>` returned manually so no
    Sidebar/Topbar/banner ride along.
- **postMessage bridge** (inline `<script>`): emits
  - `aqua:auth-ok { authed, slug, variant }` on every render,
  - `aqua:height-changed { height }` on initial paint + on
    `ResizeObserver` ticks (with `resize` fallback),
  - `aqua:navigate { href }` on every in-iframe link click
    (capture phase, closest `a[href]`).
  Matches T3 chapter 12's contract; embed-host page can listen and
  resize the iframe / track navigations / detect auth.

## Smoke (`§ Embed route`)

5 checks:
1. `GET /embed/luv-and-ker-demo/account` returns 200 (demo seed
   includes Felicia mirror with that slug).
2. Response carries a `content-security-policy: frame-ancestors`
   header.
3. Body shows `embed-surface` or `embed-login` testid (depending on
   demo session state).
4. Unknown slug `no-such-client` → `frame-ancestors 'none'`.
5. Invalid variant (`not-a-role`) → 404.

## Q-ASSUMED log

1. **Slug uniqueness across agencies** for the embed URL. Foundation
   schema currently scopes slugs per-agency; if collisions become
   real, R+1 either nests the URL as `/embed/<agency>/<client>/...`
   or adds a registry index.
2. **Minimal block walker, not the full T3 BlockRenderer.** T3's
   `BlockRenderer` is `"use client"` + relies on a runtime block
   registry. The embed surface ships a server-rendered placeholder
   that walks the tree and emits a labelled `<li>` per block —
   enough to verify the end-to-end auth + CSP path. Polish round
   swaps in T3's renderer once the registry can hydrate inside an
   embed surface.
3. **Middleware on `runtime: "nodejs"`.** Edge runtime can't read
   the file-backed PluginStorage cleanly. Next.js 16.2.4 supports
   node runtime middleware natively.
4. **Fail-closed default**. Resolver throw or unknown slug → CSP
   `'none'`. No accidental open iframes. Documented in
   middleware.ts.
5. **Auth fallback uses R9 `LoginForm` directly** (not a separate
   embed-only login). `embedded` prop already handles iframe-aware
   navigation; `clientId` scopes the auth lookup to the embed's
   client.
6. **Relative-path imports of website-editor internals** — same
   pattern as R7/R14/R15, bypasses node_modules snapshot lag.

## NOT in scope

- Custom-domain provisioning (T6 territory).
- Cross-tenant embed (out of scope per requirements).
- Full T3 `BlockRenderer` integration (R+1 polish — the runtime
  block registry needs to hydrate cleanly inside the embed shell).
- Per-block split-test or theme-token override flows (T3 owns).
- Touching milesymedia / business-os.

## Smoke results

`§ Embed route` block adds 5 checks. tsc clean. HARD BOUNDARY
honoured.
