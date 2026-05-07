/loop

# T4 — Round 012: Multi-business localStorage segregation

Today every BOS+HC+Incubator surface uses flat `bos.*` / `incubator.*`
keys — fine for single-user but breaks if Ed wants to demo two businesses
side-by-side or if an operator adds a second business to their account.
Introduce a `bos.activeBusinessId` switch + namespace data under
`businesses[id].*`. Backwards-compatible.

## Mandatory pre-read

1. T4 chapter #66 — full localStorage schema.
2. T4 chapter #67 — plugin handoff spec (this round prepares the
   per-business segregation that Postgres extraction will need).

## Scope

**A** — `lib/storage.js` shim: `Storage.get(key)` / `Storage.set(key)`
that auto-prefixes with `businesses.<activeId>.` (or returns flat key
if no activeId). Existing direct localStorage reads keep working.

**B** — Migrate the top 12 most-read keys (bos.brand, bos.healthCheck,
bos.lessonProgress, incubator.phase, etc.) to go through the shim.

**C** — Business switcher dropdown in BOS topbar + Incubator topbar:
"My business: {name} ▾" → menu of businesses + "+ Add new business".
Persists `bos.activeBusinessId`.

**D** — One-time auto-migration: on first boot of new code, if no
`businesses.*` keys exist, copy current flat keys into `businesses.
default.*` and set `activeBusinessId="default"`.

**E** — Chapter R012 + MASTER delta.

## NOT in scope

- Real cross-device sync (no APIs).
- Per-business sharing / permissions.

## When done
DONE referencing `012-multi-business-localstorage.md`.
