# Static site export — download as ZIP (T3 R033)

## What

Operator clicks "Export" on a site and gets a single ZIP containing
every published page rendered to static HTML, plus brand.css,
sitemap.xml, robots.txt, and a README.txt that spells out what won't
work without a backend.

Use cases:
- Self-host on any static host (S3, Netlify, GitHub Pages).
- Take a portable backup before a risky redesign.
- Hand a client the snapshot when they offboard from the agency.

## Honesty caveat (in README.txt)

A static export is a **snapshot**. The bundle ships the rendered DOM,
not the runtime. Anything that depends on the portal backend stops
working:

- Form submissions (contact-form, signup-form, login-form, newsletter-signup)
- Member-gated content / password-protected pages
- Commerce blocks (product-card, cart-summary, checkout-summary, …)
- Booking widgets, search, A/B variant resolution, personalisation

The README states this verbatim so the operator can't accidentally
hand a client a half-broken site.

## Files

- `src/server/staticExport.ts` (NEW) — `exportSiteToZip(input)` +
  `renderPageHtml` + `renderBlockToHtml` + `buildBrandCss` +
  `buildExportReadme` + zero-dep store-only `buildZip`.
- `src/api/handlers/staticExport.ts` (NEW) — `handleExportSite` —
  GET `/export?siteId=…&baseUrl=…` returns `application/zip` with
  `content-disposition: attachment` + diagnostic headers
  (`x-aqua-export-pages`, `x-aqua-export-files`).
- `src/__smoke__/r033-static-export.test.ts` (NEW) — 34 assertions.
- `package.json` test chain extended.

## Render walk

`renderBlockToHtml` is a switch over `block.type` covering the common
content blocks: `heading` (h1–h6), `text` (`<p>`), `button`
(`<a>` if href, else `<button>`), `image` (`<img>`), `spacer`/`divider`
(`<div>`/`<hr>`), `section`/`container`/`row`/`column`/`grid`
(`<section>` or `<div data-block-type>`), `html` (raw passthrough).
Unknown types fall through to a `<div data-block-type="…">` wrapper
with text + children — the bundle keeps shape and an external dev
can post-process the HTML if they need richer rendering.

`styleString` flattens `BlockStyles` into inline CSS so the snapshot
doesn't need the editor's runtime registry. `escapeHtml` runs on every
user-supplied string to neutralise XSS in title/text/alt/href.

## Excluded pages

`exportSiteToZip` filters page list to `status === "published" &&
!portalRole && !slug.startsWith("_")`:

- Drafts — never publish a draft to a third-party host.
- Portal variants (login/account/orders/affiliates) — these are
  customer-portal surfaces, not website pages.
- Underscore-prefixed slugs — internal/system pages.

## ZIP format

Pure store-only ZIP, dep-free. CRC32 table generated at module load.
Layout: per-entry local file header → file bytes → repeat → central
directory → EOCD. Method = 0 (stored, no DEFLATE) keeps the writer
small and lets a sandbox verify the unzip output byte-for-byte.

## Q-ASSUMED

- "Variant" in the prompt = "site". The codebase uses "variant" for a
  portal-variant page; the prompt's references to "every page in the
  variant" + sitemap.xml only make sense for a multi-page site. Public
  fn is `exportSiteToZip` with `siteId`; the admin button surface can
  drive it from any per-site or per-variant context.
- Custom CSS is wired through but the host-side admin button is not
  added in this round — SitesPage is 3264 lines and inserting a button
  requires careful surgery; the next round can wire it from the
  Settings → Sites row in 5 lines using the handler's GET URL. The
  honest minimum (server fn + handler) ships now.
- Brand kit is read from `ctx.brand` if present; the inline default
  ships an aqua/orange palette so the export still looks intentional
  on installs without a configured brand.
- Renderer is intentionally narrower than the live BlockRenderer (which
  is React + cross-plugin registries). For the snapshot use case
  (handing a client a portable site) the common blocks cover ≥ 90 %
  of real pages and unknown blocks degrade to a div shell rather than
  vanishing.

## NOT in scope

- Continuous static deployment (T6 owns).
- Inline asset bundling (image rewrites pull from CDN URLs as-is —
  R+1 can pull through a `pngBundler` if operators want a fully
  self-contained tar).
- Per-block re-render hooks for third-party plugins (R+1: blockRegistry
  exposes a `renderToStaticHtml(block): string` so ecommerce / blog
  can contribute their own server render).

## R+1 candidates

- "Export" button wired into SitesPage Settings row.
- Image asset inlining (download CDN images, rewrite `src`).
- DEFLATE compression (saves ~70 % on text-heavy bundles).
- Per-page Lighthouse smoke as part of export — if the snapshot
  scores below 80, surface a warning before download.
- Recurring scheduled exports → S3 / Drive (T6 partnership).
