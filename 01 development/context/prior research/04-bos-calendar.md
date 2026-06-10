# 04 — BOS calendar surface (T4 R021)

A calendar tab in BOS aggregating: existing `bos.tasks[]` to-dos
(those with a `dueAt`), NEW `bos.events[]` custom events, and NEW
`incubator.phaseTargetDates` per-phase targets. Self-report —
explicitly no external calendar sync (T6 territory).

> Per prompt: recurring events limited to simple weekly (12-occurrence
> cap), iCal sync deferred to T6.

## File

NEW `business-os app/calendar.html` (~250L).

## Storage

| Key                                | Type          | Notes                                                      |
| ---------------------------------- | ------------- | ---------------------------------------------------------- |
| `bos.tasks`                        | existing      | Read both array shape (`[{title, dueAt, done}]`) and the existing object-of-buckets shape (`{today, week, done}`); only items with `dueAt` are surfaced. |
| `bos.events[]` *(NEW)*             | array         | `{id, title, when:ISO, kind:'event'|'milestone'|'reminder', link?, recurWeekly?, createdAt}` |
| `incubator.phaseTargetDates` *(NEW)* | `{phaseId: ISO}` | Optional per-phase target dates. Surfaces as 'milestone' kind on the calendar. |

## UI anatomy

Two-column layout:

- **Left** (1.6fr): month header + prev/today/next nav + Mon-first
  weekday strip + 7-col day grid. Each day cell shows the day number,
  highlight when today (gold pill), border when selected, and up to 4
  coloured dots for items on that day (one dot per item, colour-coded
  by kind). Below the grid sits a collapsible "+ Add event"
  `<details>` form.
- **Right** (1fr, sticky): day-detail drawer. Empty state ("Click any
  day to see what's on") + on selection shows `<h3>` of the date +
  ordered list of items (title bold, kind / time / source as muted
  meta + link `↗` if present). Coloured left border per kind matches
  the dot colour.

Mobile: collapses to single column under 880px; drawer goes static.

## Event sources merged

`gatherItems()` merges 3 sources into one normalised list:

```js
{ title, when:ISO, kind, link?, source:'task'|'event'|'incubator' }
```

- **`bos.tasks`**: handles both array + object-of-buckets shapes for
  back-compat. Only items with `dueAt` get a place on the calendar
  (an undated to-do isn't a calendar item).
- **`bos.events[]`**: pass-through. If `recurWeekly:true`, generates
  11 future occurrences (weeks 1-11 from `when`) capped at 12
  total — title appended with " (recur)" so the user can tell
  generated rows from the original.
- **`incubator.phaseTargetDates`**: each non-empty value rendered
  as a milestone with label "<Phase> target".

## Add-event form

Inline below the grid:

- Title (required)
- Date (required) + Time (optional → defaults to 09:00 if empty)
- Kind (event / milestone / reminder)
- Link (optional URL — opens in new tab from drawer)
- "Repeat weekly (12 weeks)" checkbox

Submit:
1. Computes `when` ISO from date + time.
2. Generates id `'e' + base36-ts + 3-char rand`.
3. Pushes onto `bos.events[]`.
4. Fires R013 `Activity.log('event.created', {…})`.
5. Resets the form, jumps the view + selected-day to the new event so
   the user sees it land.

## R013 Activity registry additions

`incubator app/lib/activity.js` `KINDS` map gains:

```js
'event.created':   { icon: '📅', label: 'Calendar event created' },
'event.completed': { icon: '✅', label: 'Calendar event completed' }
```

The `event.completed` kind is registered for symmetry but no surface
fires it yet — R+1 toggle on a drawer item could mark complete.

## CSS

`.bos-cal-*` block (~140L) appended to bos styles.css:

- 7-col day grid (4px gap) with 64px min-height cells + dot row at
  bottom
- Today: gold pill on the day number
- Selected: dark border + subtle elevation
- Per-kind dot colours: task=blue (#4a6e8e), event=gold (#C9A76A),
  milestone=green (#5a7a3a), reminder=red (#d05959), done=muted-green
- Drawer items: matching left-border colour per kind
- Mobile (<880px): single-column, drawer static, max-height removed

## Smoke (verified 2026-05-07)

- `calendar.html` 200; `lib/activity.js` 200.
- Manual flow: open calendar → today highlighted in gold; click any
  day → drawer shows "Nothing on this day" or list; click "+ Add
  event" → form expands; submit "Strategy review · 2026-05-15 ·
  10:00 · event" → event appears on the 15th with gold dot,
  selected-day jumps to 15th, drawer renders the event with gold
  left-border + time 10:00 + source 'event'.
- Recurring weekly event → 12 dots span 12 consecutive weeks.
- Setting `bos.tasks=[{title:'Test', dueAt:new Date().toISOString()}]`
  → blue dot on today.
- Setting `incubator.phaseTargetDates={blueprint:'2026-05-20T09:00:00Z'}`
  → green milestone dot on the 20th + "Blueprint target" in drawer.

## Q-ASSUMED + R021 follow-ups

- **Recurring events** capped at 12 weekly occurrences for UI sanity
  (per prompt: "simple weekly"). Monthly / daily recurrence + custom
  intervals deferred.
- **Edit / delete** not in this round — calendar is create + view
  today. R+1 trivial: drawer item gets a ✕ button writing through to
  `bos.events[]`.
- **iCal sync** explicitly out per prompt — T6 territory once
  email-sender / external-API plugins land.
- **Per-business calendar** — `bos.events[]` is in NAMESPACED_KEYS
  via R012 by default? Currently not — `bos.events` isn't in R012's
  `NAMESPACED_KEYS` array. R+1 trivial register so each business
  has its own calendar.
- **`incubator.phaseTargetDates`** is a new key with no UI for
  *setting* it yet — R+1 add date-picker to each Incubator phase
  page so operators can assign targets that surface on the calendar.

## Cross-refs

- Chapter #66 `bos.tasks[]` shape (calendar reads dueAt-bearing items).
- Chapter §6 client-tasks columns (delivery for that maps cleanly to
  the kind set we expose here).
- R012 (#88) BOSStorage — `bos.events[]` is not yet in
  NAMESPACED_KEYS (R+1 register so per-business calendars work).
- R013 (#89) Activity — calendar create/complete kinds added; create
  fires today.
- R018 (#94) print.css — calendar not yet wired for print
  (R+1 trivial: `<link media="print">` + sticky bar hide already
  covered by the shared CSS).
