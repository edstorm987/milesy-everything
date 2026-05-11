# Lift Inventory — what's in `02` and `03`, and where it landed

A grep-able audit so nothing from the legacy folders is lost. Each
table row maps a legacy artefact → status (PORTED / PARTIAL /
NOT-PORTED / OBSOLETE) → where it lives in the new portal (or "—"
if not).

**Read-only.** No code in this round; no edits to `02` / `03`. Pure
documentation.

Cross-references use `04-plugin-<id>.md` shorthand for the matching
chapter in `01 development/context/prior research/`.

---

## Goal A — `02 felicias aqua portal work/`

Felicia's pre-rebuild monorepo (Next.js 15 + Tailwind 4 + Prisma).
~600 source files across `src/{app,components,lib,plugins,portal}`.
The 04 portal lifted the architectural shape (plugin runtime + portal
overlay + per-tenant scope) but flattened the in-tree plugins out
into separate `04-the-final-portal/plugins/<id>/` workspaces.

### A.1 — Top-level config + boot

| Path | Purpose | Status | New home |
|---|---|---|---|
| `package.json` / `tsconfig.json` / `next.config.ts` / `tailwind.config.ts` / `postcss.config.mjs` | Next 15 + Tailwind 4 boot config | PORTED | `04-the-final-portal/portal/` (clean rebuild) |
| `eslint.config.mjs` | flat-config eslint | NOT-PORTED | — (04 ships without lint config; CI relies on `tsc --noEmit`) |
| `portal.config.ts` | declarative portal feature toggles | OBSOLETE | replaced by per-install `install.config` (T1 R3 broker) |
| `media-storage/` | local-disk media bucket | PARTIAL | T1 R6 `MediaPort` injects a real provider; legacy disk layout is dev-only fixture |
| `examples/` | reference snippets | NOT-PORTED | — (kept for reference only) |
| `scripts/` | one-off migration + seed scripts | OBSOLETE | T1 ships `scripts/migrate-file-to-postgres.mjs` + `scripts/schema.sql` |

### A.2 — Storefront marketing pages (`src/app/<page>/`)

These live in the felicias.com top-of-funnel. The 04 portal cleanly
separates marketing (milesymedia static site, T1 R8 stitched same-
origin) from operator app (the portal). Most marketing copy is
**not yet ported** — Ed will rebuild in `business-os/` (T4) or revive
selectively from this list.

| Path | Purpose | Status | New home |
|---|---|---|---|
| `app/page.tsx` (root home) | Felicia storefront landing | PARTIAL | T5 R1 luv-and-ker (rebuilt from scratch); T5 R2 compass-coaching (different shape) |
| `app/about/`, `our-story/`, `our-philosophy/`, `the-problem/`, `sustainability/`, `ingredients/`, `lab-tests/`, `faq/` | brand storytelling pages | NOT-PORTED | — (revival list §C) |
| `app/products/`, `app/p/[slug]/`, `app/cart/`, `app/checkout/` | storefront commerce flow | PARTIAL | website-editor block library covers grid + cart + checkout (`04-plugin-website-editor-round5.md`); per-page templates not lifted |
| `app/blog/`, `app/reviews/` | content + UGC | NOT-PORTED | — (deferred to a future content plugin) |
| `app/affiliates/`, `app/refer/`, `app/redeem/` | referral landing pages | PARTIAL | `@aqua/plugin-affiliates` ports the engine; landing pages NOT-PORTED |
| `app/account/`, `app/login/`, `app/felicias-login/` | end-customer auth surface | PORTED | T1 R5 + T1 R9 (`04-foundation-round5-end-customer.md` / `04-foundation-round9-oauth-magic.md`) |
| `app/embed/` | iframe-embed shells | PORTED | T1 R5 + T4 R2 (`04-ux-storefront-perf-pass.md` Phase B) |
| `app/portal/[…]` | iframe-mountable portal surfaces | PORTED | foundation routes under `portal/src/app/portal/` |
| `app/aqua/` | brand-prefix marketing variants | NOT-PORTED | — |
| `app/contact/`, `app/help/`, `app/support-us/`, `app/shipping-returns/`, `app/privacy/` | informational | NOT-PORTED | — (per-client portal copy will replace; see T5 chapters) |
| `app/sitemap.xml` / `robots.txt` | crawl hints | NOT-PORTED | — (per-client portal generates its own) |
| `app/portal/embed.js` / `tag.js` | static embed snippets | PORTED | T1 R5 ships equivalent; legacy snippets OBSOLETE |

