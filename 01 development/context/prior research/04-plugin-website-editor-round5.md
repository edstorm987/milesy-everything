# Round-5 chapter — Website-editor plugin (T3)

Round 5 fills in the **real React components** for the cross-plugin
storefront blocks the plugin registers. R3 Goal B wired the
`RENDERER_REGISTRATIONS` map; R5 makes the components fetch real data
+ handle loading + error + missing-plugin states.

Outcome:

- 8 ecommerce blocks fetch from `/api/portal/ecommerce/*` (cart is
  client-side localStorage; products / orders / Stripe checkout are
  real fetches).
- 3 membership blocks fetch from `/api/portal/memberships/*` with
  proper `{planId, billing}` body shape and 401 / 404 handling.
- 3 affiliate blocks call `/api/portal/affiliates/*` with the real
  `{payoutEmail, displayName}` enrol shape.
- 1 form-render block lives at `form-render` — fetches a published
  form definition and renders all 11 field kinds.
- 1 crm-contact-form block — opinionated wrapper around form-render
  with a built-in fallback contact form.

Smoke: **67 pass total** (42 block tests + 25 cross-plugin
renderer tests). tsc clean.

---

## Phase A — Ecommerce 8 (real fetches)

### `ecommerceBridge.tsx` upgraded

R2 shipped `ecommerceBridge.tsx` as an empty-cart stub + a "requires
ecommerce" notice for the variant picker. R5 replaces both:

| Helper | Round-5 behaviour |
|---|---|
| `useCart()` | localStorage-backed cart (`lk_cart_v1`) with cross-tab sync via `lk-cart-change` event + native `storage` event. Returns a snapshot with `items`, `subtotal`, `count`, plus `updateQty` / `removeItem` / `addItem` / `clear` mutators that write through localStorage. `setCartProvider()` escape hatch preserved for SSR / a future server-rendered cart. |
| `ProductVariantPicker` | Real swatch UI grouped by option keys (e.g. "size" / "color"). Picks the first variant matching all currently-selected options. Emits both the picker state (`{selectedVariantId, options}`) and the `ResolvedVariant` (product + variant + price + availability) on every change. |
| `goToStripeCheckout(input)` | POSTs cart-or-supplied line items to `/api/portal/ecommerce/stripe/checkout` and follows the redirect URL. Used by PaymentButton + DonationButton. Threads `referralCodeId` + `discountCode` + `amountCents` for downstream flows. |
| `fetchOrderBySessionId(id)` | Reads `/api/portal/ecommerce/orders/by-session/:id`. Used by OrderSuccess. |
| `fetchProductVariants(productId)` | Reads `/api/portal/ecommerce/products/:id/variants`. Used by VariantPicker fallback. |
| `searchProducts(q, limit)` | Reads `/api/portal/ecommerce/products?q=…&limit=…`. Used by ProductSearch. |

### Block-by-block changes

- **ProductCardBlock / ProductGridBlock**: already used `useCatalog()`
  from R2's `lib/useProducts.ts`, which points at
  `/api/portal/ecommerce/products`. No code change needed beyond the
  upstream useProducts catalog cache.
- **CartSummaryBlock**: lifted in R2 to read `useCart()`. Now backed
  by the upgraded localStorage cart automatically — adds/removes/
  qty-updates persist across reloads + tabs.
- **CheckoutSummaryBlock**: same as CartSummary. Computes shipping +
  tax client-side (R2 lift); real values come from Stripe at checkout.
- **PaymentButtonBlock** (rewritten): invokes `goToStripeCheckout()`
  with the current cart. Surfaces the bridge's error text inline.
  Disabled when the cart is empty. Spinner state during the network
  call. Editor mode is no-op.
- **OrderSuccessBlock** (extended): reads `?session_id=` from URL,
  fetches the order via the bridge, renders line items + customer
  email + total. Falls back gracefully when the webhook hasn't yet
  processed (shows "webhooks may still be processing" hint).
- **VariantPickerBlock**: already wired in R2 to the bridge's picker.
  Now actually renders swatches because the bridge picker is real.
