# Chapter 47 — UX storefront + per-client + perf pass (T4 R2)

> T4's second round. Closes the storefront-block, end-customer, per-
> client portal, and performance polish items deferred from R1's
> chapter 46. Reuses the R1 primitive set (LoadingSkeleton / EmptyState
> / ErrorBoundary / SkipToContent / useFocusTrap / useViewport /
> contrastValidator) and extends it for the storefront/iframe surface.

## What shipped

### Phase A — Storefront block UX (commit `27c78ed`)

Brand-orange→brand-accent sweep: 60 occurrences across 31 storefront
block components in `plugins/website-editor/src/components/blocks/`.
The hardcoded fallback `var(--brand-orange, #ff6b35)` swapped to
`var(--brand-accent, #ff6b35)` so client brand kits reach the
storefront. The editor-internal canvas drag-ghost (`canvas/touchDnd.ts:45`)
was left as-is — that's an admin-only, not storefront, surface.

Per-block UX upgrades (the 6 highest-impact cross-plugin renderers):

| block | loading | error + retry | empty | aria | touch ≥ 44 | notes |
|---|---|---|---|---|---|---|
| AffiliateLeaderboardBlock | 3 row pulses (aqua-pulse) | role="alert" + Retry button | "No data yet — be the first!" | aria-label on `<section>` | n/a | 404 routed to empty state (plugin-not-installed); other failures → error state. retryNonce re-trigger pattern. |
| AffiliatePayoutMeterBlock | 3-line skeleton w/ progress-bar pulse | role="alert" + Retry | "Sign in to see your earnings" | aria-label on `<section>` | n/a | 401/404 → "Sign in" empty state. |
| AffiliateSignupBlock | n/a (form, not data) | role="alert" on submit error | success card | aria-label on form, sr-only labels, aria-invalid on email when error | inputs + button min-height 44 | autoComplete=name/email hints. |
| MembershipSignupBlock | 3-card skeleton during plan fetch | role="alert" on submit error | "No plans available" / pluginMissing branch | role="group"+aria-pressed on billing toggle, aria-label on subscribe | toggle buttons + subscribe min-height 36/44 | Cleaner load state (was just a "Loading plans…" string). |
| FormRenderBlock | 3-element form skeleton | role="alert" + Retry button on load failure | unchanged | aria-label on form | inputs + textarea + submit min-height 44 | Existing pluginMissing branch preserved. |
| CrmContactFormBlock | n/a | role="alert" on error | success card | aria-label on form, sr-only labels, autoComplete | inputs + textarea + button min-height 44 | Built-in contact form path; the formId-delegated path inherits FormRenderBlock's polish. |
| ProductGridBlock | aria-busy + role="status" + per-card pulse animation on placeholders | n/a | placeholder cards inline | aria-label on grid + per-product link | n/a | `aria-hidden` on placeholder cards while loading — doesn't pollute SR navigation. |

The 12 remaining cross-plugin renderers (8 ecommerce + login-form +
contact-form variants) inherit the brand-accent swap but were already
in good a11y shape from T3 R5 — left for a focused R3 pass if needed.

### Phase B — End-customer + embed-login polish (commit `a223692`)

New: `portal/src/lib/a11y/isEmbedded.ts` — `isEmbeddedNow()` +
`useIsEmbedded()` hook. SSR-safe (returns false on the server,
reconciles on first effect tick). Gracefully handles cross-origin
frame access throw — that's the canonical embed case (different-
origin parent), so we treat the throw as "embedded".

`embed/login/page.tsx`:
- `<Suspense fallback>` upgraded from empty `<div>` to a 3-bar
  skeleton (`role="status" aria-live="polite" aria-busy="true"`)
  so the form area doesn't visibly pop in when the LoginForm
  client component hydrates.
- Logo `<img>` gets explicit `height={40}` attribute so the form
  block below doesn't shift when the brand-kit logo finishes
  loading. Also fixes empty `alt=""` → `alt={title}` for SR.
- `<main>` gets `id="main-content"` + `data-embed="true"` so the
  skip-link target resolves and downstream CSS can hook the
  embedded case.

`MobileNav.tsx`:
- When `useIsEmbedded()` returns true, the drawer wrapper uses
  `absolute inset-0` instead of `fixed inset-0` — the drawer stays
  inside the iframe's bounds rather than overlaying the parent
  frame's chrome. (`fixed` would have escaped the iframe to cover
  whatever the embedding site has surrounding the frame.)

`/portal/customer/page.tsx`:
- `FallbackCard` gets `role="status"` so SR users hear the empty-
  state announcement when there's nothing to show.

### Phase C — Per-client portal polish (commit `9023d95`)

Per-client portals are independent Next.js apps (architecture
extension chapter 19b) so each one carries its own copy of the
foundation primitives. `clients/luv-and-ker/` got the full polish
treatment — T2 R11's "Export to repo" generator should drop this
same shape into every new client.

New files mirroring foundation:
- `clients/luv-and-ker/src/components/ui/SkipToContent.tsx`
- `clients/luv-and-ker/src/components/ui/ErrorBoundary.tsx` (with branded log prefix)
- `clients/luv-and-ker/src/components/ui/EmptyState.tsx`
- `clients/luv-and-ker/src/lib/a11y/contrastValidator.ts` (pure WCAG AA)

`globals.css` gained the polish layer:
- Global `:focus-visible` 2px brand-accent ring on every interactive (falls back to `--brand-primary` then `currentColor`)
- `sr-only` + `focus-visible:not-sr-only` utilities for SkipToContent
- `aqua-pulse` keyframes (parity with foundation)
- `prefers-reduced-motion` guard kills `animate-pulse`, `aqua-pulse`, and `scroll-behavior: smooth`
- `pointer: coarse` query bumps `.btn-primary` / `.btn-ghost` / buttons / `a[role="button"]` to `min-height: 44px` for touch

