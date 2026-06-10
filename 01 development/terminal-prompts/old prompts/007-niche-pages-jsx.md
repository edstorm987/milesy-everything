/loop

# T4 — Round 007: Niche pages JSX rewrite (4 for-* pages)

R006 ported the marketing home to JSX. Repeat the pattern for the 4
niche pages (`for-skincare`, `for-coaching`, `for-fitness`,
`for-agencies`) so mega-menu sync surface drops from 4 → 1 file
(SiteShell only).

## Pre-read

- T4 R006 chapter (HTML-embed pattern via `_home/home.html`).
- Current `public/_marketing/for-*.html` (R001 swept Resources mega-
  menu in; R005 footer parity).

## Scope

**A** — NEW `src/app/for-skincare/page.tsx` etc. — one Next.js route
per niche page. Each renders `<SiteShell>` + body via the same
`fs.readFileSync + dangerouslySetInnerHTML` pattern as R006, sourcing
HTML from `_niches/<slug>.html`.

**B** — Move legacy HTML bodies into `src/app/_niches/<slug>.html`
(extract just the body content; drop the `<head>` + nav + footer
boilerplate since SiteShell provides them).

**C** — Drop the `for-*` rewrite from `next.config.ts` `beforeFiles`.

**D** — Delete `public/_marketing/for-*.html` legacy files.

**E** — Per-page SEO: each route exports `metadata` with niche-
specific title + description. Reuse copy from R005's audit pass.

**F** — Smoke checklist (manual): `:3030/for-skincare` etc. all 200,
brand consistent, mega-menu in SiteShell drives all 4 pages, footer
parity preserved.

**G** — Chapter `04-niche-pages-jsx-rewrite.md` + MASTER row.

## NOT in scope

- HC / BOS / Incubator iframe→React rewrites (post-ship).
- Per-niche brand-kit override (post-ship — Phase 12 R3 territory).
- Mobile breakpoint pass (R005 + R026 audits already covered).

## When done
DONE referencing `007-niche-pages-jsx.md`. Mega-menu sync rule
(chapter #123 gotcha #6) becomes obsolete after this — note in
chapter that gotcha is retired.
