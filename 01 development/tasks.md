# Tasks

## In progress

Six terminals firing. T1 R7 + T2 R10 + T3 R5 all DONE; new TASKs
dropped for T1 R8 + T2 R11 + T3 R6. T4/T5/T6 still on R1.

- [ ] **T1 R8 — milesymedia ↔ portal stitch** — prompt
      `terminal-prompts/T1-round8-milesymedia-portal-stitch.md`.
      Stitch milesymedia + Aqua portal as ONE surface (localhost +
      Vercel). Coordinate with T6's Vercel monorepo work.
- [ ] **T2 R11 — Export-to-repo + presets** — prompt
      `terminal-prompts/T2-round11-export-to-repo-and-presets.md`.
      `@aqua/plugin-portal-export` materializes Live clients into
      `clients/<slug>/`. 4 starter presets. T5's Luv & Ker portal
      is the canonical reference target.
- [ ] **T3 R6 — Editor save-to-per-client-repo** — prompt
      `terminal-prompts/T3-round6-editor-per-client-save-mode.md`.
      Editor Save writes to `clients/<slug>/` for Live clients via
      T2 R11's export plugin. Save-target toggle, branching pipeline,
      diff preview, GitStatusPage.
- [ ] **T4 R1 — UX + accessibility polish** — prompt
      `terminal-prompts/T4-round1-ux-accessibility-polish.md`.
      Phase A audit (`b89ee01`) + Phase B step 1 shared UI primitives
      (`15acfbe`) shipped. B/C/D/E ahead.
- [x] **T5 R1 — Luv & Ker portal** — DONE. Phase A+B scaffold
      (`8f0bb01`) + Phase C+D pages+proxy (`2fc3ae1`) + Phase E smoke
      pass + dev-default upstream + 502 fallback + chapter
      `04-client-portal-luv-and-ker.md` + MASTER row #43. `clients/luv-and-ker/`
      boots `npm run dev -p 4040` clean; tsc clean; storefront landing,
      branded login, iframe-able embed login, gated /account|/orders|/affiliates
      (redirects to /login when unauth), shop with placeholder fallback,
      proxy round-trips to localhost:3030 (or PORTAL_API_ORIGIN) — all 200/3xx
      as expected. Ready for T2 R11's generator to reverse-engineer.
- [ ] **T6 R1 — Deployment + domains + observability** — prompt
      `terminal-prompts/T6-round1-deployment-domains-observability.md`.
      Phase A Vercel monorepo (`05dea79` + `359b476`) + Phase B
      env-var taxonomy (`ef2e82f`) shipped. C/D/E ahead.

## Done — Round 1
- [x] **T1 — Foundation** — shipped. `04 the final portal/portal/` scaffolded
      on Next 16 + React 19 + Tailwind 4. Plugin runtime, three-level
      tenancy (Agency/Client/EndCustomer), HMAC cookie auth with role +
      tenant-scope gating, server-rendered chrome with brand-kit injector,
      file-backed storage abstraction. Working `/`, `/login`, `/embed/login`,
      `/portal/agency` after first-run bootstrap. `npm run build` and
      `npx tsc --noEmit` both clean. See
      `context/prior research/04-foundation.md`.
- [x] **T2 — Fulfillment plugin** — shipped. See `context/prior research/04-plugin-fulfillment.md`. tsc-clean standalone. Pending: foundation wires `PluginRuntimePort` + `PluginRegistryPort` (T1) and brokers `applyStarterVariant` adapter (T3 stubbed body, signature locked).
- [x] **T3 — Website-editor port** — shipped. `@aqua/plugin-website-editor`
      at `04 the final portal/plugins/website-editor/`. Manifest (8 navItems /
      11 pages / 41 api / 58 storefront.blocks / 8 features), full server
      runtime (pages.ts variant helpers + themes/content/sites/embeds/
      preview/discovery), `applyStarterVariant({agencyId, clientId, role:
      PortalRole, variantId, actor?}, storage)` for T2, 6 starter JSON
      trees, storage-keys namespacing under `t/{agencyId}/{clientId}/...`,
      smoke 31/31 pass, tsc clean. Block component UIs and admin page UIs
      ship as Round-1 structural placeholders for Round-2 lift. See
      `context/prior research/04-plugin-website-editor.md`. Pending T2
      one-line refactor: swap `PortalVariantPort.role: Role` →
      `role: PortalRole` (commander confirmed correction).

## Deferred
- [ ] NotebookLM setup — skipped for now. Revisit when we need outside research.

