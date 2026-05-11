# `@aqua/plugin-agency-ops` — operations console (T2 R009)

Round-009 of the queue-based T2 worker. Agency-side operator
discipline tooling — recurring tasks, status board, incident log,
health overview. Distinct from the existing `@aqua/plugin-ops`
(monitoring/uptime/Sentry) — `agency-ops` is the **operator's**
console; `ops` surfaces external service health.

## Shape

| Area | Decision |
| --- | --- |
| `id` | `agency-ops` |
| `scopePolicy` | `agency` |
| `core` | false |
| `requires` | (none) |
| Storage layout | `tasks/index` · `tasks/by-id/<id>` · `status/index` · `status/by-id/<id>` · `incidents/index` · `incidents/by-id/<id>` |
| API routes | tasks (6) + status (3) + incidents (4) + health (1) |
| Pages | StatusBoardPage · RecurringTasksPage · IncidentsPage · HealthPage (default landing) |

## Domains

```
RecurringTask { id, agencyId, title, description?,
                cadence: daily|weekly|biweekly|monthly|quarterly|yearly,
                nextDue, lastDoneAt?, assignee?, active }

StatusItem    { id, agencyId, system,
                status: green|amber|red|unknown,
                lastChecked?, lastCheckedBy?, message? }

Incident      { id, agencyId, title,
                severity: minor|major|critical,
                startedAt, resolvedAt?, notes?, systemId? }

HealthOverview { systems: { total, green, amber, red, unknown },
                 recurringTasks: { total, active, overdueCount, nextOverdueId? },
                 incidents: { open, resolved, criticalOpen },
                 hasData }
```

## Cron-like cadence: roll-forward on completion

`RecurringTaskService.complete(actor, id)` rolls `nextDue` forward by
**exactly one cadence window relative to the previous nextDue** —
**not** relative to "now". This keeps the schedule honest when
completions land late: if a daily task is due Mon and gets completed
Thu, the next due-date is Tue (Mon + 1 day), not Fri. Test 2 nails
this with a 3-day skip then verifies `nextDue == startDue + 1 day`.

Cadence strides come from `CADENCE_MS`:
- daily 86_400_000ms
- weekly 7d
- biweekly 14d
- monthly 30d (calendar approximation; precise calendar-month roll
  is an R+1 candidate)
- quarterly 91d
- yearly 365d

## Status board

`StatusService.markChecked(actor, id, { status, message? })` writes
`lastChecked + lastCheckedBy + status` and emits
`agency-ops.status.checked`. v1 is **manual** — operator clicks tiles
on the StatusBoardPage. R+1 candidate: subscribe the monitoring `ops`
plugin's healthcheck output to auto-fill the level.

