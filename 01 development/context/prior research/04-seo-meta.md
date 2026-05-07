# 04 — SEO + meta + favicon (T3 R014)

T3 Round 014. Each page edited in the website-editor needs a clean
meta layer: title, description, OG image, canonical, favicon, sitemap.
R014 closes the SEO surface — extends `EditorPageSeo`, ships favicon
URL derivation, sitemap.xml + robots.txt endpoints, and a server-
side OG card generator (SVG, no extra deps).

## 1. State on entry

`EditorPageSeo` already covers `metaTitle / metaDescription /
ogTitle / ogDescription / ogImage / twitterCard / schemaJsonLd /
noIndex` (R002+). R014 adds:

```ts
canonical?: string        // explicit canonical URL (defaults to absolute)
keywords?: string[]       // comma-joined into <meta name="keywords">
```

These flow through the existing `EditorPage.seo` blob — no separate
storage, no migration. Editor sidebar SEO tab picks them up
automatically once host page wires the `keywords[]` input + the
canonical URL field.

## 2. Favicon URLs

NEW `lib/faviconUrls.ts`:

- `deriveFaviconUrls(brand, override?)` returns the 4-resolution
  set + `manifestThemeColor`. When `brand.logoUrl` is set (or a
  per-variant `override.logoUrl` is supplied) every URL points
  there. When unset, falls back to `/favicon-default-{32,180,192}.png`
  + `/favicon-default.ico` (foundation serves these as a 1×1 SVG
  scaled — Q-FOLLOWUP for T1 to land the static fallbacks).
- `faviconHeadLinks(urls)` emits the 5 head fragments
  (`<link rel="icon">` × 3, `<link rel="apple-touch-icon">`,
  `<meta name="theme-color">`) ready to stamp into the per-tenant
  layout.

## 3. Sitemap + robots

NEW `server/sitemap.ts` ships pure string builders:

- `buildSitemapXml(pages, baseUrl)` — emits valid `<urlset>`
  document with one `<url>` per published, non-noIndex,
  non-portal-variant, non-underscore-slug page. `<lastmod>`
  emitted when `updatedAt` present. XML-escaped.
- `buildRobotsTxt(pages, baseUrl)` — `User-agent: * / Allow: /`
  + `Disallow: /<slug>` per noIndex page + always
  `Disallow: /_*` + `Disallow: /embed/` + `Sitemap: <baseUrl>/
  sitemap.xml` pointer.

Endpoints (under `/api/portal/website-editor/`):

- `GET /sitemap.xml` — content-type `application/xml; charset=
  utf-8`, cache 5 min.
- `GET /robots.txt` — `text/plain; charset=utf-8`, cache 5 min.

Both gated through `requireClientScope`. Foundation can route
`https://<client-domain>/sitemap.xml` → this endpoint via a thin
rewrite (R+1, T1 territory).

## 4. OG card generator

NEW `server/ogImageGenerator.ts`:

- `buildOgCardSvg({ title, brandName?, primaryColor, textColor?,
  fontFamily?, width?=1200, height?=630 })` — emits 1200×630 SVG.
  Title wraps to ≤4 lines (~30 chars/line) with ellipsis on
  overflow. Brand name renders as a smaller subtle line at the
  bottom. Text colour auto-derives from background luminance
  (light bg → `#0b1220`, dark bg → `#f5f3ec`); operator
  `textColor` override always wins. XML-escaped throughout.
- `buildOgCardDataUrl(opts)` — convenience wrapping the SVG in a
  base64 data URL for editor-preview use (`data:image/svg+xml;
  base64,…`). Production should serve from the route below
  since many social crawlers refuse data URIs.

`GET /og?title=…&color=…&brand=…&textColor=…` endpoint emits SVG
with 1-day immutable cache. No tenant scope — operator composes
the URL themselves with their brand colour + title. Missing title
→ 400.

## 5. Sitemap walk

`collectSitemapPages(storage, agencyId, clientId)` (server-only,
collated inside the handler) walks every site's pages via
existing `listSites` + `listPages`, projects each into the
`SitemapPage` shape (slug / status / updatedAt / isPortalVariant
/ noIndex from `seo.noIndex`). Filtering happens in the pure
builder so `buildSitemapXml` is independently testable.

## 6. Smoke

