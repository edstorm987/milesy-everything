/loop

# T4 — Round 002: Per-phase Incubator sub-pages

Per chapter §5 + §15c, each Aqua phase needs its own Incubator sub-
page using the §15a anatomy. Currently R001 ships root + 4 generic
sub-pages. R002 adds **phase-specific** sub-pages for phases 1-4
(Epic Intro / Blueprint Setup / Diagnostics / Brand Builder).

## Mandatory pre-read

1. T4 R001 chapter `04-incubator-phase-portal.md` — anatomy + state shape.
2. `04-aqua-internals-reference.md` §5 (phases) + §5a (per-phase plugins).
3. T4 chapter #74 copy reference for tone.

## Scope

**A** — 4 new pages under `incubator app/`: `phase-1-epic-intro.html`
· `phase-2-blueprint.html` · `phase-3-diagnostics.html` ·
`phase-4-brand-builder.html`.

**B** — Each follows §15a anatomy (cover · icon · pageTitle · property
strip · video · toggles · cardGrid). Phase-specific content:
- Epic Intro — welcome video + first-action checklist + "What
  happens next" toggle.
- Blueprint Setup — link into BOS "About my business" + Strategy
  worksheets + Q&A.
- Diagnostics — link into HC + reading-list + Strategy review session
  prep.
- Brand Builder — brand questionnaire + colour/font picker placeholder
  + asset upload hints.

**C** — Root page's cardGrid extended: each phase-card unlocks per
`incubator.phase` (current + completed phases active; future phases
soft-locked with overlay per R001 honesty contract).

**D** — Phase-completion checkboxes per page; saved to `incubator.
phaseProgress[phaseId]`. Completing all on a phase advances
`incubator.phase`.

**E** — Chapter update + MASTER row.

## NOT in scope

- Wiring real APIs (still no API constraint).
- Brand Builder logo design (T4 R009 admin polish).

## When done
DONE referencing `002-incubator-per-phase-pages.md`.
