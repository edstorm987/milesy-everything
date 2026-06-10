# 04 — Per-business analytics dashboard (T4 R027)

In-BOS analytics surface — own data only, no cross-business
comparison. 5 KPI tiles aggregated from localStorage with honest
small-n badges when data is sparse.

> Per prompt: cross-business comparison + external analytics
> integration are out of scope.

## File

NEW `business-os app/analytics.html` (~220L) with period chip nav
(7d / 30d / all-time) + 5-tile responsive grid (2-col → 1-col under
760px).

## 5 KPI tiles

### 1. 📚 Lessons completed

`bos.lessonProgress` count of true entries / 22 (current registry).
Big Playfair number, gold-gradient progress bar, percentage subline.
Small-n badge when count < 7.

### 2. 🏛 Phase progress timeline

4 dots representing the 4 Incubator phases (Epic Intro → Brand
Builder). Per dot:
- **Advanced** (`incubator.phaseAdvanced[id]=true`) → solid green.
- **Current** (`incubator.phase === id`) → solid gold + pulsing
  shadow ring + 1.4s scale animation.
- **Future** (index after current) → outlined-only grey.
- **Past** (no advance flag set but index before current) → grey
  filled.

Subline: "Advanced N of 4 · current: <Label>".

### 3. 🩺 Health Check trend

When no `bos.healthCheck` → `—` muted + "No HC on file. Run the
12-min HC →" link.
When HC present:
- Big number = average score across answered topics.
- Subline: "Latest snapshot · N/M topics answered · weakest:
  <Topic>" + small-n badge if <5 topics answered.
- **Honest second line**: "Single snapshot — re-run HC to track delta
  over time." (chapter #68 contract: bos.healthCheck stores only
  latest, so trend genuinely can't be computed today).

### 4. 📊 Activity events / period

`Activity.list({ sinceMs })` filtered by selected period. Big number =
total event count. Top-3 most-frequent kinds rendered as a small list
with each kind's icon + label + count.

Subline + each tile has small-n pill when total < 7.

### 5. 🔔 Notifications / period

`bos.notifications` filtered to period. Big number = read-rate
percentage (read / total × 100). Gold-gradient progress bar shows
the same. Subline: "N read / M total" + small-n if total < 7.

## Period selector

Three chips top-right: 7d / 30d (default on-load) / All time. Click
re-filters Activity + Notifications tiles; Lessons + Phases + HC
tiles are period-agnostic (they're snapshots, not time-windowed).

## Auto-repaint

Listeners on `activity:logged`, `notify:new`, `notify:read` re-call
`paint()` so the dashboard reflects mutations live.

## Honesty contract

- Every count tile carries a `bos-an-pill bos-an-pill-warn` "n<7
  indicative" badge when sample size is below threshold.
- HC trend explicitly says "Single snapshot — re-run HC to track
  delta over time" rather than fabricate a delta from a single
  reading.
- "No HC on file" is its own state — never a fake zero.
- All inputs read live from real localStorage; no fab data path.

## CSS — `.bos-an-*` block (~80L)

- 2-col tile grid (1-col under 760px); each tile = card with
  uppercase-meta label + Playfair big number + optional gradient bar.
- Phase dots = 14px circles in 4-col mini-grid; current state has a
  4px gold halo + 1.4s scale-pulse animation.
- Small-n pill = red-tinted rounded chip (different from R009 admin
  small-n which uses gold; analytics uses red to be louder about
  insufficient sample).
- Top-3 list: chip-style rows with icon + label + bold count.

## Smoke (verified 2026-05-07)

- `analytics.html` 200.
- Manual: open with empty localStorage → Lessons 0/22, Phases all
  grey except current (Epic Intro) gold + pulsing, HC "—" + run
  link, Activity 0 + small-n badge, Notifications "—" + small-n.
- Mark a few lessons done → Lessons tile increments + bar grows
  (auto-repaint on next page load; activity event also fires +
  paint via `activity:logged` listener).
- Set `incubator.phase='blueprint'` → Phase tile current dot moves.
- Run HC → HC tile shows score + weakest topic + the snapshot caveat.
- Click 7d / All-time chips → Activity + Notifications tiles
  recompute; small-n badge appears/disappears as threshold crosses.

## Q-ASSUMED + R027 follow-ups

- **HC delta over time**: bos.healthCheck only stores the latest
  reading. R+1: extend persistToBOS to push to a `bos.hcHistory[]`
  array of `{ts, topics}` snapshots; HC tile then computes
  `avg(latest) - avg(prior)` honestly.
- **Cross-business comparison** explicitly out per prompt.
- **External analytics** (PostHog / Plausible / GA4) explicitly out
  per prompt.
- **Lessons total = 22** is hardcoded (R025 closed the gap). When
  lessons.js gains new entries, this needs updating to
  `Object.keys(window.BOS_LESSONS).length` (trivial R+1).
- **Period-agnostic tiles** (Lessons / Phases / HC) ignore the
  period chip. R+1: could honour period for Activity-derived
  lesson-completion-in-period view.

## Cross-refs

- R009 (#85) admin polish — admin gives Founder cross-business view;
  analytics is per-business operator view (distinct surface).
- R013 (#89) Activity — Activity.list source for Activity tile.
- R022 (#98) Notify — bos.notifications source for Notifications
  tile.
- R025 (#101) lessons gap close — Lessons tile denominator (22).
- Chapter #66 storage shapes — every input read here is documented.
- Chapter #68 honesty contract — small-n badges + HC snapshot
  caveat enforce it.
