# `@aqua/plugin-pre-sales-hq` — discovery + proposals + nurture cadence (T2 R012)

Round-012 of the queue-based T2 worker. Pre-sales console: per-lead
context (Discovery-call notes, proposal status, follow-up cadence)
sitting alongside the kanban-rendered lead pipeline. Distinct from
generic `kanban` because it owns the per-lead context — the kanban
plugin renders the **board view**; this plugin owns the **details**.

## Shape

| Area | Decision |
| --- | --- |
| `id` | `pre-sales-hq` |
| `scopePolicy` | `agency` |
| `core` | false |
| `requires` | (soft only — engine no-ops gracefully when `client-crm` / `kanban` aren't installed) |
| Storage layout | `calls/index` · `calls/by-id/<id>` · `calls/by-lead/<leadId>` · `proposals/*` · `nurture/*` |
| API routes | calls (3) + proposals (3) + nurture (3) — 9 total |
| Pages | PreSalesBoardPage (default landing) · CallsPage · ProposalsPage · NurturePage |

## Domains

```
DiscoveryCall { id, leadId, scheduledAt,
                completedAt?, outcome: scheduled|completed|no-show|cancelled,
                notes? }

Proposal      { id, leadId, amountCents, currency,
                status: draft|sent|accepted|rejected|withdrawn,
                sentAt?, decidedAt?, notes? }

NurtureTouch  { id, leadId, type: email|call|linkedin|other,
                sentAt, response: replied|no-response|bounced?, notes? }

OverdueNurture { leadId, daysSinceLastTouch, lastTouchAt?, lastTouchType? }
```

`PROPOSAL_TRANSITIONS`:
- `draft → sent | withdrawn`
- `sent → accepted | rejected | withdrawn`
- `accepted` is terminal
- `rejected → sent` (re-pitch path; test 7)
- `withdrawn → draft` (operator can reopen)

## Re-Nurturing cadence engine

`NurtureService.overdue(leadIds, refNow)` walks the candidate pool
(typically pulled from `client-crm`'s open-leads list and passed in)
and returns rows where:

- The most-recent NurtureTouch is older than `cadenceDays` (default 14)
  AND was NOT a `replied` response.
- OR the lead was never touched (sentinel
  `daysSinceLastTouch: Number.MAX_SAFE_INTEGER`).

Replied leads are **excluded entirely** — the conversation is "live",
the cadence stops. Never-touched leads sort to the top (highest
priority).

The cadence value is per-agency configurable via the manifest
setting `nurtureCadenceDays` (default 14); the foundation can also
inject `cadenceDays` into the container for per-test overrides
(test 11 uses 7).

## Cross-plugin integration

- **client-crm subscriber**: `NurtureService.onCrmLeadStatusChanged`
  is the wire-point for a foundation-side bus subscription. Logs an
  `other`-channel touch with `notes` reflecting the status flip.
  Mirrors the `agency-marketing` R008 plugin's same-named subscriber
  so foundations can wire both from a single CRM event.
- **kanban**: emits `pre-sales.proposal-sent` events (consumed by
  `agency-marketing` per chapter #79 + this round's prompt).
- **Activity surface**: every operation writes a `category:
  "settings"` activity entry with action prefix `pre-sales.*` so the
  inbox (R003) picks them up automatically.

## Smoke (12/12)

`tsx --test src/__smoke__/pre-sales.test.ts`. Cases:

1. `DiscoveryCall.schedule` stores call as `scheduled` + emits
   `pre-sales.call.scheduled`.
2. `DiscoveryCall.update` — flipping outcome to `completed` emits
   `pre-sales.call.completed` **once**; subsequent re-update with the
   same outcome does not re-emit.
3. `DiscoveryCall.schedule` rejects empty `leadId` and zero
   `scheduledAt`.
4. `Proposal.create` stores `draft`; `transition draft→sent` emits
   `pre-sales.proposal-sent` + sets `sentAt`.
5. Invalid transition `draft → accepted` throws
   `InvalidProposalTransitionError`.
6. `Proposal sent→accepted` records `decidedAt` + emits
   `pre-sales.proposal-decided`.
7. Re-pitch path `Proposal rejected→sent` is allowed by
   `PROPOSAL_TRANSITIONS`.
8. `Nurture.record` stores touch + emits `pre-sales.nurture.touched`.
9. `Nurture.overdue` returns leads past cadence; recent reply
   excludes; never-touched returns `Number.MAX_SAFE_INTEGER` sentinel
   and sorts first.
10. `Nurture.onCrmLeadStatusChanged` subscriber records `other`-type
    touch with `notes` reflecting the status flip.
11. Custom `cadenceDays` (7 vs default 14) — overdue threshold
    respects the override.
12. Activity events — `call.scheduled` / `proposal-sent` /
    `nurture.touched` all log under `category: "settings"` with
    `pre-sales.*` action prefix.

## Files

```
04-the-final-portal/plugins/pre-sales-hq/
├── index.ts                            (manifest)
├── package.json + tsconfig.json
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          (vendored)
    │   ├── tenancy.ts                  (vendored)
    │   ├── domain.ts                   (DiscoveryCall, Proposal, NurtureTouch, OverdueNurture, PROPOSAL_TRANSITIONS, DEFAULT_NURTURE_CADENCE_DAYS)
    │   ├── ids.ts · time.ts
    ├── server/
    │   ├── ports.ts                    (StoragePort, ActivityLogPort, EventBusPort, PreSalesEventName)
    │   ├── services.ts                 (DiscoveryCallService + ProposalService + NurtureService + onCrmLeadStatusChanged subscriber)
    │   ├── foundationAdapter.ts        (register / containerFor / cadenceDays passthrough)
    │   └── index.ts                    (barrel + container)
    ├── api/
    │   ├── handlers.ts                 (9 handlers)
    │   └── routes.ts
    ├── pages/
    │   ├── PreSalesBoardPage.tsx       (3-tile dashboard + R+1 note about kanban-split view)
    │   ├── CallsPage.tsx               (Upcoming + Past tables + schedule form)
    │   ├── ProposalsPage.tsx           (status-tile grid + table w/ contextual transition buttons)
    │   └── NurturePage.tsx             (overdue checker + recent touches + record form)
    └── __smoke__/pre-sales.test.ts     (12 cases)
```

## NOT in scope

- Real calendar integration (Calendly etc — caller passes `scheduledAt`
  ms timestamps in v1).
- Real proposal PDF generation.
- Touching milesymedia / business-os / compass-coaching.

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- Calendly / Cal.com webhook ingestion that auto-creates
  DiscoveryCall rows.
- Proposal PDF generation + email delivery via
  `@aqua/plugin-email-sender` (R10).
- Split-view UI: kanban-board (left, rendered by
  `@aqua/plugin-kanban` lead-pipeline template) + per-lead pre-sales
  details (right, this plugin) on the same page.
- Foundation-side bus wiring so `onCrmLeadStatusChanged` fires
  automatically when the CRM emits its event (today: caller invokes
  the helper).
- Nurture-cadence per-channel weighting (today: any non-replied
  channel restarts the cadence).
- Auto-overdue digest email at 09:00 daily via
  `@aqua/plugin-notifications` R005.
- Foundation `ActivityCategory` extension to add `pre-sales`
  (currently rides on `settings`); coordinated R+1 diff with T1 /
  R007 / R009 / R010 / R011.
- Templated nurture sequences (3-touch, 5-touch, etc) with
  next-touch suggestions on the NurturePage.
