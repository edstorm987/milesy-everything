# Sitemap.xml + robots.txt host routes (T3 R044)

## What

R036 shipped the generators (`lib/sitemap.ts`); R044 wires
them into actual host routes the foundation mounts. Crawler
traffic at `/sitemap.xml`, `/sitemap-<locale>.xml`, and
`/robots.txt` now hits R036's advanced output (changefreq,
priority, per-locale `<xhtml:link rel=alternate>` + x-default,
redirect-source filtering) instead of R014's narrow shape.

R014's `handleSitemapXml` / `handleRobotsTxt` stay exported
from `handlers/seoMeta.ts` so the static-export pipeline
(R033) can keep emitting its byte-stable narrow output. R044
specifically replaces the runtime route mounts.

## Files

- `src/api/handlers/sitemapHostRoutes.ts` (NEW)
  - `handleAdvancedSitemapXml(req, ctx)` — projects every
    page in the tenant's sites into `SitemapPageInput`,
    gathers `redirectSourceSlugs[]` for the filter, calls
    `selectSitemapPages` → `buildSitemap`. Returns
    `application/xml` with cache header
    `public, max-age=300, s-maxage=600`.
  - `handleAdvancedRobotsTxt(req, ctx)` — calls
    `buildRobotsTxt({sitemapUrl: <baseUrl>/sitemap.xml})`;
    same cache header + `text/plain`.
  - `handleLocaleSitemapXml(req, ctx)` — parses
    `/sitemap-<locale>.xml` (regex `[a-z]{2}(?:-[A-Z]{2})?`),
    filters `pages` to those whose `locales[locale]` is set,
    emits the locale-scoped sitemap. 404s on malformed paths.
  - All three guard with `requireClientScope(ctx)` — multi-
    tenant routing in v1 still threads through the per-client
    storage, so the host route handler the foundation mounts
    needs a `clientId` in `PluginCtx`.
- `src/api/routes.ts` — replaced R014's two route mounts
  (`/sitemap.xml`, `/robots.txt`) with R044 advanced handlers
  and added `/sitemap-:locale.xml`. R014 helpers stay
  imported by R033 static-export but are no longer mounted on
  the public sitemap path.
- `src/__smoke__/r044-sitemap-host-routes.test.ts` (NEW) —
  18 assertions: empty → 200 + xml + cache header + urlset
  body (3) / published-only filter (2) / redirect-source
  filter — target included, source excluded (2 + sentinel) /
  noIndex + privacy filters with control-case visible
  page (3) / scope guard returns 400 (1) / robots happy +
  sitemap pointer + admin/api disallows + cache (5) / locale
  path 404 on malformed + 200 on valid (2).
- `package.json` test chain extended.

## Filters applied at runtime

The handler stacks four filter layers before emitting:

1. R035 `status === "published"` — drafts never appear.
2. R025 `noIndex !== true` — operator-flagged hidden pages.
3. R025 `privacy === "public"` (or unset) — password / unlisted
   / members-only excluded.
4. R041 redirect-source filter — slugs that appear in any
   `redirectSourceSlugs[]` are dropped. Two consequences:
   - The new canonical URL is the only one advertised.
   - A sentinel page that lives at the redirect source slug
     (e.g. someone left an old `/about` page around after
     creating `/about-us` with `redirectSourceSlugs: ["/about"]`)
     is also dropped — the smoke verifies this with both pages
     present.

R036's underlying `selectSitemapPages` adds: portal-variant
filter (login/account/orders/affiliates pages live under
`/embed/…`), underscore-prefix slug filter.

## Cache headers

`public, max-age=300, s-maxage=600` — 5 min browser, 10 min
shared-cache. Short enough that publishes propagate quickly,
long enough to absorb crawler bursts. The host CDN can override
via response transform if SLA differs.

## Q-ASSUMED

- Per-tenant routing in v1 reuses the foundation's
  `PluginCtx.clientId` scope — the foundation maps the public
  hostname to a client before mounting plugin routes. Multi-
  tenant domain routing (Phase 12) lands post-ship; today
  every site under one client shares one `/sitemap.xml`.
- R014's narrow handlers stay exported because R033 static-
  export imports them. Removing R014 entirely is a follow-up
  refactor once R033 adopts the R036 shape too.
- Locale path matches `[a-z]{2}(?:-[A-Z]{2})?` — covers the
  R032 i18n locale grammar (`en`, `en-US`, `pt-BR`); rejects
  uppercase-locale paths (Google IndexNow normalizes to
  lowercase but a stray crawler might try `EN` — better to
  404 than emit the wrong file).
- Robots default disallows `/admin`, `/embed`, `/api` (R036
  defaults). Operators with non-standard mount paths can fork
  the handler and pass custom `disallow` to `buildRobotsTxt`.

## NOT in scope (R+1)

- Sitemap index files (split when > 50k URLs / 50 MB —
  post-ship).
- IndexNow / auto-ping after publish (post-ship; would emit a
  POST to `https://api.indexnow.org/indexnow` from the
  publish handler).
- Per-tenant routing for multi-domain hosting (Phase 12 R3 —
  needs domain-to-client resolver in foundation).
- Image / video sitemap extensions (walking image blocks +
  emitting `<image:image>` siblings inside `<url>`).
- Retiring R014 narrow handlers once R033 static-export
  adopts the R036 shape.