### A.3 — Admin surface (`src/app/admin/<area>/`)

61 admin sub-areas in `02`. T3 R2-R4 + T2 R*-R11 ported the operator-
facing subset; the rest are either superseded by per-plugin admin
pages or "not yet ported" (revival list §C).

| Admin area | Purpose | Status | New home |
|---|---|---|---|
| `editor/`, `pages/`, `customise/`, `themes/`, `theme/`, `sites/`, `portals/`, `sections/`, `popup/`, `assets/` | website-editor admin | PORTED | `@aqua/plugin-website-editor` (`04-plugin-website-editor-round{2,3,4}.md`) |
| `products/`, `orders/`, `subscriptions/`, `inventory/`, `shipping/`, `collections/` | ecommerce admin | PORTED | `@aqua/plugin-ecommerce` (`04-plugin-ecommerce.md`) |
| `memberships/` (+`tiers/`, `members/`) | memberships admin | PORTED | `@aqua/plugin-memberships` (`04-plugin-memberships.md`) |
| `affiliates/` (+`payouts/`, `stats/`) | affiliates admin | PORTED | `@aqua/plugin-affiliates` (`04-plugin-affiliates.md`) |
| `crm/` (+`tasks/`, `contacts/`, `deals/`) | client CRM | PARTIAL | `@aqua/plugin-client-crm` ships contacts + segments + activity (`04-plugin-client-crm.md`); deals/tasks NOT-PORTED |
| `marketing/`, `automation/` (+`runs/`), `email/` | marketing automation | PARTIAL | `@aqua/plugin-agency-marketing` covers campaigns/leads/templates (`04-plugin-agency-marketing.md`); automation runs NOT-PORTED |
| `forms/` | form builder | PORTED | `@aqua/plugin-forms` (`04-plugin-forms.md`) |
| `donations/` (+`donors/`, `goals/`) | donation campaigns | PARTIAL | ecommerce ships donation-button block; donors/goals admin NOT-PORTED |
| `team/`, `orgs/`, `customers/[email]/`, `billing/`, `notifications/preferences/` | tenancy + comms admin | PORTED | foundation chrome + T2 R1-R3 (`04-foundation-round{2,3,4}-tenancy.md` etc) |
| `settings/`, `portal-settings/` (+`plugin-authoring/`), `features/`, `marketplace/`, `plugin-health/` | platform admin | PARTIAL | T1 R3 plugin runtime + T2 R7 phase presets (`04-plugin-fulfillment.md`); plugin-authoring + marketplace NOT-PORTED (revival §C) |
| `analytics/`, `dashboards/`, `auditlog/`, `activity/`, `compliance/` | observability | PARTIAL | T6 R3 `@aqua/plugin-ops` covers ops dashboards (`04-cicd-and-monitoring.md`); auditlog/compliance NOT-PORTED |
| `reservations/` (+`calendar/`, `resources/`, `staff/`, `external/`, `services/`) | bookings | NOT-PORTED | — (revival §C) |
| `wiki/` (+`history/`), `kb/` (+`categories/`), `forum/` (+`categories/`, `moderation/`), `blog/[id]/`, `support/[id]/`, `livechat/` (+`canned/`), `reviews/`, `reviews-v2/`, `tooltips/`, `help/`, `tab/[id]/` | content + support tooling | NOT-PORTED | — (revival §C — substantial surface area) |
| `i18n/` (+`locales/`), `seo/`, `webhooks/` (+`log/`), `repo/`, `backups/` (+`restore/`) | platform plumbing | PARTIAL | T6 R3 backups (`scripts/backup-postgres.mjs`); seo/i18n/webhooks NOT-PORTED |
| `split-tests/`, `split-test/`, `site-test/`, `funnels/` | experiments + funnels | PARTIAL | website-editor ships funnels (`04-plugin-website-editor-round2.md` Phase D); split-tests NOT-PORTED |

