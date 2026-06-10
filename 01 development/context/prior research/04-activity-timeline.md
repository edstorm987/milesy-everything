# 04 — Activity & timeline (T4 R013)

Unified `bos.activity[]` writer + a full timeline view in BOS, a small
recent-activity widget on the Incubator root, and an "Activity events
/ 7d" KPI tile in admin Overview. Per chapter #66's localStorage
schema, namespaced via R012 — each business owns its own activity log.

> Real-time across-device sync and activity export are explicitly out
> of scope per the round prompt.

## Record shape

```js
{ id, ts, kind, payload, business }
```

- `id` — `'a' + base36 random + base36 ts`.
- `ts` — ISO timestamp.
- `kind` — one of the 14 `Activity.KINDS` (see below).
- `payload` — kind-specific JSON (or `null`).
- `business` — `BOSStorage.activeId()` at write-time (R012 namespace).

Cap: 200 entries; oldest dropped via `slice(-200)` on every write.

## `Activity.KINDS` registry

| Kind                              | Icon | Label                                     |
| --------------------------------- | ---- | ----------------------------------------- |
| `hc.completed`                    | 🩺   | Health Check completed                    |
| `hc.shared`                       | 📤   | HC results shared                         |
| `incubator.bridged`               | 🏛   | Continued from HC into the Incubator      |
| `incubator.welcomed`              | ✨   | Welcomed into the Incubator               |
| `incubator.welcome-dismissed`     | ✓    | Welcome banner dismissed                  |
| `incubator.phase-advanced`        | 🎉   | Phase advanced                            |
| `lesson.done`                     | 📚   | Lesson marked done                        |
| `lesson.undone`                   | ↩︎    | Lesson un-marked                          |
| `bos.section-visited`             | 🧭   | BOS section visited                       |
| `marketplace.click`               | 🛒   | Marketplace add-on clicked                |
| `feedback.submitted`              | ✍️   | Feedback submitted                        |
| `pro.trial-started`               | 🟡   | Pro trial started                         |
| `pro-confirmed-demo`              | 🟢   | Pro confirmed (demo)                      |
| `pro.trial-expired`               | ⏳   | Pro trial expired                         |

Unknown kinds fall back to `{ icon: '◆', label: kind }` so no log entry
is ever lost — only mis-icon'd if it predates the catalogue.

## `Activity` API — `incubator app/lib/activity.js`

```js
window.Activity = {
  KINDS,
  log(kind, payload) → entry,
  list(filter)       → entries     // newest first
  byKind()           → { kind: count }
  recent(n)          → entries     // n most recent
  clear()            → void
  metaFor(kind)      → { icon, label }
}
```

`list(filter)` accepts:
- `kind` — string; matches exact OR `<kind>.subkind` prefix (so
  `kind:'hc'` matches both `hc.completed` and `hc.shared`).
- `kinds` — explicit array of full kind strings.
- `sinceMs` — relative time window (used by 7d / 30d filters).
- `business` — optional business id (defaults to all).

Every `log()` dispatches a `CustomEvent('activity:logged', {detail})`
on `document` so widgets can re-paint without polling.

R012 sync: `Activity.write()` mirrors via `BOSStorage.set()` if loaded,
so multi-business switching keeps each business's log intact.

## Wired emit-points (R013)

| Surface                     | Kind                          | Where                                                    |
| --------------------------- | ----------------------------- | -------------------------------------------------------- |
| `lead magnet app/index.html` `persistToBOS()` | `hc.completed`                | Idempotent — guards against re-firing on results re-render |
| `lead magnet` `bridgeHcToIncubator()` (R010) | `incubator.bridged`           | Replaced raw `bos.activity.push()` with `Activity.log()` |
| `incubator app/lib/welcome.js` (R010) | `incubator.welcomed` / `incubator.welcome-dismissed` | `logActivity()` now delegates to `Activity.log()` |
| `incubator app/lib/phase-advance.js` (R006) | `incubator.phase-advanced`    | Inside `markComplete()` after CustomEvent fires          |
| `business-os app/module.html` mark-done toggle | `lesson.done` / `lesson.undone` | Logs current toggle direction + `lessonId, title`       |
| `business-os app/marketplace.html` click delegate | `marketplace.click`           | Logs `addonId` per click (alongside existing counter)    |

