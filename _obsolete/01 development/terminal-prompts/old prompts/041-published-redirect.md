/loop

# T3 — Round 041: Published-only redirect helper

When a page slug changes (e.g. `/about` → `/about-us`), the old URL
should 301 to the new one — not 404. Today there's no such handling.

## Pre-read

- T3 R035 draft/published shape (page has both `slug` and any
  `redirectSourceSlugs[]`).
- T3 R024 redirects map (existing redirect surface).

## Scope

**A** — `lib/slugRedirects.ts`:
- `buildRedirectMap(pages)` returns `Record<oldSlug, newSlug>` from
  every page's `redirectSourceSlugs[]`.
- `resolveRedirect(slug, map)` returns `{ to: string, status: 301 } | null`.
- Cycle guard: A→B + B→A flagged in result.

**B** — Slug rename helper: when editor renames page slug, prompt for
"add a redirect from old slug?" default-yes. Append to
`redirectSourceSlugs[]`.

**C** — Editor UI: page settings panel shows current redirects + lets
operator add/remove freely.

**D** — Smoke `§ Slug redirects` (≥12 — buildMap; resolveRedirect;
cycle detection; multiple sources to one target; new slug has no
incoming until editor adds them).

**E** — Chapter `04-slug-redirects.md` + MASTER row.

## NOT in scope
- Cross-page redirect (e.g. legacy domain to new) — post-ship.
- Wildcard redirects (post-ship).

## When done
DONE referencing `041-published-redirect.md`.