## Done — Round 2
- [x] **T1 R2 — wire fulfillment + demo seed** — shipped.
      `@aqua/plugin-fulfillment` mounted as `file:..` workspace dep
      (Turbopack + `install-links=true` + `transpilePackages`). Foundation
      port adapters bridge T2's ports → T1 server modules. Catch-all
      routes resolve `/portal/agency/[...rest]`,
      `/portal/clients/[clientId]/[...rest]`,
      `/api/portal/[plugin]/[...rest]` to plugin pages + handlers.
      Agency creation auto-installs core plugins (fulfillment seeds 6
      phase defaults via `onInstall`). `/api/dev/seed-demo` provisions
      Demo · Aqua + Felicia mirror at onboarding stage with half-ticked
      checklist. Smoke pass end-to-end. See
      `context/prior research/04-foundation-round2.md`.
- [x] **T2 R2 — ecommerce plugin** — shipped.
      `@aqua/plugin-ecommerce` at `04 the final portal/plugins/ecommerce/`.
      `scopePolicy: "client"`, `requires: ["website-editor"]`. Server
      domain (orders, products, gift cards, referrals, discounts, billing
      vestigial) backed by per-install storage. 23 API routes including
      Stripe webhook (idempotent) + checkout + billing-portal — keys read
      from per-install config, NOT env. 13 admin pages, 7 storefront UI
      components, CartContext with API-driven inventory reservations.
      8 block ids contributed (rendering delegated to T3). tsc-clean
      standalone. See `context/prior research/04-plugin-ecommerce.md`.
      Foundation pending: `registerEcommerceFoundation` call site + T3
      block-renderer registration.
- [x] **T3 R2 — Block + admin UIs lift** — shipped. Phase A: 58 blocks
      faithfully ported from 02 (absorbed in `e702415`). Phase B:
      canvas + admin siblings + libs (`5ce6cbf`) + 1429-LOC EditorPage
      faithful port (folded into `f678ef6`). Phase C: 444-LOC
      PortalsPage (`c10432e`). Phase D: Sections / Assets / Popups /
      Themes (`36404ea`). tsc-clean throughout, smoke 31/31. Final
      DONE @ `079a666`. Round-3 deferred: PageDetailPage /
      CustomisePage / ThemeDetailPage / SitesPage (depend on libs not
      yet lifted or file-size budget). Chapter
      `context/prior research/04-plugin-website-editor-round2.md`,
      MASTER row #29.

## Done — Round 3
- [x] **T3 R3 — CustomisePage + ThemeDetailPage + cross-plugin block
      renderers** — DONE. Goal A: 898-LOC CustomisePage faithful port
      with five tabs (Branding / Sidebar / Custom-tabs / Login /
      Export) + new lib/customise + lib/sidebarLayout +
      lib/loginCustomisation upgrade. Goal B: RENDERER_REGISTRATIONS
      cross-plugin renderer map (58 native + 8 ecommerce + 3
      memberships + 3 affiliates) + getBlockRenderer +
      registerExternalBlockRenderers + BlockRenderer consults the map
      first. 6 NEW stub block components for memberships + affiliates
      (paywall/signup/tier-grid/affiliate-signup/payout-meter/
      leaderboard) hitting their plugins' API namespaces. Goal C:
      ThemeDetailPage clean rewrite (architectural mismatch with 02's
      localStorage singleton — wired to plugin's per-site lib/theme.ts
      instead) + PagesPage re-pointed at EditorPage list. tsc clean;
      smoke 40/40 (was 31; +9 cross-plugin renderer tests). Chapter
      `context/prior research/04-plugin-website-editor-round3.md`,
      MASTER row #34. R4 deferred: PageDetailPage / SitesPage (3264
      LOC) / customise server-side persistence.
- [x] **T2 R3a — phase-lifecycle smoke (Goal A)** — shipped. Two smoke
      harnesses under `04 the final portal/plugins/fulfillment/src/__smoke__/`:
      in-process `lifecycle.test.ts` (9 `node:test` tests, mocks all 8
      foundation ports, walks `seedPhases → createWithPhase → tick → advance ×4`)
      and HTTP `lifecycle.http.mjs` (~50 assertions against a live
      `npm run dev`, hits seed-demo + login + every fulfillment endpoint).
      Surfaced + fixed Bug A: default phase presets referenced unregistered
      plugins (`brand`, `forms`, `email`, `analytics`, `seo`, `support`)
      causing 422 on `phase/advance`. Trimmed presets to plugins that
      actually ship (`website-editor`, `ecommerce`). Variant id soft-fail
      (Bug B) is per-architecture (logged for T3 alignment, not blocking).
      Both smokes 0 failures. `npm run smoke` script added. See
      `context/prior research/04-phase-lifecycle-smoke.md`.
