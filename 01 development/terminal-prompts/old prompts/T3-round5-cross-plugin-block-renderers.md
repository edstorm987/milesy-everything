/loop

# T3 — Round 5: Real cross-plugin storefront block renderers

Round 4 you closed the editor admin surface (SitesPage 3264-LOC +
customPages backend + PageDetailPage). Round 5 fills in the real
React components for the **18 cross-plugin storefront blocks** that
T2's plugins contribute but you currently have as stubs:

- ecommerce 8 — `product-card`, `product-grid`, `cart-summary`,
  `checkout-summary`, `payment-button`, `order-success`,
  `variant-picker`, `product-search`
- memberships 3 — `membership-paywall`, `membership-signup`,
  `membership-tier-grid`
- affiliates 3 — `affiliate-signup`, `affiliate-payout-meter`,
  `affiliate-leaderboard`
- forms 1 — `form-render`
- client-crm 1 — `crm-contact-form`
- (donation-button bonus from ecommerce extras: 1 = +1)

R3 you wired `RENDERER_REGISTRATIONS` cross-plugin renderer map
formally; the components themselves are stubs (e.g. cart-summary
renders an empty cart, paywall just gates with no real check).
R5 makes them real, fetching data from each plugin's API namespace.

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
2. `01 development/context/prior research/04-plugin-website-editor-round3.md` — your R3 chapter (RENDERER_REGISTRATIONS contract lives here)
3. `01 development/context/prior research/04-plugin-ecommerce.md` — 8 ecommerce blocks + API surface
4. `01 development/context/prior research/04-plugin-memberships.md` — 3 membership blocks + `/me/subscribe` flow
5. `01 development/context/prior research/04-plugin-affiliates.md` — 3 affiliate blocks + `/me/enroll` + leaderboard
6. `01 development/context/prior research/04-plugin-forms.md` — `form-render` block + public form fetch/submit
7. `01 development/context/prior research/04-plugin-client-crm.md` — `crm-contact-form` block
8. Source: `02 felicias aqua portal work/src/components/editor/blocks/{ProductCard,ProductGrid,CartSummary,...}.tsx` for the ecommerce 8 — you already lifted the structural shells in R2, now fetch real data

## Scope — three phases

### Phase A: Ecommerce 8 (fetch real product / cart / checkout state)

You already have the 8 ecommerce block components from R2 Phase A
(`src/components/blocks/ProductCardBlock.tsx`, etc.). They render but
don't fetch real data. Wire them up:

- `ProductCardBlock` / `ProductGridBlock` — fetch via `GET /api/portal/ecommerce/products?clientId=...` (use your existing `useCatalog` hook from R2 Phase A `lib/useProducts.ts`).
- `CartSummaryBlock` / `CheckoutSummaryBlock` — fetch the cart via
  `GET /api/portal/ecommerce/cart?clientId=...`. Replace the
  ecommerceBridge stub `useCart()` with a real React-Query-style hook
  (or plain `useEffect + fetch` — match the pattern your other blocks
  use).
- `PaymentButtonBlock` — POSTs to `/api/portal/ecommerce/stripe/checkout`
  and follows the redirect URL.
- `OrderSuccessBlock` — fetches order by `?session_id=...` query param
  via `/api/portal/ecommerce/orders/by-session/:id`.
- `VariantPickerBlock` — already has the structural lift; wire the
  variant resolver to call `/api/portal/ecommerce/products/:id/variants`.
- `ProductSearchBlock` — debounced search via
  `/api/portal/ecommerce/products?q=...`.