R011 entries (`pro-confirmed-demo` etc.) already pushed raw shapes
that the registry recognises — no extra wiring needed.

## Surfaces

### `business-os app/activity.html` (NEW)

Full timeline with two filter-chip groups:
- **Kind**: All · HC · Incubator · Lessons · Marketplace · Pro
  (uses prefix-match so e.g. "Incubator" catches all `incubator.*`).
- **Range**: All time · 7 days · 30 days.

Each row: large icon · meta label + payload summary · ISO timestamp +
`<code>kind</code>`. Honest empty state ("Nothing logged yet" with
"Try widening the filter" hint when filtered).

"🗑 Clear log" button up top — confirms before wiping (`Activity.clear()`).

Re-paints automatically on `activity:logged`.

### Incubator root widget

NEW `<section data-inc-activity>` slot below the existing dividers
on `incubator app/index.html`. Inline script reads
`Activity.recent(5)`; renders icon + label + relative timestamp
("3m ago"). Hidden when empty (honest). Auto-repaints on
`activity:logged`. "See all ↗" links to `business-os app/activity.html`.

CSS `.inc-activity-widget` block in `incubator.css` (~40L).

### Admin Overview KPI tile (R009 second row gains a 5th tile)

`Activity events · 7d` — count of entries within last 7 days from
`bos.activity`. Tile subline links to `activity.html`.

## CSS

- `incubator app/incubator.css` — `.inc-activity-widget*` (~40L).
- `business-os app/styles.css` — `.bos-activity-*` block (~50L)
  + `.bos-chip` (filter chips).

## Smoke (verified 2026-05-07)

- `lib/activity.js`, `activity.html`, `admin.html`, `incubator app/index.html`,
  `marketplace.html`, `lead magnet/index.html` all 200.
- Manual: complete HC → `Activity.list().length` === 1 with
  `kind:'hc.completed'`. Incubator root widget renders 1 row.
- Click "Continue your journey →" → `incubator.bridged` row appears
  on next paint.
- Mark a lesson done → `lesson.done` row.
- Click marketplace card → `marketplace.click` row.
- Phase-advance via R006 CTA → `incubator.phase-advanced` row.
- Filter chips in `activity.html` narrow correctly; "7 days" returns
  same count as the admin KPI tile.
- "Clear log" prompts confirm; on accept all rows vanish + admin KPI
  zeros on next admin reload.

## Q-ASSUMED + R013 follow-ups

- **`bos.section-visited`** kind is registered but no surface emits
  it yet — Q-FLAG: would need a per-page `<script>Activity.log('bos.section-visited', {page})</script>` snippet (R+1, ~10 BOS pages). Skipped to keep R013 surgical.
- **`feedback.submitted`** likewise registered but BOS request.html
  doesn't currently emit — R+1 trivial wire-up.
- **R012 multi-business mirror**: `Activity.write()` mirrors via
  `BOSStorage.set()` when present. Existing direct writes (R010,
  R011 inline pushes) bypass the namespaced mirror; switching
  business will pick them up via the `switch()`-snapshots-prev
  guard, but it's a one-way reconciliation. Full migration of those
  writers to `Activity.log()` is R+1.
- **No export** per prompt. CSV/JSON export from `activity.html`
  would be a future R016 sibling (admin already has CSV pattern from
  R009 leads).
- **Deduplication**: HC completion guard checks `prog.completed.healthCheck`
  to avoid double-logging on re-renders. Other surfaces don't dedupe
  — phase-advance is naturally one-shot via `phaseAdvanced[id]`,
  lesson toggle alternates `done`/`undone`, marketplace click is
  per-click.

## Cross-refs

- Chapter #66 `bos.activity[]` shape (this round formalises it).
- R006 (#82) phase-advance CustomEvent (this round adds an Activity
  log alongside).
- R009 (#85) admin KPIs (gains the 5th tile here).
- R010 (#86) HC handoff (introduced `bos.activity[]` raw push;
  R013 standardises on `Activity.log()`).
- R011 (#87) entitlement (`pro-confirmed-demo` already in registry).
- R012 (#88) BOSStorage (Activity write mirrors via `BOSStorage.set`).
