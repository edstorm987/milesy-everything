# `04` Client portal — Luv & Ker (Felicia)

> Authored 2026-05-05 by T5 R1. The first real per-client portal under
> `04 the final portal/clients/<slug>/`. This chapter is the canonical
> shape T2 R11's "Export to repo" generator must reverse-engineer.
> Extends `04-architecture.md` (locked v1) and
> `04-architecture-extension-per-client-portals.md` (chapter 19b).

## Why it exists

The shared Aqua portal (`portal/`) runs the agency-team admin + the
editor for Live clients. When a client reaches Live phase, the agency
operator clicks "Export to repo" — which materialises a self-contained
Next.js app at `clients/<slug>/`. That app is the deployable thing
their custom domain points at. Felicia / Luv & Ker is the first such
client, so this folder is hand-built as the reference target before
the generator exists.

## Folder layout (canonical for the generator)

```
04 the final portal/clients/luv-and-ker/
├── package.json                          ← Next 16 + React 19 + TW 4 +
│                                          6 plugin workspace deps
├── next.config.ts                        ← transpilePackages limited to
│                                          this client's plugin set
├── tsconfig.json                         ← strict, paths "@/*" → src/*
├── tailwind.config.ts                    ← brand utility colours wired
│                                          to CSS variables
├── postcss.config.mjs                    ← @tailwindcss/postcss
├── .npmrc                                ← install-links=true (Turbopack
│                                          + file: workspace deps)
├── .env.example                          ← PORTAL_API_ORIGIN +
│                                          NEXT_PUBLIC_PORTAL_AUTH_ORIGIN
├── .gitignore                            ← per-app sandbox
├── portal-config.json                    ← THE manifest — see below
├── public/
│   ├── luv-and-ker-wordmark.svg          ← brand wordmark
│   └── favicon.svg
└── src/
    ├── app/
    │   ├── globals.css                   ← brand-token CSS vars + base
    │   │                                  styles (btn-primary / -ghost)
    │   ├── layout.tsx                    ← reads portal-config, injects
    │   │                                  brand tokens via <style>:root
    │   ├── page.tsx                      ← public storefront landing
    │   ├── login/page.tsx + LoginPanel.tsx
    │   ├── account/page.tsx              ← member home (gated)
    │   ├── orders/page.tsx               ← order history (gated)
    │   ├── affiliates/page.tsx           ← refer & earn (gated)
    │   ├── shop/page.tsx + [id]/page.tsx
    │   ├── cart/page.tsx
    │   ├── checkout/page.tsx
    │   ├── order-success/page.tsx
    │   ├── embed/login/page.tsx          ← iframe-able branded login
    │   └── api/[...path]/route.ts        ← catch-all proxy → shared portal
    ├── components/
    │   ├── chrome/{Header,Footer,MemberDrawer}.tsx
    │   └── storefront/{Hero,FeaturedProducts,BrandStory,Newsletter}.tsx
    ├── lib/
    │   ├── portalConfig.ts               ← typed loader + helpers
    │   ├── brandKit.ts                   ← brandToCss / brandToStyleString
    │   ├── apiClient.ts                  ← same-origin fetch helpers
    │   └── sessionUser.ts                ← server-side getSessionUser
    └── server/
        └── pluginDispatch.ts             ← lazy manifest cache + block
                                            catalogue
```

Strict rule: nothing outside this folder is owned by the per-client
portal. Heavy logic (storage, auth, plugin runtime, editor saves) lives
in `portal/`. The per-client app is a brand + content shell.

## `portal-config.json` shape

```jsonc
{
  "$schema": "https://aqua.milesymedia.com/schemas/portal-config.v1.json",
  "client": {
    "id": "luv-and-ker",
    "slug": "luv-and-ker",
    "name": "Luv & Ker",
    "tagline": "Odo by Felicia",
    "agencyId": "milesy",
    "websiteUrl": "https://luvandker.com"
  },
  "brand": {
    "logoUrl": "/luv-and-ker-wordmark.svg",
    "primaryColor": "#F97316",
    "secondaryColor": "#FFF7ED",
    "accentColor": "#7C3AED",
    "fontHeading": "Playfair Display, ui-serif, Georgia",
    "fontBody": "ui-sans-serif, system-ui",
    "borderRadius": "8px",
    "customCSS": ""
  },
  "auth": {
    "origin": "https://milesymedia.com",
    "embedLoginPath": "/embed/login",
    "loginPath": "/login",
    "cookieName": "lk_session_v1"
  },
  "installedPlugins": [
    { "id": "website-editor", "version": "0.1.0" },
    { "id": "ecommerce", "version": "0.1.0" },
    { "id": "memberships", "version": "0.1.0" },
    { "id": "affiliates", "version": "0.1.0" },
    { "id": "client-crm", "version": "0.1.0" },
    { "id": "forms", "version": "0.1.0" }
  ],
  "portalVariants": {
    "login": "felicia-login-v1",
    "account": "felicia-account-v1",
    "orders": "felicia-orders-v1",
    "affiliates": "felicia-affiliates-v1"
  },
  "content": {
    "site.name": "Luv & Ker",
    "site.description": "...",
    "navbar.wordmark1": "LUV",
    "navbar.wordmark2": "KER",
    "hero.headline1": "Pure. Sacred.",
    "hero.headline2": "Alive.",
    "...": "..."
  }
}
```