### A.4 — In-tree plugins (`src/plugins/<id>/`)

`02` ran plugins in-tree as Next route segments + lib imports; `04`
flattened each into a workspace package at
`04-the-final-portal/plugins/<id>/` with its own `package.json` + ports.

| Legacy plugin | Status | New plugin |
|---|---|---|
| `affiliates/` | PORTED | `@aqua/plugin-affiliates` |
| `analytics/` | NOT-PORTED | — (deferred; T6 R3 ops dashboard covers operator view) |
| `auditlog/` | NOT-PORTED | — |
| `auditor/` | NOT-PORTED | — |
| `automation/` | PARTIAL | covered by agency-marketing campaigns |
| `backups/` | PORTED | T6 R3 `scripts/backup-postgres.mjs` |
| `blog/` | NOT-PORTED | — |
| `brand/` | PORTED | website-editor brand-kit (Customise) |
| `chatbot/` | NOT-PORTED | — |
| `compliance/` | NOT-PORTED | — |
| `crm/` | PORTED | `@aqua/plugin-client-crm` |
| `donations/` | PARTIAL | ecommerce donation-button block; admin NOT-PORTED |
| `ecommerce/` | PORTED | `@aqua/plugin-ecommerce` |
| `email/` | PORTED | `@aqua/plugin-email-sender` |
| `forms/` | PORTED | `@aqua/plugin-forms` |
| `forum/` | NOT-PORTED | — |
| `funnels/` | PORTED | website-editor funnels |
| `i18n/` | NOT-PORTED | — |
| `inventory/` | PARTIAL | folded into ecommerce |
| `knowledgebase/` | NOT-PORTED | — |
| `livechat/` | NOT-PORTED | — |
| `memberships/` | PORTED | `@aqua/plugin-memberships` |
| `notifications/` | NOT-PORTED | — (foundation toasts cover in-app; channels deferred) |
| `repo/` | PORTED | T3 R6 GitOpsPort + T6 R1 deploy + T6 R3 ops |
| `reservations/` | NOT-PORTED | — (revival §C) |
| `reviews/` | NOT-PORTED | — |
| `search/` | NOT-PORTED | — |
| `seo/` | NOT-PORTED | — |
| `social/` | NOT-PORTED | — |
| `subscriptions/` | PORTED | folded into memberships + ecommerce subscription mode |
| `support/` | NOT-PORTED | — |
| `webhooks/` | NOT-PORTED | — |
| `website/` | PORTED | `@aqua/plugin-website-editor` |
| `wiki/` | NOT-PORTED | — |
| `_pathMapping.ts` / `_presets.ts` / `_registry.ts` / `_runtime.ts` / `_types.ts` / `_validate.ts` | plugin-system internals | PORTED | T1 R3 plugin runtime + T2 R7 presets |

### A.5 — Components (`src/components/`)

41 top-level component files + `admin/`, `aqua/`, `editor/` subdirs.

| Component | Purpose | Status | New home |
|---|---|---|---|
| `Navbar.tsx`, `Footer.tsx`, `Hero.tsx`, `HomeSections.tsx`, `FeaturedProducts.tsx`, `IngredientGrid.tsx`, `InfoPage.tsx`, `InfoPageHeader.tsx` | storefront chrome | PARTIAL | T5 R1/R2 per-client portals rebuild from scratch with brand kit |
| `CartDrawer.tsx`, `GiftCardPurchaseForm.tsx` | commerce widgets | PARTIAL | website-editor cart blocks (R5); gift cards NOT-PORTED |
| `Navbar.tsx` admin / `AdminThemeInjector.tsx` / `AdminModeSwitcher.tsx` / `ImpersonationBar.tsx` / `PreviewBar.tsx` | admin chrome | PORTED | foundation chrome (T1 R2/R4) + T4 R1 polish |
| `ChatBot.tsx`, `ChatBotLazy.tsx` | LLM widget | NOT-PORTED | — (revival §C) |
| `CookiePreferencesModal.tsx`, `DiscountPopup.tsx` | consent + popups | PARTIAL | website-editor popup admin lifted; consent NOT-PORTED |
| `EmbeddedPortal.tsx`, `PortalEditOverlay.tsx`, `PortalPageRenderer.tsx`, `PortalTagInjector.tsx` | portal overlay system | PORTED | website-editor (`04-plugin-website-editor.md`) |
| `Hero.tsx`, `FeaturedProducts.tsx`, all storefront blocks | storefront widgets | PORTED | website-editor block library (58 blocks; `04-plugin-website-editor-round2.md`) |
| `ABTestRunner.tsx` | client-side A/B harness | NOT-PORTED | — |
| `AnalyticsResolver.tsx`, `AnalyticsTracker.tsx` | client analytics | NOT-PORTED | — |
| `FeatureGate.tsx` | feature-flag wrapper | PARTIAL | T1 R3 plugin features manifest covers most cases |
| `ForcePasswordChange.tsx` | password-reset modal | NOT-PORTED | — (T1 R10 candidate per `04-foundation-round9-oauth-magic.md` deferrals) |
| `aqua/*` subdir | Aqua-branded components | NOT-PORTED | — (Felicia branding, retired) |
| `admin/*` subdir | shared admin widgets | PORTED | foundation `portal/src/components/ui/` (T4 R1) |
| `editor/*` subdir | editor-specific widgets | PORTED | `@aqua/plugin-website-editor/src/components/editor/` |

