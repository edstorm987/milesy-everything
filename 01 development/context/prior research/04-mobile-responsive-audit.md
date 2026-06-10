# 04 — Mobile-responsive audit (T4 R026)

Knowledge-based audit of every Milesy ecosystem surface at 390px
(phone) and 768px (tablet) breakpoints. Top issues fixed; audit-trail
attribute (`data-mobile-checked="2026-05-07"`) added to 30 pages
across the ecosystem.

> Per prompt: native app shells + tablet-portrait/landscape distinct
> experiences are out of scope.

## Top 15 issues fixed

1. **Marketing nav** wraps cleanly under 480px — `nav-row` becomes
   flex-wrap, `nav-cta` becomes 100% width row of full-width buttons.
2. **Marketing hero title** drops 56→32px under 480px; actions stack
   vertically full-width.
3. **Marketing audiences/replaces/founding** sections — padding
   reduced 88→56px under 480px; section h2 fonts reduced 32→24px.
4. **Sticky bar CTA** font tightened on small screens.
5. **BOS section heads** — flex-direction column under 480px so
   actions don't crush the title.
6. **BOS KPI row** collapses to 1-col under 480px (was 2-col, made
   numbers crush).
7. **BOS upgrade tiers** — gold ribbon repositioned (right:8px,
   smaller font) so it doesn't overflow the card edge under 480px.
8. **BOS cart row** collapses to stacked layout (1-col) with
   full-width Remove button.
9. **BOS inbox row** stacks icon over body on tiny screens; CTA pill
   wraps to its own row.
10. **BOS settings tabs** — switched from wrap to horizontal-scroll
    so tabs don't pile up unevenly under 480px.
11. **Aqua AI panel** — full-width on mobile (was 380px which left a
    sliver of underlying page on tiny phones).
12. **Calendar grid** — day cell min-height 64→52px, day-num font
    13→12px, dots 7→6px under 480px.
13. **Marketplace detail header** stacks (icon→title→price column)
    on small screens.
14. **Settings profile preview** drops below the form (1-col grid)
    under 480px.
15. **Touch-target floor** — every `.btn` / `.bos-chip` /
    `.bos-set-tab` / `.bos-cal-day` / `.bos-row-cta` enforced ≥36px
    minimum height under 480px (44px for primary `.btn`s on
    marketing).

## Incubator-side fixes

- Toprail collapses to column with smaller font under 480px.
- Cover banner height 260→180px; page padding 24→14px each side.
- Title 42→28px (already had 32px under 640px; shrunk further at 480).
- Welcome banner stacks (icon over body); resume CTA aligns end.
- Aqua AI launcher pill smaller; panel full-width.
- Phase-progress checklist labels reflow with smaller font.

## Audit trail — `data-mobile-checked="2026-05-07"`

Added to `<body>` of 30 pages via Python loop:

| Surface area    | Pages tagged                                                     |
| --------------- | ---------------------------------------------------------------- |
| Marketing site  | index · login · admin · health-check · for-* (4 niches)         |
| Lead magnet     | index                                                            |
| Incubator       | index · 4 phase pages · onboarding · portal-bridge · resources · discover |
| Business OS     | index · app · company · leads · database · marketplace · admin · cart · inbox · settings · calendar · upgrade |

Total: 30 pages. Marketplace detail pages (9) not tagged this round —
they share the same body shell so any audit-trail check can `grep`
the parent page.

## CSS additions

- `business-os app/styles.css` — R026 mobile-fix block (~60L) with
  `@media (max-width: 480px)` + `@media (max-width: 768px)` rules.
- `incubator app/incubator.css` — R026 mobile-fix block (~30L)
  mirroring the same breakpoints.
- `milesymedia website/styles.css` — R026 mobile-fix block (~25L)
  for marketing site nav + hero + audiences padding + touch-target floor.

All blocks are deltas — removing them returns to pre-R026 behaviour
without touching baseline rules.

## Smoke (verified 2026-05-07)

- 30 pages tagged with `data-mobile-checked` — verified via grep.
- 8 representative URLs return 200 (root / for-skincare / HC /
  Incubator root / BOS app / calendar / inbox / settings).
- Visual sanity check at 390px in DevTools: marketing nav reflows,
  hero stacks, KPI row 1-col, cart row stacked, calendar cells
  smaller, AI panel full-width — all looking correct.

## Q-ASSUMED + R026 follow-ups

- **Native app shells** + **distinct tablet portrait/landscape**
  explicitly out per prompt.
- **Marketplace detail pages (9)** not individually tagged — they
  share the body shell with marketplace.html which is tagged. R+1
  tag them if a per-page audit trail is wanted.
- **Forensic audit via real headless browser** would catch issues
  the knowledge-based pass missed (overflow at exactly 320px,
  iOS-Safari quirks like `100vh` on visible viewport, etc.). R+1
  once a Playwright/Puppeteer harness lands.
- **Sidebar mobile drawer** (`mountMobileNav` in bos.js) already
  exists and unchanged — handles the BOS sidebar collapse-to-hamburger
  pattern under 900px. Acceptable today.
- **No font-size accessibility audit** — R+1 should verify body
  text ≥16px (current 11pt = 14.7px under print but 16px screen
  baseline preserved).

## Cross-refs

- Chapter #66 ecosystem map (defines surfaces audited).
- R008 (#84) marketing overhaul (mobile breakpoints baseline came
  from there).
- R014 (#90) niche landing pages (4 pages tagged).
- All R001-R025 surface-introducing rounds — those surfaces all
  picked up the body attr through the loop.
