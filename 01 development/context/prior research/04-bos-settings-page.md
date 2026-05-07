# 04 — BOS settings + preferences page (T4 R024)

A single per-business settings page covering: brand profile,
notification prefs, AI prefs, billing entitlement, and data
export/delete. All localStorage-backed; switching business via the
R012 sidebar swap flips these settings too.

> Per prompt: real billing changes (T6) and cross-business data
> migration are out of scope.

## File

NEW `business-os app/settings.html` (~300L), 5-tab layout.

## Tabs

### 1. Profile

Edits `bos.brand.{companyName, niche, logoUrl, primary, secondary}`.
Live swatch preview on the right shows the current niche-mark + name
in the chosen colours. Save:
- Writes through `BOSStorage.set('bos.brand', …)` so per-business
  R012 mirror stays in sync.
- Fires `Activity.log('settings.changed', { tab:'profile' })`.

### 2. Notifications

Per-kind toggle list driven by `Notify.KINDS` (5 kinds today). Saved
to NEW `bos.notifyPrefs = { [kind]: { enabled:bool, channel:'inbox' } }`.
Default = enabled when key missing. Toggling fires
`Activity.log('settings.changed', { tab:'notifications', kind, enabled })`.

`Notify.push()` was patched to read `bos.notifyPrefs[kind].enabled`
before pushing — disabled kinds are silently dropped at the source.

### 3. AI

NEW `bos.aiPrefs = { tone: 0-100, length: 'short'|'medium'|'long' }`.
Tone slider with formal / balanced / playful labels; live label updates
as user drags. Length select (Short / Medium / Long).

**Honest callout** at top: "the scripted Aqua AI (R007) doesn't branch
on tone or length yet — these settings are captured for the day real
Claude wires in via T6, at which point the prompts include them as
system-prompt context." No silent broken behaviour.

### 4. Billing

Reads `bos.entitlement` via `window.BOS.getEntitlement()` (R011) with
a localStorage fallback. Three states:
- **Free** → "Start the 14-day Pro trial →" link to `upgrade.html`.
- **Pro trial** → countdown days remaining + Confirm-Pro / See-plan CTAs.
- **Pro** → start date + See-plan / Downgrade-to-Free CTAs. Downgrade
  prompts confirm + writes `bos.entitlement.tier='free'` + flips legacy
  `bos.mode='free'` + logs `settings.changed` with `tab:'billing', to:'free'`.

DEMO callout up top reminding nothing is really charged.

### 5. Data

- **Export**: dumps every `bos.*` / `businesses.*` / `incubator.*` /
  `hc.*` localStorage key into a single JSON Blob, downloads as
  `business-os-export-YYYY-MM-DD.json`. Logs `settings.changed`
  with `action:'export', keys:N`.
- **Delete this business**: requires literal-name typing
  (anti-fat-finger) → confirm dialog → calls `BOSStorage.remove(active.id)`
  (R012) which clears the namespaced keys + drops registry entry +
  switches to first remaining business if any. Logs
  `settings.changed` with `action:'delete', businessId`. Redirects to
  `app.html` after success.

## `Activity.KINDS` registry

Gains `settings.changed` (⚙️ "Settings changed").

## CSS — `.bos-set-*` block (~70L)

- Pill-style tabs (matches R013 chip pattern).
- 1.6fr/1fr profile grid (collapses to 1col under 760px).
- iOS-style slide toggle for notification prefs (44×24, gold when
  enabled).
- Live swatch card with brand mark + name preview in chosen colours.
- Tone slider with three under-labels (formal/balanced/playful).

## Smoke (verified 2026-05-07)

- `settings.html` 200; `notify.js` 200.
- Tab switching works; Profile save persists + reloads correctly.
- Live swatch updates on `input` events (color picker drag).
- Toggle a kind off in Notifications → calling Notify.push for that
  kind silently no-ops.
- AI tone slider drag updates the formal/balanced/playful label live.
- Billing tab reflects current entitlement; Free → Trial link;
  Trial → countdown + Confirm Pro link; Pro → Downgrade-to-Free
  works.
- Export downloads a `.json` blob; Delete requires exact name typing
  + confirm + clears the active business via BOSStorage.remove.

## Q-ASSUMED + R024 follow-ups

- **Real billing changes** + **cross-business data migration** out
  per prompt. Today downgrade is local-only flag flip; no data
  migration involved.
- **AI tone/length** captured but inert until T6 wires real Claude.
  The system-prompt template will read `bos.aiPrefs` at call time.
- **Logo upload** is URL-only today. R+1: file → data URL upload via
  the existing R009 admin pattern.
- **Delete confirmation** uses literal-name typing + native `confirm()`.
  Stronger pattern (e.g. typing "DELETE") considered but rejected for
  v1; the namespaced-keys-only deletion is non-destructive enough that
  this is acceptable friction.
- **Cross-tab settings sync** — open settings in two tabs, change
  prefs in one, the other doesn't update until reload. R+1: `storage`
  event listener.

## Cross-refs

- R007 (#83) Aqua AI scripted — AI tab captures prefs the future
  Claude wiring (T6) will consume.
- R009 (#85) admin — distinct surface (admin = Founder view across
  all businesses; settings = current-business operator preferences).
- R011 (#87) entitlement — Billing tab is the user-facing read of
  what R011 controls.
- R012 (#88) BOSStorage — Profile.save calls BOSStorage.set;
  Delete calls BOSStorage.remove.
- R013 (#89) Activity — every settings change logs `settings.changed`.
- R022 (#98) Notify — Notify.push patched to respect
  `bos.notifyPrefs[kind].enabled`.
- Chapter #66 ecosystem — `bos.notifyPrefs` + `bos.aiPrefs` are new
  storage entries (R+1: register them in R012 NAMESPACED_KEYS so
  prefs are per-business too).
