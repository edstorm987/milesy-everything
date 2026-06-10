# `app/page.tsx` orphan resolution (T4 R003, Sprint 2)

Carry-forward from chapter #123 §"Open follow-ups" item 1. Resolution
this round: **Option A — delete the orphan**.

## What was the orphan

`src/app/page.tsx` shipped as a Next.js placeholder route ("A portal
to anywhere.") in the pre-unification era. Since chapter #122 unified
the marketing site into the same Next.js host, `next.config.ts`'s
`beforeFiles` rewrites matched `/` to `/_marketing/index.html` —
which fires ahead of Next's filesystem matching. The result:
`app/page.tsx` could never execute. Dead code with two failure modes:

1. **Drift risk** — future maintainer assumes editing `app/page.tsx`
   updates the homepage; it doesn't.
2. **JSX-rewrite confusion** — when we eventually port the marketing
   surface to JSX (post-ship), starting from a stale "portal to
   anywhere" stub is worse than starting from `_marketing/index.html`
   as the source of truth.

## What shipped

`rm src/app/page.tsx` — single-file delete. No imports referenced it
(it was the App-Router root page; only Next's filesystem router knows
the path, and `beforeFiles` rewrites override it).

## Why Option A over Option B

- Static `_marketing/index.html` is working, shipped, and SiteShell-
  wrapped on every other surface (chapter #123 fix-2). The only
  surface NOT JSX is the marketing home itself + the 4 niche pages
  (T4 R001 swept the latter into nav-parity).
- JSX rewrite of the marketing home is non-trivial — it's the longest
  page on the site, has the cover-banner hero, the audiences grid,
  testimonials, contact section, etc. None of that is on the ship-
  gate critical path (chapter #124).
- Deleting the orphan reduces confusion at zero cost.

## Post-ship JSX rewrite TODO

When marketing JSX is taken on, the natural shape is:

- Move `_marketing/index.html` content → `src/app/(marketing)/page.tsx`
  rendered through `<SiteShell>`.
- Drop the `beforeFiles` rewrite for `/` (and the 4 niche-page
  rewrites, swept to `app/(marketing)/for/[niche]/page.tsx`).
- `_marketing/styles.css` stays in `public/` (used by SiteShell + HC
  iframe wrapper), referenced via the existing `<link rel="stylesheet"
  href="/_marketing/styles.css">` in SiteShell.

Niche-page rewrite is its own follow-up round (out of scope here).

## Smoke

Manual: `cd 04-the-final-portal/milesymedia-website && npm run dev`,
then `curl :3030/` returns the static-HTML marketing index served
through the rewrite. `:3030/for-skincare` and the other 3 niche pages
keep working. No "missing-route" warning from Next on cold boot.

## Out of scope

- JSX rewrite of marketing home (post-ship).
- JSX rewrite of niche pages (post-ship).
- Other rewrites in `next.config.ts` (HC / BOS / Incubator are
  iframe-wrapped — chapter #123 fix-2/fix-6).