The four top-level objects are the four things the generator collects
from the editor at "Export to repo" time:

1. **`client`** — identity + agency parent. Values come from the
   `Client` row in shared portal storage.
2. **`brand`** — the `BrandKit` from the same row. Brand tokens are
   sourced from `portal/src/lib/server/demoSeed.ts` (Felicia mirror) for
   the canonical Luv & Ker palette: `#F97316` orange / `#FFF7ED` cream /
   `#7C3AED` accent / Playfair Display heading / 8px radius.
3. **`installedPlugins`** — the list of `pluginInstalls` rows scoped to
   this client (excluding agency-side plugins).
4. **`portalVariants`** — the active `EditorPage` IDs returned by
   `getActivePortalVariant({ clientId, role })` for each `PortalRole`.
5. **`content`** — published key/value content overrides from the
   website-editor's content store (the same `useContent("…")` keys the
   prototype reads in `04 the final portal/clients/felicias perfect portal/portal.config.ts`).

## API-proxy pattern

```
clients/luv-and-ker/src/app/api/[...path]/route.ts
       │
       ▼  (catch-all — every method)
fetch(  PORTAL_API_ORIGIN + "/api/<path>",
        { method, headers: copy minus hop-by-hop, body: stream } )
       │
       ▼
shared portal at localhost:3030 (dev) /
                  milesymedia.com  (prod)
       │
       ▼  (response streamed back, Set-Cookie preserved)
browser (cookie scoped to milesymedia.com origin)
```

`PORTAL_API_ORIGIN` env var picks the upstream:
- unset + `NODE_ENV !== "production"` → `http://localhost:3030`
- unset + production → falls back to `portal-config.auth.origin`
- set → exact value (allows pointing at staging / per-PR previews).

When upstream is unreachable, the proxy returns `502
{ error: "portal-upstream-unreachable", upstream, detail }` rather than
crashing.

Auth flow:

1. Visitor lands on `luvandker.com` (or the dev port `localhost:4040`).
2. Visitor opens an iframe to `luvandker.com/embed/login?return=...`
   (or navigates to `/login` directly).
3. The form POSTs `/api/auth/login` → catch-all proxy →
   `milesymedia.com/api/auth/login`.
4. The shared portal sets `lk_session_v1` on the milesymedia.com origin
   AND in the proxy response (so on a same-origin nav to /account, the
   per-client portal can also see the cookie via the proxy).
5. `src/lib/sessionUser.ts` calls `/api/auth/me` server-side and
   returns the resolved user. Member-only pages (account / orders /
   affiliates) redirect to `/login` when no session.

> **Cookie domain note** — for the iframe story to work in production,
> `lk_session_v1` must be set with `SameSite=Lax`. Cross-domain Set-
> Cookie from milesymedia.com via fetch in the iframe requires the
> shared portal to set `Domain=.milesymedia.com` and the per-client
> portal to live on a subdomain of milesymedia.com OR the cookie to be
> set per-origin via the proxy passthrough. Logged as Q-ASSUMED for
> commander review — current code preserves Set-Cookie verbatim, which
> works in dev (same machine) but production may need a cookie-domain
> tweak in `portal/src/lib/server/auth.ts` and a doc update.

## Brand-kit injection

`src/app/layout.tsx` is a server component that:

1. Loads `portal-config.json` once.
2. Calls `brandToStyleString(cfg.brand)` to render
   `:root { --brand-primary: …; --brand-secondary: …; … }`.
3. Inserts that string into a `<style>` tag inside `<head>` via
   `dangerouslySetInnerHTML`.
4. Wraps `<body>` with the `next/font` Playfair Display + Inter font
   variables so `font-family: var(--brand-font-heading)` resolves.

Every block, chrome component, and storefront section reads
`var(--brand-primary)` / `var(--brand-accent)` / etc. — no colour is
hard-coded. The same machinery as the shared portal at
`portal/src/lib/chrome/brandKit.ts` (mirror, not import — the
per-client portal cannot reach into shared portal source).

`src/app/globals.css` declares safe defaults for the same custom
properties so the document still renders if the inline style fails to
load.

## Plugin workspace deps

`package.json` declares only the plugins this client uses:

```jsonc
"@aqua/plugin-affiliates":     "file:../../plugins/affiliates",
"@aqua/plugin-client-crm":     "file:../../plugins/client-crm",
"@aqua/plugin-ecommerce":      "file:../../plugins/ecommerce",
"@aqua/plugin-forms":          "file:../../plugins/forms",
"@aqua/plugin-memberships":    "file:../../plugins/memberships",
"@aqua/plugin-website-editor": "file:../../plugins/website-editor",
```

Deliberately excluded:
- `@aqua/plugin-fulfillment` — agency-side phase engine.
- `@aqua/plugin-agency-hr / -finance / -marketing` — agency-side.
- `@aqua/plugin-email-sender` — lives in shared portal; per-client
  portal calls `/api/portal/email-sender/...` via the proxy.

`next.config.ts` lists exactly those six plugin packages in
`transpilePackages` so Turbopack compiles their TypeScript source
rather than treating them as built node_modules. `.npmrc` sets
`install-links=true` so `npm install` materialises the workspace deps
as real copies (Turbopack 16 doesn't follow npm's default symlinks for
those).

## Variants used + which pages render them

`portal-config.json#portalVariants` lists the active variant IDs per
`PortalRole`. The shared portal's
`@aqua/plugin-website-editor/server`:`getActivePortalVariant({
clientId, role })` resolves these to published `EditorPage` block
trees.

| Page route | Role | Variant ID assigned | Render strategy in v1 |
|---|---|---|---|
| `/login` | `login` | `felicia-login-v1` | Hand-coded `LoginPanel` (variant render via shared portal pending). |
| `/account` | `account` | `felicia-account-v1` | Hand-coded membership/affiliate/orders cards reading per-plugin endpoints; will switch to variant render when available. |
| `/orders` | `orders` | `felicia-orders-v1` | Hand-coded fetch from `/api/portal/ecommerce/customer/orders`. |
| `/affiliates` | `affiliates` | `felicia-affiliates-v1` | Hand-coded fetch from `/api/portal/affiliates/me`. |

Per the prompt's Phase C guidance — "Where a variant doesn't exist
yet, render a faithful hand-coded version Felicia would actually use."
The hand-coded versions read brand tokens + content from
`portal-config.json` so swapping in the published variant later is a
pure rendering change, not a content migration.

## Cross-team handoffs

- **T2 R11 — Export-to-repo generator.** Ship the generator that
  produces this exact folder shape. Every file under
  `clients/luv-and-ker/` is the canonical reference. The seven inputs
  the generator consumes are listed in chapter 19b §"Export to repo
  flow"; the output is exactly this tree minus the `node_modules` /
  `.next` / hand-coded variant fallbacks.
- **T6 R1 — Deployment + custom domains.** When this folder lands as a
  Vercel project, T6 attaches `luvandker.com` to the deployment and
  sets `PORTAL_API_ORIGIN=https://milesymedia.com` in the project's
  env vars. Confirm `lk_session_v1` cookie domain config (see API
  proxy section above).
- **T1 — Cookie-domain config.** When per-client portals on third-
  party domains (luvandker.com) need to read the `lk_session_v1`
  cookie, the shared portal's auth setter may need a
  `Domain=.milesymedia.com` tweak OR the per-client portal must
  proxy-passthrough every auth request (the current model). Logged
  Q-ASSUMED; recommend keeping proxy-passthrough for v1.

## Smoke notes

- `npm install` clean (54 packages).
- `npx tsc --noEmit` clean.
- `npm run dev` boots Turbopack on `localhost:4040` in ~850ms.
- `GET /` → 200 with brand wordmark + Hero + featured + story + newsletter.
- `GET /login` → 200, branded sign-in panel.
- `GET /embed/login` → 200, iframe-friendly compact panel.
- `GET /account` → 307 → `/login` when unauthenticated.
- `GET /shop` → 200 with placeholder product grid (falls back when
  upstream `/api/portal/ecommerce/storefront/products` returns 401 or
  is unreachable).
- `GET /api/auth/me` → upstream's response (401 unauthorised when
  cookie absent; was previously crashing the proxy on
  `getaddrinfo ENOTFOUND` when the prod origin was hit in dev — fixed
  by defaulting `PORTAL_API_ORIGIN` to `localhost:3030` in dev).

## What this folder is NOT

- Not a place for new business logic. If you need a new feature, ship
  a plugin (or extend an existing one) at `04 the final portal/plugins/`.
- Not a place to fork the editor. Edits land in the shared portal's
  editor and flow back to this folder via T3 R6's promote mechanism.
- Not a place for shared utilities. Code that more than one client's
  portal would want lives in a plugin or in `portal/src/`. Each
  per-client folder must stay self-contained enough to deploy alone.
