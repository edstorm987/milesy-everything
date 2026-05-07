/loop

# T2 — Round 009: `@aqua/plugin-agency-ops`

Operations console — status board, recurring tasks, system health.
Surfaced in agency tools ballpark.

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §1 Aqua HQ sections — Ops.
2. Existing AgencyToolsBallpark (T1 agency-shell R1).

## Scope

**A** — Manifest (`scopePolicy: "agency"`). ActivityCategory `"ops"`.

**B** — Domains: `RecurringTask` (cadence / nextDue / assignee),
`StatusItem` (system / status / lastChecked), `Incident` (date /
severity / resolved).

**C** — Services: `RecurringTaskService` (cron-like cadence + roll-
forward on completion), `StatusService` (manual checks for v1),
`IncidentService`.

**D** — 4 admin pages: Status board (green/amber/red tiles per system
+ "Mark check done"), Recurring tasks list, Incidents log, Health
overview.

**E** — Daily / weekly recurring-task seed (post-R002 from
`Standards & Internal/Recurring Actions` SOP family — operator-paste
list of 6-8 starters).

**F** — Smoke + chapter `04-plugin-agency-ops.md` + MASTER row.

## NOT in scope

- Real monitoring integrations (Sentry / Grafana — T6).
- PagerDuty / oncall.

## When done
DONE referencing `009-agency-ops.md`.
