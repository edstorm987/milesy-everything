/loop

# T3 — Round 3: CustomisePage + ThemeDetailPage + ecommerce block renderers

Round 2 you delivered the heavy lift — all four phases (A/B/C/D) shipped:
58 real block components, the 1429-LOC EditorPage with three modes + three
complexity tiers, the 444-LOC PortalsPage, and Sections/Assets/Popups/Themes
admin pages. Smoke green throughout. Round 3 closes two outstanding gaps:
(1) the two biggest still-deferred admin pages (CustomisePage =
brand-kit editor, ThemeDetailPage), and (2) the cross-team handoff that's
been parked since T2 R2 — registering React renderers for ecommerce's
8 contributed block ids so the storefront actually renders them.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. After each commit: `git pull --rebase --autostash && git push`.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-3/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-3/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-plugin-website-editor.md` — your R1 chapter
3. `01 development/context/prior research/04-plugin-website-editor-round2.md` — your R2 chapter (deferred list lives here)
4. `01 development/context/prior research/04-plugin-ecommerce.md` — T2's manifest contributes the 8 block ids; renderer registration contract lives here
5. `01 development/context/prior research/04-foundation-round3.md` — T1's wire-up; understand how block renderers reach the storefront
6. Source: `02 felicias aqua portal work/src/app/admin/customise/page.tsx` (898 lines) and `02 felicias aqua portal work/src/app/admin/themes/[id]/page.tsx` (1063 lines)
7. Source: `02 felicias aqua portal work/src/components/editor/blocks/{ProductCardBlock,ProductGridBlock,CartSummaryBlock,CheckoutSummaryBlock,PaymentButtonBlock,OrderSuccessBlock,VariantPickerBlock,ProductSearchBlock,DonationButtonBlock}.tsx` — the 8 (actually 9 — donation-button is contributed too) ecommerce blocks; you already lifted these as block components in R2 Phase A. Goal B wires them into the registry as **renderer registrations** the foundation can resolve at request time.

## Scope — three goals

### Goal A: Lift `CustomisePage` (brand-kit editor)

Replace `src/pages/CustomisePage.tsx` with a faithful port of
`02/src/app/admin/customise/page.tsx`. Brand kit editor — logo, primary /
secondary / accent colours, fonts (heading + body), border radius, custom
CSS, login-customisation tab. Per-client (writes through plugin storage
under `t/{agencyId}/{clientId}/customise`).

Dependencies you'll need:
- 02 imports `@/lib/admin/adminConfig` — your equivalent is the foundation
  brandKit on the client record. Proxy via a new
  `lib/customise.ts` shim that reads/writes the brand kit through the
  foundation's TenantPort (already exposed via `PluginCtx.services.tenants`
  in your manifest's PluginPageProps shape).
- 02 imports `@/components/admin/sidebarLayout` — the chrome belongs to T1,
  not your plugin. Skip the sidebar import; your CustomisePage is rendered
  inside T1's layout at request time. Drop the wrapper, render only the
  page body.
- 02 imports `@/lib/admin/loginCustomisation` — port to a new
  `lib/loginCustomisation.ts` shim under your plugin, namespaced under
  `t/{agencyId}/{clientId}/login-customisation`. Localstorage-cached,
  same pattern as `lib/sites.ts` you wrote in R2.

Round-3 follow-up flagged in chapter if surfaces: T1's TenantPort may not
expose a brand-kit setter route — if so, add a new
`PATCH /api/portal/website-editor/customise` handler in your plugin that
proxies to T1's `tenants.updateClientBrand({ clientId, brand })` (T1
will need to expose this). Log Q-ASSUMED if it's missing.

### Goal B: Register ecommerce block renderers in your registry

T2's `@aqua/plugin-ecommerce` manifest declares 8 (or 9, including
donation-button) `BlockDescriptor` entries with `requiresPlugin: 'ecommerce'`
but **no renderer** — rendering is delegated to your plugin per the
architecture decision in T2 R2.

You already lifted the React components in R2 Phase A under
`src/components/blocks/*.tsx`. They're in `BLOCK_REGISTRY` because they
were lifted alongside the rest, but the storefront resolver currently
treats them as best-effort (the manifest entry from ecommerce side
doesn't carry a Component reference).

Wire it up:
1. In `src/components/blockRegistry.ts`, add a `RENDERER_REGISTRATIONS:
   Record<BlockType, BlockComponentType>` map keyed by block id, exported
   alongside the existing registry. The 8 (+1) ecommerce ids are
   `product-card`, `product-grid`, `cart-summary`, `checkout-summary`,
   `payment-button`, `order-success`, `variant-picker`, `product-search`,
   `donation-button`.
2. Export a `registerExternalBlockRenderers(plugins: AquaPlugin[])` helper
   that, given a list of installed plugin manifests, validates each
   `requiresPlugin` block id has a renderer in `RENDERER_REGISTRATIONS`
   and logs a clear console warning for any missing one. Call it from
   `BlockRenderer` on first paint (or from your plugin's runtime init —
   whichever fits your existing architecture).
3. Update your storefront `BlockRenderer` to consult
   `RENDERER_REGISTRATIONS` before falling back to `BLOCK_REGISTRY` when
   the block type is from an external plugin.
4. Document the contract in `04-plugin-website-editor-round3.md` (or
   extend the R2 chapter) so future plugins know how to plug in.

If T2 R4 (memberships plugin) ships during this round, also pre-register
its 3 block ids (`membership-paywall`, `membership-signup`,
`membership-tier-grid`) — T2's R4 prompt explicitly delegates rendering
to you. If T2 R4 hasn't shipped yet, log a `Q-ASSUMED` deferring to
your R4.

### Goal C: Lift `ThemeDetailPage` + re-point `PagesPage`

`ThemeDetailPage`: replace your R1 stub with a faithful port of
`02/src/app/admin/themes/[id]/page.tsx` (1063 lines) — token editor
(primary/surface/surfaceAlt/ink/inkSoft/border/shadow/fontHeading/fontBody/
fontMono/radius/spacingUnit/customCss), preview pane, save/duplicate/delete.
Wires through your existing `lib/theme.ts` (you rewrote it in R2 Phase D
to mirror 02's contract).

`PagesPage`: your R1 stub currently shows nothing useful. Re-point it at
the EditorPage list — list pages from your existing `lib/editorPages.ts`
(`listPages(siteId)`), show inline edit / duplicate / delete actions,
"Open in editor" button that navigates to your EditorPage. Don't yet lift
02's `customPages.ts` backend — that's a separate localStorage block
system distinct from EditorPage; defer to R4 with a clear note.

## NOT in scope

- Don't touch foundation (T1 owns).
- Don't touch fulfillment / ecommerce / memberships / agency-HR plugin source.
  If you find ecommerce's Component imports need to be pulled into your
  registry, lift them via your existing `src/components/blocks/*.tsx`
  copies — DON'T import directly from `@aqua/plugin-ecommerce` at runtime.
- Don't lift `PageDetailPage` — it depends on 02's `customPages.ts` library
  which is a separate localStorage block system. Defer to R4 once the spec
  is clarified (probably becomes a separate "page-builder" plugin).
- Don't lift `SitesPage` (3264 lines) — too large for one round. R4 candidate.
- Don't modify `04-architecture.md` (locked).

## Loop discipline

Each cycle: pull → read inbox + outbox → continue → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end.

## When done

For each goal independently:

A. CustomisePage faithful port + lib/customise.ts + lib/loginCustomisation.ts
   shims, tsc clean, smoke unaffected.

B. Ecommerce block renderers wired into RENDERER_REGISTRATIONS,
   registerExternalBlockRenderers helper documented, BlockRenderer
   consults it. (Memberships blocks pre-registered if T2 R4 has shipped
   by then; otherwise note for R4.)

C. ThemeDetailPage faithful port + PagesPage re-pointed at EditorPage
   list, tsc clean, smoke 31/31 pass (or higher if you add new tests).

All three →
- Chapter `04-plugin-website-editor-round3.md` documenting what landed,
  the new renderer-registration contract, and remaining R4 deferrals
  (PageDetailPage / SitesPage / customPages backend).
- MASTER row.
- `tasks.md` row done.
- Final `DONE` + `COMMIT`.
