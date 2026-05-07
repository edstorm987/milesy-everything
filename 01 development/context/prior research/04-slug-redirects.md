# Slug redirect helper (T3 R041)

## What

When an operator renames a page slug (`/about` → `/about-us`),
the legacy URL should 301 to the new one rather than 404. R041
ships the pure builder + resolver + rename helper. The host
catch-all route handler calls `resolveRedirect` before falling
through to its 404 path.

Distinct from R025 (general redirects map — cross-domain,
regex, external rules). Slug redirects are strictly intra-site,
slug-shaped, page-scoped — a different surface with simpler
semantics.

## Files

- `src/lib/slugRedirects.ts` (NEW)
  - `normalizeSlug(s)` — leading slash, no trailing slash
    (except root). Comparisons go through this so callers don't
    have to care whether storage gave them `/about`, `about`,
    or `/about/`.
  - `buildRedirectMap(pages, opts?)` — returns
    `{forward: Record<oldSlug, newSlug>, issues: RedirectIssue[]}`.
    Walks every page's `redirectSourceSlugs[]` and writes the
    inverse map. Issue codes:
    - `self`     — page lists its own slug as a source.
    - `conflict` — two pages claim the same old slug; first
      claim (in input order) wins; second is dropped from
      `forward` and flagged.
    - `cycle`    — DFS-detected cycle of any length (length-1
      caught by `self`).
    Default `publishedOnly=true` — drafts contribute no
    redirects so a mid-rename draft doesn't redirect live
    traffic until the rename ships.
  - `resolveRedirect(slug, map)` — accepts either a
    `RedirectMap` or a plain `Record<string, string>` (so
    callers that already have a flat map can use it directly).
    Walks the chain so `A→B→C` resolves to `/c` in one hop;
    caps at 8 hops as cycle-paranoia even if the builder
    missed one. Returns `{to, status: 301}` or `null`.
  - `withSlugRename(page, newSlug)` — computes the
    `{slug, redirectSourceSlugs}` patch when the operator
    renames. Prepends old slug to the source list (idempotent).
    Drops the new slug from the source list if it appeared
    there previously (would otherwise cause `self`). No-op if
    the rename is to the same slug.
- `src/__smoke__/r041-published-redirect.test.ts` (NEW) — 23
  assertions: normalizeSlug 4 cases / buildMap basics + multi-
  source + clean (4) / drafts excluded by default + override
  (2) / self-redirect dropped + flagged / conflict flagged +
  first claim wins / 2-cycle flagged / resolveRedirect 4 (new
  slug, null, normalisation, plain Record map) / chain
  resolution / withSlugRename 4 (adds old, idempotent, no-op,
  drop self).
- `package.json` test chain extended.

## Editor wiring (out of scope this round)

Two operator-facing surfaces need to connect to this helper —
both deferred to R+1 since they touch the editor admin page:

1. Slug-rename prompt: when the operator types a new slug in
   page settings, a "Add redirect from `<old>`?" toggle defaults
   to on. Pressing save calls `withSlugRename` to compute the
   patch.
2. Page settings panel section listing `redirectSourceSlugs[]`
   with add / remove buttons (free-form, e.g. for adding a
   legacy `/old-blog-post-2019` entry months later).

The pure helper is what the host route handler imports today.

## Q-ASSUMED

- `publishedOnly: true` is the safe default. A draft renaming
  a slug shouldn't redirect live traffic — only when the
  operator clicks publish does the redirect become real.
- Conflict resolution is "first claim wins" (input order). The
  builder doesn't try to be clever about which target is
  "better" — operators see the issue and resolve manually.
- Cycle detection is DFS-based; cycles of length 2+ flag with
  the path joined by `→` for diagnostic clarity. The resolver
  caps hops at 8 as a runtime backstop.
- `resolveRedirect` accepts both `RedirectMap` and plain
  `Record` so callers already holding a flat map don't need to
  wrap. Detection uses `(map as RedirectMap).forward` truthy
  check rather than `"forward" in map` because a plain Record
  could legitimately have `"forward"` as a slug key.

## NOT in scope (R+1)

- Cross-page / cross-domain redirects (R025 territory).
- Wildcard redirects (e.g. `/blog/*` → `/posts/*`).
- Editor UI: rename-prompt toggle and settings-panel CRUD.
- Host route handler integration (one-liner: import
  `resolveRedirect`, call before 404 fall-through, return 301
  with `Location` header).
- Telemetry on redirect hits (operator dashboard would benefit
  from "which legacy URLs still receive traffic?").
