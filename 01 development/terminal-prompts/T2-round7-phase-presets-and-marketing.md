/loop

# T2 — Round 7: Phase preset definitions + agency-marketing plugin

Round 6 you shipped (A) ecommerce `order.created` emits
`referralCodeId` + `endCustomerUserId` (`db60015`) and (B)
`@aqua/plugin-agency-finance` (`8045511`). Six plugins shipped
end-to-end: fulfillment + ecommerce + agency-HR + memberships + affiliates
+ agency-finance. Round 7 is **consolidation** — connect what you've
built before adding more.

(A) Update fulfillment's default phase presets so each phase ACTUALLY
installs the right plugins on entry — your R3 lifecycle smoke proved
the transition mechanism works, but the seeded preset list doesn't
yet reflect the plugin catalogue you've grown since. (B) Ship
`@aqua/plugin-agency-marketing` to complete the Milesy-internal trio
(HR + Finance + Marketing).

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
2. `01 development/context/prior research/04-architecture.md` — §7 (phase lifecycle)
3. `01 development/context/prior research/04-plugin-fulfillment.md` (your R1 — `seedDefaultPhases` lives here)
4. `01 development/context/prior research/04-phase-lifecycle-smoke.md` (your R3a — Bug A trim)
5. `01 development/context/prior research/04-plugin-agency-hr.md` (your R3b — agency-internal pattern)
6. `01 development/context/prior research/04-plugin-agency-finance.md` (your R6b — most recent agency-internal pattern)
7. `01 development/context/prior research/04-plugin-memberships.md` + `04-plugin-affiliates.md` (per-client plugins now in catalogue)
8. `01 development/eds requirments.md`

## Two goals

### Goal A: Update phase preset definitions

Your R3a lifecycle smoke surfaced "Bug A": default phase presets
referenced unregistered plugins. You trimmed them to `website-editor` +
`ecommerce` — the only ones registered at that time. Six rounds later
the catalogue has grown. The presets should now reflect the actual
plugin life-cycle a real client goes through.

In `04 the final portal/plugins/fulfillment/src/server/presets.ts`
(or wherever your `DEFAULT_PHASE_PRESETS` lives), update the six
seeded phase definitions:

| Phase | Plugins to install on entry | Why |
|-------|----------------------------|-----|
| Discovery | `website-editor` | Brand exploration; pages but no commerce yet. |
| Design | `website-editor` | Continues — design refinement. |
| Development | `website-editor` + `ecommerce` | Build out the storefront. |
| Onboarding | `website-editor` + `ecommerce` + `memberships` | Add member tier offering. |
| Live | `website-editor` + `ecommerce` + `memberships` + `affiliates` | Full customer-facing trio. |
| Churned | (nothing — keep installs but `enabled: false`) | Architecture §7 auto-disable preserves config. |

Also reflect the matching `portalVariantId` per phase (look at the 6
starter trees T3 shipped in R1 of website-editor — `login-default`,
`login-discovery`, `login-design`, etc.). Each phase's portal variant
should be the right one for that lifecycle stage.

Re-run your existing lifecycle smoke + extend it: walk
`Discovery → Design → Development → Onboarding → Live` and verify the
plugin install set matches the table above at each step. The
`phase.advanced` event payload should include `installedPluginIds` (it
already does per your R3 chapter). Add a smoke assertion that confirms
the set.

If your seeded presets blow past the 4 plugins T1's foundation has
actually wired into `_registry.ts` (currently fulfillment + ecommerce
+ website-editor; agency-HR, memberships, affiliates, agency-finance
are NOT yet wired), the preset machinery will surface the same Bug A
again. Two paths:

- **Soft-fail (preferred):** make the preset installer treat
  "unregistered plugin id" as a `WARN` activity log entry + `event.skipped`,
  not a hard 422. Phase still advances. Document this as a deliberate
  resilience choice — same architecture spirit as Bug B's variant-id
  soft-fail.
- **Hard-fail:** keep the 422. Trim presets back to what's wired today
  (`website-editor` + `ecommerce`), and log the wider preset table as
  a foundation TODO for T1's mass-wire-up round.

Pick (a) by default. Log Q-ASSUMED.

### Goal B: `@aqua/plugin-agency-marketing`

Mirror your fulfillment + ecommerce + agency-HR + memberships +
affiliates + agency-finance shape. Most recently agency-finance — copy
that as the template. Self-contained package, vendored types, ports,
container builder, foundation adapter, tsc-clean standalone.