- [x] **T2 R3b — agency-HR plugin (Goal B)** — shipped.
      `@aqua/plugin-agency-hr` at `04 the final portal/plugins/agency-hr/`.
      `scopePolicy: "agency"`, `core: false` (opt-in). Staff +
      departments + leave-request domain (Staff with status/role/manager
      graph + locationType/hourlyRate; Department tree with cycle-safe
      parentId; LeaveRequest with pto/sick/sabbatical types and
      pending/approved/rejected workflow). Three services with cycle
      checks + email uniqueness. Four ports declared (TenantPort,
      ActivityLogPort, EventBusPort, PluginInstallStorePort). 13 API
      routes at `/api/portal/agency-hr/*` with per-route
      `visibleToRoles`. 5 admin pages + 4 client components. Foundation
      adapter (`registerAgencyHrFoundation` + `containerFor` singleton)
      ready for T1 to side-effect-import. `onInstall` seeds five default
      departments. tsc-clean; 6/6 smoke tests green. See
      `context/prior research/04-plugin-agency-hr.md`. Foundation
      pending: workspace dep + transpilePackages + side-effect-import
      file + `_registry.ts` append + `ActivityCategory` += "hr".
- [x] **T1 R3 — three plugins live** — shipped. `@aqua/plugin-ecommerce`
      and `@aqua/plugin-website-editor` mounted as workspace deps
      alongside fulfillment. `_routeResolver.ts` handles two manifest
      path conventions side-by-side (relative `:name` and full-URL
      `[name]`). API path leading-slash normalised. Real
      `portalVariantAdapter` calls T3's `applyStarterVariant` bound to
      the website-editor install's plugin storage.
      `ecommerceFoundation.ts` side-effect-import registers
      `EcommerceFoundation` at boot. Cross-team patch added re-exports
      to `plugins/ecommerce/src/server/index.ts`. `ActivityCategory`
      extended with `"ecommerce"`. Demo seed installs both client-scoped
      plugins on Felicia. Smoke green: 14 pages 200 + multi-plugin API
      dispatch. See `context/prior research/04-foundation-round3.md`.

## Done — Round 10
- [x] **T2 R10 — Email-sender plugin** — shipped.
      `@aqua/plugin-email-sender` at
      `04 the final portal/plugins/email-sender/`. `scopePolicy: "agency"`,
      `core: false`, no hard deps. Single point of egress for every
      transactional / notification email across the agency portal.
      Domain EmailMessage (state machine queued→sending→sent/failed/bounced,
      idempotency key `${triggeredByPlugin}:${externalRef}` else
      `${plugin}:${sortedTo}:${fnv1a(body)}` — collapses event-bus
      retries), SenderIdentity (per-agency, isDefault flag, status
      active/pending/failed, verifyDomain stub), ProviderConfig
      (postmark/sendgrid/resend/smtp/none, masked apiKeyMasked + full
      key kept at `provider/api-key`, webhookSecret, status
      active/unconfigured/error).
      Four services: EmailService (enqueue + state transitions + 4
      cross-plugin subscribers), DeliveryService (queued→sending→
      sent/failed via active driver, retry path via resetForRetry),
      WebhookService (verify-by-driver + dedupe by
      `${RecordType}:${MessageID}` + status update + emit),
      IdentityService, ProviderService.
      Driver pattern: PostmarkDriver (live; injectable fetchImpl,
      query-param `?secret=` exact-match webhook verify), NoopDriver
      (live; synthetic `noop_<id>` ref), StubDriver (sendgrid/resend/
      smtp throw "R11 stub"). Five standard ports + one OPTIONAL
      MarketingTemplatePort (agency-marketing's EmailTemplate store +
      optional render fn — absent → templateless enqueue still works,
      templateId throws cleanly).
      12 API routes including 1 PUBLIC (`POST public/webhook/postmark`).
      3 admin pages (Outbox / Settings / Logs). No storefront blocks
      (server-side only).
      Cross-plugin subscribers declared via `EVENT_SUBSCRIPTIONS` const
      array on the foundation adapter — foundation R6 router reads at
      boot + subscribes 4 handlers on the live EmailService:
      forms.notification.requested → onFormsNotificationRequested,
      membership.subscription_changed → onMembershipSubscriptionChanged
      (welcome/cancellation), affiliate.payout_completed →
      onAffiliatePayoutCompleted, auth.bootstrap.signup →
      onAuthBootstrapSignup. `onInstall` bootstraps default sender
      identity from settings (defaultFromName/defaultFromEmail).
      tsc-clean; 7/7 smoke pass via
      `npx tsx --test src/__smoke__/email-sender.test.ts`. Foundation
      pending: workspace dep + transpilePackages + side-effect-import +
      `_registry.ts` append + `ActivityCategory` += "email" +
      cross-plugin event router subscriber wiring (now load-bearing
      across forms/memberships/affiliates/auth) +
      MarketingTemplatePort projection from agency-marketing +
      catch-all `public: true` honouring for the Postmark webhook.
      T2 plugin catalogue now: 10 shipped (fulfillment / ecommerce /
      agency-HR / memberships / affiliates / agency-finance /
      agency-marketing / client-crm / forms / email-sender); 89
      smoke cases catalogue-wide. See
      `context/prior research/04-plugin-email-sender.md`.

