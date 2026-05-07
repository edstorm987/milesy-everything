/loop

# T3 — Round 033: Static site export — download as ZIP

Operator can export a portal-variant as static HTML/CSS/JS for
self-hosting on third-party servers (or for backups). Generates a
ZIP from the rendered tree.

## Mandatory pre-read

1. T3 R022 version history.
2. Existing rendered storefront pipeline.

## Scope

**A** — `exportVariantToZip(variantId): Buffer` — server fn that
renders every page in the variant to static HTML, bundles CSS / brand
kit / images / robots.txt / sitemap into a single ZIP.

**B** — `/admin/export` button per variant; downloads on click.

**C** — Honesty in chapter: "static export = snapshot at this point;
forms / dynamic blocks won't work without backend wiring".

**D** — Smoke + chapter `04-static-export.md` + MASTER row.

## NOT in scope

- Continuous static deployment (T6).

## When done
DONE referencing `033-static-export.md`.
