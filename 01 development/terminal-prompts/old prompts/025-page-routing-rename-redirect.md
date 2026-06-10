/loop

# T3 — Round 025: Page routing — rename, move, delete, redirect

Operator can rename / move / delete pages with automatic redirect
handling so old URLs don't 404. Per-page slug edit + redirect
registry.

## Mandatory pre-read

1. Existing page persistence in @aqua/plugin-website-editor.
2. T3 R022 version history — paired with rename history.

## Scope

**A** — `pageSlug` settings UI per page (current + edit field).
Saving rename writes new slug + appends `{from, to, ts}` to per-
variant `redirects[]` registry (capped 100 entries; oldest pruned).

**B** — Storefront route handler reads redirects: if requested slug
matches `from`, emits 301 to `to` URL.

**C** — Move-to-variant: dropdown to swap a page's parent variant
(e.g. account → start-here).

**D** — Delete page with confirm modal — auto-creates redirect to
configured fallback (variant root or `/`).

**E** — Smoke + chapter `04-page-routing.md` + MASTER row.

## NOT in scope

- Wildcard / regex redirects.
- 410 Gone (redirects only).

## When done
DONE referencing `025-page-routing-rename-redirect.md`.