## Done — Round 9
- [x] **T2 R9 — Forms plugin** — shipped.
      `@aqua/plugin-forms` at `04 the final portal/plugins/forms/`.
      `scopePolicy: "either"`, `core: false`, no hard deps.
      Soft-integrates with client-CRM/affiliates/memberships via
      cross-plugin event payloads + admin-configurable webhook URLs
      (zero source coupling).
      Domain FormDefinition (11 field kinds, state machine
      draft→published→archived, per-form submissionCount), FormField
      (validation rules + per-kind checks + attributeKey hint for
      CRM), SubmitAction (4 kinds incl. external-webhook),
      Submission (idempotent on fnv1a hash of
      formId+identifier+sortedValues — collapsed re-submits don't
      bump count), FormTemplate (3 seeded defaults Contact /
      Newsletter Signup / Lead Capture).
      Four services (Form/Submission/Notification/Template). Six
      standard ports + one OPTIONAL EmailQueuePort (agency-marketing
      brokers when installed). 13 API routes including 2 PUBLIC
      (`POST public/submit/:formId` + `GET public/form/:formId`).
      5 admin pages — structured FormBuilderPage (no drag-drop in
      v1). 1 storefront block id (`form-render` — T3 owns).
      Stable event payloads (`forms.submission.created`,
      `forms.submission.validation_failed`,
      `forms.submission.status_changed`,
      `forms.notification.requested`).
      tsc-clean; 8/8 smoke pass via `npm run smoke`. Foundation
      pending: workspace dep + transpilePackages + side-effect-import +
      `_registry.ts` append + `ActivityCategory` += "forms" + catch-all
      `public: true` honouring + cross-plugin event router fan-out +
      EmailQueuePort wiring (no-op stub until agency-marketing
      send-time integration ships).
      T2 plugin catalogue now: 9 shipped (fulfillment / ecommerce /
      agency-HR / memberships / affiliates / agency-finance /
      agency-marketing / client-crm / forms); 82 smoke cases
      catalogue-wide. See
      `context/prior research/04-plugin-forms.md`.

## Done — Round 8
- [x] **T2 R8 — Client-CRM plugin** — shipped.
      `@aqua/plugin-client-crm` at
      `04 the final portal/plugins/client-crm/`. `scopePolicy: "client"`,
      `core: false`, no hard deps (soft-integrates with memberships +
      ecommerce via OPTIONAL injected ports). Pairs with T1 R5:
      end-customer signups auto-appear as Contacts via `mergeFromUser`.
      Domain Contact (per-(agency,client) email uniqueness, optional
      endCustomerUserId link, status active/unsubscribed/bounced/deleted,
      tags + attributes, firstSeenAt + lastSeenAt with engagement bumps),
      Segment (4 seeded defaults All/New/Engaged/Dormant with sliding
      `{{now-Nd}}` window resolution, AND-of-conditions evaluator),
      ActivityRecord (10 kinds, idempotent cross-plugin ingest).
      Three services (Contact/Segment/Activity). Six standard ports +
      two OPTIONAL (MembershipBenefits / EcommerceOrders).
      14 API routes including `/events/ingest` for foundation event
      router. 6 admin/customer pages including auto-bootstrapping
      `MyProfilePage`. 1 storefront block id `crm-contact-form`.
      Bulk import (≤1000 rows). tsc-clean; 10/10 smoke pass via
      `npm run smoke`. Foundation pending: workspace dep +
      transpilePackages + side-effect-import + `_registry.ts` append +
      `ActivityCategory` += "crm" + UserPort projection +
      MembershipBenefitsPort + EcommerceOrdersPort wiring + cross-plugin
      event router. T2 plugin catalogue now: 8 shipped (fulfillment /
      ecommerce / agency-HR / memberships / affiliates / agency-finance /
      agency-marketing / client-crm); 74 smoke cases all green. See
      `context/prior research/04-plugin-client-crm.md`.

