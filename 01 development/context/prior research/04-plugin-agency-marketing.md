# Agency-marketing plugin (T2 R7)

`@aqua/plugin-agency-marketing` — campaigns, leads, email templates,
reports. Agency-internal, third leg of the Milesy-internal trio
alongside agency-HR (people) + agency-finance (money). Per-agency
install (`scopePolicy: "agency"`, `core: false`, opt-in).

> Built by T2 on 2026-05-05 alongside Goal A (phase preset
> definitions + soft-fail). tsc-clean standalone; 8/8 smoke pass.

## 1. Package shape

```
04-the-final-portal/plugins/agency-marketing/
├── index.ts                          default-exports the AquaPlugin manifest
├── package.json                      @aqua/plugin-agency-marketing@0.1.0
├── tsconfig.json
├── src/
│   ├── lib/
│   │   ├── aquaPluginTypes.ts        vendored AquaPlugin contract
│   │   ├── domain.ts                 Campaign + Lead + EmailTemplate + filters + Snapshot/Funnel report shapes
│   │   ├── tenancy.ts                Mirror types (+ "marketing" added to ActivityCategory)
│   │   ├── ids.ts                    makeId
│   │   └── time.ts                   stubable clock
│   ├── server/
│   │   ├── ports.ts                  Storage · Tenant · User · ActivityLog · EventBus · PluginInstallStore
│   │   ├── campaigns.ts              CampaignService (CRUD + state machine + budget/result rollup + secondary index by channel)
│   │   ├── leads.ts                  LeadService (CRUD + funnel transitions + assign/contact + secondary indexes by email/campaign/staff)
│   │   ├── templates.ts              TemplateService (CRUD + idempotent seedDefaults — 3 defaults — `{{placeholder}}` substitution)
│   │   ├── reports.ts                ReportService (campaignSnapshot + leadFunnel + per-campaign lead stats)
│   │   ├── foundationAdapter.ts      registerAgencyMarketingFoundation + containerFor + containerWithDeps + _containerFromCtx
│   │   └── index.ts                  buildAgencyMarketingContainer + barrel
│   ├── api/
│   │   ├── handlers.ts               13 handlers
│   │   └── routes.ts                 ROUTES (per-route visibleToRoles)
│   ├── pages/
│   │   ├── CampaignsPage.tsx
│   │   ├── LeadsPage.tsx
│   │   ├── TemplatesPage.tsx
│   │   ├── ReportsPage.tsx           trailing 12-month snapshot + funnel
│   │   └── SettingsPage.tsx
│   └── __smoke__/
│       └── marketing.test.ts         8 node:test cases via tsx --test
└── package-lock.json
```

22 source files, ~3500 LOC, zero runtime deps.

## 2. Manifest (key fields)

```ts
{
  id: "agency-marketing",
  category: "core",                    // agency-internal
  status: "alpha",
  core: false,                         // opt-in
  scopePolicy: "agency",               // never installed per-client
  navItems: [Campaigns · Leads · Email templates · Reports · Settings],   // 5 items, panel "agency-marketing"
  pages: [Campaigns (×2), Leads, Templates, Reports, Settings],           // 6 entries
  api: ROUTES,                         // 13 routes
  features: [campaign-tracking, lead-funnel, email-templates, reports],
  settings.groups: [
    general (defaultCurrency, defaultLeadAssignee),
    automation (autoSendOnTemplate — stored, not yet enforced),
  ],
  onInstall: seeds 3 default email templates (Welcome / Re-engagement / Newsletter),
  healthcheck: running campaigns + new leads + templates count,
}
```

NO storefront blocks — agency-internal.

## 3. Domain model (v1)

```ts
type Campaign = {
  id, agencyId,
  name, channel: "email"|"sms"|"social"|"paid"|"organic"|"event",
  status: "draft"|"scheduled"|"running"|"paused"|"completed"|"archived",
  startAt?, endAt?,
  budgetCents?, currency,
  goalKpi?: "leads"|"signups"|"revenue"|"engagement",
  goalTarget?, resultActual?,
  ownerStaffId?,                       // FK to agency-HR Staff
  notes?, createdAt, updatedAt,
};

type Lead = {
  id, agencyId,
  campaignId?,                         // attribution
  email, name?, phone?,
  source: "form"|"manual"|"import"|"campaign",
  status: "new"|"contacted"|"qualified"|"converted"|"unqualified"|"lost",
  assignedStaffId?,                    // FK to agency-HR Staff
  notes?,
  contactHistory: { at, by?, note }[], // append-only
  createdAt, updatedAt, lastContactedAt?,
};

type EmailTemplate = {
  id, agencyId,
  name, subject, bodyHtml, bodyText?,
  category: "welcome"|"re-engagement"|"newsletter"|"transactional"|"other",
  status: "active"|"archived",
  isDefault: boolean,                  // seeded vs agency-added
  createdAt, updatedAt,
};
```

