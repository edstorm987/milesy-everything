# Chapter 153 — ActivityCategory enum batch extension (T1 R033)

Multiple T2 plugins flagged R+1 ActivityCategory promotions when
they shipped, riding on `settings` / `hr` placeholders in the
meantime. R033 batches them all + adds chip styling + severity
derivation so the agency activity feed lights up new categories
without per-render code changes.

## Goal A — Enum extension

`src/server/types.ts ActivityCategory` extended with 9 new entries
(public-funnel + bos-auth-gate already promoted in R032):

| category          | plugin (chapter)     |
|-------------------|----------------------|
| `payroll`         | T2 R015              |
| `integrations`    | T2 R016 (#118)       |
| `support`         | T2 R017 (#119)       |
| `onboarding`      | T2 R018 (#126)       |
| `reports`         | T2 R019 (#127)       |
| `feedback`        | T2 R020 (#131)       |
| `team-resources`  | T2 R014              |
| `resources`       | T2 R013              |
| `files`           | T2 R010              |

Plugins continue to write under their placeholder (`settings` / `hr`)
until they update their own `logActivity` calls. This round only
unblocks the proper category — backfilling existing rows is
explicitly out of scope.

## Goal B — Chip styling + severity

NEW `src/lib/chrome/activityCategoryStyle.ts` (no `server-only` shim
— smoke drives runtime):

- `categoryStyle(category)` returns `{color, icon, label}` for every
  ActivityCategory member. Hex palette + emoji glyph + short label.
  Renderer composes background `#color1a` (10% alpha), border
  `#color55` (33%), text `#color`.
- Unknown category falls back to neutral chip (`color #64748b, label "Other"`)
  so an event written under a placeholder still renders.
- `deriveActivitySeverity(entry)` reads `entry.action` and pattern-matches:
  - **error**: `system.error.*`, `plugin.crash.*`.
  - **warn**: `feedback.detractor.*` (chapter #131 "high-severity"),
    `support.ticket.urgent.*`, `stripe.payment.failed`,
    `stripe.subscription.canceled`, `auth.lockout.*`.
  - **info**: everything else.
- `describeActivityChip(entry)` composite — returns `{category, severity}`.
- `CATEGORY_FILTER_ORDER` — operator-friendly ordering for the filter
  dropdown (operations-relevant first, settings/system last).

The pattern lists are the seed; future plugins extend them via PRs
to this module. No runtime registration — keeps the surface inspectable.

## Goal C — Activity feed wire-up

`src/app/portal/agency/_AgencyActivityFeed.tsx` updates:

- Imports `describeActivityChip`.
- `InboxEntry` gains optional `action?: string` so severity can
  derive (placeholder until activity-inbox API surfaces it through;
  feed gracefully tolerates `action` undefined → "info").
- Each row renders the chip with brand-coloured background + border
  + label.
- `warn` / `error` severity adds a left-border outline (amber-500 /
  red-600) + a 🔔 glyph before the message.
- `data-severity` attribute on each `<li>` for easy DOM probes /
  e2e selectors.

## Goal D — Smoke

NEW `scripts/smoke-activity-category-batch.test.ts` (run via
`npm run smoke:activity-category-batch`, 12/12 pass, ~3s).

Four suites, mostly pure runtime:

- **Enum** (1) — types.ts union contains every promoted category.
- **Chip styling** (4) — every category resolves to hex + icon +
  label; existing categories preserved (no regression); unknown
  category falls back to "Other"; CATEGORY_FILTER_ORDER includes
  every promoted category.
- **Severity derivation** (5) — feedback.detractor.* → warn;
  feedback.promoter.* → info; stripe.payment.failed +
  auth.lockout → warn; system.error / plugin.crash → error;
  describeActivityChip composes correctly.
- **Feed wire-up source-marker** (2) — describeActivityChip
  imported; warn/error outline + bell glyph applied; InboxEntry
  carries optional `action`.

## NOT in scope

- Backfilling existing activity rows that used placeholder
  categories — they continue to render under the placeholder; new
  events use the proper category going forward.
- Real activity-inbox layout overhaul (post-ship).
- Per-plugin sweep to update each `logActivity` call to the new
  category — incremental; plugins migrate as their next round
  touches them.
- Filter dropdown UI itself (`CATEGORY_FILTER_ORDER` exported but
  not yet rendered into a dropdown component — R+1 wires it once
  the activity-inbox UI lands).

## Q-ASSUMED

- **Hex palette over Tailwind class names**: chip colours need to
  compose at runtime (background alpha, border colour). Inline
  styles let `categoryStyle().color + "1a"` produce the alpha
  variant without enumerating a per-category Tailwind utility.
- **Emoji icons over @icon library**: zero client-bundle cost +
  works in the static export. R+1 swaps for an icon library if
  Ed wants visual consistency.
- **Severity derivation from action prefix over schema field**:
  ActivityEntry doesn't carry severity today; adding it would
  force every plugin to update its log calls. Pattern-matching
  the action prefix is a non-breaking add that downstream plugins
  ignore. R+1 promotes severity to a first-class field if the
  pattern grows.
- **Detractor warn over error**: chapter #131 says "red border +
  bell"; we add the bell + an amber-500 outline (warn). True red
  is reserved for `system.error.*` / `plugin.crash.*` (errors
  that need immediate attention; a detractor score is bad-feedback
  not service-broken).
- **`InboxEntry.action` optional + tolerant**: until the
  activity-inbox API surfaces `action` through, feed entries
  resolve to severity "info". Backwards-compatible.
- **Unknown category falls back to "Other"**: events written
  under any string still render. No throw, no fabrication — just
  a neutral chip + the message.
- **`CATEGORY_FILTER_ORDER` exported for future filter UI**: keeps
  the contract pinned in the smoke; rendering it lands when the
  inbox UI ships.
