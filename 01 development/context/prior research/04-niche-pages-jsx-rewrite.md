# Niche pages — JSX rewrite (T4 R007, post-Sprint-2 polish)

R006 ported the marketing home; R007 finishes the job for the 4 niche
pages (`for-skincare` / `for-coaching` / `for-fitness` /
`for-agencies`). Mega-menu sync surface drops from 4 files → 1 file
(`SiteShell.tsx`). Chapter #123 gotcha #6 retires fully.

## What shipped

- **NEW** `src/app/for-skincare/page.tsx`
- **NEW** `src/app/for-coaching/page.tsx`
- **NEW** `src/app/for-fitness/page.tsx`
- **NEW** `src/app/for-agencies/page.tsx`

Each route is a server component that renders `<SiteShell>` wrapping
a body chunk loaded via `fs.readFileSync` at module load + injected
through `dangerouslySetInnerHTML`. Pattern identical to R006.

- **NEW** `src/app/_niches/for-{skincare,coaching,fitness,agencies}.html`
  — body sections (hero · audiences · replaces · founding · cta · etc)
  extracted byte-for-byte from R005's polished niche pages. Each is
  ~118 lines. The leading underscore on `_niches/` keeps Next's app
  router from routing the directory.

- **DELETED** the 4 legacy `public/_marketing/for-*.html` files. Git
  history preserves them; the JSX routes are canonical now.

- `next.config.ts` — the 4 `for-*` `beforeFiles` rewrites **dropped**.
  JSX routes serve directly. The remaining `beforeFiles` rewrite is
  `/business-os` → `/business-os/index.html` (still standalone app
  per chapter #123 fix-2).

## Per-page SEO

Each route exports `metadata` with niche-specific title +
description, reusing the polished R005 copy:

- **Skincare**: "Aqua for Skincare brands — Milesy Media" /
  ingredient storytelling + product pages + repeat-purchase rituals.
- **Coaching**: "Aqua for Coaches & consultants — Milesy Media" /
  niche down + high-ticket frame + retention.
- **Fitness**: "Aqua for Fitness studios & coaches — Milesy Media" /
  programme architecture + trial conversion + retention.
- **Agencies**: "Aqua for Agencies — Milesy Media" / multi-client
  architecture + plugin ecosystem + per-client portals.

## Chapter #123 gotcha #6 — RETIRED

Before R006/R007 the canonical Resources mega-menu lived in 5 places:
`SiteShell.tsx` + `_marketing/index.html` + 4 niche pages. Editing
the menu meant a 5-file sweep (chapter #123 fix-7 + R001).

After R007: only `SiteShell.tsx` carries the mega-menu. Editing one
React component updates every marketing surface. Sync rule no longer
applicable to ANY page on the marketing surface; future maintainers
needn't track the rule.

## Smoke (manual)

- `:3030/for-skincare` (and the 3 other niche routes) all 200, brand
  consistent, mega-menu lives in SiteShell only.
- Edit one mega-menu link in `SiteShell.tsx` → reload any niche route
  → menu updates with no other file change (proof-of-retired sync).
- Footer parity preserved (R005's Resources / Privacy / Terms still
  render; SiteShell footer applies uniformly).

## What stayed

- All R001 + R005 polish copy (mega-menu shape, footer parity, nav
  CTAs, niche-specific hero + audiences + replaces sections).
- `_marketing/styles.css` (still referenced by SiteShell's
  `<link rel="stylesheet" href="/_marketing/styles.css">`).
- `_marketing/privacy.html` + `terms.html` (R005 stubs — those routes
  use `next.config.ts` rewrites, not JSX yet).
- HC + Incubator iframe-wrapped routes (chapter #123 fix-2 / fix-6).

## Out of scope

- HC / BOS / Incubator iframe → React rewrites (post-ship).
- Per-niche brand-kit override (post-ship — Phase 12 R3 territory).
- Mobile breakpoint pass (R005 + R026 audits already covered).
- Privacy / Terms JSX rewrite (rewrites still serve them; small,
  rarely visited; cheap to leave static).
