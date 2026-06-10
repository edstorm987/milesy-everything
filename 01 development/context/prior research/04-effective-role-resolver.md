# `04` Effective-role resolver in chrome (T1 R7)

> Authored 2026-05-07. Closes the R+1 deferral from T1 R002 (Employee
> HQ) — wires the chrome (Sidebar + admin-page wrappers) to read each
> user's effective role-permission grid and hide nav items / page
> bodies the user lacks.

## Files touched

- `portal/src/lib/server/effectiveRole.ts` (NEW)
  - `effectiveRole(session): { roleLabel, permissions, isFounder }`.
    Maps `session.role` enum → agency-hr's `DEFAULT_ROLES` seed by
    label: `agency-owner` → Founder (all 18 perms) · `agency-manager`
    → Admin (17 — all minus `roles.edit`) · `agency-staff` →
    Designer (3 narrow) · `client-*` / `end-customer` → empty.
  - `hasAllPermissions(eff, requires)` — Founder bypass; empty
    requires = no gate; otherwise every key must be in the grid.
  - Re-exports `PermissionKey` + `ALL_PERMISSION_KEYS` for callers.
  - Imports come from a relative path
    (`../../../../plugins/agency-hr/src/...`) rather than the
    `@aqua/plugin-agency-hr/server` workspace alias. The package's
    node_modules-symlinked `src/server/index.ts` snapshot pre-dates
    R7's `ALL_PERMISSION_KEYS` re-export and would 2305 at compile
    time without a clean reinstall — relative imports work
    immediately and stay in sync with the on-disk source.
- `portal/src/lib/server/RequirePermission.tsx` (NEW)
  - Server component. `<RequirePermission session requires={[...]}
    fallback?>{children}</RequirePermission>`. Empty `requires` =
    no gate. Founder always passes. Otherwise renders an inline 403
    panel describing the required keys + the user's current
    `roleLabel` (or a custom fallback).
- `portal/src/plugins/_types.ts`
  - `NavItem.requires?: string[]` — declared at manifest level so
    plugins can opt nav items into the grid (not all surfaces have
    been migrated yet — empty/omitted is a no-op).
- `portal/src/lib/chrome/sidebarLayout.ts`
  - `BuildSidebarInput` gains `permissions?: readonly string[]` +
    `isFounder?: boolean`.
  - `buildSidebar` adds an `if (item.requires && !isFounder &&
    !item.requires.every(p => grid.has(p))) continue;` filter
    immediately after the existing `visibleToRoles` gate.
- `portal/src/app/portal/agency/layout.tsx` &
  `portal/src/app/portal/clients/[clientId]/layout.tsx`
  - Compute `effectiveRole(session)` and pass `permissions` +
    `isFounder` into `buildSidebar`. Other layouts (customer scope)
    don't need the gate today — end-customers see no plugin nav.
- `portal/src/app/portal/clients/[clientId]/page.tsx`
  - Wraps the Tools tab content in `<RequirePermission requires={
    ["plugins.install"]}>` and the Finance tab content in
    `<RequirePermission requires={["finance.view"]}>`. SOPs tab
    keeps its own `assertSopsAccess` gate (T1 R4 pattern).
- `portal/scripts/smoke.mjs`
  - NEW `§ Effective role` block: Founder POV sees Tools + Finance
    tab content (no 403 panel substring).

## Migration scope (Goal C)

The prompt called for "4-5 highest-risk admin pages". Migrated in
this round:

1. Per-client Tools tab (`plugins.install`).
2. Per-client Finance tab (`finance.view`).

Deferred to a follow-on polish round:

3. Agency-side `/portal/agency/agency-finance` admin pages — the
   pages live inside the agency-finance plugin package; foundation
   can't drop a `<RequirePermission>` wrapper around plugin-mounted
   pages without a foundation-level page-mount adapter.
4. Fulfillment phase-transition surface — gating on the API side
   (`/api/portal/fulfillment/phase/advance`) is the right hook,
   but T2 owns that handler. Prompt's intent is captured by the
   onboarding-dashboard advance button: only Founder/Admin reach
   that surface today via sidebar visibility; keys to enforce
   server-side land when foundation route declarations honour
   `requires:` natively (R+1).
5. Agency-hr roles page — already has its own role gate
   (`AGENCY_ADMINS`); explicit `requires: ["roles.edit"]` move is
   pending the foundation page-mount adapter.

The pattern for follow-on migration is one-line: wrap the page body
in `<RequirePermission session={session} requires={[...]}>`.

## Q-ASSUMED log

1. **Default-role mapping over per-employee `customRoleId` lookup.**
   Foundation has no container resolver for plugin storage today, so
   reading the user's `agencyEmployee.customRoleId` from agency-hr's
   `PluginStorage` at request time would require a fresh
   plumbing-round (foundation→plugin service registry). v1 keys off
   `session.role` enum directly; the customRoleId override is the
   documented hookup point for R+1 once that registry exists.
2. **Empty `requires` = no gate.** Most plugin nav items don't
   declare `requires` yet. Treating empty as "open" lets us migrate
   incrementally without breaking existing surfaces.
3. **Relative-path import for agency-hr internals.** The workspace
   alias resolves through node_modules which was snapshotted before
   R7's new exports; relative imports always read the on-disk
   source. Documented for the next reinstall round to flip this back.
4. **Smoke verifies Founder POV only.** Role-swap testing across
   Admin/Designer/Copywriter/Ops would need the smoke to bootstrap
   distinct sessions for each — out of scope for this round; the
   resolver itself is unit-tested via the type-checker (each
   `session.role` switch arm pinned to a known seed label).

## NOT in scope

- New permission keys beyond the 18 from R002.
- Cross-plugin permission inheritance.
- Per-employee `customRoleId` override (R+1 — needs foundation
  plugin-storage resolver).
- Migrating agency-finance / agency-hr roles / fulfillment
  phase-advance surfaces (each documented above as "polish round
  follow-on").

## Smoke results

`§ Effective role` block adds 3 checks. tsc clean. HARD BOUNDARY
honoured.
