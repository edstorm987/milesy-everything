# 04 — "As a client" preview mode (T4 R020)

Operator (or Founder) can preview BOS + Incubator from a client's
POV. Switches `bos.activeBusinessId` to the previewed business via
R012's BOSStorage + flags every page with a sticky violet "Previewing
as {name}" banner. 60-min auto-expire, then silently flips back.

> Per prompt: multi-operator preview sessions out of scope.

## Storage shape — `bos.previewAs`

```js
{
  businessId,             // BOSStorage.list() id being previewed
  originalBusinessId,     // operator's own active id at preview-start (for exit-restore)
  leadId,                 // admin lead the preview was kicked off from
  leadName,               // banner display label
  startedAt: ISO,
  expiresAt: ISO          // startedAt + 60 min
}
```

Lives at the top of the localStorage namespace (not per-business) so
exit-flow can switch back regardless of which business is currently
active.

## Admin lead-detail entrypoint

R009's lead drill-down panel gains a new section below the note
field:

> 👁 Preview as this client
> Previews BOS + Incubator from a client's POV for 60 min. Switches
> active business + flags every page with a banner you can exit.
>
> [select: businesses from BOSStorage.list()] [Preview as this client →]

Click handler:
1. Reads selected business id from the `<select>` (defaults to current
   active).
2. Snapshots current `BOSStorage.activeId()` as `originalBusinessId`.
3. Writes `bos.previewAs` with 60-min expiresAt.
4. Calls `BOSStorage.switch(businessId)` if changing.
5. `window.open('app.html', '_blank', 'noopener')` so the operator's
   admin tab stays put.

## `mountPreviewBanner()` on every BOS + Incubator page

Mirrored helper in:
- `bos.js` (boot — runs alongside trial banner / cart icon / Incubator strip).
- `incubator.js` (boot — runs first thing in DOMContentLoaded).

Both follow the same contract:
1. Read `bos.previewAs`.
2. If null → no-op.
3. If `expiresAt` past → silently clear flag, switch back to
   `originalBusinessId` (if any), reload. **No banner shown** —
   honest auto-expire.
4. Else render sticky violet banner top-of-body:
   `👁 Previewing as <strong>{leadName}</strong> · expires in ~{N} min · Exit preview`
5. Click "Exit preview" → clear flag, switch back, reload.

The banner is keyed `[data-bos-preview-banner]` so it's idempotent
(no double-mount on accidental re-paint).

## Auto-expire semantics

- Computed at every page boot — opening a tab past the 60-min mark
  silently clears the flag.
- "of inactivity" interpreted as wall-clock, not interaction time:
  the flag is set once + checked on every load. Any page load past
  60 min from `startedAt` triggers expire. Real activity-tracker
  (refresh expiry on every interaction) was considered but felt
  surveilly for v1; defer to R+1 if needed.
- After silent expire, business is switched back via
  `BOSStorage.switch(originalBusinessId)`. No banner is shown to
  reduce noise.

## Honest behaviour

- Banner explicitly names the lead being previewed and time
  remaining — operator can never accidentally believe they're
  "really logged in as the client".
- Exit is one click + reload — never blocks the operator from
  bailing.
- The preview is **read-write** — anything the operator does inside
  the previewed business namespace persists into that business's
  `businesses.<id>.*` keys. Documented Q-FLAG: future "preview-only,
  read-only" mode could lock writes via a flag in BOSStorage.set;
  R+1 if Ed wants strict separation.

## Q-ASSUMED + R020 follow-ups

- **Lead → business mapping** doesn't exist yet — the admin select
  defaults to the operator's own active business. That gives the
  preview button a working surface today; once leads carry a
  `businessId` field (R+1 sign-up flow), the select can default to
  the lead's business.
- **Read-only mode** out of scope for v1 — the operator can mutate
  the previewed business's state. Q-FLAG: surface a stricter mode
  via `bos.previewAs.readonly = true` + a BOSStorage.set guard.
- **Cross-tab refresh** — open BOS in two tabs while previewing,
  exit in one, the other still shows the banner until reload. R+1:
  listen on the `storage` event to auto-clear in sibling tabs.
- **Multi-operator preview sessions** explicitly out per prompt.

## Smoke (verified 2026-05-07)

- admin.html, app.html, incubator app/index.html all 200.
- Manual flow:
  1. Open admin → click any lead row → drill-down renders.
  2. New "👁 Preview as this client" section appears below note.
  3. Pick a business + click "Preview as this client →" → new tab
     opens at app.html with violet "👁 Previewing as <name> · expires
     in ~60 min · Exit preview" banner top-of-body.
  4. Click any Incubator page (back-strip + new-tab nav) → same
     banner shows on Incubator pages too.
  5. Click "Exit preview" → flag cleared, business switched back to
     original, reload completes with no banner.
- Manually setting `bos.previewAs.expiresAt` in past → next reload
  silently clears flag + switches back, no banner.

## Cross-refs

- R009 (#85) admin lead drill-down — entrypoint extended.
- R012 (#88) BOSStorage — `BOSStorage.switch` + `activeId` are the
  swap mechanism; `bos.previewAs` is a top-level key (not in
  NAMESPACED_KEYS — it's a session control flag, not per-business
  data).
- R011 (#87) entitlement — preview doesn't change entitlement; the
  operator sees the previewed business's pro state if any.
- R013 (#89) Activity — preview start/exit could log activity rows
  in R+1 (`as-client.preview-start`, `…preview-exit`); skipped this
  round to keep scope tight.
- R018 (#94) print.css — preview banner is hidden on print via
  `[data-print-hide]` selector pattern; banner gets `data-bos-preview-banner`
  which is in print.css's hide list (added there in R018 already as
  catch-all `[data-print-hide]`).