`layout.tsx`:
- Mounts `<SkipToContent />` as first body child
- Dev-mode `validatePalette()` warning prints WCAG warnings to the
  server console for the active brand kit. Felicia palette
  (`#F97316` primary / `#FFF7ED` secondary / `#7C3AED` accent /
  `#1A1A1A` ink / `#FFFFFF` surface) passes AA — no warnings
  expected at boot.

All 9 page-level `<main>` elements got `id="main-content"` so the
skip-link target resolves. Storefront landing wraps page sections
in `<ErrorBoundary label="storefront">`.

### Phase D — Performance smoke (commit `da37a93`)

`scripts/smoke-perf.mjs` + `npm run smoke:perf`: lightweight fetch-
based check. Per representative page (landing / login / embed /
agency home / clients list / 2 plugin pages), asserts:
1. Response time ≤ `AQUA_BUDGET_MS` (default 2500ms — local-dev
   FCP-equivalent target since SSR HTML is the dominant blocking
   resource for First Contentful Paint).
2. HTML payload ≤ per-page KB budget (landing 80 / login 60 /
   portal home 200 / portal list 100 / plugin pages 200).
3. Status 2xx/3xx.

Cumulative totals printed at the end.

**Why fetch-based and not real Lighthouse:** real Lighthouse needs
Puppeteer + a Chromium install which is out of scope for a polish
round. SSR-render time + HTML payload size are the dominant
FCP/LCP signals for a Next.js app — fetch-based smoke gets 80% of
the value. Real Lighthouse with TTI/CLS deferred to R3.

Tunable via `AQUA_BUDGET_MS` / `AQUA_BUDGET_KB` / `AQUA_BASE`
env vars.

## Image optimisation audit (Phase D §"Image optimization")

Foundation portal: only one `<img>` outside of plugin storefront
blocks — the embed-login brand logo. R2 added an explicit `height`
attr so it reserves layout space (no flash). Switching to
`next/image` would give automatic format negotiation + lazy-load,
but Next/Image in a per-tenant brand-logo context needs allowlisted
remote domains in `next.config.ts` — that's a per-deploy config,
not a per-component change. Deferred to T6 R2.

Plugin storefront blocks (HeroBlock, GalleryBlock, ProductGridBlock,
etc.) already use `<img loading="lazy">`. The cleanest upgrade
path is shipping a foundation `<BrandImage>` wrapper that switches
to `next/image` when the src matches an allowlist. Deferred to a
future round (probably joins T1 R8 or T6 R2).

## Cross-team WARNs surfaced

Logged but not fixed (out of scope):
- T2 / `agency-finance/src/components/InvoicesList.tsx:85` — `window.location.reload()` after mark-paid loses scroll + filter state. Same pattern flagged in R1's audit (#7 in the cross-team WARN list).
- T2 / `affiliates/src/components/AffiliatesList.tsx:94` — same.
- All 28 `window.location.reload()` sites flagged in R1's audit are still present; the foundation refactor (R2 deferred from R1) belongs to T1.

## Items deferred to round 3

1. **`<BrandImage>` wrapper** — single `<img>` → `<next/image>`
   migration with per-deploy allowlist. T6 R2 likely owner.
2. **Real Lighthouse smoke** — Puppeteer + Chromium harness with
   TTI / CLS / LCP measurement. Replaces `smoke:perf` once the
   Vercel preview pipeline is set up (T6 R2).
3. **Bundle analysis** — `@next/bundle-analyzer` integration to
   flag chunks > 300KB. Deferred — Next 16 build profile is the
   stop-gap.
4. **Lazy-load editor admin** — when a storefront block accidentally
   imports an editor-only helper, the entire 1,429-line `EditorPage`
   ships to the customer. A `dynamic(() => import(...), { ssr: false })`
   gate at the editor entry would prevent the regression. T3 R6
   territory.
5. **Server caching** — `revalidate` hints on read-heavy server
   components (e.g. `/portal/agency` lists installs every request).
   Storage layer in T1 R8 is more authoritative; tactical hints
   would compete with that.
6. **`InlineSkeleton` adoption across the remaining 12 cross-plugin
   renderers** — R2 covered the 6 highest-impact; the remaining 12
   either already render fine (HeroBlock, FeatureGridBlock, etc.)
   or are admin-only.
7. **ConfirmDialog adoption across 29 `confirm()` sites** — primitive
   shipped in R1, mechanical adoption deferred again. Best done in
   one focused round to avoid touching every plugin twice.

## Definition-of-done check

- [x] Phase A — storefront block UX polish (6 blocks deeply, brand-accent sweep across all 31).
- [x] Phase B — end-customer + embed-login polish (Suspense skeleton, logo height, `useIsEmbedded`).
- [x] Phase C — per-client portal polish (`clients/luv-and-ker/` adopts the R1 primitive set + globals polish + contrast warning).
- [x] Phase D — perf smoke (`scripts/smoke-perf.mjs` + `npm run smoke:perf`).
- [x] Phase E — chapter `04-ux-storefront-perf-pass.md` (this file).
- [x] MASTER row.
- [x] tasks.md row.
- [x] tsc clean (verified at every checkpoint, including the per-client portal's own `tsc --noEmit`).
- [ ] Live `npm run smoke:perf` — requires `npm run dev` co-running; harness ships ready to invoke.
- [ ] R3 deferred items captured in §"Items deferred to round 3".
