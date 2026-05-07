/loop

# T4 — Round 013: Activity & timeline view

Surface a unified timeline across HC + Incubator + BOS: every meaningful
action (HC complete, phase advance, lesson done, BOS section visited,
add-on clicked) writes to `bos.activity[]`. Render as a timeline tab in
BOS + a small "Recent activity" widget on the Incubator root.

## Mandatory pre-read

1. T4 chapter #66 — current localStorage schema.
2. T4 R006 (lesson-advance event), R005 (HC recommendations).

## Scope

**A** — Activity record shape: `{ id, ts, kind, payload, business }`.
Kinds: `hc.completed` · `incubator.phase-advanced` · `lesson.done` ·
`bos.section-visited` · `marketplace.click` · `feedback.submitted`.

**B** — `Activity.log(kind, payload)` writer (capped at 200 entries,
oldest dropped). Wire into existing event surfaces (HC results,
lesson "mark done", phase advance, marketplace click, etc.).

**C** — `/business-os app/activity.html` new page — full timeline
with filter chips (kind / day-range). Empty state honest: "Nothing
logged yet".

**D** — Incubator root: small "Recent activity" widget below cardGrid
showing last 5 entries.

**E** — Admin overview KPIs gain "Activity events / 7d".

**F** — Chapter R013 + MASTER delta.

## NOT in scope

- Real-time across-device timeline.
- Activity export.

## When done
DONE referencing `013-activity-timeline.md`.
