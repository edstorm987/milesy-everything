/loop

# T4 — Round 021: BOS calendar surface

Calendar tab in BOS aggregating: Incubator phase deadlines, lesson
schedule, business to-dos, custom events. Self-report — no external
calendar integration.

## Mandatory pre-read

1. T4 chapter #66 — current BOS sidebar (My to-dos exists).
2. T4 R013 activity timeline.
3. T4 chapter #59 §6 client-tasks columns.

## Scope

**A** — `business-os app/calendar.html` new page. Month-grid view
with prev/next nav. Today highlighted.

**B** — Event sources: `bos.tasks[]` (existing to-dos with dueAt) +
`bos.events[]` (new — `{title, when, kind, link}`) + Incubator phase
target dates if set.

**C** — "+ Add event" inline form.

**D** — Day-detail drawer: clicking a day shows all events / tasks /
deadlines.

**E** — Activity log entry on event create/complete (chains R013).

**F** — Chapter R021 + MASTER delta.

## NOT in scope

- Recurring events beyond simple weekly.
- iCal sync (T6 territory).

## When done
DONE referencing `021-bos-calendar.md`.
