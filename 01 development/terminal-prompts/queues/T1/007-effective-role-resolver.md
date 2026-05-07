/loop

# T1 — Round 007: Effective-role resolver in chrome

R+1 deferral from R002 (Employee HQ). Wire chrome (Sidebar + page guards)
to read each user's effective `customRoleId`, look up its permissions via
`agency-hr`'s `RoleService`, and hide nav items / view tabs the user
lacks. Hide-not-disable so menus stay clean.

## Mandatory pre-read

1. Chapter `04-employee-hq.md` (T1 R002) — `PermissionKey`,
   `roleHasPermission`, `permissionGuard`, `RoleService`.
2. Chapter `04-agency-shell.md` R1+R2 — Sidebar `extra` slot + agency layout.
3. `04-the-final-portal/portal/src/components/chrome/Sidebar.tsx` — current
   `visibleToRoles` filter; extend to `requires: PermissionKey[]`.

## Scope

**A** — `effectiveRole(user)` resolver in `lib/server/effectiveRole.ts`
that returns `{ roleId, permissions: PermissionKey[] }`. Reads user's
`agencyEmployee.customRoleId` from agency-hr storage, falls back to
legacy role enum mapping (Founder/Admin/Designer/Copywriter/Ops →
seed roles).

**B** — Sidebar.tsx + per-client overview tabs accept optional
`requires: PermissionKey[]` from manifests. Filter by intersection
against effectiveRole.permissions. Founder always sees everything.

**C** — `<RequirePermission requires=...>` server-component wrapper for
admin-page bodies (server-side check; renders 403 fallback otherwise).
Migrate the 4-5 highest-risk admin pages (agency-hr, agency-finance
placeholder, fulfillment phase-transition).

**D** — Smoke `§ Effective role`: 5 seed roles each load
`/portal/agency` and only see expected sidebar items + tabs. Founder
sees all. Designer cannot see Finance tab. Chapter
`04-effective-role-resolver.md` + MASTER row.

## NOT in scope

- New permissions beyond the 18 keys from R002.
- Cross-plugin permission inheritance.
- T4 territory.

## When done
DONE referencing `007-effective-role-resolver.md`.
