/loop

# T4 — Round 006: Marketing index JSX rewrite + SiteShell consolidation

The static `_marketing/index.html` carries copy mirrors of SiteShell's
mega-menu (chapter #123 gotcha #6 — manual sync). Convert the
marketing home to JSX rendered through SiteShell. Drops the mega-menu
sync requirement permanently. Also delete the `/` rewrite — JSX
becomes the canonical source.

T4 polish lane R005 closed clean; this is post-Sprint-2 polish that
lights up next.

## Pre-read

- Chapter #123 §"Gotchas to preserve" #6 (sync rule).
- Chapter #145 (R005 — what was just polished; preserve all that).
- `public/_marketing/index.html` (current canonical source).
- `src/components/SiteShell.tsx` (the chrome the JSX inherits).

## Scope

**A** — NEW `src/app/page.tsx` (the orphan-resolved-via-delete in
R003 returns deliberately). Renders `<SiteShell>` with home content:
hero · audiences · replaces · founding · sticky CTA · footer.

**B** — Reuse copy from R005's polished `_marketing/index.html` —
faithful JSX port of every section. No new copy.

**C** — Drop `next.config.ts` `beforeFiles` rewrite for `/` (JSX wins
naturally now).

**D** — Move legacy `_marketing/index.html` to
`old prompts/_marketing-index-legacy.html` (or delete entirely if
git history is enough — Q-ASSUMED Q-BLOCKED choice).

**E** — Niche pages (`for-*.html`) stay static-HTML for v1 (separate
round if/when JSX rewrite-time available).

**F** — Smoke checklist (manual): `:3030/` shows the marketing home,
brand consistent, mega-menu lives in SiteShell only (verify by
editing one mega-menu link in SiteShell and confirming `/` reflects).

**G** — Chapter `04-marketing-jsx-rewrite-home.md` + MASTER row.

## NOT in scope

- Niche-page JSX rewrites (later round — R007+).
- Replacing footer JSX with new design (preserve R005's footer
  structure).
- Mobile-responsive breakpoint pass (R005 audit covered).

## When done
DONE referencing `006-marketing-jsx-rewrite.md`. After this T4 hits
WAKE-EMPTY again — Ed decides whether to stage niche-page JSX
rewrites or let T4 idle until further work.
