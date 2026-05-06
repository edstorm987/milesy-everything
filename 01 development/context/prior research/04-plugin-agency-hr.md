# Agency HR plugin (T2 R3)

`@aqua/plugin-agency-hr` — internal HR for the agency operating the
portal. Staff directory, departments, and leave management. Mirrors
the fulfillment + ecommerce port pattern: vendored `AquaPlugin` types,
ports for foundation, container builder, foundation adapter the
foundation side-effect-imports at boot.

> Built by T2 on 2026-05-04 as Goal B of Round 3, alongside the
> phase-lifecycle smoke (chapter 26). Manifest tsc-clean standalone;
> 6/6 smoke tests green.

## 1. Package shape

```
04-the-final-portal/plugins/agency-hr/
├── index.ts                         default-exports the AquaPlugin manifest
├── package.json                     @aqua/plugin-agency-hr@0.1.0
├── tsconfig.json
├── src/
│   ├── lib/
│   │   ├── aquaPluginTypes.ts       vendored AquaPlugin contract (T1 unification later)
│   │   ├── domain.ts                Staff · Department · LeaveRequest types + CRUD inputs
│   │   ├── tenancy.ts               AgencyId / Role / ActivityCategory mirrors
│   │   ├── ids.ts                   makeId + slugify
│   │   └── time.ts                  now() + toDateString + daysBetween
│   ├── server/
│   │   ├── ports.ts                 TenantPort + ActivityLogPort + EventBusPort + PluginInstallStorePort
│   │   ├── staff.ts                 StaffService (CRUD + cycle-safe manager graph)
│   │   ├── departments.ts           DepartmentService (CRUD + cycle-safe parent tree + DEFAULT_DEPARTMENTS)
│   │   ├── leave.ts                 LeaveService (request → approve/reject → cancel)
│   │   ├── foundationAdapter.ts     registerAgencyHrFoundation + containerFor singleton
│   │   └── index.ts                 buildAgencyHrContainer + barrel re-exports
│   ├── api/
│   │   ├── handlers.ts              13 route handlers
│   │   └── routes.ts                ROUTES manifest array (visibleToRoles per route)
│   ├── components/                  client (`"use client"`)
│   │   ├── StaffList.tsx
│   │   ├── NewStaffModal.tsx
│   │   ├── DepartmentList.tsx
│   │   └── LeaveBoard.tsx
│   ├── pages/                       server-rendered (default-export server component)
│   │   ├── StaffPage.tsx            mounted at "" + "staff"
│   │   ├── DepartmentsPage.tsx
│   │   ├── LeaveRequestsPage.tsx
│   │   └── SettingsPage.tsx
│   └── __smoke__/
│       └── hr.test.ts               6 node:test cases via tsx --test
└── package-lock.json
```

22 source files, ~2300 LOC, zero runtime dependencies (peer-deps on
`react@19` + `next@16` only).

## 2. Manifest (key fields)

```ts
{
  id: "agency-hr",
  category: "ops",
  status: "alpha",
  core: false,                  // opt-in via the agency-side marketplace
  scopePolicy: "agency",        // installs at agency scope only — never per client
  navItems: [Staff, Departments, Leave, Settings] (4 items, all panelId: "agency-hr"),
  pages: [StaffPage (×2), DepartmentsPage, LeaveRequestsPage, SettingsPage] (5 entries),
  api: ROUTES (13 routes — see §4),
  features: [leave-workflow, department-tree, manager-graph],
  settings.groups: [general (leaveAutoRestoreDays, defaultPtoDaysPerYear), permissions (canStaffEdit)],
  onInstall: seeds DEFAULT_DEPARTMENTS via the per-request container,
  healthcheck: reports staff + department counts + foundation registration state,
}
```

`scopePolicy: "agency"` matches `04-foundation-round2.md §"Auto-install
core plugins"` — the foundation's `installCorePluginsForScope({clientId})`
auto-skips agency-scoped plugins, so HR never lands per client even
if the phase preset sneaks it in.

`core: false` keeps it out of `installCorePluginsForScope` entirely;
agency owners install it explicitly from the marketplace (or the
foundation can include it in a future onboarding wizard).

## 3. Domain model (v1)

```ts
type Staff = {
  id, agencyId,
  userId?,                       // optional foundation user link
  name, email, role: Role,       // mirrors foundation Role
  departmentId?, title,
  joinedAt: "YYYY-MM-DD",
  leftAt?,
  status: "active" | "on-leave" | "alumni",
  managerId?, locationType?, hourlyRate?,
  createdAt, updatedAt,
};

type Department = {
  id, agencyId, name,
  parentId?, description?,
  createdAt, updatedAt,
};

type LeaveRequest = {
  id, agencyId, staffId,
  type: "pto" | "sick" | "sabbatical",
  startDate, endDate,            // YYYY-MM-DD
  days,                          // computed at create
  status: "pending" | "approved" | "rejected",
  reason?, createdAt,
  approvedBy?, approvedAt?, decisionNote?,
};
```

