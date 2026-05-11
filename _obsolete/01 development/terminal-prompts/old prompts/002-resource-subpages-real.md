/loop

# T4 — Round 002: Resource sub-pages — first 3 real implementations

`/resources/[slug]` today renders 7 stub "coming soon" cards (chapter
#123 fix-5). Replace 3 of them with real, useful pages: `seo-audit`,
`site-speed`, `accessibility-audit`. Each is a self-contained
diagnostic that will eventually hook into T2 R023 rank-my-website
(Sprint 2 — which lands in plugins/, separate from these JSX pages).

Carry-forward from chapter #123 §"Open follow-ups" item 5.

## Pre-read

- Chapter #123 §"fix-5" + §"fix-7" (Resource Finder catalog).
- `src/lib/resources/catalog.ts` — flip `live: false → true` for each
  slug shipped.
- `src/app/resources/[slug]/page.tsx` (the catch-all stub renderer).

## Scope

**A** — `src/app/resources/seo-audit/page.tsx` — real route (NOT the
catch-all stub). SiteShell-wrapped. URL input + "Run check" form.
Result panel shows honest checklist (title length / meta length / H1
count / canonical / OG / robots+sitemap reachable) with **A-F bands
NOT a numeric percentage** per chapter #68. NO email-capture in this
round (T2 R023 plugin handles that integration later); just the tool.

**B** — `src/app/resources/site-speed/page.tsx` — input URL → returns
TTFB / DOMContentLoaded / total bytes / image count. Pure client-
side fetch (no PSI dep — that's post-ship). Honest "rough estimate
from this device" caption.

**C** — `src/app/resources/accessibility-audit/page.tsx` — input URL
→ runs lightweight checks (alt-tag coverage / heading hierarchy /
landmark presence / contrast on inline-styled text). Same band-only
result language.

**D** — Update `src/lib/resources/catalog.ts` — flip `live: true` on
the three slugs; everything else (seo-audit / site-speed / a11y) was
`soon` before.

**E** — Smoke checklist (manual): each page loads, form submits, no
results lie. Can also run against milesymedia.com itself as
self-test.

**F** — Chapter `04-resource-subpages-first-three.md` + MASTER row.

## NOT in scope

- Email capture / lead creation (T2 R023 owns).
- Real Lighthouse / PSI integration (post-ship).
- The other 4 stubs (`ux-orchestration` / `copy-clinic` / `playbooks`
  / `case-studies`) — leave as stubs.

## When done
DONE referencing `002-resource-subpages-real.md`.