### State machines

**Campaign:**

```
draft     → scheduled | running | archived
scheduled → running | paused | archived
running   → paused | completed | archived
paused    → running | completed | archived
completed → archived
archived  → (terminal)
```

**Lead funnel:**

```
new        → contacted | unqualified | lost
contacted  → qualified | unqualified | lost | converted
qualified  → converted | contacted | unqualified | lost
converted  → (terminal)
unqualified→ contacted              (re-engage path)
lost       → contacted              (give it another shot)
```

`recordContact(leadId, note)` auto-bumps `new → contacted` so the
status reflects activity without forcing a separate update call.

### Validation rules (in services)

| Service | Rule |
|---------|------|
| CampaignService | name + channel required; budgetCents ≥ 0; endAt ≥ startAt; only draft campaigns can be deleted (others use status:"archived"); state-machine transitions enforced |
| LeadService | email required; per-agency unique by email (case-insensitive via `leads/by-email/<lower>` index); funnel transitions enforced; email change re-keys index |
| TemplateService | name + subject + bodyHtml + category required; seedDefaults idempotent |

## 4. Storage layout (per-install plugin storage)

```
campaigns/by-id/<id>            → Campaign
campaigns/by-channel/<channel>  → string[] of campaign ids
campaigns/index                 → string[] of all campaign ids

leads/by-id/<id>                → Lead
leads/by-email/<lowercased>     → leadId  (uniqueness lookup)
leads/by-campaign/<campaignId>  → string[] of lead ids
leads/by-staff/<staffId>        → string[] of lead ids
leads/index                     → string[] of all lead ids

templates/by-id/<id>            → EmailTemplate
templates/index                 → string[] of all template ids
```

Same secondary-index discipline as the other agency-internal plugins
— `findByEmail`, `listForCampaign`, `listForStaff` are O(1) lookups.

## 5. API surface (13 routes mounted at `/api/portal/agency-marketing/`)

| Method · Path | Handler | Roles |
|--------------|---------|-------|
| GET `campaigns` | listCampaignsHandler | viewers |
| POST `campaigns` | createCampaignHandler | admins |
| PATCH `campaigns` | updateCampaignHandler | admins |
| DELETE `campaigns?id=…` | deleteCampaignHandler | admins |
| GET `leads` | listLeadsHandler | viewers |
| POST `leads` | createLeadHandler | viewers (anyone agency-side can capture a lead) |
| PATCH `leads` | updateLeadHandler | viewers |
| POST `leads/contact` | contactLeadHandler | viewers |
| GET `templates` | listTemplatesHandler | viewers |
| POST `templates` | createTemplateHandler | admins |
| PATCH `templates` | updateTemplateHandler | admins |
| GET `reports/campaigns?from=&to=` | reportCampaignsHandler | viewers |
| GET `reports/leads?from=&to=` | reportLeadsHandler | viewers |

## 6. Reports (the snapshots)

`reports.campaignSnapshot({ from, to })`:

```ts
{
  from, to,
  byChannel: Array<{ channel, count, budgetCents, resultTotal }>,
  byStatus: Array<{ status, count }>,
  totalCampaigns,
  totalBudgetCents,
}
```

`reports.leadFunnel({ from, to })`:

```ts
{
  from, to,
  byStatus: Array<{ status, count }>,
  total,
  conversionRate,                      // converted / total (0..1)
  newCount, contactedCount, qualifiedCount,
  convertedCount, unqualifiedCount, lostCount,
}
```

`reports.campaignLeadStats(campaignId)`:

```ts
{ total, converted, conversionRate }
```

Used by CampaignsPage to show a "this campaign generated X leads,
Y converted" line per campaign.

## 7. Email-template placeholder substitution

`templates.renderHtml(tpl, vars)` and `templates.renderSubject(tpl, vars)`
do simple `{{key}}` replacement. Missing vars render as `{{key}}` literal
(not stripped) so the template author can spot omissions in preview.
No escaping or sanitisation — the agency author owns template safety.
Real send-time integration (SMTP, SendGrid, Postmark) is a future
round; for now the helpers are string-based and runtime-free.