## Done — Round 7
- [x] **T1 R7 — Postgres backend (production storage)** — shipped.
      Architecture §13's parked v1-required item closed. New
      `src/server/storagePostgres.ts` driver — lazy `pg.Pool` from
      `DATABASE_URL` with TLS auto-detect (Neon / Supabase /
      Vercel Postgres); `loadBlob` / `saveBlob` against a single-row
      JSONB blob in `portal_kv` keyed `__portal_state__`. Slotted
      into the existing `Backend` abstraction in `storage.ts` next to
      file/memory/kv via dynamic import (so `pg` stays out of the
      parse-time path when PORTAL_BACKEND=file). Implicit promotion:
      `DATABASE_URL` set + `PORTAL_BACKEND` unset → postgres takes
      over (prod is "set DATABASE_URL and go"; dev stays on file).
      `scripts/schema.sql` (key/value/updated_at + `portal_kv_key_prefix`
      btree on `text_pattern_ops`), `scripts/migrate-file-to-postgres.mjs`
      (idempotent ON CONFLICT upsert, DRY_RUN=1 supported, exit codes
      0–4), `scripts/smoke-postgres.mjs` (8/8 pass — schema + index +
      round-trip + idempotent re-write + prefix scan + payload-size
      sanity + cleanup). RLS deferred to R8 — single-row blob layout
      would gate the row not the in-blob fields; existing
      `withTenantScope` is the operating defense. Q-ASSUMED documented:
      blob-row over per-key rows so every existing `getState()` call
      site keeps working without consumer refactor. `npm run
      smoke:postgres` + `npm run migrate:file-to-postgres` aliases.
      `.env.example` documents DATABASE_URL + pool tunables. tsc clean.
      Verified end-to-end against a local Postgres (eds@localhost):
      schema applied + migration moved 24KB blob from
      `.data/portal-state.json` into `portal_kv`. Production runbook
      in chapter. The Next-hosted HTTP smoke against postgres was
      blocked by a parallel session holding the Next single-instance
      dev lock; the postgres-direct smoke covers the driver surface
      independently. See
      `context/prior research/04-foundation-round7-postgres.md`.
- [x] **T2 R7 — Phase preset consolidation + agency-marketing
      plugin** — shipped.
      Goal A (commit `a80daa9`): updated `DEFAULT_PHASE_PRESETS` in
      fulfillment/src/server/presets.ts to reflect the actual plugin
      lifecycle — Discovery=[website-editor], Design=[website-editor],
      Development=[website-editor, ecommerce], Onboarding=[+memberships],
      Live=[+affiliates], Churned=[]. Added soft-fail in
      TransitionService.advancePhase + ClientLifecycleService.createWithPhase:
      when runtime returns "not found"/"not in registry"/"not registered"
      error, the install is SKIPPED (WARN activity entry +
      `phase.preset_plugin_skipped` event), phase still advances.
      AdvancePhaseResult gains `skipped: { pluginId, error }[]`;
      installs[i] gains optional `skipped:true`. Real registry-side
      errors (auth/scope/dep) still hard-fail. Lifecycle smoke
      extended with R7 describe-block: catalogue assertion + soft-fail
      walkthrough (REGISTRY=[website-editor, ecommerce] only; onboarding
      hop skips memberships, live hop skips memberships+affiliates).
      11/11 smoke (9 original + 2 R7).
      Goal B: `@aqua/plugin-agency-marketing` at
      `04 the final portal/plugins/agency-marketing/`.
      `scopePolicy: "agency"`, `core: false`. Domain Campaign (state
      machine draft→scheduled→running→paused/completed→archived,
      budget+goal+result rollup), Lead (funnel new→contacted→qualified
      →converted/unqualified/lost with re-engage paths, append-only
      contactHistory, secondary indexes by email/campaign/staff),
      EmailTemplate (3 seeded defaults Welcome/Re-engagement/Newsletter,
      `{{placeholder}}` substitution). Four services
      (Campaign/Lead/Template/Report). Six ports. 13 API routes.
      5 admin pages. campaignSnapshot + leadFunnel reports.
      tsc-clean; 8/8 smoke. Foundation pending: workspace dep +
      transpilePackages + side-effect-import + `_registry.ts` append +
      `ActivityCategory` += "marketing" + UserPort projection.
      T2 plugin catalogue now: 7 shipped (fulfillment / ecommerce /
      agency-HR / memberships / affiliates / agency-finance /
      agency-marketing) — full Milesy-internal trio + customer-facing
      trio. See
      `context/prior research/04-plugin-agency-marketing.md`.

