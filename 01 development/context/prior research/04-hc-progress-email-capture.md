# 04 — HC progress save / email-capture nudge (T4 R017)

The post-Q5 progress-save modal already existed (cycle 30 work). R017
extends it into a **resume-link generator**: the modal now captures
email + name, generates a `?resume=<token>` URL the user can copy and
open on another device, and stores the captured email as a lead.

> Honesty contract: every surface in this flow says "Demo mode — email
> isn't sent yet". Real send wires later via T6 (per chapter #71 open
> follow-ups).

## What changed

### Modal (lead-magnet `index.html`)

Two card states inside `[data-hc-progress-modal]`:

- **Form state** (`[data-hc-progress-shell]`): name + **email** (now
  required) + optional mobile + amber "Demo mode" fineprint + "Email me
  my progress link →" submit. Skip button preserved.
- **Result state** (`[data-hc-progress-result]`, hidden by default):
  "🔗 Your resume link is ready." + `<textarea>` with the URL +
  "📋 Copy to clipboard" + Close. Status line confirms copy.

Switching states swaps `hidden` attrs — no re-render flash.

### Token generator

```js
makeResumeToken(email, savedAtIso) =
  btoa(unescape(encodeURIComponent(JSON.stringify({
    email, savedAt: savedAtIso, hcState: state
  }))))

makeResumeUrl(email) = location.origin + location.pathname + '?resume=' + encodeURIComponent(token)
```

Token payload includes the full module-scope `state`
(`{step, type, areaIdx, tier, exerciseIdx, answers}`) so a resume
fully restores the user's place in the funnel.

### `?resume=<token>` consumer

Runs at the very top of the script (right after `var state = {…}`).
Decodes safely (catch errors honestly), validates **7-day expiry**,
restores `state = payload.hcState`, sets `window.__hcResumed = true`
+ `__hcResumedEmail`, and writes `hc.contact = {email, capturedAt:
'resume-link', resumedAt: …}`.

Failure cases (corrupted, missing fields, expired) set
`window.__hcResumeError = '<honest message>'` instead — surfaced as a
red banner above the intro card on next paint.

### Resume finalisation

A second IIFE at script tail reads `__hcResumed` and calls the right
view setup:
- `state.step === 'overview'` → `show('overview') + renderOverview()`
- `'exercise'` → `show('exercise') + renderStep()`
- `'results'` → `show('building')` then 400ms later
  `buildResults(); show('results'); paintResultsExtras()`
- `'gate'` → `show('gate')`
- otherwise → fallback `show(state.step)`

Then injects a small green "✓ Resumed · <email>. Picking up where you
left off." banner above the visible step.

### Lead capture

`appendLeadFromHcSave(email, name)` pushes to `bos.leads[]` per
chapter #66 schema:

```js
{
  id: 'L' + base36-ts,
  email, name,
  source: 'hc-progress-nudge',
  capturedAt: ISO
}
```

Visible in admin Leads tab (R009) immediately. R013 Activity also
fires `hc.shared` with `{source: 'hc-progress-nudge', method:
'resume-link', name}` so the timeline + admin "Activity events / 7d"
KPI both reflect the capture.

### CSS

`.hc-modal-fineprint` block (~12L) appended to lead-magnet
styles.css — small amber-tinted notice for the "Demo mode" copy.

## Token & expiry contract

- 7-day expiry — `+new Date(payload.savedAt) - now > 7d` triggers
  `__hcResumeError = 'Resume link expired …'`.
- No HMAC / signing — purely client-side reconstruct. Fine for the
  v1 demo because nothing is server-trusted; T6 swap will be a real
  signed token via the email-sender plugin.
- `encodeURIComponent` round-trip handles emoji + UTF-8 in answers.
- Failures degrade to honest messaging, never silent breakage.

## Smoke (verified 2026-05-07)

- `lead magnet/index.html` 200; `?resume=<garbage>` 200 with red
  honest error banner.
- Manual flow:
  1. Run HC ≥5 questions in section 1 → modal pops.
  2. Enter name + email + click "Email me my progress link →".
  3. Modal switches to result state with the URL textarea.
  4. Copy the URL (clipboard write-through covers both legacy +
     navigator.clipboard).
  5. Open in new tab → "✓ Resumed" green banner above the right
     step + answers preserved.
- `bos.leads[]` shows the captured lead in admin Leads tab.
- R013 Activity timeline shows the `hc.shared` row.
- Forging a stale `savedAt` >7d in the token → red expiry banner.

## Q-ASSUMED + R017 follow-ups

- **Real email send** explicitly out per prompt — T6 plugs in
  email-sender. Today the user copies the URL manually; the modal
  is honest about it.
- **No HMAC / signing** — payload is base64-only. Acceptable while
  it's a localStorage demo; T6 must sign the token server-side
  before any real email goes out (otherwise anyone could forge a
  resume URL pointing to whatever state).
- **Cross-device sync beyond resume-link** out of scope. Multi-business
  R012 already keeps each business namespaced; resume link doesn't
  switch business.
- **Token URL length**: full hcState can grow to several KB once the
  user answers many questions. Modern browsers handle ~32KB URLs
  fine; if state explodes, R+1 should chunk into localStorage +
  pass only an opaque id.

## Cross-refs

- Chapter #71 open follow-ups (HC progress email line — closed by
  this round in v1 demo form; T6 wires real send).
- Chapter #68 honesty contract (Demo-mode labels + honest expiry +
  honest failure messages).
- Chapter #66 `bos.leads[]` schema (this round adds `source: 'hc-progress-nudge'`).
- R013 (#89) Activity (resume-link generation logged as `hc.shared`).
- R009 (#85) admin Leads tab + per-lead drill-down (sees R017 leads).
- R010 (#86) HC handoff — `hc.contact` written by R017 resume-flow
  is consumed by `bridgeHcToIncubator()` exactly the same as before.
