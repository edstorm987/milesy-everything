# `04` `@aqua/plugin-leads-pipeline` — CSV import + email campaigns + contacts (T2 R027)

> Authored 2026-05-07. T2's R027 deliverable. Pairs with T1 R034
> (Pipelines refactor, chapter #156): foundation now owns the
> `Pipeline` + `PipelineCard` shape + a default `leads`-kind pipeline;
> this plugin owns the **leads** side of that contract — Lead/Contact
> domain, CSV-driven contact rolodex, single-shot email blasts via
> the email-sender plugin's queue, and a public-funnel subscriber.

## Files shipped

NEW plugin folder `04-the-final-portal/plugins/leads-pipeline/`:

- `package.json` — `name: "@aqua/plugin-leads-pipeline"`, `type:
  "module"`, exports map (`./manifest`, `./server`, `./types`),
  `npm run smoke` runs `tsx --test src/__smoke__/leads-pipeline.test.ts`.
- `tsconfig.json` — same shape as agency-hr (ES2022, strict,
  `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`,
  `noEmit: true`, types: `["node"]`).
- `index.ts` — manifest. `id: "@aqua/plugin-leads-pipeline"`,
  `scopePolicy: "agency"`, `core: false`, `category: "marketing"`,
  3 nav items (Leads board / Contacts / Campaigns), 4 pages (board /
  contacts / campaigns / "" → contacts), routes table, `onInstall`
  no-ops (foundation already owns the leads pipeline from R034),
  `healthcheck` reports lead/contact/campaign counts.
- `src/lib/aquaPluginTypes.ts` — vendored Aqua plugin contract
  (byte-equivalent to agency-hr's, only port re-export path differs).
- `src/lib/tenancy.ts` — vendored `AgencyId/ClientId/UserId/Role` +
  `ActivityCategory` extends with `"leads"` (foundation-pending).
- `src/lib/ids.ts` — `makeId(prefix)` + `canonEmail(raw)` (trim+
  lowercase — single source-of-truth for the plugin's idempotency key).
- `src/lib/time.ts` — clock indirection for smoke.
- `src/lib/domain.ts` — `Lead`, `LeadCard`, `projectLeadCard`,
  `Contact { type: "lead"|"customer"|"vendor" }`, `Campaign` (status
  `draft|scheduled|sending|sent`), `AudienceFilter` (`tags?`,
  `sourcedFrom?`, `notContactedSinceMs?`, `pipelineColumn?`),
  `CsvImportResult`, `CSV_COLUMN_VARIANTS` lookup table.
- `src/server/csv.ts` — purpose-built CSV parser (no dep). Handles
  quoted cells with embedded commas, `""` → `"` escapes, CRLF, BOM,
  header-variant lookup. Tag cells are split on `; |` and on `,`
  *inside* a quoted cell (a bare comma is a CSV separator).
- `src/server/leads.ts` — `LeadService.list/get/getByEmail/upsert/
  update/delete/importCsv/resolveAudience/stampLastEmailedAt`.
  Storage: `lead:<id>` rows + `leads/index` id list +
  `leads/email/<canonical>` pointer for O(1) idempotent merge on
  re-upload. `upsert` only fills blanks — never clobbers an existing
  lead's notes/tags from a re-import (tags accumulate). `importCsv`
  walks rows, returns `{imported, updated, skipped, errors[]}`.
- `src/server/contacts.ts` — `ContactService` sibling rolodex, same
  storage pattern. `promoteLead(lead)` is idempotent on canonical
  email; promotion ladder `lead → vendor → customer` (higher wins
  on conflict).
- `src/server/campaigns.ts` — `CampaignService.create/update/list/
  send`. `send()` flips status `draft → sending`, walks resolved
  audience, enqueues one email per lead via `EmailEnqueuePort` with
  `externalRef: "campaign:<id>:<email>"` so half-failed campaigns
  collapse on retry; per-recipient errors are logged but do not abort
  the blast (`sentCount < recipients` becomes the read-back signal).
  Update is rejected once status hits `sending|sent`.
- `src/server/ports.ts` — port contracts: `TenantPort`,
  `ActivityLogPort`, `EventBusPort`, `PluginInstallStorePort`, NEW
  `EmailEnqueuePort` (adapter onto T2 R024 email-sender's
  `EmailService.enqueue` so this plugin doesn't import email-sender
  directly), NEW `PipelinePort` (adapter onto T1 R034 foundation
  pipelines: `addLeadCard`, `leadIdsInColumn`, `columnLabelForLead`).
  Both new ports are OPTIONAL — when absent, `send()` throws and
  pipeline integration is skipped (foundation-pending).
- `src/server/subscribers.ts` — `EVENT_SUBSCRIPTIONS = ["public-
  funnel.lead.captured", "pipelines.card.moved"]` declarative manifest
  the foundation introspects at boot. `handleFunnelLeadCaptured`
  upserts a Lead row + tags it `["public-funnel"]`; when
  `PipelinePort` is wired the lead also lands on the leads pipeline's
  "New" column. `handlePipelineCardMoved` listens for
  `cardKind === "lead" && toColumn === "Won"` and idempotently
  promotes the lead to a Customer Contact.
- `src/server/index.ts` — barrel: services, container builder,
  foundation adapter re-exports, port type re-exports.
- `src/server/foundationAdapter.ts` — `registerLeadsPipelineFoundation
  ({...})` singleton + `containerFor / containerWithDeps /
  _containerFromCtx` helpers. Same pattern as agency-hr.
- `src/api/handlers.ts` — JSON handlers: list/create/update/archive
  Leads, importCsv (multipart `file` OR JSON `{text,filename?}`),
  list/create Contacts, list/create/update/send/preview-audience
  Campaigns. Errors: 400 validation, 404 missing, 422 business rule.
- `src/api/routes.ts` — 13 routes mounted at
  `/api/portal/leads-pipeline/*` with per-route `visibleToRoles`.
  CSV import route is `import-csv` POST (admin only).
- `src/pages/LeadsBoardPage.tsx` — server-rendered placeholder
  board (kanban host R+1 replaces); groups leads by `pipelineCardId`
  presence. `data-testid="leads-pipeline-board"`.
- `src/pages/ContactsPage.tsx` — CSV import form (multipart POST to
  the import route) + leads list + contacts list.
  `data-testid="leads-pipeline-contacts"` + `csv-import` +
  `leads-list` + `contacts-list`.
- `src/pages/CampaignsPage.tsx` — campaigns table + new-campaign
  pointer to the API. `data-testid="leads-pipeline-campaigns"`.
- `src/__smoke__/leads-pipeline.test.ts` — 25/25 pass via
  `npm run smoke` (`tsx --test`, ~1s). Suites:
  - **CSV parser (7)** — Email/email/E-mail/MAIL/Email Address
    variants · Mobile/Tel/Cell variants · `; | ,` tag splitting
    inside quoted cells · quoted commas in company · BOM strip ·
    unrecognised header capture · variant lookup keys all lowercase.
  - **LeadService (7)** — upsert creates · upsert idempotent on
    canonical email (Foo@Bar.COM == foo@bar.com) · CSV happy path
    (Email/Name/Mobile/Company/Tags) · CSV idempotent re-import
    (`r2.imported === 0 && r2.updated === 2`) · CSV skip rows
    missing email · CSV missing email column reports
    `csv_missing_email_column` · LeadCard projection shape +
    `LeadService.projectLeadCard` static export.
  - **AudienceFilter (3)** — by tag · by source · by pipelineColumn
    via `PipelinePort` (lead in "Qualified" only).
  - **Campaign.send (3)** — happy path enqueues one email per
    audience lead + `triggeredByPlugin === "@aqua/plugin-leads-
    pipeline"` + Lead.sentCount stamped + Lead.lastContactedAt set ·
    fails when `EmailEnqueuePort` missing · non-replayable on a
    sent campaign.
  - **Subscribers (5)** — `EVENT_SUBSCRIPTIONS` exact list ·
    `public-funnel.lead.captured` creates Lead + lands on pipeline ·
    `pipelines.card.moved → Won` promotes Lead to Customer Contact ·
    promotion is idempotent (second move yields same 1 contact) ·
    non-Won column moves do NOT promote.

## tsc + smoke

- `npx tsc --noEmit` — clean (run from inside the plugin folder).
- `npm run smoke` — 25/25 pass, ~1s.

## Domain shape (locked-in this round)

- **Lead** — `{id, agencyId, email (canonical), name?, phone?,
  company?, tags[], source, capturedAt, lastContactedAt?, notes?,
  sentCount?, pipelineCardId?}`. `email` is always
  `trim().toLowerCase()`. Re-imports never overwrite an existing
  field with blank — they only fill missing slots and union tags.
- **LeadCard** — `{leadId, email, name?, company?, source}`
  projection; matches the foundation's `LeadSnapshot` shape from
  pipelines.ts (R034) so a future card-store wire-up is field-by-
  field copy.
- **Contact** — `{id, agencyId, email, name?, phone?, company?,
  tags[], type: "lead"|"customer"|"vendor", source,
  promotedFromLeadId?, lastContactedAt?, notes?, createdAt,
  updatedAt}`. Promotion ladder higher-wins (`customer > vendor >
  lead`) so a vendor that shows up in a CSV doesn't downgrade.
- **Campaign** — `{id, agencyId, name, subject, bodyHtml, bodyText?,
  status, scheduleAt?, audienceFilter, recipients, sentCount,
  sentAt?, createdAt, updatedAt, createdBy}`. `status` lifecycle:
  `draft → scheduled? → sending → sent`. Edits rejected once
  `status >= sending`.
- **AudienceFilter** — declarative `{tags?, sourcedFrom?,
  notContactedSinceMs?, pipelineColumn?}`. `tags` and `sourcedFrom`
  are OR-within / AND-across (lead must hit at least one tag AND at
  least one source). `notContactedSinceMs` excludes leads contacted
  within the rolling window. `pipelineColumn` requires a
  `PipelinePort` adapter wired up; absent port = clause silently
  drops (best-effort, matches agency expectation while T1 finishes
  the wire).

## Idempotency contracts

1. **Lead by email** — every Lead row has `leads/email/<canonical>`
   pointing at its id. CSV re-uploads collapse on this key.
2. **Contact by email** — same pattern at `contacts/email/<canon>`.
   `promoteLead` is therefore idempotent on its own.
3. **Campaign send** — `EmailEnqueueInput.externalRef` is always
   `campaign:<id>:<email>`; the email-sender plugin's idempotency
   table (R011 + R024) collapses retries.

## API surface

`/api/portal/leads-pipeline/`:

- `GET leads` · `POST leads` · `PATCH leads?id=…` · `POST leads/archive`
- `POST import-csv` (multipart `file` OR JSON `{text,filename?,
  defaultSource?,defaultTags?}`)
- `GET contacts` · `POST contacts`
- `GET campaigns` · `POST campaigns` · `PATCH campaigns?id=…` ·
  `POST campaigns/send` (`{id}`) · `POST campaigns/preview-audience`
  (`AudienceFilter` body)

## Foundation pending

Tracked here so the orchestrator's next foundation round picks them up:

1. **`ActivityCategory` += `"leads"`** — vendored locally; foundation
   `_registry.ts` / canonical `ActivityCategory` union needs the same
   extension. Same one-line patch agency-hr / public-funnel chapters
   already flagged. Chapter #153 (R033 batch) did NOT cover `"leads"`.
2. **Plugin runtime registration** — workspace dep + `transpilePackages`
   + a side-effect import calling `registerLeadsPipelineFoundation
   ({...})` + an entry in `_registry.ts` (same 5-step pattern as
   agency-hr / public-funnel / email-sender).
3. **`EmailEnqueuePort` adapter** — wraps email-sender's
   `EmailService.enqueue` (chapter #144 / R024). Until wired,
   `Campaign.send` throws `"email-sender not wired …"`. The port shape
   is intentionally a strict subset of `EnqueueInput` so the foundation
   adapter is one function (forward `triggeredByPlugin`/`externalRef`
   verbatim, default to no `cc`/`bcc`/`from` so email-sender's default
   identity wins).
4. **`PipelinePort` adapter** — wraps T1 R034's foundation
   `pipelines.ts` exports: `addLeadCard` calls `addCard({pipelineId:
   getPipelineBySlug(agencyId, "leads")?.id, kind: "lead", snapshot:
   {leadId, email, name?, company?, source}})` + reads back the
   created card; `leadIdsInColumn` walks `listCardsByAgency` filtered
   by column label; `columnLabelForLead` is a reverse lookup. Until
   wired, the leads pipeline integration is silently skipped (still
   honest — Lead rows persist, audience filters w/o `pipelineColumn`
   resolve, campaigns still send).
5. **Event-bus subscription wiring** — foundation reads
   `EVENT_SUBSCRIPTIONS` from `./server` and `events.on(name,
   handler)` for each. `public-funnel` (chapter #132) already emits
   `lead.captured`; T1 R034 emits `pipelines.card.moved` per its
   move-card mutation (foundation-pending IF R034 didn't ship the
   emit).

## Q-ASSUMED

- ActivityCategory `"leads"` not yet in foundation enum — vendored
  locally, foundation-pending #1.
- `EmailEnqueuePort` defined here rather than imported from email-
  sender — keeps cross-plugin coupling inside foundation glue and
  this plugin tsc-clean standalone.
- `PipelinePort` is OPTIONAL in v1 — agency expectation is "best
  effort" while T1 finishes the wire; absent port = pipeline clause
  silently drops, send still goes out.
- CSV tag separators: `; |` always split; bare comma is a CSV
  separator so the cell must be quoted to embed multiple comma-
  separated tags. Smoke pins this.
- Re-imports are merge-not-clobber — only fill blanks + union tags.
  Otherwise an agency that fixes a typo in their notes locally would
  have it overwritten by the next CSV upload.
- `EVENT_SUBSCRIPTIONS` exported as a declarative manifest rather
  than auto-subscribing in `onInstall` — foundation owns subscription
  lifetime so there's no dangling listener after uninstall.
- Promotion ladder higher-wins (`customer > vendor > lead`) — a
  vendor showing up in a CSV import shouldn't downgrade an existing
  customer Contact.
- Campaign send emails go out one-shot per recipient; rate limiting
  delegated entirely to email-sender's queue (T2 R024) — no internal
  back-pressure logic here.
- One-off recipient send errors do NOT abort the blast — they're
  logged on `leads.campaign.send_skip` and surface as
  `sentCount < recipients` to the caller.
- LeadsBoardPage is a placeholder until the kanban plugin ships
  (T2 R+1 per #156's "NOT in scope").

## NOT in scope (deferred)

- Drip-sequence campaigns / multi-step automation (R+1 — v1 is
  single-shot send).
- Tracking pixels / open-rate (R+1 — needs SMTP webhook ingest
  + per-recipient signed pixel URL).
- A/B testing campaigns (post-ship).
- Lead scoring (post-ship).
- Real kanban host for the leads board (T2 kanban plugin R+1 from
  #156).
- Cropping / advanced CSV mapping UI — header autodetect covers v1.
