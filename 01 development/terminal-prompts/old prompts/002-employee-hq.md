/loop

# T1 — Round 002: Employee HQ + Role Builder

Ed asked for this explicitly: when he hires staff, give them scoped access
to fulfillment + SOPs without exposing the full agency surface. Spec is
captured in chapter
**`01 development/context/prior research/04-aqua-internals-reference.md`**
§9 (Employee HQ) + §9c (SOP-tag access gate). Read those first.

Pre-req: T1 Round 001 (Aqua reskin) shipped and the agency-shell home is
already live with Aqua phases + the six-section sidebar.

## Mandatory pre-read

1. Chapter #59 §9 + §9c (Employee HQ spec, SOP tag taxonomy).
2. Chapter #61 (Agency Shell) — what's already in place.
3. `03 old portal/.../eds-old-portal-idea-fixed/src/components/views/EmployeeManagementView/`
   + `RoleBuilder/` + `modals/EmployeeManagementModal/` +
   `modals/EmployeeProfileModal/` + `modals/AddRoleModal/` — the
   most-evolved prior shape. Read-only reference.
4. `04-the-final-portal/plugins/agency-hr/` — already shipped staff
   management for Aqua's existing departments / leave; **extend**, do not
   duplicate.

## Scope

**Goal A — Employee model on top of `agency-hr`**
- Extend `Staff` domain with `agencyEmployee: true` flag,
  `customRoleId?: string` pointer, `assignments: ClientAssignment[]`
  where `ClientAssignment = {clientId, roleId, scope: "view"|"edit"|"admin"}`.
- Existing Staff CRUD remains; new fields default to safe values for
  backwards compat.

**Goal B — Role Builder**
- New plugin or extend `agency-hr`: `Role { id, label, permissions:
  PermissionKey[], visibleViewIds: string[], requiresAuth: boolean }`.
- `PermissionKey` enum covers: `clients.view` / `clients.edit` /
  `clients.create` / `clients.delete` / `plugins.install` /
  `finance.view` / `finance.edit` / `kanban.view` / `kanban.edit` /
  `sops.view` / `sops.tag.<tagFamily>` (5 tag-family gates per §9c) /
  `employees.view` / `employees.edit` / `roles.edit`.
- Default seed roles: `Founder` (all perms), `Admin` (everything except
  `roles.edit`), `Designer` (clients.view + plugins.install +
  sops.tag.service), `Copywriter` (clients.view + sops.tag.sales +
  sops.tag.service), `Ops` (clients.view + finance.view + sops.tag.standards).

**Goal C — Surfaces**
- `/portal/agency/employees` — `EmployeeListPage`. Table: name + role +
  assigned-client count + last-active. Row click → profile.
- `/portal/agency/employees/[id]` — `EmployeeProfilePage`. Editable
  fields, assignments list, NDA-signed flag, payroll link to
  agency-finance.
- `/portal/agency/roles` — `RoleBuilderPage`. List of roles + permission
  matrix grid (rows=roles, cols=PermissionKeys, checkboxes). Default
  roles uneditable; clone-and-edit pattern.
- "+ Add employee" modal in `EmployeeListPage` topbar.

**Goal D — Permission gate**
- Foundation `requireRole(perm: PermissionKey)` middleware: reads
  current user's customRoleId → role.permissions, returns 403 if missing.
- Apply to existing per-route `visibleToRoles` machinery (extend, don't
  replace) — when a route declares `requires: PermissionKey[]`, gate by
  that.

**Goal E — Sidebar gating**
- `Sidebar.tsx` reads current user's role → filters `visibleViewIds`.
  Items the role can't see drop out cleanly.

**Goal F — Smoke + chapter**
- Smoke: Founder sees full sidebar; Designer sees only clients +
  service-SOP gate; permission denial returns 403 not 500; role
  edit cascades to current sessions on next request.
- Chapter `04-employee-hq.md`. MASTER row.

## NOT in scope

- The SOP shelf UI itself — T2 ships that as `002-sop-shelf` in parallel.
  Just declare the `sops.tag.<family>` permission keys; don't build SOP
  storage here.
- Touching `milesymedia website/` or `business-os/` (HARD BOUNDARY).
- Employee personal profile (avatar / bio / preferences) beyond what
  `agency-hr` Staff already has.
- Time tracking, payroll automation — agency-finance is the upstream.
- Custom permission groups beyond the keys listed.

## When done

DONE entry referencing `002-employee-hq.md`. Chapter committed. MASTER
row added. tasks.md row added. Commander archives the file.