NEW `__smoke__/r014-seo-meta.test.ts` 33/33 pass:

- favicon: brand logo wins, fallback when unset, per-variant
  override, faviconHeadLinks emits 5 head fragments.
- sitemap: XML 1.0 declaration + `<urlset>`, published-non-
  noIndex-non-portal pages only (drafts / noIndex / portal-
  variants / underscore-prefixed slugs all excluded), `<lastmod>`
  on updatedAt presence, base-URL trailing-slash stripped, XML
  escape of ampersands in slugs.
- robots: User-agent header, per-noIndex Disallow, always-
  Disallow `/_*` + `/embed/`, sitemap pointer.
- OG card: valid SVG, brand name surface, multi-tspan title wrap,
  light/dark text auto-pick, custom textColor override, XML
  escape on title, buildOgCardDataUrl returns base64 SVG URI.
- HTTP shape: `/sitemap.xml` 200 application/xml, empty case
  still valid `<urlset>`; `/robots.txt` 200 text/plain with
  always-emitted sitemap pointer; `/og` 200 image/svg+xml with
  title + 400 without title.

`@aqua/plugin-website-editor` package.json test chain extended.
tsc-clean.

## 7. Files

- `plugins/website-editor/src/types/editorPage.ts` patch
  (`EditorPageSeo` + canonical + keywords).
- `plugins/website-editor/src/lib/faviconUrls.ts` (NEW).
- `plugins/website-editor/src/server/sitemap.ts` (NEW).
- `plugins/website-editor/src/server/ogImageGenerator.ts` (NEW).
- `plugins/website-editor/src/api/handlers/seoMeta.ts` (NEW —
  three handlers: sitemap.xml / robots.txt / og).
- `plugins/website-editor/src/api/routes.ts` patch (3 new routes).
- `plugins/website-editor/src/__smoke__/r014-seo-meta.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 8. Q-ASSUMED / deviations

- Editor sidebar "SEO" tab — UI surfacing of canonical + keywords
  inputs is host-page concern; the type extension lights up
  whatever SEO sidebar T3 R+1 ships. Existing
  `EditorPropertiesSidebar` already drives field-form rendering
  per `BlockField`, but page-level SEO has its own panel that
  R014 doesn't touch.
- Favicon fallback URLs (`/favicon-default-{32,180,192}.png` +
  `.ico`) — foundation serves these (T1 territory). R014 ships
  the helper; T1 lands the actual static assets when ready.
  Editor preview shows `<link>` tags pointing at these paths;
  if foundation hasn't landed them, the browser renders a
  broken-image-icon for now (cheap to fix, not blocking).
- OG card uses SVG, not raster PNG. Many social crawlers prefer
  PNG/JPEG; R+1 candidate is `sharp`-based rasterisation in a
  foundation route. SVG works in Twitter card previews + most
  modern previews; cheap-and-robust beats heavy-and-perfect.
- No @vercel/og — the typography is plain SVG `<text>` with a
  system-font stack. Crisp, fast, dependency-free. Custom fonts
  are R+1 (would need font subsetting + base64 inlining or a
  proper raster pipeline).
- Per-page "schema.org structured data" remains in the existing
  `EditorPageSeo.schemaJsonLd` field (free-form string) — out
  of scope per prompt.
- Per-portal-variant favicon override — `deriveFaviconUrls`
  accepts an `override.logoUrl` second arg; per-variant wiring
  through `EditorPage.seo` is R+1 (operator can already set a
  per-page `ogImage`, the same pattern extends to favicons
  trivially).

## 9. R+1 candidates

- Editor sidebar "SEO" tab visual — canonical + keywords +
  noIndex toggle + per-page favicon override + OG image
  preview (calls `/og?title=…&color=…` for live preview).
- Foundation static fallback assets at `/favicon-default-*`.
- Raster PNG OG cards via `sharp` (or `@vercel/og`) at the
  foundation layer for social crawlers that refuse SVG.
- Custom-font support in the OG generator (font subsetting +
  inlined `<defs><font>`).
- `/sitemap_index.xml` for clients with > 50k pages (per
  sitemaps.org spec, current single sitemap is fine to ~50k
  URLs).
- Schema.org structured data UI (the `schemaJsonLd` field is
  free-form text today; sidebar pickers for common types
  Article / Product / LocalBusiness would help SEO operators).
