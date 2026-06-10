# 04 — Multi-business localStorage segregation (T4 R012)

Today every BOS + HC + Incubator surface uses flat `bos.*` /
`incubator.*` keys — fine for single-user but breaks if Ed wants to
demo two businesses side-by-side, or if an operator manages a second
business under one account. R012 introduces a per-business namespace
under `businesses.<id>.<key>` plus an active-business switcher.

**Approach: switch-by-mirror.** Each business's data is stored under
`businesses.<id>.<key>` for the 14 namespaced keys; the active
business's data is **also mirrored into the flat `<key>` slots** so
existing readers (bos.js, incubator.js, admin, lead-magnet) need no
changes. Switch / add / remove rewrite the flat slots from the new
active business. This was the safest path with the most existing
code paths preserved — full reader migration to a `BOSStorage.get()`
shim is R+1.

> Real cross-device sync, sharing, permissions are explicitly out of
> scope per the round prompt. Postgres extraction (chapter #67) is
> the next layer up.

## Storage schema additions

| Key                                     | Type                | Purpose                                           |
| --------------------------------------- | ------------------- | ------------------------------------------------- |
| `bos.businesses`                        | `[{id,name}]`       | List of businesses on this device.                |
| `bos.activeBusinessId`                  | string              | Active business id; `'default'` after migration.  |
| `businesses.<id>.<flatKey>`             | varies              | Per-business mirror of any of the 14 NAMESPACED_KEYS. |

`NAMESPACED_KEYS` (top 14 most-read per chapter #66):

```
bos.user · bos.brand · bos.healthCheck · bos.progress ·
bos.lessonProgress · bos.tasks · bos.leads · bos.activity ·
bos.entitlement · bos.company ·
incubator.phase · incubator.phaseProgress ·
incubator.phaseAdvanced · incubator.lastVisitedPhasePage
```

(Round prompt asked for "top 12" — we shipped 14 because the marginal
cost is zero and entitlement + activity were both candidates not in
the original 12 list.)

## `BOSStorage` API — `incubator app/lib/storage.js`

```js
window.BOSStorage = {
  NAMESPACED_KEYS,         // array of namespaced keys
  list()                   → [{id, name}]
  activeId()               → string | null
  getActive()              → {id, name} | null
  add(name)                → {id, name}      // snapshot current flat keys, switch
  switch(id)               → boolean         // mirror namespace → flat
  remove(id)               → void            // also clears that namespace
  rename(id, name)         → void
  set(key, value)          → void            // writes both flat AND namespaced slot
  snapshot(id)             → void            // copy flat keys into namespace
  mirror(id)               → void            // copy namespace into flat keys
}
```

**`set(key, value)`** is the public write-through helper: writes the
flat slot AND, if the key is in `NAMESPACED_KEYS`, the
`businesses.<active>.<key>` slot. New code should prefer
`BOSStorage.set()` over raw `localStorage.setItem()` for any
per-business field. (Existing direct-write code paths still work —
they just skip the namespaced mirror until the next switch /
snapshot, which is acceptable because `switch()` calls `snapshot(prev)`
first to capture any unsaved drift.)

## Auto-migration

Runs on first load of `lib/storage.js`. If `bos.businesses` is empty:

1. Best-effort name from `bos.user.business` || `bos.brand.companyName`
   || `'My business'`.
2. Append `{id:'default', name}` to `bos.businesses`.
3. Set `bos.activeBusinessId = 'default'`.
4. `snapshotInto('default')` — copies all 14 flat-key values into
   `businesses.default.<key>`.

Idempotent — re-running does nothing because the list is non-empty.

## Switcher UI — `incubator app/lib/business-switcher.js`

Auto-mounts into:

- **Incubator pages**: inserts a `<span data-bos-switcher>` into
  `.inc-toprail`, before the existing "milesymedia.co ↗" link.
- **BOS pages**: inserts a `<div data-bos-switcher>` into
  `.bos-sidebar`, above `.bos-side-nav`.

UI:
- Pill button "◆ <name> ▾" with current business name (truncated at 160px).
- On click → menu listing all businesses (active marked with ✓ + accent
  colour), separator, "+ Add new business" item.
- Pick existing → `BOSStorage.switch(id)` + `location.reload()` so
  every reader picks up the freshly-mirrored flat keys.
- "+ Add new business" → `prompt()` for name → `BOSStorage.add(name)` +
  reload (new business starts as a snapshot of the current flat keys
  — operator can wipe in admin if they want a blank slate; documented
  Q-ASSUMED).

CSS: `.bos-switcher*` appended to **both** `incubator app/incubator.css`
(dark-themed pill) and `business-os app/styles.css` (light-themed full-
width sidebar item) since the two surfaces have different palettes.

## Wiring

- **Incubator**: 5 most-visited pages get `<script src="lib/storage.js">`
  + `<script src="lib/business-switcher.js">` before the existing
  `incubator.js` (root + 4 phase pages). Other Incubator pages
  (onboarding, portal-bridge, resources, discover) don't get the
  switcher this round — limits visual noise on transactional pages
  per Q-ASSUMED.
- **BOS**: bos.js boot calls a new `ensureSwitcherLoaded()` that
  injects both scripts into `<head>` (idempotent via `[data-bos-storage]`
  guard). Mirror-pattern of `ensureAquaAILoaded()` from R007. Every
  BOS page picks it up automatically; no per-page edits.

## Smoke (verified 2026-05-07)

- `lib/storage.js`, `lib/business-switcher.js`, root + phase-1 pages,
  BOS app.html all return 200.
- First load with no `bos.businesses` → migrates to `[{id:'default',
  name:'<bos.user.business || My business>'}]`; `businesses.default.*`
  populated from current flat keys.
- Switcher renders in Incubator toprail (right side, before
  milesymedia link) and in BOS sidebar (above auto-nav).
- Click "+ Add new business" → prompt → new business in list with
  ✓ on the new one; flat keys still hold the snapshot so user can
  modify and switch back to default to see the original state preserved.
- Switch back to "default" → reload → all flat keys mirror the
  default's namespaced state.

## Q-ASSUMED + R012 follow-ups

- **Switch-by-mirror** chosen over Storage-prototype monkey-patch —
  zero touch on existing readers, lower risk. Full reader migration
  to `BOSStorage.get()` is R+1.
- **+ Add new business** snapshots current flat keys as starting
  state. Alternative would be "blank slate" — left to R+1 admin UX
  ("Duplicate from default" vs "Start fresh").
- **No per-business UI for marketplace clicks / niche packs / activity
  log** — these still mirror correctly via switch but admin views are
  per-active-business only. Multi-business analytics (cross-business
  KPIs) is R+1.
- Switcher mounts on the 5 most-visited Incubator pages; the 4
  transactional pages (onboarding/portal-bridge/resources/discover)
  intentionally skip to keep visual noise low.
- `BOSStorage.set()` write-through is implemented but not yet used by
  any caller — exists for R+1 / future code. Existing writers
  (bos.js, admin, etc.) continue to write flat keys directly; their
  changes propagate to the active namespace on next `switch()` via
  the prev-snapshot step.
- No per-business `bos.businesses` GC of orphan namespace keys when
  a business is removed — R+1 (`removeBusiness()` does delete the 14
  namespaced keys explicitly, but if `NAMESPACED_KEYS` grows, old
  names persist).

## Cross-refs

- Chapter #66 ecosystem snapshot + flat localStorage schema (this
  round shows the segregated overlay).
- Chapter #67 plugin handoff (per-business namespace shape Postgres
  will mirror — this is the localStorage stub of the eventual
  `business_id` column on every row).
- Chapter #71 open follow-ups (R012 is one of the open items closed
  in this batch).
- R009 (#85) admin (future "switch admin to per-business view"
  surfaces here).
- R011 (#87) entitlement is now namespaced — different businesses
  can have different Pro states.