### A.6 — Lib (`src/lib/`)

| File / dir | Purpose | Status | New home |
|---|---|---|---|
| `auth.ts`, `consent.ts` | session + cookie helpers | PORTED | `portal/src/lib/server/session.ts` (T1 R1) |
| `discounts.ts`, `giftCards.ts`, `referralCodes.ts` | commerce promo helpers | PARTIAL | discounts/codes folded into ecommerce checkout; gift cards NOT-PORTED |
| `ingredients.ts`, `products.ts`, `variants.ts`, `reviews.ts` | product domain helpers | PORTED | `@aqua/plugin-ecommerce` |
| `portalCache.ts`, `portalEditMode.ts`, `useContent.ts` | portal overlay helpers | PORTED | website-editor (`portalEditMode.ts` lifted in R4) |
| `seoScore.ts` | content SEO scoring | NOT-PORTED | — |
| `s3/` | S3 client wrapper | PARTIAL | T1 R6 MediaPort can wrap S3; current default is local disk |
| `stripe/` | Stripe SDK wrapper | PORTED | `@aqua/plugin-ecommerce` server (per-install Stripe key) |
| `vercel/server.ts` | Vercel API client | PORTED | T6 R1 `@aqua/plugin-domains` + T6 R2 foundation `vercelDomain.impl.ts` |
| `shopify.ts`, `shopifyCustomer.ts` | Shopify storefront client | OBSOLETE | architecture moved to first-party stripe checkout |
| `admin/sites.ts`, `admin/customPages.ts`, etc. | admin-side CRUD helpers | PORTED | website-editor `src/lib/{sitesAdmin,customPages,portalSettings,…}.ts` |
| `server/*` | server-only utilities | PORTED | foundation `portal/src/lib/server/` |

### A.7 — `src/portal/` runtime

Already PORTED by T1 R1-R5 + T3 R1-R6 — this directory was the seed
for the entire 04 portal architecture. See `04-architecture.md` §3-4
+ `04-plugin-website-editor.md` for the lift trail.

### A.8 — API routes (`src/app/api/`)

72 route directories under `api/portal/*` + `api/auth` + `api/admin` +
`api/donations` + `api/og` + `api/stripe`.

