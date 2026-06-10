/loop

# T3 — Round 036: Sitemap.xml + robots.txt generators

Pure generators that take a site's published pages and emit a valid
`sitemap.xml` (including hreflang alternates from R032 i18n) and a
`robots.txt`. Host integration is a one-liner Next route.

## Mandatory pre-read

1. R032 i18n hreflang helper (already exposes `buildHreflangLinks`).
2. R035 draft/published split (only published pages emit).
3. R026 SEO/meta chapter (canonical URL helper).

## Scope

**A** — `lib/sitemap.ts`:
- `buildSitemap(pages, opts)` → string. Each `<url>` carries `<loc>`,
  `<lastmod>` (page.publishedAt), `<changefreq>` (default `weekly`),
  `<priority>` (default 0.5; home 1.0; configurable per-page), and one
  `<xhtml:link rel="alternate" hreflang=...>` per locale via
  `buildHreflangLinks`.
- `buildRobotsTxt(opts)` → string. Inputs: `disallow[]` (default
  `/admin`, `/embed`, `/api`), `sitemapUrl`, optional `crawlDelay`.

**B** — Validation: `validateSitemap(xml)` returns parse errors (basic
well-formedness check). Used in smoke.

**C** — Helper `selectSitemapPages(pages)` — filters drafts, private,
redirected pages out (uses R024 redirects + R025 private flag if
present).

**D** — Smoke `§ Sitemap + robots` (≥10 cases — multi-locale with
hreflang, single-locale, private-page exclusion, redirect exclusion,
robots disallow shape, well-formedness).

**E** — Chapter `04-sitemap-robots.md` + MASTER row + tasks row.

## NOT in scope

- Image-sitemap / video-sitemap extensions (R+1).
- Per-page lastmod from version history (R+1 — uses publishedAt for
  now).

## When done
DONE referencing `036-sitemap-robots.md`.