## Done — Round 6
- [x] **T1 R6 — Foundation mass plugin wire-up + cross-plugin event
      router** — shipped. After R5 the foundation hosted 3 plugins
      live while T2 had 6 more on disk un-wired. R6 catches up — all
      9 plugins installable end-to-end. 6 file:.. workspace deps + 9
      transpilePackages, 6 new `foundation-adapters/<plugin>Foundation.ts`
      side-effect-imports, `_registry.ts` append for all 6 manifests.
      Shared `_foundationPorts.ts` (tenant/activity/events/pluginInstalls
      /user) + `_crossPluginPorts.ts` (ecommerceOrders projections +
      membershipBenefits) keep per-plugin adapters small. `ActivityCategory`
      += hr/memberships/affiliates/finance/marketing/crm. Each
      `register*Foundation` call uses `as unknown as Parameters<...>` to
      bridge plugin-vendored ActivityCategory drift. **Cross-plugin
      event router**: `eventBus.subscribeForPlugin(pluginId, eventName,
      handler)` with tenant-filtered fan-out (only fires for plugins
      installed in the emit's scope). `_eventSubscribers.ts` wires
      affiliates ← `order.created`, client-crm ← order.created /
      affiliate.attribution_recorded / membership.subscription_*. R6
      also widens `_validate.ts` (categories + panel ids) and adds a
      "discovered panels" render path in `sidebarLayout.ts` so
      future plugins ship new panel ids without a foundation patch.
      `membershipsFoundation.stripeFor` returns a NOOP StripePort so
      memberships's containerFor builds in dev (paid flows throw
      clearly; real Stripe SDK adapter is foundation-pending).
      `seedDemoAgency` extended to install 5 client-side
      (website-editor → ecommerce → memberships → affiliates →
      client-crm) + 3 agency-side (agency-hr / agency-finance /
      agency-marketing) for a 9-plugin demo. `scripts/smoke.mjs`
      35/35 pass: /demo cold + 9 install entries + 11 nav URLs 200 +
      6 API surfaces 200 + full POV cycle. tsc + build clean. See
      `context/prior research/04-foundation-round6.md`.
- [x] **T2 R6 — Agency-finance plugin + ecommerce affiliates wiring**
      — shipped.
      Goal A (commit `db60015`): closes the affiliates attribution
      loop. ecommerce now persists `referralCodeId` on `ServerOrder`,
      reads `metadata.referralCodeId` + `metadata.endCustomerUserId`
      from Stripe sessions, and emits `order.created` exactly once
      with full payload (orderId, clientId, amountTotal, currency,
      subtotal=amountTotal+discountAmount, referralCodeId,
      endCustomerUserId, discountSource). `upsertOrderByStripeSession`
      now returns `{ order, isNew }` so the handler can dedupe across
      Stripe webhook retries. New ecommerce smoke at
      `src/__smoke__/order-created-event.test.ts`, 5/5 pass.
      Goal B: `@aqua/plugin-agency-finance` at
      `04 the final portal/plugins/agency-finance/`.
      `scopePolicy: "agency"`, `core: false`. Domain Invoice (per-year
      sequence INV-YYYY-NNNN, state machine draft→sent→paid/overdue/
      void/refunded with markPaid as the sole path into paid),
      Expense (pending→approved/rejected→reimbursed, secondary indexes
      by category + staff), ExpenseCategory (six seeded defaults).
      Four services (Category/Invoice/Expense/Report). Six ports
      (Storage/Tenant/User/Activity/Events/PluginInstallStore). 15
      API routes. 5 admin pages including InvoiceDetail with
      renderInvoiceHtml output. RevenueSnapshot reports
      trailing-window invoicesIssued/Paid/Overdue, expensesByCategory,
      monthly aggregate, netCents. tsc-clean; 9/9 smoke pass via
      `npm run smoke`. Foundation pending: workspace dep +
      transpilePackages + side-effect-import + `_registry.ts` append +
      `ActivityCategory` += "finance" + UserPort projection (shared
      with memberships/affiliates). T2 plugin catalogue now: 6
      shipped (fulfillment / ecommerce / agency-HR / memberships /
      affiliates / agency-finance). See
      `context/prior research/04-plugin-agency-finance.md`.

## Done — Round 5
- [x] **T3 R5 — Real cross-plugin block renderers** — DONE.
      Phase A: ecommerceBridge upgraded (real localStorage cart with
      cross-tab sync, real ProductVariantPicker swatch UI,
      goToStripeCheckout adapter); OrderSuccess fetches by
      ?session_id, PaymentButton invokes Stripe, DonationButton
      re-pointed at ecommerce, ProductSearch credentials + correct
      URL. Phase B: 6 stub renderers replaced with real fetches:
      MembershipPaywall consults /memberships/me, MembershipSignup
      corrected body shape `{planId, billing}` + 401/404 flows,
      MembershipTierGrid display-only, AffiliateSignup body shape
      `{payoutEmail, displayName}`, AffiliatePayoutMeter rolls up
      attributions + payouts, AffiliateLeaderboard graceful 404.
      NEW FormRenderBlock (renders 11 field kinds from
      /forms/public/form/:id, submits with thank-you/redirect),
      NEW CrmContactFormBlock (delegates to FormRenderBlock when
      formId set, else built-in contact form). RENDERER_REGISTRATIONS
      grew to 66 entries. New cross-plugin smoke (25 tests); total
      67/67 pass. tsc clean. Chapter
      `context/prior research/04-plugin-website-editor-round5.md`,
      MASTER row #40. R6 deferred: server-side cart, Stripe
      Subscription mode for recurring donations, storefront SSR.
      T2 R10 cross-team: /affiliates/leaderboard,
      /client-crm/public/contact endpoints.
