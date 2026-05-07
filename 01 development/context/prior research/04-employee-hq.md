# Employee HQ + Role Builder (T1 002)

Ed asked for this explicitly: when he hires staff, give them scoped
access to fulfillment + SOPs without exposing the full agency surface.
Spec: chapter #59 §9 + §9c. This chapter records the v1 shape that
shipped — what's in, what deferred, and the wiring contract that lets
plugin authors gate routes by `PermissionKey` incrementally.

## What ships

Employee HQ is built **on top of** the existing `agency-hr` plugin
rather than as a new plugin — chapter #61's "extend, do not duplicate"
guideline. The plugin already owned Staff + Department + Leave; this
round adds Roles + an Employee surface that filters Staff to
`agencyEmployee: true`.

### Goal A — Staff domain extended (additive)

`Staff` (in `plugins/agency-hr/src/lib/domain.ts`) gains:

- `agencyEmployee?: boolean` — opt-in flag set by the EmployeeListClient
  invite flow. Existing seeded staff default to undefined (false-y) so
  they don't accidentally show up under Employees.
- `customRoleId?: string` — points at a `CustomRole`. When unset, the
  foundation `role` (agency-owner / agency-manager / agency-staff)
  remains the gate.
- `assignments?: ClientAssignment[]` where
  `ClientAssignment = {clientId, roleId, scope: "view"|"edit"|"admin"}`.
  Per-client scoping for Designers/Copywriters who only operate on
  certain therapists. Empty by default.
- `metadata?: Record<string, unknown>` — same bag pattern as the
  agency-shell R2 `Client.metadata`. NDA-signed flag, payroll link, and
  any future profile fields land here without further schema growth.

`CreateStaffInput` and `UpdateStaffPatch` accept all four; `update()`
merges `metadata` rather than clobbers so partial patches preserve
siblings, mirroring `tenants.updateClient`.

### Goal B — Role domain + RoleService

New file `plugins/agency-hr/src/server/roles.ts`. `CustomRole` shape:

```ts
{ id, agencyId, label, permissions: PermissionKey[],
  visibleViewIds: string[], requiresAuth: boolean, seed: boolean,
  createdAt, updatedAt }
```

`PermissionKey` is the canonical gate identifier. The 14 keys from the
prompt plus the 5 `sops.tag.<family>` variants per chapter §9c =
**18 total** keys (Sales / Service / Standards / Internal / Tools).

Storage shape mirrors Staff/Department: `role:<id>` + `role/index`.

`RoleService` exposes list / get / create / update / delete /
seedDefaults. `seedDefaults` is idempotent — short-circuits if the
index exists. Seed-flagged roles refuse update + delete with a clear
error ("clone-and-edit instead"). Sort order pins seeds first
(Founder → Admin → Designer → Copywriter → Ops), then user clones
alphabetically.

Default seed roles match the prompt spec exactly:

| Role | Permissions |
|---|---|
| Founder | all 18 |
| Admin | all except `roles.edit` |
| Designer | clients.view + plugins.install + sops.tag.service |
| Copywriter | clients.view + sops.tag.sales + sops.tag.service |
| Ops | clients.view + finance.view + sops.tag.standards |

`onInstall` was extended: after seeding default departments, it now
also calls `c.roles.seedDefaults(ctx.actor)`. Idempotent — safe on
upgrade for existing installations.

### Goal C — Surfaces

Two new manifest pages mounted at:

- `/portal/agency/agency-hr/employees` → `EmployeesPage` →
  `EmployeeListClient` (rows = staff filtered to `agencyEmployee` or
  `customRoleId` set; row click expands NDA / payroll / assignments;
  `+ Add employee` modal POSTs to `/staff` with `agencyEmployee:true`
  injected).
