# Client-CRM plugin (T2 R8)

`@aqua/plugin-client-crm` — per-client CRM for the agency's clients to
manage their end-customer pool. Contacts + segments + activity timeline
+ custom attributes. `scopePolicy: "client"`, `core: false`. No hard
deps, but soft-integrates with memberships + ecommerce + affiliates
via optional injected ports (return-null-when-absent, same pattern as
R5 ecommerce↔memberships).

> Built by T2 on 2026-05-05 as Round 8. tsc-clean standalone; 10/10
> smoke pass. Pairs naturally with T1 R5's end-customer flow — every
> end-customer signup auto-appears here as a Contact when foundation
> wires the cross-plugin event router.

## 1. Package shape

```
04-the-final-portal/plugins/client-crm/
├── index.ts                          default-exports the AquaPlugin manifest
├── package.json                      @aqua/plugin-client-crm@0.1.0
├── tsconfig.json
├── src/
│   ├── lib/
│   │   ├── aquaPluginTypes.ts        vendored AquaPlugin contract
│   │   ├── domain.ts                 Contact · Segment · SegmentRule · ActivityRecord · Ingest payloads · ImportResult
│   │   ├── tenancy.ts                Mirror types (+ "crm" added to ActivityCategory)
│   │   ├── ids.ts                    makeId
│   │   └── time.ts                   stubable clock + day constants
│   ├── server/
│   │   ├── ports.ts                  Storage · Tenant · User · ActivityLog · EventBus · PluginInstallStore (+ optional MembershipBenefits + EcommerceOrders)
│   │   ├── contacts.ts               ContactService (CRUD + bulk import + email uniqueness scoped to (agencyId, clientId) + mergeFromUser + secondary indexes by email/userId + _touchLastSeen)
│   │   ├── segments.ts               SegmentService (CRUD + idempotent seedDefaults — 4 defaults — AND-of-conditions evaluator with `{{now-Nd}}` placeholder resolution + listMembers walk)
│   │   ├── activity.ts               ActivityService (append-only log + addNote + 3 cross-plugin ingest methods with idempotency + ecommerce backfill via optional port)
│   │   ├── foundationAdapter.ts      registerClientCrmFoundation + containerFor + containerWithDeps + _containerFromCtx
│   │   └── index.ts                  buildClientCrmContainer + barrel
│   ├── api/
│   │   ├── handlers.ts               16 handlers
│   │   └── routes.ts                 ROUTES (per-route visibleToRoles)
│   ├── pages/
│   │   ├── ContactsPage.tsx          mounted at "" + "contacts"
│   │   ├── ContactDetailPage.tsx     "contacts/:id" — profile + activity timeline
│   │   ├── SegmentsPage.tsx          list + member-count per segment
│   │   ├── ActivityPage.tsx          cross-contact feed
│   │   ├── SettingsPage.tsx
│   │   └── MyProfilePage.tsx         "/portal/customer/profile" — auto-bootstraps via mergeFromUser
│   └── __smoke__/
│       └── crm.test.ts               10 node:test cases via tsx --test
└── package-lock.json
```

22 source files, ~3700 LOC, zero runtime deps.

## 2. Manifest (key fields)

```ts
{
  id: "client-crm",
  category: "growth",
  status: "alpha",
  core: false,
  scopePolicy: "client",
  requires: [],                        // no HARD deps; soft-integrates via optional ports
  navItems: [
    Contacts · Segments · Activity · Settings (panel "growth", admin),
    "My profile" (panel "customer", end-customer),
  ],                                   // 5 items
  pages: 7 entries (incl. ContactDetail + customer page on full URL),
  api: ROUTES,                         // 14 routes
  storefront.blocks: [
    "crm-contact-form",                // T3 R3 will register renderer
  ],
  features: [contacts, segments, activity-timeline, cross-plugin-ingest, bulk-import],
  settings.groups: [
    general (autoCreateOnSignup, defaultTags),
    schema (customAttributeSchema JSON),
  ],
  onInstall: seeds 4 default segments (All / New / Engaged / Dormant),
  healthcheck: active contacts + segments count,
}
```

## 3. Domain model (v1)

```ts
type Contact = {
  id, agencyId, clientId,
  endCustomerUserId?,                  // foundation User id, nullable
  email, name?, phone?,
  source: "signup"|"manual"|"import"|"form-block"|"order",
  status: "active"|"unsubscribed"|"bounced"|"deleted",
  segmentIds: string[],
  tags: string[],
  attributes: Record<string, string>,
  firstSeenAt, lastSeenAt?,
  createdAt, updatedAt,
};

type Segment = {
  id, agencyId, clientId, name, description?,
  rules: SegmentRule[],                // AND-of-conditions
  isDefault: boolean,                  // seeded; non-deletable
  status: "active"|"archived",
  createdAt, updatedAt,
};

type SegmentRule = {
  field: "tag" | "source" | "status" | "membershipPlanId" | "lastSeenAt" | "firstSeenAt" | "customAttr",
  op: "eq"|"neq"|"in"|"nin"|"before"|"after"|"contains",
  value: string | string[] | number,
  attrKey?: string,                    // when field === "customAttr"
};

type ActivityRecord = {
  id, agencyId, clientId, contactId,
  kind: "signup"|"login"|"order"|"subscription_started"|"subscription_canceled"|
        "affiliate_referral"|"note"|"email_sent"|"page_view"|"custom",
  summary, details?: Record<string, unknown>,
  occurredAt, createdAt,
};
```

