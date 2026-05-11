# 04 — Lessons content gap (T4 R015)

Per chapter #71 open-follow-ups: 17 of the original 22-row module
library shipped as visible-but-locked Pro rows. R015 unlocks 10 of
them with v1 written content — bringing the free-tier total from 5
to 15. Honesty contract: every new body opens with a v1-draft note
and explicitly names what Pro Mastery layers add.

## Lessons added

| ID                    | Step | Track             | Phase tag(s) (R006)         |
| --------------------- | ---- | ----------------- | --------------------------- |
| `private-hub`         | 1.2  | Foundations       | epic-intro · blueprint      |
| `storage-drives`      | 1.3  | Foundations       | epic-intro · blueprint      |
| `tech-stack`          | 1.4  | Foundations       | blueprint                   |
| `domain-email`        | 2.1  | Brand & presence  | blueprint · diagnostics     |
| `gbp`                 | 2.2  | Brand & presence  | diagnostics                 |
| `offer-architecture`  | 3.1  | Sales & marketing | diagnostics · brand-builder |
| `sales-sops`          | 3.6  | Sales & marketing | brand-builder               |
| `clarity-page`        | 3.8  | Sales & marketing | brand-builder               |
| `workflows`           | 4.1  | Operations        | brand-builder               |
| `kpis`                | 4.2  | Operations        | brand-builder               |

Each follows the existing `module.html` shape (chapter #73): hero
title + lead + outline + body (5 sections × ~3-5 paras + a callout
+ a practical prompt) + recap + the R006 "Mark this lesson done"
toggle.

## `phases` field on each lesson

NEW per-lesson field. Array of phase ids (strings drawn from the R002
PHASES list) declaring which Incubator phases each lesson supports.
Read by R006 phase-advance — R+1 will swap `PHASE_LESSON_REQUIREMENTS`
hardcoded map for a derived view from this field. Today the map still
hardcodes the 5 originals; R015 adds the metadata so the swap is a
trivial one-liner when scheduled.

## Honesty contract

Every new lesson body opens with a `bos-callout`:

```
📝 v1 draft. The 60-minute version. Deeper Pro Mastery lives in the retainer cohort.
```

Specific scope notes per lesson where relevant — e.g. `gbp`: "Google
updates this surface ~quarterly; check the Aqua weekly bulletin for
changes." `kpis`: "Per-niche KPI sets ship inside the niche packs
(R004); Pro Mastery layers benchmarking."

No promises beyond what the v1 actually delivers.

## `database.html` updates

10 rows changed from `🔒 Pro` lock pattern to live `module.html?id=…`
links + green "Open →" CTA in the action column. Intro paragraph
rewritten:

> Free tier ships with **15 fully-written lessons** (R015 expanded the
> original 5): the full Foundations track, Brand & Presence
> essentials, the Sales architecture + SOPs + Clarity page, and
> Operations workflows + KPIs. The remaining locked rows (4.3 SOPs
> library · 4.5 Hiring · 5.1 Service quality · 5.3 Pricing strategy ·
> 5.4 Authority builder · 5.5 Brand voice · 5.6 Annual planning) ship
> in coming rounds. Each free lesson is a v1 draft — Pro Mastery
> deepens with per-niche walkthroughs and quarterly review sessions.

## Files

| Path                                                  | Change                              |
| ----------------------------------------------------- | ----------------------------------- |
| `business-os app/lessons.js`                          | +10 lesson records (~530 added L)   |
| `business-os app/database.html`                       | 10 rows unlocked + intro rewritten  |

## Smoke (verified 2026-05-07)

- All 10 new `module.html?id=<id>` URLs return 200.
- `lessons.js` registry now has 15 lesson records (verified by `grep -c "track:"`).
- database.html still passes 200; 10 rows render with green "Open →"
  CTAs; "🔒 Pro" badge count drops from 17 to 7.
- Each new lesson page renders the v1-draft callout, the outline
  navigation, the 5-section body, the next-link, and the R006 mark-done toggle.

## Q-ASSUMED + R015 follow-ups

- **Remaining 7 locked rows**: 4.3 SOPs library · 4.5 Hiring (KPI
  variant — TBC if same as 4.2) · 5.1 Service quality · 5.3 Pricing
  strategy · 5.4 Authority builder · 5.5 Brand voice · 5.6 Annual
  planning. R016+ candidates.
- **`phases` field** captured but not yet read by R006's
  `PHASE_LESSON_REQUIREMENTS`. R+1: swap hardcoded map for a derived
  view.
- **No video / no quiz** per prompt — text + diagrams (callouts) only.
- **No per-niche walkthroughs** — niche packs (R004) layer that on
  top via Aqua AI replies + recommended-modules grid.
- **Word count** kept tight (~30L body per lesson). Pro Mastery is
  the deeper version; this is the honest 60-minute primer.

## Cross-refs

- Chapter #74 copy reference (this round writes new content for 10 of
  the 17 locked rows in the 22-row module library).
- Chapter #71 open follow-ups (closes the "15+ locked rows" line).
- Chapter #73 `module.html` shape (mirrored exactly).
- Chapter `04-incubator-phase-portal.md` R006 (phases tagging
  prepares the swap).
- Chapter #59 §13 SOP shelf taxonomy (sales-sops + workflows pull
  from this).
