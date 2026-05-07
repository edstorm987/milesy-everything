# `@aqua/plugin-agency-marketing` — R008 extension (Calendar + Touchpoints + Performance)

Round-008 of the queue-based T2 worker. Additive layer on the existing
R7 plugin (Campaigns + Leads + Templates + Reports). Adds the
`ContentItem` + `Touchpoint` domains, three new services, three new
admin pages, eight new API routes, and a `client-crm` event-bus
subscriber for touchpoint logging.

## Q-ASSUMED on `scopePolicy`

The R008 prompt asks for `scopePolicy: "client"` and `requires:
["client-crm"]`. The existing plugin ships `scopePolicy: "agency"`,
no requires. Flipping `scopePolicy` would be **destructive for
existing installs** (different storage scope; current data wouldn't
re-key). R008 ships **additive** — keeping `agency` scope; cross-plugin
integration with `client-crm` is implemented as a soft subscriber port
(`onCrmLeadStatusChanged`) that the foundation calls when wiring the
two plugins together. Migration to `client` scope is flagged R+1.

## What's added

### Domains

```
ContentItem { id, agencyId, campaignId?, title,
              channel: CampaignChannel,
              scheduledAt?, publishedAt?,
              status: draft|scheduled|published|archived,
              url?, notes?, createdAt, updatedAt }

Touchpoint  { id, agencyId, leadId, campaignId?,
              type: outreach|reply|open|click|meeting|note,
              channel: CampaignChannel, at,
              summary?, metadata?, createdAt }

CalendarBucket / CalendarWindow — UTC-day buckets for the calendar grid
PerformanceSummary — 12-week sparkline + tile counts + hasData flag
```

### Services

- `ContentCalendarService` — `list / get / create / update / publish /
  archive / window(start, end)`. `create()` defaults `status` from
  `scheduledAt` (scheduled vs draft). `window()` buckets by UTC day
  and surfaces `unscheduledCount` for the side rail (excludes
  archived from the count).
- `TouchpointService` — `list / get / listForLead / record` plus the
  cross-plugin subscriber `onCrmLeadStatusChanged({ leadId, fromStatus,
  toStatus, actor? })` which logs a `note` touchpoint with
  `metadata.source = "client-crm.lead.status_changed"`. Rejects
  invalid type.
- `PerformanceService` — composes campaign / content / touchpoint
  counts; `summary(refNow, weeks=12)` returns
  `PerformanceSummary` with `hasData = (campaigns ∨ content ∨
  touchpoints)`. Sparkline is 12 trailing weekly buckets ending at
  `refNow`; an empty world returns 12 zeroes (no fabrication).

### Admin pages (3 new)

- `CalendarPage` — 7-column week grid, `?from=` query for prev/next,
  publish-state colour, "today" link.
- `TouchpointsPage` — table sortable by lead via `?leadId=`.
- `PerformancePage` — tile cards (Campaigns, Content,
  Touchpoints-12w, Lead-replies) + bar-chart sparkline + by-type
  breakdown. Honesty empty-state when `hasData` is false.

navItems extended: Calendar / Touchpoints / Performance between
Reports and Settings.

### API routes (8 new)

```
GET    /content                       (viewers)
POST   /content/create                (viewers)
PATCH  /content/update?id=<>          (viewers)
POST   /content/publish?id=<>         (viewers)
GET    /calendar?from=<>&to=<>        (viewers)
GET    /touchpoints                   (viewers)
POST   /touchpoints/record            (viewers)
GET    /performance                   (viewers)
```

Handlers in sibling `src/api/handlers-r008.ts` to keep the original
`handlers.ts` reviewable.

## Cross-plugin integration

- **lead-pipeline activity events**: `touchpoint.record` writes a
  `marketing` activity entry — the activity-inbox (R003) picks them
  up automatically with no extra wiring. When a touchpoint of type
  `outreach` references a `campaignId`, the metadata identifies the
  campaign so a future report can attribute leads.
- **client-crm subscriber**: `TouchpointService.onCrmLeadStatusChanged`
  is the wire-point for a foundation-side bus subscription. Foundations
  call it when the CRM emits `client-crm.lead.status_changed`.
  Idempotency is the caller's responsibility (CRM dedupes its own
  events).

## Smoke (17/17 — 8 pre-existing + 9 R008)

`tsx --test src/__smoke__/marketing.test.ts`. R008 cases:

1. `ContentCalendar.create` stores + emits `content.created`; default
   status follows `scheduledAt` (drafted vs scheduled).
2. `ContentCalendar.update + publish` transitions status; sets
   `publishedAt`; emits update events.
3. `ContentCalendar.window` buckets by UTC day across the requested
   range; `unscheduledCount` counts drafts without `scheduledAt`.
4. `Touchpoint.record` stores + emits `touchpoint.recorded`; rejects
   unknown type.
5. `Touchpoint.listForLead` returns only that lead's touchpoints,
   newest first.
6. `onCrmLeadStatusChanged` subscriber wraps `record()` with a `note`
   touchpoint and `metadata.source = "client-crm.lead.status_changed"`.
7. `Performance.summary` honesty contract — empty world
   `hasData: false`; sparkline is 12 zeroes; tile values zero.
8. `Performance.summary` aggregates campaigns + content + touchpoints;
   sparkline is 12 weekly buckets summing to total touchpoints in the
   12-week window.
9. `ContentCalendar.archive` flips status; `window.unscheduledCount`
   excludes archived.

## Files

```
04-the-final-portal/plugins/agency-marketing/
├── index.ts                                (manifest extended — navItems + pages)
├── src/
    ├── lib/
    │   └── domain.ts                       (extended — ContentItem, Touchpoint, CalendarBucket/Window, PerformanceSummary)
    ├── server/
    │   ├── content.ts                      (NEW — ContentCalendarService)
    │   ├── touchpoints.ts                  (NEW — TouchpointService + PerformanceService)
    │   └── index.ts                        (extended — barrel + container)
    ├── api/
    │   ├── handlers-r008.ts                (NEW — 8 handlers)
    │   └── routes.ts                       (extended — 8 new routes appended)
    ├── pages/
    │   ├── CalendarPage.tsx                (NEW — week grid)
    │   ├── TouchpointsPage.tsx             (NEW — table)
    │   └── PerformancePage.tsx             (NEW — tiles + sparkline + honesty empty state)
    └── __smoke__/marketing.test.ts         (extended — 9 R008 cases)
```

## NOT in scope

- Real channel integrations (Meta / Google Ads).
- AI content generation (use `ai-builder` plugin if available).
- Touching milesymedia / business-os / compass-coaching.

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- Migrate `scopePolicy: "agency" → "client"` per the original prompt
  (data migration required; soft pairing with client-crm holds the
  value for now via the subscriber).
- Real Meta / Google Ads channel integration (currently the channel
  enum is decorative — no auto-publish from ContentItem).
- AI-builder integration for content drafts (`ai-builder` exists; an
  R+1 button on CalendarPage would generate copy).
- Extend `Touchpoint.metadata` schema with channel-specific shapes
  (Slack / WhatsApp message ids, etc).
- Performance trends: compare current 12w to prior 12w and surface
  delta tiles + colour.
- Calendar drag-to-reschedule (today the page is read-only; PATCH
  flow exists via API).
- Templated content from email-templates (one-click "schedule a
  template send" flow).
- Foundation-side subscription wiring so `onCrmLeadStatusChanged`
  fires automatically when the CRM emits its event.