### Validation rules (in services)

| Service | Rule |
|---------|------|
| ContactService | email required + per-(agencyId, clientId) unique (case-insensitive); email change re-keys index; bulk import capped at 1000 rows |
| SegmentService | name unique per-client; default segments cannot be deleted (status:"archived" instead); rule evaluation is AND-of-conditions |
| ActivityService | contact must exist; engagement-kind events bump lastSeenAt; ingest methods idempotent on synthesized (kind, source-id) key |

## 4. Storage layout (per-install plugin storage)

```
contacts/by-id/<id>            → Contact
contacts/by-email/<lowered>    → contactId  (uniqueness lookup)
contacts/by-user/<userId>      → contactId  (User-link reverse lookup)
contacts/index                 → string[] of all contact ids

segments/by-id/<id>            → Segment
segments/index                 → string[] of segment ids

activity/by-id/<id>            → ActivityRecord
activity/by-contact/<cid>      → string[] of activity ids
activity/index                 → string[] of all activity ids
```

Same secondary-index discipline as the rest of the catalogue.

## 5. API surface (14 routes mounted at `/api/portal/client-crm/`)

| Method · Path | Handler | Roles |
|--------------|---------|-------|
| GET `contacts` | listContactsHandler | admin viewers |
| POST `contacts` | createContactHandler | admin roles |
| PATCH `contacts` | updateContactHandler | admin roles |
| DELETE `contacts?id=…` | deleteContactHandler | admin roles |
| POST `contacts/import` | importContactsHandler | admin roles |
| POST `contacts/notes` | addNoteHandler | admin roles |
| GET `contacts/activity?id=…` | listContactActivityHandler | admin viewers |
| GET `segments` | listSegmentsHandler | admin viewers |
| POST `segments` | createSegmentHandler | admin roles |
| PATCH `segments` | updateSegmentHandler | admin roles |
| DELETE `segments?id=…` | deleteSegmentHandler | admin roles |
| GET `segments/members?id=…` | listSegmentMembersHandler | admin viewers |
| POST `events/ingest` | ingestEventHandler | admin roles (foundation event router) |
| GET `me/profile` | meProfileHandler | end-customer (auto-bootstraps via mergeFromUser) |
| PATCH `me/profile` | meUpdateProfileHandler | end-customer (limited to name/phone/attributes) |

## 6. Optional cross-plugin ports

Two optional ports declared in `src/server/ports.ts`:

```ts
MembershipBenefitsPort.getMembershipForUser({ agencyId, clientId, userId })
  → { planId, planName?, status } | null
EcommerceOrdersPort.listForUser({ agencyId, clientId, userId?, email?, limit? })
  → EcommerceOrderProjection[]
```

Foundation supplies these when memberships / ecommerce are also
installed for the same client. Absent → segments + activity backfill
degrade gracefully:

- `membershipPlanId` rules return false-no-match when port is absent
  (segment evaluator handles `null` snapshot cleanly).
- `ActivityService.backfillFromEcommerce` returns 0 when port is absent.

## 7. Default segments (seeded on install)

| Name | Rule(s) | Why |
|------|---------|-----|
| All | (no rules — matches every active contact) | Quick "all my customers" view. |
| New | `firstSeenAt > now - 7 days` | Recently joined; warm. |
| Engaged | `lastSeenAt > now - 30 days` | Active in last month. |
| Dormant | `lastSeenAt < now - 90 days` (or never seen) | Re-engagement target. |

The `now` resolver in `value: "{{now-Nd}}"` is re-resolved at evaluate
time (not seed time), so the windows slide naturally as time passes.

## 8. Cross-plugin event ingest

`POST /api/portal/client-crm/events/ingest` accepts:

```ts
{
  type: "order.created" | "subscription.started" | "subscription.canceled" | "affiliate.attribution_recorded",
  payload: { orderId? endCustomerUserId? customerEmail? amountTotal? planId? status? affiliateUserId? affiliateEmail? amountCents? occurredAt? }
}
```

Each ingest method:
1. Resolves the relevant Contact via `userId` → `email` → auto-create.
2. Checks idempotency (same source-id + kind already recorded → no-op).
3. Records the ActivityRecord with appropriate kind + bumps Contact's `lastSeenAt`.

Foundation pending: cross-plugin event router that subscribes to
ecommerce `order.created`, memberships `subscription.*`, affiliates
`affiliate.attribution_recorded` events and calls
`POST /events/ingest` for each install of client-crm in the matching
client scope. Until that's wired, the route is callable directly
(useful for tests + manual backfill scripts).