| Namespace | Status | New home |
|---|---|---|
| `api/auth/` | PORTED | foundation routes (`portal/src/app/api/auth/`) + T1 R9 magic + OAuth |
| `api/portal/products/`, `cart/`, `orders/`, `subscriptions/` | PORTED | `@aqua/plugin-ecommerce` |
| `api/portal/memberships/`, `affiliates/`, `donations/` | PORTED | matching plugins |
| `api/portal/forms/`, `crm/`, `kb/`, `wiki/`, `forum/`, `support/`, `chatbot/`, `livechat/`, `reviews/` | PARTIAL | forms+crm PORTED; rest NOT-PORTED |
| `api/portal/dashboard/`, `analytics/`, `audit/`, `compliance/`, `activity/` | PARTIAL | T6 R3 ops covers operator dashboards; rest NOT-PORTED |
| `api/portal/plugins/`, `migrate/`, `schema/`, `health/`, `heartbeat/`, `heartbeats/`, `discoveries/`, `promote/`, `inject-tag/` | PORTED | T1 plugin runtime + T6 R3 `/healthz` |
| `api/portal/settings/`, `config/`, `domains/`, `links/`, `orgs/`, `search/` | PORTED | foundation chrome + plugin runtime |
| `api/portal/example/` | OBSOLETE | scaffold reference |
| `api/portal/reservations/`, `webhooks/`, `i18n/`, `seo/` | NOT-PORTED | — |
| `api/donations/`, `api/og/`, `api/stripe/` | PARTIAL | folded into ecommerce |
| `api/admin/*` | OBSOLETE | architecture flipped — admin uses same `/api/portal/*` namespace under role guards |

### A.9 — Public assets (`public/`)

| Folder | Status | New home |
|---|---|---|
| `public/images/` | PARTIAL | per-client portals carry their own `public/`; legacy Felicia images NOT-PORTED |
| `public/fonts/` | NOT-PORTED | — (per-client portals load from Google Fonts or self-host as needed) |

---

## Goal B — `03 old portal/old-portal-github/`

The previous-generation Aqua Portal v9 — Next.js + Prisma 7-app
monorepo. Already covered by six dedicated chapters; this section is
a single index to those.

| Sub-area | Coverage chapter | Status |
|---|---|---|
| Overview / shape | `old-portal-overview.md` | OBSOLETE (architectural reference; no direct port) |
| Host shell | `old-portal-host-shell.md` | OBSOLETE (replaced by single Next.js portal in `04`) |
| Sub-apps (6 business apps) | `old-portal-suites.md` | PARTIAL (concepts redistributed across T2 plugins) |
| Roles + tenancy | `old-portal-roles-tenancy.md` | PORTED (`04-architecture.md` §5; T1 R3 broker) |
| Bridge package | `old-portal-bridge.md` | OBSOLETE (replaced by per-plugin ports) |
| Extras (3 reference impls) | `old-portal-extras.md` | NOT-PORTED (kept as reference siblings) |

`03/old-portal-github/.github/workflows/` CI patterns informed T6 R3
GitHub Actions (`04-cicd-and-monitoring.md`).

---

## Goal C — Worth coming back for (prioritised revival list)

Distilled from the NOT-PORTED rows above. Each entry: legacy location,
rough effort, why it might matter. Ordered by Ed-likelihood-to-care.

### Tier 1 — already on the v1-future list

1. **Reservations / bookings** — `02/src/plugins/reservations/` +
   `02/src/app/admin/reservations/{calendar,resources,staff,external,services}/`.
   Effort: large (1 plugin round, ~1500 LOC). Why: agency clients in
   service businesses (Compass Coaching's PT pipeline; future spa /
   salon clients) will want this. Domain shape already exists; just
   needs the lift.
2. **Knowledge base + wiki** — `02/src/plugins/{knowledgebase,wiki}/` +
   `02/src/app/admin/{kb,wiki}/`. Effort: medium (~1 plugin round).
   Why: per-client docs / SOPs surface — agency-side ops manuals.
3. **Plugin marketplace + plugin-authoring** —
   `02/src/app/admin/{marketplace,portal-settings/plugin-authoring}/`.
   Effort: large (governance + signing flows). Why: third-party
   plugin ecosystem is in `eds requirments.md`.
4. **Forum + livechat + support tickets** — `02/src/plugins/{forum,
   livechat,support}/` + matching admin areas. Effort: each medium;
   bundle as one "community" plugin round. Why: end-customer engagement
   surface beyond CRM contacts.

### Tier 2 — enhancement to existing surfaces

5. **CRM deals + tasks** — `02/src/app/admin/crm/{deals,tasks}/`.
   Effort: small (extend client-crm plugin). Why: agency sales
   pipeline; Felicia explicitly asked.
6. **Reviews / UGC** — `02/src/plugins/reviews/` + `02/src/app/admin/
   reviews-v2/` + `02/src/app/reviews/`. Effort: medium. Why: storefront
   social proof; integrates with ecommerce blocks.