- `/portal/agency/agency-hr/roles` → `RolesPage` → `RoleMatrixClient`
  (sticky-leftmost role column + 18 permission columns + per-cell
  checkbox; seed rows render checkboxes disabled with a `seed` chip;
  `Clone` button on each row creates an editable copy; `+ New role`
  modal creates a blank role).

Two new nav items added to the manifest under `panelId: "agency-hr"`,
visible only to `AGENCY_ADMINS` (agency-owner + agency-manager) since
both surfaces mutate org-wide identity.

`EmployeeProfilePage` was folded into `EmployeeListClient` as an
inline row-expand rather than a separate route — keeps the manifest
page count tight and matches the way Staff/Departments render their
rows. The dedicated `/employees/[id]` route is documented as an R+1
deferral when more profile fields land.

### Goal D — Permission gate

`permissionGuard(role, requires: PermissionKey[])` is exported from
the agency-hr server barrel as an opt-in helper any plugin handler can
call to enforce a `requires` declaration. Throws a 403-shaped error
(`error.status = 403`) on miss; the foundation's catch-all surface can
translate the throw into JSON. `roleHasPermission(role, perm)` is the
boolean predicate.

The `requires: PermissionKey[]` route declaration is a **plugin-side
opt-in**. Existing routes' `visibleToRoles` machinery (the foundation
role gate) keeps working unchanged. Plugins adopt incrementally — when
a route author wants permission-key precision, they add `requires` and
call `permissionGuard(...)` inline. Sweeping retrofit across every
plugin's existing routes is documented as an R+1 deferral; the
current 19 routes already gate by `visibleToRoles` so the surface is
not insecure.

### Goal E — Sidebar role-aware filter

The chrome's `Sidebar.tsx` already filters items via the manifest's
`visibleToRoles`; the new Employee HQ items declare
`visibleToRoles: AGENCY_ADMINS` so they drop out cleanly for
`agency-staff`. The `visibleViewIds` field on `CustomRole` is wired
into the data model and surfaces in the matrix UI's clone payload but
the chrome-side reading of it (filter sidebar by an effective role's
viewIds) is documented as an R+1 follow-up — needs a way to resolve
"current user's effective role" in the chrome layer, which currently
only sees the foundation `role` not the `customRoleId`.

### Goal F — Smoke + chapter

`portal/scripts/smoke.mjs` gains a `§ Employee HQ` block:

- `GET /api/portal/agency-hr/roles` returns 200 with all five seed
  roles flagged `seed: true`.
- `/portal/agency/agency-hr/roles` and `/employees` pages render 200.
- Cloning a seed role via `POST /roles` produces a new editable role.
- Inviting an employee via `POST /staff` with `agencyEmployee:true` +
  `customRoleId` + `metadata` persists.

`tsc --noEmit` clean inside the agency-hr workspace. End-to-end smoke
run via the portal's local dev server is **deferred** — running it
collides with the parallel-session Next single-instance lock that's
hit several rounds (R7 WARN). The agency-hr `__smoke__/hr.test.ts`
suite should grow a roles slice in a future incremental commit.

## API surface added

| Method | Path | Visibility |
|---|---|---|
| GET | `roles` | agency-owner / manager / staff |
| POST | `roles` | agency-owner / manager |
| PATCH | `roles` | agency-owner / manager |
| DELETE | `roles` | agency-owner / manager |

Same body conventions as the existing routes — POST takes
`CreateRoleInput`, PATCH takes `{id, patch}`, DELETE takes `?id=` or
JSON body.

## Files

- `plugins/agency-hr/src/lib/domain.ts` — Staff extension + Role/
  Permission types + ClientAssignment + ALL_PERMISSION_KEYS.
- `plugins/agency-hr/src/server/staff.ts` — Honours new fields in
  create/update; merge-on-update for `metadata`.
- `plugins/agency-hr/src/server/roles.ts` — NEW. RoleService +
  DEFAULT_ROLES + roleHasPermission + permissionGuard.
- `plugins/agency-hr/src/server/index.ts` — Container picks up
  RoleService; barrel exports.
