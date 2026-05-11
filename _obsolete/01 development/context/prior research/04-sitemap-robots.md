# Sitemap.xml + robots.txt advanced generators (T3 R036)

## What

R014 shipped the minimal sitemap/robots used by R033 static-export.
R036 adds the production-grade pair: per-page changefreq +
priority, per-locale `<xhtml:link rel="alternate" hreflang="…">`
alternates pulling from R032 i18n, redirect/private/draft
filtering, and a basic well-formedness validator for the smoke
suite.

R014 stays in place for the static-export bundle (which is
intentionally narrower). R036 is what host Next routes call when
serving `/sitemap.xml` and `/robots.txt`.

## Files

- `src/lib/sitemap.ts` (NEW)
  - `selectSitemapPages(pages, opts)` — filters by status,
    privacy, noIndex, portalRole, underscore-prefix, and R025
    redirect sources.
  - `buildSitemap(pages, opts)` — string emitter; per-page
    `<lastmod>` (publishedAt → ISO day), `<changefreq>` (default
    `weekly`), `<priority>` (default 0.5; home 1.0; clamped to
    [0,1]), per-locale `<xhtml:link>` alternates + `x-default`.
    `xmlns:xhtml` only declared when at least one page carries
    locales.
  - `buildRobotsTxt(opts)` — structured-options API
    (`{sitemapUrl, disallow?, crawlDelay?, userAgent?,
    extraLines?}`). Defaults disallow `/admin`, `/embed`, `/api`.
    Auto-prepends leading slash on disallow paths.
  - `validateSitemap(xml)` — dep-free well-formedness check
    (declaration, urlset namespace, balanced `<url>` blocks,
    one-`<loc>` per block, generic tag balance).
- `src/__smoke__/r036-sitemap-robots.test.ts` (NEW) — 45
  assertions.
- `package.json` test chain extended.

## Filtering rules (selectSitemapPages)

A page survives iff **all** of the following hold:

- `status === "published"`
- `noIndex !== true`
- `portalRole` is unset (login/account/orders/affiliates pages
  live under `/embed/…`)
- `privacy` is unset or `"public"`
- slug doesn't start with `_` or `/_` (private internal slugs)
- slug isn't in the supplied redirect-source set

`redirectFromSlugs` accepts an array or a `Set` so callers can
pass `Object.keys(redirectMap)` directly.

## hreflang shape

The sitemap form differs from R032's HTML form: `<xhtml:link
rel="alternate" hreflang="…" href="…" />`. We delegate URL
construction to `localizedUrl(slug, locale, defaultLocale)` so
the URL convention (default-unprefixed, non-default `/<loc>/…`)
stays in one place. `x-default` always points at the
defaultLocale URL.

## Q-ASSUMED

- `lib/sitemap.ts` (new) lives alongside `server/sitemap.ts`
  (R014). Two modules so the static-export round (which deals in
  byte-stable, dep-free output) doesn't get pulled into the
  i18n/redirect dependencies. Next round (or a small follow-up)
  can refactor R014 to call R036 once we're confident the new
  shape is what static-export needs too.
- `validateSitemap` is a regex-based well-formedness check, not
  a full XML parser. It catches the failure modes the smoke
  cares about (unbalanced url blocks, multi-loc inside a `<url>`,
  missing namespace) without pulling in `node:xml` or sax. A
  third-party validator (e.g. `xmllint --noout`) is the gate to
  run in CI; the helper is what the smoke uses inline.
- Generic-tag balance counter ignores self-closing tags like
  `<xhtml:link … />` because the open-tag regex requires `(?<!\/)>`
  (no slash immediately before close). Smoke verifies this on
  the i18n sitemap.
- "Per-page lastmod from version history" deferred per prompt —
  `publishedAt` is the source for now.
- `/api`, `/embed`, `/admin` are the host-canonical disallows;
  operators with non-default routes pass an explicit `disallow:
  []` to override.

## NOT in scope

- Image-sitemap / video-sitemap extensions.
- Per-page lastmod sourced from version history.
- Multi-sitemap index files (split when > 50k URLs).
- Auto-pinging Google/Bing sitemap endpoints.
- Host Next route wiring (`app/sitemap.xml/route.ts` is
  one-liner R+1).

## R+1 candidates

- `app/sitemap.xml/route.ts` + `app/robots.txt/route.ts` host
  routes that pull pages via the editor's API and call these
  helpers.
- Sitemap index file when site has > 50k URLs (or > 50 MB
  output).
- `lastmodFromVersionHistory(page, versions)` helper that picks
  the most-recent version timestamp instead of `publishedAt`.
- Image-sitemap extension: walk every `image` block in each
  page's published tree and emit `<image:image>` entries.
- Auto-ping after publish: POST sitemap URL to Google /
  IndexNow on every promote-to-published.
- R014 module retired or aliased to call into R036 once
  static-export adopts the advanced shape.
