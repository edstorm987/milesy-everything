/loop

# T1 — Round 025: Multi-agency users — `agencyIds[]` (WS-C R025 / Phase 12 R1)

`ServerUser.agencyId` becomes `agencyIds: string[]`. Foundation for the
master/satellite vision (chapter #123 §"Multi-agency vision"). Ed-as-
master needs to belong to multiple agencies (Milesy Media + future
AquaOasis-web demo + niche satellites).

Plan reference: chapter #124 `04-ship-plan-v1.md` WS-C R025.

## Mandatory pre-read

- Chapter #123 §"Multi-agency vision" + §"Gaps to close".
- Chapter #19 architecture (pool model — `agencyId` is on every row).
- `users.ts` + `auth.ts` session payload shape.

## Scope

**A** — Schema: `ServerUser.agencyIds: string[]` (replaces
`agencyId: string`). Migration runner converts existing rows:
`agencyIds: [agencyId]`. Idempotent — running twice is safe. Migration
versioned (`USER_SCHEMA_V` constant) so dual-read paths can detect
unmigrated rows.

**B** — `SessionPayload` carries `activeAgencyId: string` (the agency
this session is currently scoped to) **plus** legacy `agencyId` field
mirroring it for back-compat. Issue helper picks first agencyIds entry
when no `activeAgencyId` passed.

**C** — Scope helpers: every existing `getCurrentUser`-derived agency
query (lots — grep for `session.agencyId`) keeps working via the
back-compat field. NEW helper `getActiveAgencyIds(session)` returns
`[activeAgencyId]` for the current-session scope; reserved for any
"all my agencies" UI surface (e.g. Topbar switcher in R026).

**D** — User-creation paths (signup, invite-accept, founder seed,
demo seeds) updated to write `agencyIds: [agencyId]` not
`agencyId: agencyId`. Lead signup (from R023) keeps `agencyIds: []`.

**E** — Tenant scope helper `assertTenantScope(session, agencyId)`
checks `session.agencyIds.includes(agencyId)` so master users with
multiple agencies pass for any of theirs. (`activeAgencyId` is only
the current view; multi-agency reads still respect membership.)

**F** — Smoke `§ Multi-agency users`: migration converts single→array
+ back-compat agencyId field reads/writes correctly + new user paths
write array + assertTenantScope passes for any membership +
unauthorised cross-agency rejected.

**G** — Chapter `04-multi-agency-users.md` + MASTER row.

## NOT in scope

- Topbar agency switcher UI (R026 next sprint).
- Per-agency lead-magnet packs (Phase 12 R4 post-ship).
- Domain-aware marketing (Phase 12 R3 post-ship).

## When done
DONE referencing `025-multi-agency-users.md`.