## 9. Smoke test (10 cases)

`src/__smoke__/crm.test.ts` — `node:test` via `tsx --test`. Builds an
in-memory foundation with optional Membership + Ecommerce ports
mocked, walks:

| Step | Asserts |
|------|---------|
| 0 | `seedDefaults` ×2: first seeds 4 segments, second is no-op; default segments cannot be deleted |
| 1 | Contact create with full fields; case-insensitive duplicate-email rejected; same email in different clients allowed (scope = (agency, client)) |
| 2 | `mergeFromUser` reconciles a manual contact with a foundation User by email — same id returned, `endCustomerUserId` linked, no duplicate created; idempotent on second call |
| 3 | Bulk import: new email creates, existing email patches (tags merged + deduped, attributes merged), missing email skipped |
| 4 | Segment evaluate: "All" matches every active contact; tag-rule matches only tagged contacts; membership-rule matches only the user the mock port returns Silver for |
| 5 | Activity timeline append + chronological order; `addNote` doesn't bump lastSeenAt; `ingestOrderCreated` is idempotent on orderId; engagement bumps lastSeenAt → Engaged segment now matches |
| 6 | `ingestSubscription` + `ingestAffiliateAttribution` auto-create contacts for unknown email/user; idempotent on (planId, status) and orderId |
| 7 | `backfillFromEcommerce` ingests orders from the optional port; returns count |
| 8 | Optional ports absent: membership-rule segment matches nobody (graceful null); backfillFromEcommerce returns 0 |
| 9 | Activity log + event bus carry all 6+ CRM verbs (created/updated/merged/imported/segment-created/activity-recorded) |

```
▶ client-crm smoke
  ✔ step 0–9 (10/10 pass)
ℹ tests 10   ℹ pass 10   ℹ fail 0
```

`npm run smoke` from `04-the-final-portal/plugins/client-crm/`.

## 10. Foundation pending (orchestrator brokerage)

| # | Task | File / Surface |
|---|------|---------------|
| 1 | Workspace dep + transpilePackages | `portal/package.json` + `portal/next.config.ts` |
| 2 | Side-effect-import file at `portal/src/plugins/foundation-adapters/clientCrmFoundation.ts` calling `registerClientCrmFoundation({ tenant, user, activity, events, pluginInstalls, membershipBenefits?, ecommerceOrders? })` | new file |
| 3 | `_registry.ts` append (`clientCrmManifest as unknown as AquaPlugin`) | `portal/src/plugins/_registry.ts` |
| 4 | `ActivityCategory` union += `"crm"` | `portal/src/server/types.ts` |
| 5 | **`UserPort.getUser` + `getUserByEmail` projection** — same shared port memberships/affiliates/finance/marketing all need | shared across the catalogue |
| 6 | **MembershipBenefitsPort wiring** — read from `@aqua/plugin-memberships/server`'s `containerFor()`, project `subscription + plan` into `MembershipSnapshot` | new adapter file |
| 7 | **EcommerceOrdersPort wiring** — read from `@aqua/plugin-ecommerce/server`'s `containerFor(storage).orders.listOrdersForClient`, project + filter by user/email | new adapter file |
| 8 | **Cross-plugin event router** — same item every plugin since R5 has flagged. Foundation subscribes to ecommerce `order.created`, memberships `subscription.*`, affiliates `affiliate.attribution_recorded` and fans out to client-crm's `/events/ingest` for each matching install scope. | foundation event-bus adapter |

## 11. Cross-team integration TODOs

- **T1 R5 end-customer flow**: when a foundation User signs up via the
  end-customer flow, fire a `user.signed_up` event with
  `{ userId, email, agencyId, clientId }` so client-crm can ingest it
  (or call `mergeFromUser` directly via the foundation event router).
  The `MyProfilePage` already auto-bootstraps via mergeFromUser on
  first read, so signups land cleanly even if the event misses.
- **T3 R3 storefront blocks**: register a renderer for `crm-contact-form`.
  Block descriptor lives in this plugin's manifest; renderer in T3.
  Form POSTs to `POST /contacts` with `source: "form-block"`.
- **T2 ecommerce / memberships / affiliates follow-up**: emit cross-plugin
  events with the payload shapes documented in §8. Today only
  ecommerce emits `order.created` (R6). Memberships needs a
  `subscription.*` emit; affiliates needs an `affiliate.attribution_recorded`
  emit. Small additions per plugin; future round.

## 12. NOT in scope (per the prompt)

- Email sending / SMTP integration — that's agency-marketing's
  templates; CRM only stores `email_sent` ActivityRecord rows when
  fired by other surfaces.
- Form-builder for the contact form — block id contributed; T3
  owns the renderer.
- Campaign-trigger automation (e.g. "Dormant → fire email") — future
  plugin.
- Full DSL for segment rules — kept AND-of-conditions on the
  enumerated field types.

## 13. Verification commands

```bash
cd "04-the-final-portal/plugins/client-crm"

# tsc clean
npx tsc --noEmit

# 10/10 smoke pass
npm run smoke
```
