# 04 — Founder admin polish (T4 R009)

Expanded `business-os app/admin.html` from a thin Overview/Leads/Reports/
Questions stub into a real founder dashboard pulling from BOS + HC +
Incubator state. All localStorage aggregation — no API.

> Auth gate is still the throwaway `prompt()` password. Explicit TODO
> comment now flags T6 prod gate. Acceptable while the entire app runs
> on localStorage; not acceptable once the portal plugin lands.

## Storage keys touched

| Key                            | Source              | Notes                                             |
| ------------------------------ | ------------------- | ------------------------------------------------- |
| `bos.leads`                    | existing            | per-lead drill-down + CSV export                  |
| `bos.healthCheck`              | existing            | drill-down topic list                             |
| `bos.user`                     | existing            | sign-up KPI                                       |
| `bos.lessonProgress`           | R006                | "Lessons completed" KPI                           |
| `incubator.active`/`.phase`    | R001 / R002         | "Active in Incubator" + phase chip                |
| `incubator.phaseAdvanced`      | R006                | "Phase advances" KPI                              |
| `bos.marketplaceClicks`        | NEW R009            | `{addonId: count}` — tracker added to marketplace.html |
| `bos.leadNotes`                | NEW R009            | `{leadId: noteText}` — drill-down note field      |
| `bos.reports.snapshots`        | NEW R009            | `[{ts, leads, hcDone, lessonsDone, advances}]`    |
| `bos.adminUnlocked`            | existing #69        | gate flag                                         |
| `bos.hcQuestions`              | existing #69        | now includes per-step `phase` field               |

## Overview pane

Two KPI rows now. Existing 4 tiles preserved. NEW second row:

- **Active in Incubator** — boolean (`incubator.active`); subline shows current `incubator.phase` label.
- **Lessons completed** — count of true entries in `bos.lessonProgress`; subline "of 5 written".
- **Phase advances** — count of true entries in `bos.phaseAdvanced` (R006).
- **Top marketplace clicks** — top addon id + count + "N total clicks" subline. Renders `—` when no clicks tracked yet.

Single-device honesty: when no marketplace tracker has fired we render the dash, not a fake zero with implied data.

## Leads pane

- Existing table preserved; rows now `cursor:pointer` and emit click → drill-down.
- NEW "⬇ Export CSV" button top-right. Builds `id,name,source,stage,value,contact,note` rows from `bos.leads` + `bos.leadNotes`, escapes commas / quotes / newlines, downloads as `leads-YYYY-MM-DD.csv` via Blob + ObjectURL.
- NEW per-lead drill-down panel below the table:
  - Header: name + contact + source + stage + Close button.
  - Two-column body: HC topic list (with `unanswered` muted-pill for null scores per honesty contract) + Incubator phase + last activity from `bos.progress.lastActive`.
  - Note textarea + Save button → writes `bos.leadNotes[id]`. Status text confirms save for 2.5s.
- Lead id is `l.id` if present, otherwise positional `L<i>` — stable per session.

## Reports pane

- Existing reports table preserved (HC submissions list).
- NEW "📸 Run weekly snapshot" button captures the current metric counts into `bos.reports.snapshots` (append-only).
- NEW snapshots table below reports — newest first. Each row shows leads / HC done / lessons done / phase advances with **Δ vs the snapshot closest to (this snapshot's ts − 7 days)** rendered in green/red/grey.
- **Honesty contract**: small-`n` flagged — when any cell value is `<5` we render `n<5 indicative` pill alongside the count. Doesn't suppress the number; just labels the noise.

## Questions editor

Each step now exposes a `phase` `<select>` next to its `type` select:
`all | epic-intro | blueprint | diagnostics | brand-builder`. When set
to anything other than `all`, a small gold sub-line below the head
reads `↳ tagged for <phase> phase`.

Saved into the existing `bos.hcQuestions` shape — `step.phase`. The
lead-magnet read-side wiring (filter / prioritise by
`incubator.phase`) is R+1; admin captures the field today so editors
can tag without a code change.

## Auth gate TODO

Inline comment block above the existing `prompt()` IIFE flags the T6
prod-auth requirement:

```js
/* TODO (T6): replace prompt() password with real auth (server-side
   session check + role gate). Today's gate is a throwaway client-
   side check — anyone with devtools can bypass. */
```

Behaviour unchanged; `bos.adminUnlocked` flag still bypasses prompt
on subsequent loads.

## Marketplace click tracker (added in scope)

`marketplace.html` boot script gets a delegated click listener that
increments `bos.marketplaceClicks[addonId]` on every click inside an
`[data-mp-addon]` card. The data attr is added by `bos.js`'s
`renderMarketplace` so existing rendering works as-is.

## Files

| Path                                                  | Change                                          |
| ----------------------------------------------------- | ----------------------------------------------- |
| `business-os app/admin.html`                          | KPI row #2 + Leads CSV/drill + Reports snapshot + step phase select + auth-gate TODO |
| `business-os app/marketplace.html`                    | Click tracker delegate                          |
| `business-os app/bos.js`                              | `data-mp-addon` attr on addon-card root         |

## Smoke (verified 2026-05-07)

- `admin.html` 200; `marketplace.html` 200.
- KPI row #2 renders 4 tiles; with no incubator state shows `0` / `phase: Epic Intro` / `0 of 5 written` / `—`.
- Click any lead row → drill-down panel renders below; Save note writes `bos.leadNotes[id]`.
- Export CSV downloads `leads-2026-05-07.csv` with proper escaping.
- Take snapshot → row appears in snapshots table; second snapshot 7d+ later shows Δ + small-n pill.
- Adding a new question via the editor surfaces the phase `<select>`; selecting `blueprint` writes `phase:"blueprint"` to the step in `bos.hcQuestions` and the `↳ tagged for` line appears.
- Marketplace card click increments `bos.marketplaceClicks[id]`; Overview "Top marketplace clicks" reflects on next admin reload.

## Q-ASSUMED + R009 follow-ups

- "Lessons completed" denominator is hard-coded `of 5 written` per chapter #74 — when more lessons ship it'd want to read from a manifest.
- Snapshot deltas pick the snapshot **closest to (target − 7d)** rather than strictly 7d-old; with sparse runs that's the most useful match. Documented in the explanatory paragraph above the table.
- `bos.leadNotes` key is per-lead-id; if a lead is renamed/removed the orphan note persists. R+1: GC notes against current `bos.leads`.
- The questions editor `phase` field saves but the lead-magnet doesn't yet read it. R+1 is to teach `lead magnet app/index.html` to filter / prioritise by `incubator.phase` (lives in same localStorage namespace, trivial pull).
- No chart library per prompt; future rounds could add CSS sparklines or a tiny SVG-bar per snapshot row.

## Cross-refs

- Chapter #69 questions editor (this round extends with phase scope).
- Chapter #66 ecosystem snapshot + localStorage schema.
- Chapter #68 honesty contract (small-n flag, unanswered-topic pill, no fab marketplace zeros).
- Chapter #74 lesson catalogue (5 written → denominator).
- Chapter `04-incubator-phase-portal.md` (R001-R007) — phase / phaseAdvanced / lessonProgress all defined here.