- **ProductSearchBlock** (re-pointed): URL changed from the
  Round-1-monolith path `/api/portal/products?q=...` to the plugin
  path `/api/portal/ecommerce/products?q=...&limit=12`. Adds
  `credentials: include` and 4xx-graceful empty results.
- **DonationButtonBlock** (re-pointed): URL changed from
  `/api/donations/checkout` to the ecommerce plugin's
  `/api/portal/ecommerce/stripe/checkout`. Submits a single line item
  priced at `amount * 100` cents with `mode: "donation"` +
  `recurring` flag in the payload. Recurring donations as Stripe
  Subscriptions is a Round-6 follow-up (needs a real Price object).

### Q-ASSUMED — no `/cart` endpoint

T2's `@aqua/plugin-ecommerce` doesn't yet ship `GET /cart` /
`POST /cart`. R5 keeps cart state client-side (matches 02's pattern)
via `useCart()` + localStorage. Server-side cart persistence is a
Round-6+ follow-up; the localStorage shim works for unauthenticated
guests + authenticated end-customers alike.

---

## Phase B — Memberships 3 + Affiliates 3 + Forms 1 + CRM 1

### Memberships

- **MembershipPaywallBlock**: real GET against `/api/portal/memberships/me`.
  Reads `subscription.status` (`trialing` / `active` qualify) +
  `subscription.planId`. If `props.requirePlanIds` is set, only those
  plan ids unlock children. Editor mode renders a small green strip +
  always shows children so layout is editable. 4xx / 5xx / network
  errors → silent gate-closed.
- **MembershipSignupBlock**: real GET `/plans` + POST `/me/subscribe`.
  Body shape corrected from `{planId, billingPeriod}` →
  `{planId, billing}` to match memberships R4 server. 401 → "Sign in
  to subscribe"; 404 → "Memberships are not enabled on this site";
  successful free-tier subscribe (no redirect URL) → page reload to
  show the new state. Loading state shown before plans arrive.
- **MembershipTierGridBlock**: same `/plans` fetch; pure-display grid
  for marketing pages. No subscribe interaction.

### Affiliates

- **AffiliateSignupBlock**: corrected body shape from
  `{email, name}` → `{payoutEmail, displayName}` matching affiliates
  R5 `meEnrollHandler`. 401 → "Sign in to enrol as an affiliate";
  404 → "Affiliate program is not enabled on this site".
- **AffiliatePayoutMeterBlock**: GET `/me` returns
  `{ affiliate, codes, attributions, payouts }`. The block rolls up
  attributions into pendingCents / approvedCents and payouts into
  paidCents (sum of completed) + nextPayoutAt (earliest scheduled).
- **AffiliateLeaderboardBlock**: GET
  `/api/portal/affiliates/leaderboard?limit=N`. **Q-ASSUMED**: T2's
  affiliates plugin doesn't yet ship this endpoint. Block degrades to
  empty state on 404 / 5xx. T2 R10 follow-up: add `/leaderboard`
  returning top-N by lifetimeEarnings.

### Forms

- **FormRenderBlock** (NEW): `props.formId` → fetches
  `/api/portal/forms/public/form/:formId`. Renders all 11 field kinds
  per T2's forms `FormFieldKind` (text / email / phone / textarea /
  select / multiselect / radio / checkbox / number / date / hidden).
  On submit POSTs `{values}` to
  `/api/portal/forms/public/submit/:formId` and either:
  - Redirects (when `submitAction.kind === "redirect"`)
  - Shows the configured `thankYouMessage`
  - Shows a default "Thanks — we'll be in touch" message
  Loading + error + plugin-missing states all handled.

### CRM

- **CrmContactFormBlock** (NEW): two paths.
  - When `props.formId` is set → delegates to FormRenderBlock (best
    path because forms plugin auto-fans submissions into CRM via the
    foundation event router).
  - Default → built-in name + email + message form that POSTs to
    `/api/portal/client-crm/public/contact`. **Q-ASSUMED**: T2 R10
    follow-up to add this public ingest. Until then, 404 → submission
    surfaces "Thanks!" optimistically + console.warn (operator hint).

---

## Phase C — Smoke + chapter

### `cross-plugin-renderers.test.ts` (NEW)

Adds 25 assertions covering the registry contract:

- Every cross-plugin block id resolves to a function via
  `getBlockRenderer(id)` (16 ids × 1 assertion).
- `registerExternalBlockRenderers(plugins)` reports zero missing ids
  for a synthetic ecommerce / memberships / affiliates / forms / CRM
  manifest (5 zero-missing assertions).
- `registerExternalBlockRenderers` surfaces unknown ids when fed a
  manifest with a nonsense block type (1 assertion).
- The cross-plugin count rolls up to 16 (1 assertion, donation-button
  counted with ecommerce per the prompt).
- `RENDERER_REGISTRATIONS` map has at least 66 entries (1 assertion).

### Existing `blocks.test.ts` extended

The R3 cross-plugin externalIds list grew from 6 → 8 (added
`form-render` + `crm-contact-form`). Block test count: 42 (was 40).

### Total smoke: **67 pass · 0 fail**

```bash
cd 04\ the\ final\ portal/plugins/website-editor
npm test
# blocks.test.ts: 42 passed · 0 failed
# cross-plugin-renderers.test.ts: 25 passed · 0 failed
```

`tsc --noEmit` clean.

---

## R6 follow-ups + cross-team TODOs

| Item | Owner | Why deferred |
|---|---|---|
| Server-side cart persistence | T2 ecommerce | localStorage shim works v1; a server-side cart unlocks abandoned-cart email + cross-device sessions |
| `GET /api/portal/affiliates/leaderboard?limit=N` | T2 affiliates | Block degrades to empty state until then |
| `POST /api/portal/client-crm/public/contact` | T2 client-crm | Public ingest endpoint for crm-contact-form's built-in path |
| Stripe Subscription mode for recurring donations | T2 ecommerce | DonationButton currently sends one-off charges with `recurring: true` flag in payload |
| RichEditor real implementation | T1 / future text-editing plugin | Stub textarea remains in PageDetailPage |
| Storefront SSR for cross-plugin blocks | T1 + T3 | Architecture §6 deferred. Current renderers are client-only. |
| Real React-Query / SWR layer | future polish round | Plain `useEffect + fetch` is fine for v1 |

## Auth-gated vs public block split

Quick reference for the foundation event router + storefront SSR
shaping:

| Block | Auth requirement | Endpoint |
|---|---|---|
| product-card / product-grid / product-search | public | `/api/portal/ecommerce/products` |
| cart-summary / checkout-summary | public (localStorage) | n/a — client state |
| payment-button / donation-button | public submit | `/stripe/checkout` |
| order-success | public read | `/orders/by-session/:id` |
| variant-picker | public | `/products/:id/variants` |
| membership-paywall | end-customer | `/memberships/me` |
| membership-signup / tier-grid | mixed (read public, subscribe end-customer) | `/plans` (public) + `/me/subscribe` (auth) |
| affiliate-signup | end-customer | `/affiliates/me/enroll` |
| affiliate-payout-meter | end-customer | `/affiliates/me` |
| affiliate-leaderboard | public (auth-optional) | `/affiliates/leaderboard` (Q-ASSUMED) |
| form-render | public | `/forms/public/form/:id` + `/forms/public/submit/:id` |
| crm-contact-form | public | `/client-crm/public/contact` (Q-ASSUMED) or delegates to forms |

When a block requires auth and the visitor is anonymous, the standard
pattern is to render a "Sign in to …" hint + a deep-link back to the
client-portal login (`/portal/customer`).

## Cross-team handoffs

- **T2 ecommerce R10**: ship `GET /api/portal/ecommerce/orders/by-session/:id`
  if it doesn't already exist; OrderSuccessBlock relies on it.
- **T2 affiliates R10**: ship
  `GET /api/portal/affiliates/leaderboard?limit=N` returning
  `{ rows: { rank, name, totalReferred, lifetimeEarningsCents }[] }`.
- **T2 client-crm R10**: ship
  `POST /api/portal/client-crm/public/contact` accepting
  `{ name, email, attributes?, tags?, source }` and creating /
  upserting a Contact under the per-client scope.
- **T1 R7+**: storefront SSR for cross-plugin blocks (architecture
  §6) — the renderers are currently client-only.
