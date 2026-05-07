# 04 · Admin · live HC questions editor

Author: T4
Status: shipped 2026-05-07.

## Why

Ed wants to edit the Health Check questions himself: add new ones, change wording, swap in different question types. Originally the lead-magnet had `var QUESTIONS = […]` hardcoded inline — admin couldn't drive it.

## What changed

### Default question set extracted to a shared module

`04-the-final-portal/milesymedia website/lead magnet app/hc-questions.js` exposes `window.HC_AREAS = [...]` containing the full default 5-area / 3-tier-each / N-step-each AREAS structure (Visibility & Search · Your Website · Where Customers Come From · My Business · Keeping Them, with Beginner / Intermediate / Professional tiers each with their own `exercise` array of step objects).

### Lead-magnet reads localStorage override first

```js
var AREAS = (function () {
  try {
    var ovr = JSON.parse(localStorage.getItem('bos.hcQuestions') || 'null');
    if (ovr && Array.isArray(ovr) && ovr.length) return ovr;
  } catch (e) {}
  return window.HC_AREAS || [];
})();
```

Edit in admin → save to `bos.hcQuestions` → reload the HC tab → user sees the new questions.

### Admin editor (tree)

`/admin.html` Questions-editor tab pulls `hc-questions.js` from `../lead magnet app/` (same origin in dev + prod), then renders a tree:

```
[Area card — collapsed by default, click to expand]
  ├ Area meta:    name · icon · blurb
  ├ Tier tabs:    [Beginner] [Intermediate] [Professional]
  └ Tier meta:    label · time · summary
     └ Steps (per tier exercise array):
        ├ Step 1 — type select (choice/multi/slider/text/task/reveal/url)
        ├ Step 2 — fields adapt to type:
        │            choice/multi: prompt + options (one per line, `label | score`)
        │            task/reveal:  title + body (HTML allowed) + done-label
        │            slider:       prompt + min + max + suffix
        │            url/text:     prompt + placeholder
        └ + Add step / × Delete step
        
+ New area / × Delete area / Restore defaults
```

Every input change writes immediately to `localStorage['bos.hcQuestions']`. Restore-defaults clears the override so the lead-magnet reverts to `window.HC_AREAS`.

### Admin gate

Throwaway prompt() password gate on `/admin.html`. Defaults `milesy` or `aqua`. On correct, `bos.adminUnlocked = '1'` so the prompt never repeats. Wrong → 🔒 lockup screen.

## Open follow-ups

- **Score field for `choice` options is ad-hoc** (split on ` | `). Could be a proper input matrix, but the current syntax is fine for a small editor.
- **No undo / version history.** Last-write-wins on `bos.hcQuestions`. Restore-defaults is the only safety net.
- **No "preview as user" button yet.** Admin opens a new tab to `../lead magnet app/index.html` to test, but that doesn't isolate from any captured `hc.contact` or progress. Could add a "Preview as fresh user" that wipes `hc.*` and `bos.healthCheck` for a clean test.
- **Quickwins functions on each area** (the `quickwins(slot)` builders that produce the action-rich wins on results) are NOT yet editable from the admin — they're hardcoded in `hc-questions.js`. Admin can edit the structure but not the action-mappings.
- **Admin will become a portal route** (`/admin/lead-magnet-traffic`) when the BOS extracts to `@aqua/plugin-business-os`. The localStorage backing becomes Postgres.

## Files

- `04-the-final-portal/milesymedia website/lead magnet app/hc-questions.js` (new, shared)
- `04-the-final-portal/milesymedia website/lead magnet app/index.html` (loader hook)
- `04-the-final-portal/milesymedia website/business-os app/admin.html` (tree editor)
- `04-the-final-portal/milesymedia website/business-os app/styles.css` (tree editor styling)