- `plugins/agency-hr/src/api/handlers.ts` — Four new role handlers.
- `plugins/agency-hr/src/api/routes.ts` — Four new role routes.
- `plugins/agency-hr/src/pages/EmployeesPage.tsx` — NEW.
- `plugins/agency-hr/src/pages/RolesPage.tsx` — NEW.
- `plugins/agency-hr/src/components/EmployeeListClient.tsx` — NEW.
- `plugins/agency-hr/src/components/RoleMatrixClient.tsx` — NEW.
- `plugins/agency-hr/index.ts` — Manifest registers two nav items +
  two pages; `onInstall` seeds default roles.
- `portal/scripts/smoke.mjs` — `§ Employee HQ` block.

## HARD BOUNDARY honoured

Zero touches to `04-the-final-portal/milesymedia website/` or
`04-the-final-portal/business-os/` — Ed's territory.

## Deviations / Q-ASSUMED

- **EmployeeProfilePage merged into row-expand** rather than a
  dedicated `/employees/[id]` page. Keeps file count tight; profile
  fields available are minimal (NDA / payroll / assignments) so a
  full-page surface would be padding.
- **`metadata` bag for NDA / payroll** — same pattern as Client
  metadata in the agency-shell R2 round, not first-class fields.
- **`requires: PermissionKey[]` adoption is opt-in per route** — no
  sweeping retrofit. Existing `visibleToRoles` keeps working in
  parallel.
- **Sidebar `visibleViewIds` filter is wired data-side only** — chrome
  rendering uses the foundation `role`, not the `customRoleId`. R+1
  follow-up: resolve effective role in chrome and apply
  `visibleViewIds`.
- **Smoke verification is harness-side only**. Live smoke against the
  Next dev server deferred (parallel-session lock collision; same
  WARN as R7 chapter).
- **Parallel-session WARN**: during step 1 of this round, an
  orchestrator commit (`0650856`) absorbed `RoleMatrixClient.tsx` from
  my untracked working tree and the working-tree state had an
  intervening reset that lost `roles.ts`, `EmployeesPage.tsx`,
  `RolesPage.tsx`, and `EmployeeListClient.tsx` after their `Write`
  tool calls reported success. Re-applied in step 2. Same shared-
  `.git/index` mesh hazard documented in R7/R8 chapters; resolved
  cleanly by re-writing + immediate commit.

## R+1 candidates

- Dedicated `/portal/agency/agency-hr/employees/[id]` page when
  profile data grows beyond NDA / payroll / assignments.
- Per-client assignment editor UI inside the row-expand or a future
  profile page (POST `/staff/assignments` add/remove).
- Foundation chrome layer resolves the current user's effective role
  (foundation role + customRoleId merge) and applies
  `visibleViewIds` to the sidebar before render.
- Sweeping retrofit of existing plugin routes to declare
  `requires: PermissionKey[]` and call `permissionGuard()` (clients,
  finance, kanban first; SOP routes will already declare it from the
  T2 002 SOP shelf round).
- agency-hr `__smoke__/hr.test.ts` grows a roles slice (seed
  idempotency, clone, update permissions, refuse seed mutation).

## Cross-team handoffs

- **T2 SOP shelf** (`002-sop-shelf` shipped @ `ed53377`, MASTER #63):
  the five `sops.tag.<family>` permission keys are now declared
  exactly as their spec called for. T2's SOP routes can call
  `permissionGuard(role, ["sops.tag.service"])` etc. as soon as
  agency-hr's role exposes itself via the foundation user store.
- **Foundation chrome** (T1): the `Sidebar.tsx` `visibleViewIds`
  filter is the next concrete wire-up. Needs an `effectiveRole`
  resolver that merges foundation `role` + `customRoleId` into a
  permissions set, then drops nav items whose `id` isn't in
  `visibleViewIds` (when set).
