# T1 R019 — End-customer portal (third audience, recursion close)

Closes the third-audience loop from `eds requirments.md` §3 (agencies / clients / end-customers) + §6 recursion. T3 R013 builds the iframe shell + T1 R016 ships the `/embed/<slug>/<variant>` foundation route — this round adds the actual `/portal/customer` surface that those iframes display.

## What was already shipped

- `/portal/customer/page.tsx` — variant-driven home with branded welcome + plugin-link aggregation. Resolves website-editor install → `getActivePortalVariant({role:"account"})` with login-variant fallback (R5 lift); renders blocks via T3 `<BlockRenderer>`. Customer-panel plugin links (`panelId:"customer"` or `href:/portal/customer/...`) collected, role-gated, sorted.
- `/portal/customer/[...rest]/page.tsx` — catch-all that resolves plugin pages via `resolveCustomerPluginPage` and renders them with R007 effective-role gating.
- `/portal/customer/layout.tsx` — Sidebar + Topbar + ThemeInjector (client brand, not agency).

So Goals A + B were materially shipped before R019. This round closes the two remaining gaps.

## Goals shipped this round

### Goal C — foundation sub-route stubs

NEW pages at `/portal/customer/{orders,account,bookings,membership,affiliate}/page.tsx`. Each delegates to a shared helper.

**Shared helper** — `src/app/portal/customer/_subroute.tsx::CustomerSubroute({cfg})`:

1. `requireRole("end-customer")` + `session.clientId` guard (else fallback card).
2. `getInstall({agencyId, clientId}, cfg.pluginId)`.
3. **Enabled + has `redirectTo`** → `redirect(cfg.redirectTo)`.
4. **Enabled + no redirect** → "configured but not yet exposing customer surface" friendly card (used by orders + bookings — ecommerce + bookings plugins only ship agency-side panels today).
5. **Missing/disabled** → "not enabled — ask your provider" friendly card.

**Mapping**:

| Sub-route | pluginId | Behaviour when enabled |
| --- | --- | --- |
| `/orders` | `ecommerce` | "coming soon" card (no customer surface yet) |
| `/account` | `client-crm` | redirect → `/portal/customer/profile` (canonical plugin route) |
| `/bookings` | `bookings` | "coming soon" card (no customer surface yet) |
| `/membership` | `memberships` | redirect → `/portal/customer/memberships` |
| `/affiliate` | `affiliates` | redirect → `/portal/customer/affiliates` |

The redirect targets are the canonical plugin nav paths the catch-all already serves. Foundation sub-routes are stable, marketing/iframe-friendly URLs that survive plugin renames; the plugin's own paths remain canonical for sidebar nav.

### Goal D — iframe embed mode

`/portal/customer/layout.tsx` now branches on the `lk_demo_embed=1` cookie (set by R013 `/demo?embed=1` and R016 `/embed/<slug>/customer`). When embed:

- Strips Sidebar + Topbar.
- Renders bare `<main data-testid="portal-customer-embed">` so the iframe content sits flush against the host page.
- Still injects `<ThemeInjector brand={client.brand} scope="customer">` so the iframe inherits the client's brand kit (16-var palette from R15) — exactly the chapter-#19b "client website embeds my Aqua portal, looks like the client's brand" contract.

Mirrors the agency-layout pattern from R013 line-for-line (`portal-embed` testid → `portal-customer-embed` testid).

## Goal E — smoke + chapter + MASTER row

NEW `scripts/smoke-end-customer-portal.test.ts` — 16 tests via `npm run smoke:end-customer-portal` (~700ms). Coverage:

- Each of 5 sub-route page files exists + imports `CustomerSubroute` + default-exports a page component (10 tests).
- `_subroute.tsx` exports `CustomerSubroute` async function + uses `redirect` + `getInstall` (1 test).
- `layout.tsx` contains `lk_demo_embed=1` cookie check + `portal-customer-embed` testid (1 test).
- Sub-route config contracts: orders→ecommerce w/ no redirect; account→client-crm with `/profile`; membership→memberships with `/memberships`; affiliate→affiliates with `/affiliates` (4 tests).

We don't spin up the Next.js runtime in the smoke; we verify the shipped surface is structurally intact. End-to-end iframe + cookie + redirect testing belongs in playwright (R+1 alongside T3 R013's iframe smoke).

## Q-ASSUMED

- **Singular paths are foundation aliases** — the prompt asks for `/membership` and `/affiliate` (singular); plugins use plural (`/memberships`, `/affiliates`). Singulars are stable foundation aliases that redirect to the plural plugin canonicals; both work, foundation surface survives plugin rename.
- **Ecommerce + bookings have no customer surface yet** — both plugins only ship agency-side panels. Their stubs render "configured but not yet exposing customer surface" rather than redirecting to nowhere. R+1 either plugin ships customer-side pages → swap stub for redirect.
- **`lk_demo_embed=1` cookie is the canonical embed marker** — same cookie set by R013 `/demo` + R016 `/embed/<slug>/<variant>` middleware. Single source of truth across all three iframe surfaces.

## NOT in scope

- New plugin development (per prompt).
- Per-end-customer custom permissions beyond plugin presence (per prompt — R+1 candidate).
- Full Playwright smoke for iframe + cookie flow (R+1 alongside T3 R013).
- Wiring ecommerce + bookings customer-side surfaces (separate plugin rounds).

## R+1 candidates

- Ecommerce customer-side `/portal/customer/orders` index of past orders + tracking links.
- Bookings customer-side `/portal/customer/bookings` upcoming + book-new flow.
- Per-end-customer permission plane (today: plugin-presence is the only gate).
- Playwright iframe+cookie+brand-injection smoke harness.
- Customer-side notifications (R005 plugin already ships agency-side; mirror for end-customers).
- Real-time activity tail when end-customer makes a request that the agency owner sees in the Inbox.

## Files touched

- `portal/src/app/portal/customer/layout.tsx` — embed branch added.
- `portal/src/app/portal/customer/_subroute.tsx` — NEW shared helper.
- `portal/src/app/portal/customer/orders/page.tsx` — NEW.
- `portal/src/app/portal/customer/account/page.tsx` — NEW.
- `portal/src/app/portal/customer/bookings/page.tsx` — NEW.
- `portal/src/app/portal/customer/membership/page.tsx` — NEW.
- `portal/src/app/portal/customer/affiliate/page.tsx` — NEW.
- `portal/scripts/smoke-end-customer-portal.test.ts` — NEW (16 tests).
- `portal/package.json` — `smoke:end-customer-portal` script added.

tsc clean. HARD BOUNDARY honoured (zero touches to `milesymedia website/`, `business-os/`, `clients/compass-coaching/`).