- (`DonationButtonBlock` if you've lifted it — same Stripe-checkout flow.)

Replace all `ecommerceBridge.tsx` stub returns with real fetches +
loading + error states. Keep the `setCartProvider()` escape hatch for
SSR but make it optional now.

### Phase B: Memberships 3 + Affiliates 3 + Forms 1 + CRM 1 (real fetches)

Replace the stub renderers you registered in R3 Goal B:

- **`membership-paywall`** — accept `props.requirePlanIds: string[]`.
  Fetch the user's subscription via `GET /api/portal/memberships/me`.
  If active subscription's planId is in the requirePlanIds list, render
  children. Otherwise render a "Upgrade to access" CTA with a link to
  `membership-signup` (or via `props.upgradeUrl`).
- **`membership-signup`** — fetch plans via
  `GET /api/portal/memberships/plans?clientId=...`. Render a tier picker
  (Bronze / Silver / Gold cards). On click, POST to
  `/api/portal/memberships/me/subscribe` with `{planId, billing}`. Follow
  the redirect URL (Stripe Checkout for paid tiers; immediate confirm for
  free).
- **`membership-tier-grid`** — same plans fetch as `signup`, just a
  pure-display grid (no signup interaction). Useful for marketing pages.
- **`affiliate-signup`** — POST to `/api/portal/affiliates/me/enroll`
  with `{payoutEmail}`. Auth-gated via end-customer cookie. Show
  enrolled state + the user's referral code if already enrolled.
- **`affiliate-payout-meter`** — fetch via `GET /api/portal/affiliates/me`.
  Display lifetime earnings + pending payout amount + progress bar
  to next payout threshold.
- **`affiliate-leaderboard`** — fetch top-N from
  `GET /api/portal/affiliates/leaderboard?limit=N` (T2 may need to
  add this endpoint — log `Q-ASSUMED` and stub if missing).
- **`form-render`** — accept `props.formId`. Fetch via
  `GET /api/portal/forms/public/form/:formId`. Render the form's fields
  per their `kind`. Submit to
  `POST /api/portal/forms/public/submit/:formId`. Show
  `submitAction.thankYouMessage` or follow redirect.
- **`crm-contact-form`** — variant of `form-render` that defaults its
  `submitAction` to "post to client-CRM /contacts" and adds the
  submitter to the "All" segment.

### Phase C: Smoke + chapter

Add component-level smoke tests (`src/__smoke__/cross-plugin-renderers.test.ts`)
that mount each renderer with mocked fetch responses and assert it:
- Renders loading state then data state.
- Handles HTTP errors gracefully (renders fallback or error message).
- Handles "plugin not installed" (404 from API) gracefully.

Update chapter `04-plugin-website-editor-round5.md` (or extend R3
chapter) documenting:
- The fetch + loading + error pattern for cross-plugin blocks.
- The auth-gated vs public block split.
- Cross-team integration TODOs:
  - T2 ecommerce: confirm cart endpoint shape (`GET
    /api/portal/ecommerce/cart`).
  - T2 affiliates: confirm leaderboard endpoint exists (or T2 R11
    follow-up to add it).
  - T2 forms: confirm public endpoint shape matches your fetch.

## NOT in scope

- Don't build new admin pages — Round 4 closed the admin surface.
- Don't touch foundation (T1 owns).
- Don't touch plugin server source. Reads only via HTTP API.
- Don't build a real React-Query / SWR layer — plain hooks are fine
  for v1; data-fetching layer is a future polish round.
- Don't build storefront SSR — these renderers run client-side; SSR is
  a future round (architecture §6 deferred).

## Loop discipline

Each cycle: pull → read inbox + outbox → continue → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end. Phase A is biggest (8 renderers) — commit per 2-3 wired.

## When done

1. All 16-17 cross-plugin block renderers fetch real data + handle
   loading/error/missing-plugin states.
2. `tsc --noEmit` clean inside the website-editor plugin.
3. Smoke pass (existing 40 + new component-level tests).
4. Chapter `04-plugin-website-editor-round5.md` (or R3 extension)
   documenting fetch pattern + cross-team TODOs.
5. MASTER row.
6. `tasks.md` row done.
7. Final `DONE` + `COMMIT`.

If Phase A alone takes the loop, partial DONE is fine — Phases B + C
can ship in R6.
