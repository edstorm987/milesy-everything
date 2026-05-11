/loop

# T3 — Round 014: SEO + meta + favicon block management

Each page edited in the website-editor needs a clean meta layer:
title, description, OG image, twitter card, canonical, favicon, sitemap.

## Mandatory pre-read

1. `02 felicias aqua portal work/` — current SEO patterns
   (Felicia's portal as north-star).
2. T3 prior rounds — page metadata storage.

## Scope

**A** — Per-page `meta` schema: `title`, `description`, `ogImage`,
`canonical`, `noindex?`, `keywords?`. Editor sidebar tab "SEO".

**B** — Per-portal-variant favicon (96+/192+ resolutions) + apple-
touch-icon. Saved on brand kit but overrideable per variant.

**C** — Auto-generated sitemap.xml at `/[clientSlug]/sitemap.xml`
listing every published page. robots.txt at root with appropriate
allow/disallow per variant `noindex`.

**D** — OG image generator (server-side `@vercel/og`-style): defaults
to `{title} on {brandName}` over brand-coloured background. Override-
able per page.

**E** — Smoke + chapter `04-seo-meta.md` + MASTER row.

## NOT in scope

- Real sitemap submission to Search Console (operator does it manually).
- Schema.org structured data.

## When done
DONE referencing `014-seo-meta-favicon.md`.
