# Chapter 127 — `lead` role + permission grid (T1 R023, WS-A)

R022 shipped the post-login redirect with a defensive `lead` arm
ahead of the role landing. R023 lands the role: `lead` is a global
tenant — HC graduates, Resources tool users, and BOS visitors sit
here pre-agency-signup. They are not bound to an agency.

## Goal A — `Role` union

`src/server/types.ts`:

- `Role` gains `"lead"`.
- `ALL_ROLES` includes it (`AGENCY_ROLES` / `CLIENT_ROLES` unchanged —
  leads are neither).
- NEW `isLeadRole(role)` type guard. Mutually exclusive with
  `isAgencyRole` / `isClientRole`.

## Goal B — Sentinel agency id

Leads have no agency, but `ServerUser.agencyId` is a required string
across 56 call-sites — making it optional would force a sweeping
refactor outside this round's scope. Instead:

```ts
export const LEAD_AGENCY_ID = "agency_lead_global";
```

Lead users (and their session payloads) carry this sentinel. The
helper `requireAgencyScope` rejects it at the route boundary so no
real agency-scoped read ever sees the sentinel — emit/logActivity
calls that pass it through write to a virtual "lead-global" stream
that's harmless and easy to filter.

This is an explicit Q-ASSUMED: the sentinel keeps the existing
schema honest with a one-symbol change instead of a 56-callsite
rewrite. R+1 (when leads grow more behavior) can re-evaluate.

## Goal C — Permission grid

`effectiveRole.ts` now has an explicit `case "lead": return EMPTY`
arm. No agency-scoped permissions; the `account.read` /
`account.update.email-name` capabilities the prompt mentions live
outside the permission grid (in `/portal/account` chrome) and aren't
gated by `EffectiveRole`.

`resolvePostLoginPath` (R022) keeps its `case "lead": return "/business-os"`
arm — confirmed via smoke. With `lead` now part of the `Role` union,
the resolver dropped its permissive `RoleLike` cast and uses
`SessionPayload["role"]` directly.

## Goal D — Lead signup tolerates missing agency

`createUser`'s `CreateUserInput.agencyId` is now optional. Behavior:

- `role === "lead"` + missing `agencyId` → defaults to `LEAD_AGENCY_ID`.
- `role === "lead"` + explicit `agencyId` → caller's value wins (used
  for "this lead came from agency X's funnel" attribution at R+1).
- Any other role + missing `agencyId` → throws at runtime
  (`agencyId required for role "<role>"`). Defensive; the type system
  already ensured callers always pass one before this round, so this
  guards against future refactors.

`bootstrapAgency` is **not** called for lead signups. The public-funnel
plugin (T2 R021) that owns the HC → lead → BOS flow consumes this
contract: lead signup creates user only, no agency record.

## Goal E — `requireAgencyScope` boundary helper

NEW `src/lib/server/requireAgencyScope.ts`:

- `isAgencyScopedSession(session)` — predicate. Returns `false` when
  role is `lead`, agencyId is the sentinel, or agencyId is empty.
- `requireAgencyScope(session)` — throws `AuthError(403, "agency_scope_required")`
  for non-agency-scoped sessions.

Pairs with `requireRole` (allowed-role-list gate). Drop one line at
the top of any agency-scoped endpoint:

```ts
const session = await requireSession();
requireAgencyScope(session);
```

Wider adoption is incremental — this round ships the helper +
boundary contract. Per-route adoption follows the same pattern as
R021's CSRF wire-up.

## Goal F — Smoke

NEW `scripts/smoke-lead-role.test.ts` (run via
`npm run smoke:lead-role`, 9/9 pass, ~5s).

Five suites:

- **Type system** (4 tests) — `lead` in ALL_ROLES not in
  AGENCY/CLIENT_ROLES; `isLeadRole/isAgencyRole/isClientRole` mutual
  exclusion; LEAD_AGENCY_ID stable string; non-lead roles still
  classify correctly. Pure-runtime — types.ts has no `server-only`.
- **effectiveRole.ts** (1 test) — explicit `case "lead"` returning
  EMPTY. Source-marker (server-only).
- **requireAgencyScope.ts** (2 tests) — file exists; rejects lead +
  sentinel + missing agencyId via AuthError(403). Source-marker.
- **Post-login redirect** (1 test) — resolver still has
  `case "lead": return "/business-os"`. Source-marker.
- **users.createUser** (1 test) — `agencyId?:` optional + lead
  defaults to LEAD_AGENCY_ID + non-lead missing-agency runtime guard.

## NOT in scope

- HC → lead auto-signup (T2 R021).
- BOS auth gate (T2 R022).
- Lead-to-agency-owner upgrade flow (R+1 post-ship).
- Per-route adoption of `requireAgencyScope` (incremental — this
  round ships helper + boundary contract).

## Q-ASSUMED

- **Sentinel `LEAD_AGENCY_ID` over schema-relax**: 56 callsites read
  `agencyId` as `string`; relaxing to optional would force a sweeping
  refactor. Sentinel keeps the contract honest with one symbol.
  Documented in types.ts header comment; `requireAgencyScope` rejects
  it at the boundary.
- **Lead permission grid = EMPTY**: `account.*` capabilities the
  prompt mentions are chrome-level routes (/portal/account), not
  permission-grid entries. `EMPTY` matches the existing pattern for
  client-* / end-customer (also outside the agency grid).
- **`createUser` non-lead missing agencyId throws at runtime**: types
  already required it before this round. Runtime guard catches future
  callers that accidentally drop the field.
- **Topbar `ROLE_LABEL` gets "Lead"**: required by `Record<Role, string>`
  exhaustiveness check after the union extension.
- **Resolver dropped permissive `RoleLike`**: `lead` is now a real
  member of `SessionPayload["role"]` so the cast is no longer needed.