Validation rules enforced in services (not just at the API layer):

| Service | Rule |
|---------|------|
| StaffService | email is unique per-agency (case-insensitive); staff cannot manage themselves; manager change cycle-checked |
| DepartmentService | name unique per-agency (case-insensitive); parent must resolve in the same agency; parent cycle refused |
| LeaveService | endDate ≥ startDate; staff must exist; re-deciding a pending request flips status only once; approval flips staff to on-leave (no scheduler in v1 — manual restore via update) |

## 4. API surface (13 routes mounted at `/api/portal/agency-hr/`)

| Method · Path | Handler | Roles |
|--------------|---------|-------|
| GET `staff` | listStaffHandler | agency-* |
| POST `staff` | createStaffHandler | agency-owner / agency-manager |
| GET `staff/get?id=…` | getStaffHandler | agency-* |
| PATCH `staff` | updateStaffHandler | agency-owner / agency-manager |
| POST `staff/archive` | archiveStaffHandler | agency-owner / agency-manager |
| GET `departments` | listDepartmentsHandler | agency-* |
| POST `departments` | createDepartmentHandler | agency-owner / agency-manager |
| PATCH `departments` | updateDepartmentHandler | agency-owner / agency-manager |
| DELETE `departments?id=…` | deleteDepartmentHandler | agency-owner / agency-manager |
| GET `leave` | listLeaveHandler | agency-* |
| POST `leave` | requestLeaveHandler | agency-* (any agency role can submit a request) |
| POST `leave/decide` | decideLeaveHandler | agency-owner / agency-manager |
| POST `leave/cancel` | cancelLeaveHandler | agency-* |

Response envelope is consistent with fulfillment + ecommerce: `{ ok: true, … }`
on success, `{ ok: false, error }` with appropriate HTTP code on
failure (400 validation, 404 not-in-agency, 405 wrong method, 422
business rule).

## 5. Foundation port surface

The plugin needs four ports — declared in `src/server/ports.ts`:

```ts
TenantPort       — getAgency(id) for activity messages + branding
ActivityLogPort  — logActivity({...}) + listActivity(filter)
EventBusPort     — emit(scope, name, payload)  (HR event names listed below)
PluginInstallStorePort — getInstall(scope, pluginId) (read-only, used at install-time)
```

