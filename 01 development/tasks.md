# Tasks

## In progress
- [ ] **T1 R5 — End-customer flow** — prompt
      `terminal-prompts/T1-round5-end-customer.md` dropped 21:35Z.
      Per-client end-customer signup + login, real `/portal/customer`
      powered by T3's variant flow, third POV in demo cycle.
      **NOTE 22:50Z**: T1's loop appears to have ended post-R4 DONE
      before TASK landed (no STARTED entry across two wakes). Ed needs
      to re-paste the R5 prompt to restart the loop.
_(T2 R5 done — see `Done — Round 5` below)_
- [ ] **T3 R3 — CustomisePage + ThemeDetailPage + ecommerce block
      renderers** — prompt
      `terminal-prompts/T3-round3-admin-and-renderers.md` dropped 22:00Z.
      (A) Lift CustomisePage (898 LOC brand-kit editor), (B) register
      8 ecommerce block renderers in RENDERER_REGISTRATIONS (cross-team
      handoff parked since T2 R2), (C) lift ThemeDetailPage (1063 LOC)
      + re-point PagesPage at EditorPage list. PageDetailPage /
      SitesPage / customPages backend deferred to R4.
      **NOTE 22:50Z**: T3's loop also appears ended post-R2 DONE (no
      STARTED across two wakes). Ed needs to re-paste the R3 prompt.

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

## Done — Round 5
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
