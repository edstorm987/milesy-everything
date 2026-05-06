/loop

# T2 — Round 3: End-to-end validation + agency-HR plugin

Your Round 2 ecommerce plugin shipped (`4f6b264`). T1 wired all three
plugins into the foundation in their R3 (`29bd49a`). T3 is in Round 2
filling in the editor UIs. Round 3 for you: prove the system works
end-to-end and start expanding the agency-internal plugin set.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.

## Messaging

- **Outbox**: `01 development/messages/terminal-2/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-2/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/context/prior research/04-architecture.md`
3. `01 development/context/prior research/04-plugin-fulfillment.md` (your R1 work)
4. `01 development/context/prior research/04-plugin-ecommerce.md` (your R2 work)
5. `01 development/context/prior research/04-foundation-round2.md` and `04-foundation-round3.md` (T1's wire-up)
6. `01 development/context/prior research/old-portal-suites.md` — see "People Hub" section for HR patterns from `03`
7. `01 development/eds requirments.md`

## Two parallel goals

### Goal A: First end-to-end phase-preset smoke test

Build a single integration test (or a documented scripted walk-through)
that exercises the full lifecycle:

1. POST `/api/dev/seed-demo` if not already seeded.
2. Create a fresh client (NOT the seeded Felicia mirror) via your
   `ClientLifecycleService.createWithPhase` API at
   `/api/portal/fulfillment/clients` with phase `discovery`.
3. Verify: client record created · phase = `discovery` · `discovery`
   phase's plugin preset installed for client · checklist initialised
   with internal+client tasks.
4. Tick all internal + client checklist items via
   `/api/portal/fulfillment/checklist/tick`.
5. POST `/api/portal/fulfillment/clients/<id>/phase/advance` with
   `toPhase: design`.
6. Verify: discovery plugins disabled (config preserved) · design
   plugins enabled · `phase.advanced` event fired · activity log entry.
7. Repeat advance for `design → development → onboarding → live`.
8. At each phase: hit the relevant client portal route and verify the
   active portal variant matches the phase.

Output: `04-the-final-portal/plugins/fulfillment/src/__smoke__/lifecycle.test.ts`
+ a chapter `04-phase-lifecycle-smoke.md` documenting the walkthrough,
expected vs observed results, and any bugs surfaced. If you find bugs,
patch them in your plugin (or surface a `WARN` to T1's inbox if
foundation-side).

### Goal B: Agency HR plugin (new — `@aqua/plugin-agency-hr`)

Mirror your fulfillment-plugin pattern. Build
`04-the-final-portal/plugins/agency-hr/` as a self-contained package.

Domain model — staff directory + departments + leave management
(simple v1):

```ts
type Staff = {
  id, agencyId, name, email, role: Role,        // foundation Role enum
  department, title, joinedAt, status,
  managerId?, locationType?, hourlyRate?,
};

type Department = { id, agencyId, name, parentId? };

type LeaveRequest = {
  id, agencyId, staffId, type: 'pto'|'sick'|'sabbatical',
  startDate, endDate, status: 'pending'|'approved'|'rejected',
  reason?, createdAt, approvedBy?, approvedAt?,
};
```

Manifest:
- `id: 'agency-hr'`
- `category: 'core'` (agency-internal)
- `scopePolicy: 'agency'` — installed at agency level, NOT per-client
- `core: false` (opt-in, not auto-installed)
- 4–5 navItems: Staff · Departments · Leave · Settings
- 3–4 admin pages: StaffPage, DepartmentsPage, LeaveRequestsPage, NewStaffModal
- 8–12 API routes at `/api/portal/agency-hr/*`
- `onInstall`: seeds default departments (Engineering, Design, Marketing, Operations, Sales) for new agency

Look at `03 old portal/old-portal-github/main-monorepo/apps/aqua-ops-people/`
for design inspiration — the People Hub there has the HR view pattern
worth reusing visually.

## Foundation integration

Both work products land via the same port pattern as fulfillment +
ecommerce. Your HR plugin must:
- Build standalone `tsc --noEmit` clean.
- Define ports it needs from foundation (StoragePort, TenantPort, ActivityPort, EventBusPort).
- Export a `buildAgencyHrContainer(deps)` builder.
- Side-effect-import a `registerAgencyHrFoundation` from a `foundation/` adapter file (T1 wires this in their next round).

## NOT in scope

- Don't touch fulfillment, ecommerce, website-editor, or foundation source.
- Don't build full payroll / timesheets / performance reviews — v1 is staff directory + departments + leave only.
- Don't try to import T1's foundation directly — use the ports pattern.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup`. 600–900s mid-task, 1500s on full DONE,
3 empty wakes → end.

Pass `<<autonomous-loop-dynamic>>` to `ScheduleWakeup`.

## When done

For each goal independently:

A. Smoke test passing → chapter `04-phase-lifecycle-smoke.md` →
   MASTER row → `tasks.md` row done.

B. agency-hr plugin tsc-clean standalone → chapter
   `04-plugin-agency-hr.md` → MASTER row → `tasks.md` row done.

Both → `DONE` entry + final `COMMIT` to outbox.

Goal A is higher priority (validates the whole architecture). Do A
first. Goal B if time allows in this loop.