Manifest:
- `id: "agency-marketing"`
- `category: "core"` (agency-internal)
- `scopePolicy: "agency"` — agency-level install (mirrors agency-HR + agency-finance)
- `core: false` — opt-in
- ~5 navItems: Campaigns · Leads · Email Templates · Reports · Settings (panel `agency-marketing`)
- ~5 admin pages
- ~12 API routes at `/api/portal/agency-marketing/*`
- `onInstall` seeds default email templates (Welcome / Re-engagement / Newsletter)

### Domain model

```ts
type Campaign = {
  id, agencyId,
  name, channel: "email"|"sms"|"social"|"paid"|"organic"|"event",
  status: "draft"|"scheduled"|"running"|"paused"|"completed"|"archived",
  startAt?, endAt?,
  budgetCents?, currency,
  goalKpi?: "leads"|"signups"|"revenue"|"engagement",
  goalTarget?,
  resultActual?,                      // populated as the campaign runs
  ownerStaffId?,                      // foreign key to agency-HR Staff (optional cross-read)
  notes?,
  createdAt, updatedAt,
};

type Lead = {
  id, agencyId,
  campaignId?,                        // attribution
  email, name?, phone?,
  source: "form"|"manual"|"import"|"campaign",
  status: "new"|"contacted"|"qualified"|"converted"|"unqualified"|"lost",
  assignedStaffId?,                   // foreign key to agency-HR Staff
  notes?,
  createdAt, updatedAt, lastContactedAt?,
};

type EmailTemplate = {
  id, agencyId,
  name, subject, bodyHtml, bodyText?,
  category: "welcome"|"re-engagement"|"newsletter"|"transactional"|"other",
  status: "active"|"archived",
  createdAt, updatedAt,
};
```

### Services

- **CampaignService** — CRUD + status transitions + budget vs result rollup.
- **LeadService** — CRUD + status transitions + `assignTo(staffId)` + `recordContact(leadId, note)`.
- **TemplateService** — CRUD + idempotent seedDefaults (Welcome /
  Re-engagement / Newsletter starter templates).
- **ReportService** — `campaignSnapshot({from, to})` aggregates by
  channel + by status; `leadFunnel({from, to})` reports new → contacted
  → qualified → converted counts.

### Ports

Same set as agency-finance + agency-HR:
- `StoragePort`, `TenantPort`, `UserPort`, `ActivityLogPort`,
  `EventBusPort`, `PluginInstallStorePort`
- ActivityCategory union extension: `"marketing"`. Note for cross-team.

### API routes (~12)

Admin (visibleToRoles agency-side):
- `GET /campaigns` · `POST /campaigns` · `PATCH /campaigns/:id` · `DELETE /campaigns/:id`
- `GET /leads` · `POST /leads` · `PATCH /leads/:id` · `POST /leads/:id/contact`
- `GET /templates` · `POST /templates` · `PATCH /templates/:id`
- `GET /reports/campaigns` · `GET /reports/leads`

### Admin pages (~5)

`CampaignsPage`, `LeadsPage`, `TemplatesPage`, `ReportsPage`,
`SettingsPage`. Inline create modals on each.

### NO storefront blocks

Agency-internal — no block contributions.

## Foundation integration

Same pattern as agency-finance. Document Foundation pending list in chapter:
- Workspace dep + transpilePackages + side-effect-import file +
  `_registry.ts` append + ActivityCategory += `"marketing"`.

## NOT in scope

- Don't build real email-sending integration (SMTP / SendGrid / Postmark)
  — store templates, render on demand, but actual sending is a future
  round.
- Don't build SMS or social-media integrations — campaigns track
  channel as metadata only.
- Don't build form-builder for lead capture — leads come in via API
  POST or manual entry. Form-builder is a future plugin.
- Don't touch fulfillment (except Goal A's `presets.ts` edit) /
  ecommerce / website-editor / agency-HR / memberships / affiliates /
  agency-finance / foundation source.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end.

## When done

Goal A:
1. `presets.ts` updated with the six-phase plugin map above.
2. Soft-fail behaviour for unregistered-plugin ids documented + tested.
3. Existing lifecycle smoke extended to assert install sets per phase.
4. `tsc --noEmit` clean.

Goal B:
1. `tsc --noEmit` clean inside `04 the final portal/plugins/agency-marketing/`.
2. Smoke (`src/__smoke__/marketing.test.ts`) — node:test cases:
   - `seedDefaultTemplates` idempotent.
   - Campaign CRUD + status transitions.
   - Lead funnel transitions.
   - `campaignSnapshot` + `leadFunnel` aggregates.
   - Activity log + event bus side-effects.
3. Chapter `04-plugin-agency-marketing.md`.
4. MASTER row.
5. `tasks.md` row done.
6. Final `DONE` + `COMMIT`.

Goal A first (small + closes a long-standing ecosystem gap). Goal B
is the meat. Partial DONE acceptable.
