# Chapter 131 — Multi-agency users (`agencyIds[]`) — T1 R025, WS-C

Foundation for the master/satellite vision (chapter #123 §"Multi-agency
vision"). Ed-as-master needs to belong to multiple agencies — Milesy
Media + future AquaOasis-web demo + niche satellites — each surfaced
through the same auth shell. R025 lays the schema + migration; the
Topbar agency switcher (R026) lands next sprint.

## Goal A — Schema dual-write

`ServerUser` now carries:

```ts
agencyIds: string[];   // canonical membership list
agencyId: string;      // legacy mirror — = agencyIds[0] (or LEAD_AGENCY_ID for leads)
```

The legacy `agencyId` field is preserved deliberately. 56+ existing
callsites read `user.agencyId` / `session.agencyId` directly — the
sweep is out of scope for this round, and most of those callers want
"the user's currently-active agency" (which is what the mirror
provides). New code should read `agencyIds`.

NEW exported `USER_SCHEMA_V = 2` constant flags the version the
migration runner expects.

## Goal B — Session payload extension

`SessionPayload` gains:

- `agencyIds?: string[]` — full membership list.
- `activeAgencyId?: string` — which agency the session is currently
  viewing.
- legacy `agencyId: string` — still required, mirrors `activeAgencyId`.

`issueSession` derives both:

```ts
const agencyIds = input.agencyIds && input.agencyIds.length > 0
  ? input.agencyIds
  : input.role === "lead" ? [] : [input.agencyId];
const activeAgencyId = input.activeAgencyId ?? input.agencyId;
```

Existing callers that pass only `agencyId` get the natural default
(`[agencyId]` + `activeAgencyId === agencyId`). Legacy cookies issued
before R025 still verify — `getSessionAgencyIds` falls back to
`[session.agencyId]` when the new fields are absent.

## Goal C — Migration runner

NEW `src/server/userSchemaMigration.ts` exports
`migrateUsersSchema(users)` — pure, idempotent, mutates in place:

1. Already-migrated rows (have `agencyIds`) pass through; if
   `agencyId` mirror drifted, re-stamp it.
2. Legacy single-agency rows: build `agencyIds = [agencyId]`
   (or `[]` for `lead` role).
3. Returns `{ scanned, upgraded, schemaVersion }` for telemetry.

Wired into `ensureHydrated` (storage.ts) — runs once after the cache
loads from disk via lazy import:

```ts
const { migrateUsersSchema } = await import("./userSchemaMigration");
migrateUsersSchema(cache.users);
```

Lazy import keeps the migration helper out of every storage
consumer's bundle. Runtime cost is negligible (single `Object.keys`
walk per cold start).

The module deliberately omits the `server-only` shim so the smoke
can `tsx --test` it directly.

## Goal D — User-creation paths

`createUser` (the canonical path — signup, founder seed, demo seeds,
invite-accept all funnel through it) now writes both shapes:

```ts
const agencyIds = input.role === "lead" ? [] : [agencyId];
// ... user: { ..., agencyIds, agencyId, ... }
```

Lead role keeps `agencyIds: []` (global tenant per chapter #127).

## Goal E — Helpers

NEW exports in `src/lib/server/auth.ts`:

- `getSessionAgencyIds(session): string[]` — full membership.
  Back-compat: falls back to `[session.agencyId]` for legacy cookies.
- `getActiveAgencyId(session): string` — what the session is viewing.
  Defaults to `session.agencyId`.
- `getActiveAgencyIds(session): string[]` — convenience for "all my
  agencies" UI surfaces. Today returns membership; reserved for the
  R026 switcher to expand once `activeAgencyId` can differ from
  `agencyIds[0]`.
- `assertTenantScope(session, agencyId): void` — throws
  `AuthError(403, "tenant_scope_mismatch")` when the requested
  agencyId is outside the session's membership. Master users with
  multiple agencies pass for any of theirs.

## Goal F — Smoke

NEW `scripts/smoke-multi-agency-users.test.ts` (run via
`npm run smoke:multi-agency-users`, 10/10 pass, ~3s).

Five suites:

- **Migration runner** (4 pure-runtime tests) — single→array
  conversion / idempotence / lead → empty array / preserves existing
  agencyIds + re-mirrors agencyId.
- **Schema** (2 source-marker tests) — types.ts has agencyIds +
  legacy mirror + USER_SCHEMA_V; SessionPayload has activeAgencyId +
  agencyIds.
- **createUser** (1) — both shapes written.
- **issueSession + helpers** (2) — derives defaults; auth.ts exports
  all four helpers + `tenant_scope_mismatch` error.
- **Storage hydrate** (1) — ensureHydrated calls migrateUsersSchema.

## NOT in scope

- Topbar agency switcher UI (R026 next sprint).
- Per-agency lead-magnet packs (Phase 12 R4 post-ship).
- Domain-aware marketing (Phase 12 R3 post-ship).
- Sweeping the 56 `session.agencyId` / `user.agencyId` callsites to
  read `agencyIds` directly — legacy mirror handles them.

## Q-ASSUMED

- **Legacy `agencyId` mirror over sweep**: 56 callsites; most want
  "current/active agency" (which mirror provides). Sweep can land
  incrementally as R026+ surfaces want multi-agency reads.
- **Migration in `ensureHydrated`**: runs once on cold start;
  idempotent so warm restarts are no-ops. Lazy import keeps storage
  consumers' bundles lean.
- **Lead = empty `agencyIds`**: chapter #127 contract — leads are
  global, not bound to any agency. Sentinel `LEAD_AGENCY_ID` stays
  in the legacy mirror for `requireAgencyScope` to reject at the
  boundary.
- **`activeAgencyId` defaults to `agencyId`**: until R026 ships the
  switcher UI, every session has `activeAgencyId === agencyId`.
- **Legacy cookies pre-R025 stay valid**: `getSessionAgencyIds`
  falls back to `[session.agencyId]` when `agencyIds` field is
  absent. No forced re-login on deploy.
- **`assertTenantScope` is the new boundary**: existing
  `requireRoleForClient` etc. continue to use `session.agencyId`
  directly (which mirrors active agency). New routes that need to
  accept any-of-membership should call `assertTenantScope`.
- **Smoke source-marker for schema/wire-up; pure-runtime for
  migration**: migration is pure logic without server-only deps;
  schema + wire-up live in modules that have server-only.
