# Static export — sitemap bundle (T3 R046)

## What

R033 shipped static-site export (downloads ZIP). R036 + R044
shipped advanced sitemap + robots. R046 swaps the bundled
`sitemap.xml` and `robots.txt` from R014's narrow generators
to R036's advanced ones, and adds per-locale
`sitemap-<locale>.xml` files when the site has any
locale-tagged pages.

Same filter stack as the runtime route handlers (R044): drafts
excluded (R035), private + noIndex excluded (R025),
redirect-source slugs filtered (R041), portal-variants and
underscore-prefixed slugs filtered (R036).

## Files

- `src/server/staticExport.ts` (modified)
  - Imports swapped: `./sitemap` (R014 narrow) → `../lib/sitemap`
    (R036 advanced) using `selectSitemapPages`,
    `buildSitemap` (aliased `buildAdvancedSitemap`),
    `buildRobotsTxt` (aliased `buildAdvancedRobotsTxt`),
    `SitemapPageInput`.
  - Page projection updated — `SitemapPageInput` carries
    `publishedAt`, `privacy`, `noIndex`, `isHomepage`,
    `portalRole`, `locales` (R032 shape:
    `{defaultLocale, locales: Record<localeCode, ...>}`).
  - `redirectSources[]` gathered across all pages and passed
    to `selectSitemapPages({redirectFromSlugs})`.
  - Per-locale loop: scan filtered pages for any `locales`,
    union all locale codes, emit `sitemap-<locale>.xml` per
    locale containing only the pages tagged with that
    locale.
  - `buildAdvancedRobotsTxt({sitemapUrl: <baseUrl>/sitemap.xml})`
    replaces the R014 `buildRobotsTxt(pages, baseUrl)` form;
    defaults disallow `/admin`, `/embed`, `/api`.
- `src/__smoke__/r046-static-export-sitemap-bundle.test.ts`
  (NEW) — 21 assertions, scanning the ZIP byte stream for
  local-file headers + entry payloads:
  - bundle has sitemap + robots + README (3)
  - R036 advanced shape — `<priority>` + `<changefreq>`
    elements present, full-URL `<loc>` (4)
  - drafts excluded (2: published in, draft out)
  - redirect-source filter — target included, source excluded
    even when a sentinel page lives at the source slug (2)
  - noIndex + privacy filters with control-case visible
    page (3)
  - robots advanced shape — sitemap pointer + admin/api
    disallows (3)
  - per-locale: `sitemap-en.xml` + `sitemap-fr.xml` bundled +
    well-formed urlset (3)
  - no-locale site ships only `sitemap.xml` + `robots.txt`
    (no per-locale variants) (1)
- `package.json` test chain extended.

## ZIP scanner (smoke utility)

The smoke parses the export ZIP without a dep. Each local
file entry in a store-only ZIP starts with `PK\x03\x04`
followed by 30-byte header → name → extra → payload.
`zipNames(zip)` walks signatures collecting names;
`zipEntry(zip, name)` returns the payload as UTF-8 text. The
exported ZIP is store-only (no compression — see R033
chapter), so the payload bytes are the file bytes.

## Filters at export time vs runtime

Two emission paths now share the same filter logic via R036's
`selectSitemapPages`:

| Path | Module | Cache |
|------|--------|-------|
| Runtime route | `api/handlers/sitemapHostRoutes.ts` (R044) | 5min/10min |
| Static export | `server/staticExport.ts` (R046) | n/a — file bake |

A page that flips from public to private after a static
export ships with the ZIP would still be in the bundled
sitemap until the operator re-exports. Honesty caveat already
documented in R033 chapter ("snapshot, not running portal");
R046 inherits.

## Q-ASSUMED

- R014 `server/sitemap.ts` stays for now (R033 prompt
  mentioned "still used elsewhere; R+1 cleanup post-ship").
  R046 doesn't break R014's exports — `handleSitemapXml` /
  `handleRobotsTxt` from `handlers/seoMeta.ts` still build
  on R014. They're just no longer mounted on the public
  routes (R044) AND no longer driving the export bundle
  (R046). Pure helper module retained for whatever else
  imports it (probably nothing — R+1 audit + retire).
- Per-locale sitemaps only emit when at least one page
  carries `locales`. Single-locale sites ship one
  `sitemap.xml` + one `robots.txt` — minimal bundle bloat.
- `sitemap-<locale>.xml` filtering uses
  `p.locales.locales[loc]` truthy — pages without a slug
  entry for that locale are dropped.
- ZIP smoke is byte-stream scan rather than a real unzip
  library — keeps the smoke dep-free. Production ZIPs are
  store-only (R033 contract) so fixed-offset parsing works.

## NOT in scope (R+1)

- Retiring R014 narrow generators entirely (post-ship audit
  + delete pass; needs grep for any remaining imports).
- Editor UI for sitemap config (today operators control
  emission via per-page toggles — noIndex, privacy,
  redirectSourceSlugs).
- Sitemap-index file when bundle exceeds 50k URLs.
- Image-sitemap extensions in the bundle.
- IndexNow ping after publish (orthogonal — runtime route
  + publish handler).
