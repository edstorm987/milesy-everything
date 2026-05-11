/loop

# T2 — Round 8: Client-CRM plugin (`@aqua/plugin-client-crm`)

Round 7 you shipped the Milesy-internal trio (HR + Finance + Marketing)
and the phase-preset consolidation. Seven plugins shipped; 64 smoke
cases green. Round 8 adds the **client-side CRM** — a per-client tool
for Felicia (and future clients) to manage their own end-customer pool:
contact list + segments + notes + activity timeline. Pairs naturally
with T1 R5's end-customer flow when that ships (each end-customer who
signs up shows up automatically here).

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-2/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-2/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-architecture.md` — §1 (three-tier tenancy)
3. `01 development/context/prior research/04-plugin-agency-hr.md` (your R3b — agency-internal CRUD pattern; client-CRM is its client-scoped sibling)
4. `01 development/context/prior research/04-plugin-memberships.md` (your R4 — UserPort precedent for resolving end-customer profiles)
5. `01 development/context/prior research/04-plugin-affiliates.md` (your R5b — per-end-customer pattern)
6. `01 development/eds requirments.md`

## Scope

`04-the-final-portal/plugins/client-crm/` — `@aqua/plugin-client-crm`,
self-contained package, mirror your fulfillment + ecommerce + agency-HR
+ memberships + affiliates + agency-finance + agency-marketing shape
(vendored AquaPlugin types, ports, container builder, foundation
adapter, tsc-clean standalone).

Manifest:
- `id: "client-crm"`
- `category: "growth"`
- `scopePolicy: "client"` — Felicia's CRM is hers, not the agency's
- `requires: []` — no hard dep, but soft-integrates with memberships +
  affiliates + ecommerce when present (cross-plugin reads via injected
  ports, returning null when absent — same pattern as ecommerce↔memberships)
- `core: false` (opt-in)
- ~5 navItems split: admin (Contacts · Segments · Activity · Settings under panel `growth`); customer-facing (My profile under panel `customer`)
- ~5 admin pages + 1 customer page
- ~12 API routes at `/api/portal/client-crm/*`
- 1 storefront block id: `crm-contact-form` (lead-capture form, T3 owns rendering)
- `onInstall` seeds default segments (All / New / Engaged / Dormant)

### Domain model

```ts
type Contact = {
  id, agencyId, clientId,
  endCustomerUserId?,                   // foreign key to foundation Users when the contact registered;
                                        // null if imported / manually entered
  email, name?, phone?,
  source: "signup"|"manual"|"import"|"form-block"|"order",
  status: "active"|"unsubscribed"|"bounced"|"deleted",
  segmentIds: string[],                 // membership in 0..N segments
  tags: string[],                       // freeform labels
  attributes: Record<string, string>,   // custom fields per agency/client
  firstSeenAt, lastSeenAt?,
  createdAt, updatedAt,
};

type Segment = {
  id, agencyId, clientId,
  name, description?,
  rules: SegmentRule[],                 // simple AND-of-conditions; future: full DSL
  isDefault: boolean,                   // non-deletable
  status: "active"|"archived",
  createdAt, updatedAt,
};

type SegmentRule = {
  field: "tag" | "source" | "status" | "membershipPlanId" | "lastSeenAt" | "customAttr",
  op: "eq"|"neq"|"in"|"nin"|"before"|"after"|"contains",
  value: string | string[],             // op-dependent
  attrKey?: string,                     // when field === "customAttr"
};

type ActivityRecord = {
  id, agencyId, clientId, contactId,
  kind: "signup"|"login"|"order"|"subscription_started"|"subscription_canceled"|"affiliate_referral"|"note"|"email_sent"|"page_view"|"custom",
  summary, details?: Record<string, unknown>,
  occurredAt,
};
```

### Services

- **ContactService** — CRUD + `recordActivity(contactId, kind, summary, details?)`,
  bulk import via CSV-shaped POST (no actual file parsing — accept
  array body), email uniqueness scoped to `(agencyId, clientId)` pair
  (mirrors T1's per-client end-customer email-pool semantics from
  R5 prompt). `mergeFromUser(userId)` reconciles a foundation User with
  an existing Contact (e.g. when an end-customer signs up after first
  appearing as a manual import).
- **SegmentService** — CRUD + idempotent seedDefaults (All / New /
  Engaged / Dormant). `evaluate(segment, contact)` runs the rules.
  `listMembers(segmentId)` walks contacts. Default segments use
  hardcoded rule sets (e.g. New = `firstSeenAt` after `now-7d`,
  Dormant = `lastSeenAt` before `now-90d`).
- **ActivityService** — append-only log of events per contact. Reads
  ecommerce `order.created`, memberships `subscription.created`,
  affiliates `affiliate.attribution_recorded` events when those plugins
  are installed (via cross-plugin event subscription — declare an
  `EventSubscriberPort` similar to your existing port patterns).

### Ports needed from foundation

- `StoragePort`, `TenantPort`, `UserPort`, `ActivityLogPort`,
  `EventBusPort`, `PluginInstallStorePort` (same set as agency-HR)
- `MembershipBenefitsPort` — optional, returns null when memberships
  not installed (same shape ecommerce already declares for the discount
  chain — your R5 work). Used to enrich segments by membership tier.
- `EcommerceOrdersPort` — optional, returns null when ecommerce not
  installed. Used to backfill Contact.lastSeenAt + activity timeline.
- ActivityCategory union extension: `"crm"`. Note for cross-team.

### API routes (~12)

Admin (`visibleToRoles: AGENCY_ROLES + CLIENT_ROLES`):
- `GET /contacts` (filter by segmentId / tag / status) · `POST /contacts` · `PATCH /contacts/:id` · `DELETE /contacts/:id`
- `POST /contacts/import` — bulk import (array body, max 1000)
- `POST /contacts/:id/notes` — append a note ActivityRecord
- `GET /segments` · `POST /segments` · `PATCH /segments/:id` · `DELETE /segments/:id`
- `GET /segments/:id/members`
- `GET /contacts/:id/activity`
- `POST /events/ingest` — internal endpoint for cross-plugin event subscription

End-customer-facing (`visibleToRoles: ["end-customer"]`):
- `GET /me/profile` — own contact record + segment memberships
- `PATCH /me/profile` — update name / phone / preferences

### Admin pages (~5)

`ContactsPage` (filterable list + create/import modals),
`ContactDetail` (profile + activity timeline + notes),
`SegmentsPage` (list + create modal + rule editor),
`ActivityPage` (cross-contact activity feed),
`SettingsPage` (custom-attribute schema management).

### Customer pages (1)

`MyProfilePage` (`panelId: "customer"`) — own contact record + a few
preference toggles.

### Storefront block contributions

`crm-contact-form` (block id only — T3 R3 will register renderer when
this lands; T3 R3 prompt already has a renderer-registration hook).

## Foundation integration

Same pattern as memberships + affiliates + agency-finance + agency-marketing:
- `tsc --noEmit` clean inside `04-the-final-portal/plugins/client-crm/`.
- Ports declared in `src/server/ports.ts`.
- Export `buildClientCrmContainer(deps)`.
- Export `registerClientCrmFoundation(deps) + containerFor(storage)` for side-effect-import.
- Foundation pending list in chapter — same items as your previous 4
  plugins (workspace dep + transpilePackages + side-effect-import +
  `_registry.ts` append + ActivityCategory union += `"crm"` + cross-plugin
  event subscription routing for `order.created` /
  `subscription.created` / `affiliate.attribution_recorded` →
  ActivityService).

## NOT in scope

- Don't build email-sending integration — that's agency-marketing's
  templates; CRM only stores `email_sent` activity records when other
  surfaces fire them.
- Don't build form-builder for CRM contact form — block id is
  contributed; T3 owns the renderer.
- Don't build campaign-trigger automation (e.g. "when contact joins
  Dormant segment, fire email") — that's a future plugin.
- Don't build full DSL for segment rules — keep it AND-of-conditions
  with the few field types listed.
- Don't touch fulfillment / ecommerce / website-editor / agency-HR /
  memberships / affiliates / agency-finance / agency-marketing /
  foundation source.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end.

## When done

1. `tsc --noEmit` clean inside `04-the-final-portal/plugins/client-crm/`.
2. Smoke (`src/__smoke__/crm.test.ts`) — node:test cases:
   - `seedDefaultSegments` idempotent.
   - Contact CRUD + email uniqueness scoped to `(agencyId, clientId)`.
   - `mergeFromUser` reconciles a manual contact with a foundation User by email.
   - Segment evaluate / listMembers correctness against seed contacts.
   - Activity timeline append + read in chronological order.
   - Optional ports (membership / ecommerce) absent: graceful null handling.
3. Chapter `04-plugin-client-crm.md` documenting domain, services, API
   surface, Foundation pending list, cross-team integration TODOs.
4. MASTER row.
5. `tasks.md` row done.
6. Final `DONE` + `COMMIT` to outbox.