7. **i18n / locales** — `02/src/plugins/i18n/` +
   `02/src/app/admin/i18n/locales/`. Effort: medium. Why: multi-language
   per-client portals.
8. **SEO + sitemap admin** — `02/src/plugins/seo/` +
   `02/src/app/admin/seo/` + `02/src/app/sitemap.xml/`. Effort: small
   per-portal; large platform-wide. Why: marketing parity.
9. **Webhooks admin + log** — `02/src/app/admin/webhooks/{,log}/`.
   Effort: small. Why: per-install outbound integration plumbing.
10. **Compliance + audit log** — `02/src/app/admin/{compliance,
    auditlog}/` + `02/src/plugins/{compliance,auditlog,auditor}/`.
    Effort: medium. Why: enterprise / regulated agency clients.

### Tier 3 — content + brand surfaces

11. **Blog admin + storefront** — `02/src/app/admin/blog/[id]/` +
    `02/src/app/blog/`. Effort: small (extend website-editor).
12. **Storefront brand pages** — `about / our-story / our-philosophy /
    sustainability / ingredients / lab-tests / faq / contact /
    privacy / shipping-returns`. Effort: per-client (operator copy).
    Don't lift the Felicia copy — the *templates* are worth lifting
    as starter-block sets in website-editor.
13. **Cookie consent modal** — `02/src/components/CookiePreferencesModal.tsx`.
    Effort: tiny. Why: GDPR baseline missing in 04.
14. **Force-password-change modal** — `02/src/components/ForcePasswordChange.tsx`.
    Effort: tiny. Why: T1 R9 deferrals list it as R10.

### Tier 4 — likely-obsolete-but-noted

15. **ChatBot widget** — `02/src/components/ChatBot{,Lazy}.tsx` +
    `02/src/plugins/chatbot/`. The `@aqua/plugin-ai-builder`
    (R7-R9) covers the operator-facing AI surface; if we want
    end-customer chat, it's a from-scratch plugin, not a lift.
16. **A/B testing** — `02/src/components/ABTestRunner.tsx` + admin
    `split-tests/` + `split-test/`. Effort: medium. Why: marketing
    teams ask for it. Could fold into website-editor as a per-block
    variant toggle.
17. **Automation runs** — `02/src/app/admin/automation/runs/`. Most
    of this folded into agency-marketing campaigns; the runs log is
    the only piece NOT-PORTED. Effort: small if revived as a tab on
    campaigns.
18. **Funnel split-test variants** — already in scope for website-
    editor R10 polish; no new plugin needed.
19. **Notifications channels** — `02/src/plugins/notifications/`. T1
    R5 magic-link + email-sender cover transactional; in-app push +
    Slack / Teams channels NOT-PORTED. Effort: medium per channel.

### What we did NOT lose

The 04 portal port covered the load-bearing 80%: foundation auth +
plugin runtime, the 6 customer-facing plugins (ecommerce / memberships
/ affiliates / forms / client-crm / website-editor), the 3 agency-
internal plugins (HR / finance / marketing), portal-export + ai-builder
+ ops + domains. The architectural move from monolith → plugin
mesh is irreversible — anything in the §C list above can be revived
as its own plugin round without touching the foundation.

---

## Cross-references

- Architecture: `04-architecture.md`
- Foundation rounds: `04-foundation-round{1..9}*.md`
- Plugin chapters: `04-plugin-{ecommerce,memberships,affiliates,
  fulfillment,agency-marketing,agency-finance,agency-hr,client-crm,
  forms,email-sender,portal-export,domains,website-editor,ai-builder}.md`
- Per-client portals: `04-client-portal-{luv-and-ker,second}.md`
- Deployment + CI: `04-deployment-domains-{observability,round2}.md`
  + `04-cicd-and-monitoring.md`
- UX + a11y: `04-ux-{audit,accessibility-pass,storefront-perf-pass}.md`
- Legacy `03/` chapters: `old-portal-{overview,host-shell,suites,
  roles-tenancy,bridge,extras}.md`

This chapter is the single index Ed can `ctrl-F` when something
feels missing. If it's NOT-PORTED here, it's parked, not lost.