`PluginStorage` (the foundation's per-install KV) comes from
`aquaPluginTypes.ts` — same shape every plugin sees. Storage keys this
plugin uses:

```
staff:<id>          → Staff
staff/index         → string[] of all staff ids
dept:<id>           → Department
dept/index          → string[] of all department ids
leave:<id>          → LeaveRequest
leave/index         → string[] of all leave ids
```

### HR event names

```
hr.staff.created
hr.staff.updated
hr.staff.archived
hr.department.created
hr.department.updated
hr.department.archived
hr.leave.requested
hr.leave.approved
hr.leave.rejected
```

The foundation's `EventBusPort` accepts arbitrary string event names,
so adding HR events doesn't require an upstream union extension.

### `ActivityCategory` extension

The plugin writes activity entries with `category: "hr"`. Foundation's
canonical enum at `04-the-final-portal/portal/src/server/types.ts`
currently lists eight categories (auth | tenant | plugin | phase |
fulfillment | ecommerce | settings | system). The vendored
`tenancy.ts` here adds `"hr"` for tsc-cleanness; T1's foundation needs
a one-line addition to the upstream `ActivityCategory` union when the
plugin gets wired in. Same pattern as ecommerce in chapter 25.

## 6. Container builder + foundation adapter

```ts
// src/server/index.ts
export interface AgencyHrDeps {
  agencyId: AgencyId;
  storage: PluginStorage;
  activity: ActivityLogPort;
  events: EventBusPort;
  tenant: TenantPort;
  pluginInstalls: PluginInstallStorePort;
}

export function buildAgencyHrContainer(deps: AgencyHrDeps): {
  staff: StaffService;
  departments: DepartmentService;
  leave: LeaveService;
};
```

```ts
// src/server/foundationAdapter.ts
export interface AgencyHrFoundation { tenant, activity, events, pluginInstalls }
export function registerAgencyHrFoundation(deps: AgencyHrFoundation): void;
export function containerFor(args: { agencyId, storage }): AgencyHrContainer;
export function clearAgencyHrFoundation(): void;
export function isFoundationRegistered(): boolean;
export function requireFoundation(): AgencyHrFoundation;
```

The foundation will land a side-effect-import file like
`portal/src/plugins/foundation-adapters/agencyHrFoundation.ts`:

```ts
import { registerAgencyHrFoundation } from "@aqua/plugin-agency-hr/server";
import { getAgency } from "@/server/tenants";
import { logActivity, listActivity } from "@/server/activity";
import { emit } from "@/server/eventBus";
import { getInstall } from "@/server/pluginInstalls";

let registered = false;
function ensure(): void {
  if (registered) return;
  registerAgencyHrFoundation({
    tenant: { getAgency },
    activity: { logActivity, listActivity },
    events: { emit },
    pluginInstalls: { getInstall },
  });
  registered = true;
}
ensure();
```

`_registry.ts` then needs:

```ts
import "./foundation-adapters/agencyHrFoundation";          // side-effect: register
import agencyHrManifest from "@aqua/plugin-agency-hr";

const PLUGINS: AquaPlugin[] = [
  fulfillmentManifest as unknown as AquaPlugin,
  websiteEditorManifest as unknown as AquaPlugin,
  ecommerceManifest as unknown as AquaPlugin,
  agencyHrManifest as unknown as AquaPlugin,
];
```

`portal/package.json` gains `"@aqua/plugin-agency-hr": "file:../plugins/agency-hr"`,
and `next.config.ts.transpilePackages` gains the same id.

## 7. Smoke test

`src/__smoke__/hr.test.ts` — `node:test` via `tsx --test`. Builds an
in-memory foundation (TenantPort returning a stub Agency, an
ActivityLogPort that pushes to an array, an EventBusPort that pushes to
an array, a no-op PluginInstallStorePort, and a Map-backed
PluginStorage), constructs the container, walks:

| Step | What | Asserts |
|------|------|---------|
| 0 | `seedDefaults` × 2 | first call seeds 5; second call returns `existed: 5` (idempotent); list returns Engineering / Design / Marketing / Operations / Sales sorted by name |
| 1 | `staff.create` × 2 | new staff has `status: "active"`; duplicate email rejected (case-insensitive) |
| 2 | parent cycle | A→B fine; then B→A throws "cycle" |
| 3 | leave request + approval | request has `days: 5`; decide({approved}) flips staff status to `on-leave`; second decide rejects ("already approved") |
| 4 | side effects | activity log contains all five HR action verbs; event bus carries `hr.staff.created` + `hr.leave.approved` |
| 5 | filters + listing | `staff.list({status:"on-leave"})` finds Riley; `leave.list({status:"pending"})` is empty after approval; query "riley" matches |

```
▶ agency-hr smoke
  ✔ step 0: seed default departments (idempotent)
  ✔ step 1: create staff + department uniqueness
  ✔ step 2: department cycle prevention
  ✔ step 3: request leave + approval flow
  ✔ step 4: side effects — activity + events recorded
  ✔ step 5: filters + listing
ℹ tests 6   ℹ pass 6   ℹ fail 0
```

Run with `npm run smoke` from `04-the-final-portal/plugins/agency-hr/`.

## 8. Cross-team integration TODOs

Things the orchestrator brokers when wiring HR into the foundation:

1. **Add the workspace dep** in `portal/package.json` + `next.config.ts.transpilePackages` (one-line each).
2. **Side-effect-import file** at `portal/src/plugins/foundation-adapters/agencyHrFoundation.ts` (see §6 snippet).
3. **Registry append** — add `agencyHrManifest` to `_registry.ts`'s PLUGINS array.
4. **`ActivityCategory` extension** — add `"hr"` to the upstream union in `portal/src/server/types.ts`.
5. **No phase preset wiring needed** — HR is `core: false`, so it never auto-installs from a phase preset. Agency owners opt in via the agency-side marketplace surface (or via a future onboarding wizard).
6. **No catch-all route changes** — the plugin uses the relative path convention; resolver already handles `/portal/agency/<plugin>/...` and `/api/portal/<plugin>/...`.

## 9. Out of scope (v1)

Per the prompt: "Don't build full payroll / timesheets / performance
reviews — v1 is staff directory + departments + leave only."

Future plugins or follow-on rounds:

- **Timesheets** — hours per project per day, billable/non-billable, integration with fulfillment briefs.
- **Payroll** — paychecks, tax, integration with a provider (Gusto / Deel / SeamlessHR).
- **Performance reviews** — review cycles, feedback, ratings, goal tracking.
- **PTO balances + accrual** — settings already store `defaultPtoDaysPerYear` but balance enforcement is future work.
- **Approval workflows** — direct-manager-only approval (today any agency-admin can decide); multi-step approvals.
- **Org-chart visualisation** — flat list today; tree-render of `managerId` graph + `parentId` department tree later.
- **Invite flow** — when a Staff row has `userId` linked to a foundation user, the user gets portal access; v1 leaves the link manual.

## 10. Look-and-feel inspiration

Per the prompt: `03 old portal/old-portal-github/main-monorepo/apps/aqua-ops-people/`
holds the People Hub layout from the v9 archive (chapter 14
`old-portal-suites.md` covers the sub-app). The component shells in
`src/components/` here keep that flat-card aesthetic — directory grid,
status pills, side-by-side list+filter — without lifting any of the
v9 styling (CSS lives at the foundation layer; brand-kit CSS variables
paint per-tenant).

## 11. Verification commands

```bash
# tsc clean
cd "04-the-final-portal/plugins/agency-hr"
npx tsc --noEmit

# 6/6 smoke pass
npm run smoke

# Inspect the manifest shape
node -e "import('./index.ts').then(m => console.log(Object.keys(m.default)))"
```