- [x] **T1 R5 — End-customer flow** — shipped. Closes the architecture's
      three-level recursion (Agency → Client → End-customer).
      `users.ts` storage key for end-customers becomes
      `email|c:<clientId>` so two clients of the same agency may both
      have a customer named jane@gmail.com; agency/client tier keep
      the legacy plain-email key. `getUser`/`verifyPassword`/
      `setUserPassword`/`updateUser` accept optional `UserLookupScope`.
      New `POST /api/auth/end-customer/signup` with rate limits +
      `signupsEnabled` gate + 409 on duplicate; issues `lk_session_v1`
      with `clientId + role=end-customer`. `/api/auth/login` accepts
      an embed-supplied `clientId` and tries the per-client pool first.
      `Client.endCustomers: ClientEndCustomerConfig` (`signupsEnabled`
      default true, optional `postLoginReturnUrl`).
      `/portal/customer/page.tsx` is variant-driven — looks up the
      website-editor install, calls T3's `getActivePortalVariant` for
      "account" then "login", renders blocks via `<BlockRenderer>`,
      falls back to a welcome card + customer-panel plugin links.
      New `/portal/customer/[...rest]` catch-all + `resolveCustomerPluginPage`
      in the resolver. `PanelId += "customer"`; `buildSidebar` filters
      by `panelId === "customer"` (or `/portal/customer` href) when
      scope is `customer`. Demo seed adds `demo-shopper@aqua.test`;
      `/demo/toggle` cycles agency → client → customer → agency;
      `DemoBanner` shows three POV labels + "Next view → X" button.
      Embed `LoginForm` carries `clientId` + `allowSignup` + signup
      toggle + parent-frame return URL. tsc + build clean. See
      `context/prior research/04-end-customer-flow.md`.
- [x] **T2 R5 — Affiliates plugin + ecommerce↔memberships discount
      integration** — shipped.
      Goal A (ecommerce edit, commit `640d98b`): extended
      `DiscountService` chain with a 5th step keyed on userId — calls
      injected `MembershipBenefitsPort.getDiscountPercentForUser` and
      applies the largest membership discount, persisting
      `order.discountSource: "membership"` + planId snapshot. New
      `DiscountType: "membership"`. `ServerOrder` gains
      discountSource/discountAmount/discountCode/discountSnapshot/
      endCustomerUserId with idempotent webhook-retry preservation.
      Backward-compat: port absent → null. New ecommerce smoke at
      `src/__smoke__/discount-membership.test.ts`, 7/7 pass.
      Goal B: `@aqua/plugin-affiliates` at
      `04 the final portal/plugins/affiliates/`. `scopePolicy: "client"`,
      `requires: ["ecommerce"]`, `core: false`. Domain
      Affiliate/ReferralCode/Attribution/Payout. Four services.
      Six ports including new `EcommerceOrdersPort` (cross-plugin
      order projection — reads `metadata.referralCodeId` until
      ecommerce ships first-class field). 16 API routes, 6 admin
      pages + 1 customer page. 3 storefront block ids. Heavy use of
      secondary indexes for O(1) lookups. tsc-clean; 9/9 smoke pass.
      Foundation pending: workspace dep + transpilePackages +
      side-effect-import + `_registry.ts` append +
      `ActivityCategory` += "affiliates" + UserPort projection (shared
      with memberships) + ecommerceOrders adapter + cross-plugin
      event subscription routing ecommerce `order.created` →
      affiliates `attributions/record`. See
      `context/prior research/04-plugin-affiliates.md`.

## Done — Round 4
- [x] **T3 R4 — SitesPage + PageDetailPage + customPages backend** —
      DONE. Goal A: 3,264-LOC SitesPage faithful port with new libs
      (`sitesAdmin`, `portalSettings`, `themeVariants` rebuilt,
      `portalEditMode`, `domains` Vercel stub). Goal B: faithful port
      of 02's `customPages.ts` (9 typed block kinds, full CRUD,
      onCustomPagesChange listener). Goal C: 269-LOC PageDetailPage
      faithful port consuming customPages — title/slug/nav inputs +
      per-block editors + SEO panel (title/description/OG/canonical/
      robots/JSON-LD) + publish/duplicate/delete + sticky footer;
      RichEditor stub at `components/RichEditor.tsx`. After R4 the
      website-editor admin surface is parity-with-02. tsc clean;
      smoke 40/40 unchanged. Chapter
      `context/prior research/04-plugin-website-editor-round4.md`,
      MASTER row #37. R5 deferred: server-side persistence for
      sitesAdmin/customPages/customise/loginCustomisation; Vercel
      domain proxy; portal-settings persistence; real RichEditor host.