## 8. Smoke test (8 cases)

`src/__smoke__/marketing.test.ts` — `node:test` via `tsx --test`.
Builds an in-memory foundation (Tenant resolves stub agency, User
resolves a Staff projection, ActivityLog/EventBus push to arrays),
walks:

| Step | Asserts |
|------|---------|
| 0 | `seedDefaults` ×2: first seeds 3 templates (Welcome / Re-engagement / Newsletter), second is no-op; `isDefault: true` on seeded rows |
| 1 | Campaign create at `draft`; state-machine: draft→scheduled→running, paused, completed; backwards transition (running → draft) rejected |
| 2 | Delete on completed campaign rejected; fresh draft can be deleted |
| 3 | Lead create at `new` → duplicate-email rejected (case-insensitive) → `recordContact` auto-bumps to `contacted` + appends to contactHistory + sets lastContactedAt → contacted→qualified→converted; un-convert (converted→contacted) rejected (terminal) |
| 4 | `getByEmail` is case-insensitive; `listForCampaign` returns the lead; missing email → null |
| 5 | Template create + `{{placeholder}}` substitution: full render works, missing var renders as `{{key}}` literal |
| 6 | `campaignSnapshot`: 1 campaign, $500 budget, byChannel email row count 1; `leadFunnel`: total 1, converted 1, conversionRate 1.0; `campaignLeadStats(campaignId)` returns 1/1/1 |
| 7 | Activity log + event bus carry all the marketing verbs (template.created, campaign.created/scheduled/started/paused/completed, lead.created/contacted/converted) |

```
▶ agency-marketing smoke
  ✔ step 0: seed default email templates (idempotent)
  ✔ step 1: campaign create + status state-machine
  ✔ step 2: campaign delete only on draft
  ✔ step 3: lead create + duplicate-email rejected + funnel transitions
  ✔ step 4: lead getByEmail + listForCampaign
  ✔ step 5: template create + render with placeholders
  ✔ step 6: campaignSnapshot + leadFunnel aggregates
  ✔ step 7: side-effects — activity + events
ℹ tests 8   ℹ pass 8   ℹ fail 0
```

`npm run smoke` from `04-the-final-portal/plugins/agency-marketing/`.

## 9. Foundation pending (orchestrator brokerage)

| # | Task | File / Surface |
|---|------|---------------|
| 1 | Workspace dep + transpilePackages | `portal/package.json` + `portal/next.config.ts` |
| 2 | Side-effect-import file at `portal/src/plugins/foundation-adapters/agencyMarketingFoundation.ts` calling `registerAgencyMarketingFoundation({ tenant, user, activity, events, pluginInstalls })` | new file |
| 3 | `_registry.ts` append (`agencyMarketingManifest as unknown as AquaPlugin`) | `portal/src/plugins/_registry.ts` |
| 4 | `ActivityCategory` union += `"marketing"` | `portal/src/server/types.ts` |
| 5 | **`UserPort.getUser` projection** — same projection memberships + affiliates + finance need | shared with the other agency-internal + per-client plugins |

## 10. Cross-team integration TODOs

- **agency-HR cross-read** (`ownerStaffId` / `assignedStaffId`):
  the UI ideally shows the Staff record's name + department on
  Campaign owner + Lead assignee chips. v1 resolves via
  `UserPort.getUser`; richer agency-HR cross-read is foundation
  brokerage.
- **Real send-time integration**: deferred. SMTP/SendGrid/Postmark
  webhooks land in a future round. Settings field
  `autoSendOnTemplate` is the placeholder.
- **Form-builder for lead capture**: deferred. Leads come in via
  API POST or manual entry today; a form-builder plugin is a future
  addition (likely `@aqua/plugin-forms`).

## 11. NOT in scope (per the prompt)

- Real email/SMS/social/paid-media API integration — campaign rows
  track channel as metadata only.
- SMS gateway / social-media scheduling — store-and-template only.
- Form-builder for lead capture — leads enter via API/manual.
- Live email sends — `templates.render*` returns strings; nothing
  posts to an SMTP provider.

## 12. Verification commands

```bash
cd "04-the-final-portal/plugins/agency-marketing"

# tsc clean
npx tsc --noEmit

# 8/8 smoke pass
npm run smoke
```
