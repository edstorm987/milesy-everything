# Marketing home — JSX rewrite via SiteShell (T4 R006, post-Sprint-2 polish)

R005 closed the Sprint-2 polish lane on the static `_marketing/index.html`.
R006 ports the home itself to JSX so the chapter #123 gotcha #6
mega-menu sync rule retires for the home page (niche pages keep
static-HTML for v1).

## What shipped

- **NEW** `src/app/page.tsx` — the route Next.js's app router uses
  for `/`. Renders `<SiteShell>` wrapping a server-rendered HTML
  body chunk loaded once at module load via `fs.readFileSync`.
- **NEW** `src/app/_home/home.html` — the body sections (hero ·
  audiences · industries · replaces · services · trust · process ·
  vsl · stats · founding · cta) lifted byte-for-byte from R005's
  polished `_marketing/index.html`. Leading underscore on the
  directory name keeps Next's app router from trying to treat it as
  a route.
- `next.config.ts` — `/` rewrite **dropped**. JSX wins naturally now.
  Niche-page rewrites kept (separate round if/when JSX-rewritten).
- `src/components/SiteShell.tsx` — footer brought up to R005 parity:
  Health Check · Business OS · Incubator · **Resources** · Client
  portal · **Privacy** · **Terms** · email.
- `public/_marketing/index.html` — **deleted**. Git history preserves
  it; the JSX page is canonical now.

## Why HTML-import + dangerouslySetInnerHTML, not hand-converted JSX

Q-ASSUMED tradeoff. The body is 340 lines of section markup. A
faithful manual JSX port (every `class` → `className`, every inline
`style="..."` → object, every `<button>` mid-content gets a noop
`onClick`) is high-effort and a vector for copy drift between R005's
polished source and the new JSX.

The chosen approach:

1. Server component reads `_home/home.html` once at module load
   (cold-start cost only).
2. Single `dangerouslySetInnerHTML` injection.
3. Future copy edits remain a one-file diff in the same shape R005
   already mastered.

It's safe because:

- The HTML is **author-controlled, not user-supplied** — no XSS
  surface (chapter #68 honesty contract: we control every byte that
  ends up on the page).
- It runs server-side: there's no client hydration mismatch — the
  HTML lands as-is in the SSR'd document.
- Replacing this with hand-built React components later is a clean
  refactor when the time is right (a section either becomes data-
  driven or its layout needs to react to state).

## The mega-menu sync rule retires (for the home page)

Before R006: `_marketing/index.html` carried its own copy of the
SiteShell mega-menu. Editing the canonical menu meant editing two
files (chapter #123 gotcha #6).

After R006: only `<SiteShell>` carries the mega-menu (the JSX home
inherits it). Niche pages still have their inline copy — same gotcha
applies there until each niche page goes JSX. R006 reduces the sync
surface from 5 files to 4.

## Smoke (manual)

- `cd 04-the-final-portal/milesymedia-website && npm run dev`,
  hit `http://localhost:3030/` → marketing home renders identically
  to pre-R006.
- Edit a mega-menu link inside `SiteShell.tsx` → reload `/` →
  the menu updates with no other file changes.
- `:3030/for-skincare` (and the 3 other niche pages) still work via
  the surviving `next.config.ts` rewrites.
- `/privacy` and `/terms` still work via R005 rewrites.

## What stayed

- All R005 polish copy (Services H2 fix, hero, audiences, replaces,
  process, founding cohort, CTA).
- Footer structure (R005 parity preserved in SiteShell).
- Niche pages (still static HTML — R007+ if Ed schedules).
- HC + Incubator iframe-wrapped routes (chapter #123 fix-2).

## Out of scope

- Niche-page JSX rewrites (R007+ if scheduled).
- Section componentisation (per-section React components with typed
  props) — follow-up once we know which sections move next.
- Mobile-responsive breakpoint pass (R005 audit covered).