- [x] **T2 R4 — Memberships plugin** — shipped.
      `@aqua/plugin-memberships` at `04 the final portal/plugins/memberships/`.
      `scopePolicy: "client"`, `requires: ["ecommerce"]`, `core: false`.
      Domain: Plan + Benefit + Subscription. Four services
      (PlanService / BenefitService / SubscriptionService / WebhookService).
      Seven ports — including new StripePort (decoupled from ecommerce
      per the prompt's preferred default; 13 methods covering customer +
      subscription + checkout + billing-portal + price + webhook-verify)
      and new UserPort (resolve EndCustomerProfile from foundation Users).
      16 API routes split admin / customer / public-webhook
      (`public: true` flag for catch-all bypass). 7 admin pages + 1
      customer-facing "My membership" page. 3 storefront block ids
      (membership-paywall / membership-signup / membership-tier-grid —
      T3 owns rendering). `onInstall` seeds Bronze/Silver/Gold defaults
      ($0 / $9.99 / $24.99 monthly + annual variants). tsc-clean
      standalone; 9/9 smoke pass via `npm run smoke`. Foundation pending
      list: workspace dep + transpilePackages + side-effect-import file
      + `_registry.ts` append + `ActivityCategory` += "memberships" +
      UserPort projection + `stripeFor({agencyId, clientId})` reading
      per-install Stripe keys from the ecommerce install + catch-all
      honouring `public: true`. See
      `context/prior research/04-plugin-memberships.md`.
- [x] **T1 R4 — Milesy Media demo button + sign-in wiring** — shipped.
      Static site declares `<meta name="aqua-portal-base">`; an inline
      rewriter retargets `[data-aqua-action="sign-in"|"demo"]` hrefs at
      load (sign-in → `${base}/login`, demo → `${base}/demo`).
      `SessionPayload` gains optional `isDemo` baked into the HMAC
      cookie. New top-level Route Handlers: `GET /demo`
      (seed-then-cookie-then-redirect to `/portal/agency`) +
      `GET /demo/toggle` (POV flip agency-owner ↔ client-owner via the
      Felicia mirror). Seed body factored into
      `src/lib/server/demoSeed.ts`; `resetDemo()` wipes demo agency +
      every descendant before re-seeding; `/api/dev/seed-demo?reset=1`
      gated reset. `DemoBanner` server component injected at
      `/portal/layout.tsx` so POV toggle spans agency + client surfaces.
      Real `/api/auth/login` never sets `isDemo` — banner only renders
      for sandboxed sessions. Footer "Last deployed YYYY-MM-DD" + README
      doc the bump-on-deploy convention. Smoke green: `/demo` cold,
      toggle both directions, `?reset=1` wipes/re-seeds, real auth
      unaffected. tsc + build clean. See
      `context/prior research/04-milesymedia-demo.md`.

## Up next (after Round 4)
- [x] T3 R2: lift website-editor block UIs + admin UIs from `02` —
      DONE. See above (under "Round 2 in flight" → moved to Done).
      Round-3 follow-ups: PageDetailPage (depends on lifting 02's
      `customPages.ts` localStorage block system distinct from
      EditorPage), CustomisePage (898 lines, deps on adminConfig +
      sidebarLayout + loginCustomisation), ThemeDetailPage (1063
      lines), SitesPage (3264 lines — split across multiple sub-loops).
- [ ] T2 follow-up: real Stripe webhook smoke (foundation already routes
      `/api/portal/ecommerce/stripe/webhook` correctly).
- [ ] Build the first phase-preset end-to-end (create client → pick
      Onboarding → fulfillment installs starter plugins → checklist appears
      → both sides tick → advance phase). Foundation runs the preset
      machinery; T2 owns preset definitions.
- [ ] Demo cron — wire a Vercel cron to `GET /api/dev/seed-demo?reset=1`
      at 04:00 UTC nightly (architecture §8) once we're ready.

## Done
- [x] Phase 0 — Prior research. 18 chapters in
      `01 development/context/prior research/`. Indexed in `MASTER.md`.
- [x] Architecture lock-in. `04-architecture.md` chapter covers:
      pool-model multi-tenancy, Aqua-manifest plugins, server-rendered
      chrome, single-cookie auth, phase lifecycle, brand kit per client.
      14 decisions logged.
- [x] Round 1 terminal prompts drafted (T1 / T2 / T3).
- [x] Vercel pinned to deploy only `04 the final portal/milesymedia website/`.
- [x] `eds requirments.md` populated. Drafted by Claude from conversation;
      Ed amends as needed.
