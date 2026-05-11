/loop

# T4 — Round 001: niche pages mega-menu mirror

`for-skincare.html`, `for-coaching.html`, `for-fitness.html`,
`for-agencies.html` still render the OLD static nav. Sweep the
Resources mega-menu (the same one in `_marketing/index.html` per
unify-fix-7) into all four niche pages so navigation is consistent
across the marketing surface.

Carry-forward from chapter #123 §"Open follow-ups" item 2.

## Pre-read

- Chapter #123 §"fix-7" + §"Gotchas to preserve" item 6 (mega-menu
  sync rule).
- `public/_marketing/index.html` (current canonical mega-menu shape).
- `src/components/SiteShell.tsx` (the JSX-side mega-menu — match
  shape).

## Scope

**A** — Identify the exact `<nav>` block in `_marketing/index.html`
that carries the Resources dropdown. Extract as a reusable HTML chunk
(don't introduce a build step — copy-paste is fine for now; chapter
#123 explicitly says JSX rewrite is later).

**B** — Inject the same chunk into each of the 4 niche pages. Replace
their existing nav block. Keep page-specific CTAs untouched.

**C** — Sweep any niche-page logos / "Get started" CTAs to point at
`/signup` (was `/login` in legacy paths) and "Sign in" to `/login`.

**D** — Smoke checklist (manual): visit each `/for-*` and confirm the
Resources dropdown opens, links resolve, brand visually consistent.

**E** — Append outbox NOTE describing what was synced + a one-line
TODO for the eventual JSX rewrite that consolidates this.

**F** — Chapter `04-niche-pages-megamenu-sync.md` (small) + MASTER row.

## NOT in scope

- JSX rewrite of niche pages (later round — current pace stays
  static-HTML).
- New niche pages (post-ship).

## When done
DONE referencing `001-niche-pages-megamenu.md`.