Status levels: `green / amber / red / unknown`. New items default to
`unknown` (honesty — we haven't checked yet).

## Incident lifecycle

- `open(actor, { title, severity, startedAt?, notes?, systemId? })`
  defaults `startedAt = now()`; emits `agency-ops.incident.opened`.
- `update(actor, id, patch)` is idempotent on `resolvedAt` — the
  resolved event fires **once** on the transition open→resolved.
  Subsequent updates that change `resolvedAt` again do NOT re-emit
  (test 7). `patch.resolvedAt = null` reopens (sets undefined).
- `resolve(actor, id, at?)` is sugar for `update(..., { resolvedAt:
  at ?? now() })`; emits with `durationMs = resolvedAt - startedAt`.

## Health overview (honesty contract)

`HealthService.overview(refNow?)` composes counts from all three
services. `hasData = (tasks ∨ status ∨ incidents).length > 0` — when
false, the HealthPage renders an empty-state ("No ops data yet") with
links to populate the three sub-pages. No fabricated zeroes.

Default landing on the plugin (path `""`) is HealthPage so the
operator gets the dashboard view first.

## Default seed (chapter §1 "Standards & Internal / Recurring Actions")

`DEFAULT_RECURRING_TASKS` ships 8 starter rows operator-paste-friendly:

1. Review weekly KPIs (weekly)
2. Triage support inbox (daily)
3. Audit failed logins (weekly)
4. Backup verification (monthly)
5. Plugin healthcheck pass (weekly)
6. Rotate at-risk credentials (quarterly)
7. Client retention review (monthly)
8. Compliance / SOP refresh (quarterly)

`onInstall` calls `seedDefaults` when the `seedDefaultsOnInstall`
setup answer is true (default). Idempotent — second call no-ops on
existing titles.

## Smoke (12/12)

`tsx --test src/__smoke__/agency-ops.test.ts`. Cases:

1. RecurringTask CRUD — create + list + update + archive (active
   filter excludes archived).
2. `complete` rolls `nextDue` forward by exactly one cadence window
   relative to prior `nextDue` — not relative to "now". Late
   completion (3-day skip) still rolls to `startDue + 1 day`.
3. `seedDefaults` is idempotent — adds 8 rows; second call seeded=0,
   existed=8.
4. `list({ overdue: true })` returns only nextDue≤now active rows;
   inactive rows filtered out (`overdue=false` includes them).
5. Status item — `create` defaults to `unknown`; `markChecked` sets
   level + lastChecked + lastCheckedBy + emits
   `agency-ops.status.checked`.
6. `Incident.open + resolve` — `startedAt` defaults to now; `resolve`
   writes `resolvedAt` + emits `agency-ops.incident.resolved` with
   `durationMs`.
7. `Incident.update` is idempotent on `resolvedAt` — resolved event
   emitted **once** on transition; re-update does not re-emit.
8. Incident filter `resolved=true|false` partitions correctly.
9. `HealthService.overview` honesty contract — empty world
   `hasData: false`, all zero counts.
10. `HealthService.overview` aggregates systems + tasks + incidents;
    reports overdue + criticalOpen counts.
11. RecurringTask rejects empty title; Status rejects empty system;
    Incident rejects empty title.
12. Activity events — task.created/completed +
    incident.opened/resolved + status.checked all log entries under
    `category: "settings"`.

## Files

```
04-the-final-portal/plugins/agency-ops/
├── index.ts                            (manifest)
├── package.json + tsconfig.json
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          (vendored)
    │   ├── tenancy.ts                  (vendored)
    │   ├── domain.ts                   (Cadence, RecurringTask, StatusItem, Incident, HealthOverview, DEFAULT_RECURRING_TASKS)
    │   ├── ids.ts · time.ts
    ├── server/
    │   ├── ports.ts                    (StoragePort, ActivityLogPort, EventBusPort, AgencyOpsEventName)
    │   ├── services.ts                 (RecurringTaskService + StatusService + IncidentService + HealthService)
    │   ├── foundationAdapter.ts        (register / containerFor / _containerFromCtx)
    │   └── index.ts                    (barrel + container)
    ├── api/
    │   ├── handlers.ts                 (14 handlers)
    │   └── routes.ts
    ├── pages/
    │   ├── StatusBoardPage.tsx         (tile grid + add-system form + per-tile mark-check form)
    │   ├── RecurringTasksPage.tsx      (table + new-task form + Seed defaults button)
    │   ├── IncidentsPage.tsx           (table + open-incident form + resolved/open toggle)
    │   └── HealthPage.tsx              (tile dashboard + honesty empty state — default landing)
    └── __smoke__/agency-ops.test.ts    (12 cases)
```

## NOT in scope

- Real monitoring integrations (Sentry / Grafana / uptime — those
  live in the existing `@aqua/plugin-ops` plugin).
- PagerDuty / oncall rotation.
- Touching milesymedia / business-os / compass-coaching.

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- Cron-style schedule expressions (today only fixed cadences).
- Calendar-month / calendar-quarter precision (today: 30d / 91d
  approximations).
- Auto-bridge: subscribe `@aqua/plugin-ops` healthcheck output to
  auto-update StatusItem levels (manual checks → automated).
- PagerDuty / oncall escalation on critical incidents.
- Incident postmortem template + linked SOP from
  `@aqua/plugin-sops`.
- Recurring-task assignment workflow (today: `assignee` field stored
  but no email / notification fan-out — would route via
  `@aqua/plugin-notifications` R005).
- StatusItem grouping by environment / region (today: flat list).
- Snooze / skip-this-cycle on a recurring task without rolling.
- Foundation-side `ActivityCategory` extension to add `agency-ops`
  (currently rides on `settings`); coordinated diff with T1 + R+1
  for credentials-vault category bump.
