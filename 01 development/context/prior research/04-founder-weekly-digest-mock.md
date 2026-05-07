# 04 — Founder weekly digest mockup (T4 R028)

A new "This week" panel above the R009 admin Overview KPIs +
copy-able Markdown digest modal + Monday auto-arm + history. Real
email send is T6 territory — for now the operator copies the body
into their mail client.

> Per prompt: real email send + HTML email styling are out of scope.

## File

`business-os app/admin.html` extended (no new file). One panel
inserted above existing KPIs + a modal at the same level + a
self-contained `(function(){…})()` block at the end of the inline
script.

## Storage

| Key                                  | Type                       | Notes                                                  |
| ------------------------------------ | -------------------------- | ------------------------------------------------------ |
| `bos.reports.weekly[]`               | NEW array `{ts, md}`       | Append on each digest open. Cap 12 entries.            |
| `bos.reports.weekly.lastArmedISO`    | NEW string                 | Set on every digest open. Used to suppress Monday auto-arm if already-this-week. |

## "This week" panel anatomy

- **Head**: eyebrow + `Founder digest <range>` (e.g. "May 5 – May 11")
  + History button + 📧 Send digest button + 1-line "Demo — real
  send via T6" subline.
- **Auto-arm banner**: gold-tinted strip "🌅 Monday digest ready —
  last week's wrap-up is queued up. Open it →" rendered only when:
  - it's Monday + before noon local time, AND
  - `bos.reports.weekly.lastArmedISO` is missing or > 6 days old.
  Click "Open it →" opens the modal (and stamps lastArmedISO).
- **Counts grid** (6 cells, responsive 6 → 3 → 2 col):
  HC done · Phase advances · Lessons done · Leads (week) · Unread
  inbox · Activity events. The Activity cell carries an "n<7
  indicative" pill when total < 7 (matches R027 honesty pattern).
- **Highlights list** (3 items with gold left-border):
  - 🏆 Most engaged business — iterates `BOSStorage.list()` and
    counts per-business `businesses.<id>.bos.activity` events in
    7d window. Tops the list. When zero events: explicit "No
    business activity in window — indicative only."
  - ⚠ Stuck pattern — single-user proxy: if HC done but zero phase
    advances → "could use a nudge"; if no HC → "send the lead-magnet
    link"; otherwise "no obvious stuck pattern this week."
  - 📈 Marketplace interest — top entry from `bos.marketplaceClicks`
    or honest "no clicks yet — indicative only."

## Send-digest modal

Triggered by:
- 📧 Send digest button in the panel head.
- Open-it link in the Monday auto-arm banner.
- "History" button shows alert with list of past digests + opens the
  most recent into the modal.

Inside:
- DEMO banner explaining T6 wires real send.
- Read-only `<textarea>` with the full Markdown body
  (`buildMarkdown()` composes from the same `gatherCounts()` +
  `gatherHighlights()` data).
- 📋 Copy to clipboard button (legacy `execCommand('copy')` +
  modern `navigator.clipboard.writeText`); status confirms copy then
  auto-clears 4s.
- Close button (✕) + click-outside-card closes.

Each open:
1. Pushes `{ts, md}` to `bos.reports.weekly[]` (capped 12).
2. Updates `bos.reports.weekly.lastArmedISO`.
3. R013 Activity logs `settings.changed` w/ `tab:'reports', action:'weekly-digest'`.

## Markdown body shape

```markdown
# Founder digest · May 5 – May 11

_Demo mock — real send via T6 once email-sender ships._

## Counts
- HC done: <n>
- Phase advances: <n>
- Lessons done: <n>
- Leads (week): <n>
- Unread inbox: <n>
- Activity events: <n> (n<7 — indicative only when applicable)

## Highlights
- 🏆 Most engaged: <business> (<n> events)
- ⚠ Stuck pattern: …
- 📈 Marketplace interest: top add-on …

— Sent from Business OS admin · <ISO>
```

Highlights stripped of HTML so the Markdown is plain-text mail-client
ready.

## Auto-arm logic

```js
if (now.getDay() === 1 && now.getHours() < 12
    && (!lastArmed || Date.now() - +new Date(lastArmed) > 6 * 86400000)) {
  showArmBanner();
}
```

Once-per-week guarantee comes from the 6-day spread (Monday-to-Monday
is always 7 days, but if user opens the digest mid-week the
lastArmedISO covers them through next Monday).

## History UX

History button → `alert()` with a numbered list of saved digest
timestamps + opens the most recent into the modal. Crude on purpose
— a real history surface is R+1 (probably a Reports-tab section in
admin).

## Honesty contract

- Activity count < 7 → "n<7 indicative" red pill on the cell.
- Most-engaged biz with 0 events → italic muted "No business
  activity in window — indicative only."
- Marketplace highlight with no clicks → italic muted "No clicks
  yet — indicative only."
- Stuck-pattern is a single-user proxy and the copy frames it as
  pattern-detection rather than authoritative metric.
- Demo banner on the modal calls out T6 plumbing.

## CSS — `.bos-week-*` block (~50L)

- `.bos-week-panel` — gradient card sitting above KPIs.
- `.bos-week-grid` — 6→3→2 col responsive count strip.
- `.bos-week-hl` — gold-left-border highlight rows.
- `.bos-week-armbanner` — gold-tinted Monday banner.
- `.bos-week-modal*` — full-screen overlay + 720px max-width card +
  `<textarea>` styled for monospace.

## Smoke (verified 2026-05-07)

- `admin.html` 200.
- This-week panel renders above KPIs with current week range.
- Counts populate from real localStorage; small-n pill appears on
  empty Activity log.
- Send-digest button opens modal; Markdown textarea contains the
  generated body; Copy fills clipboard; status confirms.
- History button (with no history) shows alert; with 1+ entries
  shows numbered list + opens most recent into modal.
- Each open appends to `bos.reports.weekly[]` (capped 12) +
  stamps lastArmedISO + fires Activity row.
- Manually setting `Date()` to a Monday morning would surface the
  auto-arm banner; banner has Open link that opens the modal.

## Q-ASSUMED + R028 follow-ups

- **Real email send** out per prompt — T6 plugs in email-sender.
- **HTML email styling** out per prompt — Markdown body is
  plain-text mail-client ready.
- **Cross-business count granularity** — currently iterates
  `BOSStorage.list()` for "most engaged" highlight only; the count
  cells are still flat (active-business view). R+1: each count
  could be the SUM across all businesses for true cross-roster
  view.
- **History UI** uses alert() — R+1 should be a proper Reports-tab
  panel listing saved digests with click-to-open.
- **Auto-arm timing** is wall-clock based on the user's local time.
  No server-side cron triggers it.
- **Cap 12 entries** = ~3 months of weekly digests. Bigger window
  R+1.

## Cross-refs

- R009 (#85) admin polish — this-week panel sits above existing
  KPIs in Overview pane; History could fold into Reports tab R+1.
- R013 (#89) Activity — `gatherCounts` + per-business engagement
  iterate `bos.activity` mirrored via R012.
- R012 (#88) BOSStorage — "Most engaged" highlight reads each
  business's namespaced activity entries.
- R022 (#98) Notify — unread-inbox count surfaces here.
- R027 (#103) Analytics — same data source family; small-n badges
  match the red-pill pattern (analytics uses red, week-panel uses
  red here too).
- Chapter #68 honesty — every count cell + every highlight has an
  honest fallback when sample is thin.
