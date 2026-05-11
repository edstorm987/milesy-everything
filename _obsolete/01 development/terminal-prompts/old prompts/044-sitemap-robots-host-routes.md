/loop

# T3 — Round 044: Sitemap.xml + robots.txt host routes

R036 shipped the generators (`src/lib/sitemap.ts`). R044 wires them
into actual host routes so Googlebot can hit `:3030/sitemap.xml` +
`:3030/robots.txt`.

## Pre-read

- T3 R036 chapter (sitemap generators).
- R035 draft/published (only `published` pages emit).
- R024 redirects (filter sources).

## Scope

**A** — NEW host routes inside the website-editor plugin's host
integration layer (NOT the marketing-website Next.js app — that's T1
territory). Plugin emits a `routes` manifest entry; foundation mounts.
- `/sitemap.xml` → `selectSitemapPages` + `buildSitemap` →
  `text/xml` response.
- `/robots.txt` → `buildRobotsTxt` → `text/plain` response.
- `/sitemap-<locale>.xml` per i18n locale (R032) when locales
  configured on any page.

**B** — Reads pages from the website-editor PluginCtx storage.
Filter excludes drafts (R035 published-only), private (R025),
redirect sources (R041), portal-variants, underscore slugs.

**C** — Cache headers: `Cache-Control: public, max-age=300,
s-maxage=600` — short enough that publishes propagate quickly,
long enough to absorb crawler bursts.

**D** — Smoke `§ Sitemap host route` (≥10 — happy path; published-only
filter; redirect-source exclusion; private exclusion; multi-locale
case; robots disallow shape; cache-control header set; response
content-type correct).

**E** — Chapter `04-sitemap-host-routes.md` + MASTER row.

## NOT in scope

- Sitemap index files (split when > 50k URLs — post-ship).
- IndexNow / auto-ping after publish (post-ship).
- Per-tenant routing (still single-tenant for v1; multi-tenant
  domains land Phase 12 R3 post-ship).

## When done
DONE referencing `044-sitemap-robots-host-routes.md`.
