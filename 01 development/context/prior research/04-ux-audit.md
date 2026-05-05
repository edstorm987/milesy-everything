# Chapter 40 — UX + accessibility audit (T4 R1 Phase A)

> Inspection of the entire `04 the final portal/` surface as it stands at
> the end of T1 R6 / T2 R9 / T3 R5 (commit `9837e27`). Scope: the
> foundation chrome (`portal/src/components/chrome/*`), foundation pages
> (`portal/src/app/portal/**`), 9 plugin admin surfaces (~70 pages, ~70
> client components), 58 storefront blocks + 18 cross-plugin renderers.
>
> Out of scope (T5 / T6 / T3 / T2 territory): `clients/luv-and-ker/`,
> the marketing site, anything under `02`/`03`.

## Inventory

| layer | count | example |
|---|---|---|
| Foundation chrome | 4 components | `Sidebar.tsx`, `Topbar.tsx`, `DemoBanner.tsx`, `ThemeInjector.tsx` |
| Foundation pages | 7 server pages | `/portal`, `/portal/agency`, `/portal/clients`, `/portal/clients/[clientId]`, `/portal/customer`, `/login`, `/` |
| Plugin admin pages | 70 server pages | `plugins/<plugin>/src/pages/*.tsx` |
| Plugin admin client comps | ~80 client components | `plugins/<plugin>/src/components/{,admin}/*.tsx` |
| Storefront blocks | 58 native + 8 ecom + 6 cross-plugin | `plugins/website-editor/src/components/blocks/*.tsx` |
| Modals already declared | 7 with `role="dialog"` | NewClientModal, NewPlanModal, NewStaffModal, PhaseEditorModal, AdvancePhaseModal, CartDrawer, DiscountPopup |

## Headline numbers (the punch list, by signal)

- `focus-visible:` utilities used anywhere in `04`: **0** (zero focus-ring opt-ins)
- `<ErrorBoundary>` components: **0** (no boundary anywhere — uncaught render errors fall through to Next's default error page)
- `animate-pulse` skeletons in scope (`portal/` + `plugins/`): **0** (skeletons exist only in out-of-scope `clients/felicias perfect portal/`)
- Native `confirm(...)`: **29** call sites (destructive actions are blocking + un-styled)
- `window.location.reload()`: **28** call sites (no in-place re-render after mutation, every save full-reloads)
- Modals using `role="dialog"`: **7 of ~10** modals (3 missing — see table)
- Skip-to-content link: **none**
- Keyboard focus trap on modals: **none** (the 7 dialog-roled modals don't trap)
- ARIA-live region for toasts/announcements: **none** (no toast system)
- Mobile breakpoints: chrome is hard-coded `w-60` sidebar + `flex` row — no breakpoint behaviour at `<768px`
- Color contrast: brand-kit CSS variables passed straight into `bg-[var(--brand-primary)]` etc. with no validation; client-uploaded palette can render `text-white on yellow` and we don't catch it.

## Per-surface punch list

Legend per cell: `loading` · `empty` · `error-boundary` · `focus-ring` · `aria` · `keyboard-nav` · `mobile`. ✅ acceptable, ⚠️ partial, ❌ missing.

### Foundation chrome

| component | loading | empty | error | focus | aria | kbd | mobile | notes |
|---|---|---|---|---|---|---|---|---|
| `Sidebar.tsx` | n/a | n/a | ❌ | ❌ | ⚠️ | ❌ | ❌ | No `<nav aria-label>`, no skip-link target. Fixed `w-60`. No mobile collapse. Active state uses brand-primary tint — fine for keyboard once focus ring lands. |
| `Topbar.tsx` | n/a | n/a | ❌ | ❌ | ⚠️ | n/a | ❌ | Sign-out button has no `aria-label`; "↗ Marketing" link has no descriptive label. Stacks fine at desktop, overflows at <500px. |
| `DemoBanner.tsx` | n/a | n/a | ❌ | ❌ | ✅ | n/a | ✅ | Already has `role="region" aria-label="Demo banner"`. Wraps gracefully. |
| `ThemeInjector.tsx` | server | n/a | n/a | n/a | n/a | n/a | n/a | Renders `<style>` only — no UX surface. **Action: add contrast-validator warning** when client palette fails AA. |

### Foundation pages

| page | loading | empty | error | focus | aria | kbd | mobile | notes |
|---|---|---|---|---|---|---|---|---|
| `/` (landing) | n/a | n/a | ❌ | ❌ | ⚠️ | n/a | ✅ | CTAs are `<Link>` — keyboard-fine. Tap targets ≥44px ✅. |
| `/login` | n/a | n/a | ❌ | ⚠️ | ⚠️ | n/a | ✅ | LoginForm uses `focus:border-…` but no visible **ring**. Error shown as `<p>` not `role="alert"`. |
| `/portal` | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Pure redirect. |
| `/portal/agency` | n/a | ✅ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | Empty client list has helpful CTA ✅. Cards stack at 1col mobile ✅. Topbar overflows. |
| `/portal/clients` | n/a | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ | Missing empty state when `clients.length === 0` (renders empty `<ul>` with no CTA). |
| `/portal/clients/[clientId]` | n/a | ✅ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | Empty installs list has explanatory text ✅. |
| `/portal/customer` | ❌ | ✅ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | Variant-driven; fallback card is good. No skeleton while resolving variant. |
| `/embed/login` | ❌ | n/a | ❌ | ⚠️ | ⚠️ | n/a | ✅ | Same as `/login`. |

### Plugin admin pages — common across all 9 plugins

Pattern observed across **every** plugin admin component:

- Server page renders → fetches data via `containerFor(props.storage)` → passes to a `"use client"` component → component holds local state, fires `fetch(...)`, calls `window.location.reload()` on success.
- **No loading skeleton** during initial server render; **no skeleton** for client-side refetches (the page just full-reloads).
- **Empty-state coverage** is uneven: ProductsList shows "0 products" but no CTA; AffiliatesList does say "No affiliates yet"; FormsListPage just shows a count. ChecklistPage has no empty state for "no client selected".
- **`confirm(...)` for delete** — 29 call sites, one popup-style native dialog (un-styled, blocks render thread, dismissable via Esc but no focus return).
- **`<button>` without focus styling** — bare `<button type="button">` rendered unstyled. Once you tab, the focus indicator depends entirely on the browser default which is invisible against many of the dark plugin styles.
- **Per-plugin CSS prefixes** instead of Tailwind: `ecom-*`, `affiliates-*`, `forms-*`, `fulfillment-*`, `hr-*`, `memberships-*` — each plugin has its own visual vocabulary; class name presence does NOT guarantee the styles exist (they're declared in `plugins/<plugin>/src/components/styles.css` of varying maturity).
- **Modals** — 7 of ~10 modals declare `role="dialog" aria-modal="true"` ✅. None traps focus, none restores focus on close.
- **Async action UX** — `setBusy(true)` + button text flips to `…` or "Saving…" — fine. Errors land in a local `<p>` with no `role="alert"`.

#### Plugin-by-plugin summary

| plugin | pages | client-side comps | loading | empty | error | focus | aria | kbd | mobile | top issues |
|---|---|---|---|---|---|---|---|---|---|---|
| affiliates | 6 | 5 | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | `AffiliatesList` good empty state; `MyAffiliatePanel` form has no field-level error. |
| agency-finance | 5 | 2 | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | `InvoicesList`, `ExpensesList` no empty state; invoice detail uses bare HTML render. |
| agency-hr | 4 | 5 | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | `NewStaffModal` has dialog role; `LeaveRequestsPage` table has no row keyboard nav. |
| agency-marketing | 5 | 2 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | `CampaignsPage` lacks empty state; `TemplatesPage` modal lacks dialog role. |
| client-crm | 6 | 4 | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | `ContactsPage` table lacks aria, `MyProfilePage` has decent form but no error. |
| ecommerce | 13 | 10 | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | `ProductsList` no CTA when empty; `confirm()` on delete; `OrderDetail` table no aria. |
| email-sender | 3 | 2 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | New plugin, all 3 pages need empty/loading/aria. |
| forms | 5 | 3 | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | `FormsListPage` has no empty state; `FormBuilderPage` has no field reorder a11y. |
| fulfillment | 5 | 8 | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ⚠️ | Best overall — `NewClientModal` + `PhaseBoard` are reference quality. |
| memberships | 7 | 4 | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | `PlansPage` decent; `SubscribersPage` table lacks aria. |
| website-editor | 11 | 30+ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | EditorPage is 1,429-line beast — outliner needs keyboard nav; SitesPage 3,264-line port; CustomisePage already has tabs but no `role="tablist"`. |

### Storefront blocks (58 + 8 + 6 = 72 renderers)

Sampled HeroBlock, ProductGridBlock, ProductCardBlock, MembershipSignupBlock, MembershipPaywallBlock, AffiliateSignupBlock, FormRenderBlock, CrmContactFormBlock.

Pattern:
- Inline `style={{...}}` everywhere (not Tailwind) — necessary because blocks render in the editor canvas + the customer iframe + the public storefront, all with different surrounding chromes. Acceptable.
- Loading state: ProductGridBlock + MembershipSignupBlock + AffiliateLeaderboardBlock + AffiliatePayoutMeterBlock all show `"Loading…"` text or inline placeholder cards ✅.
- Empty state: MembershipSignupBlock, AffiliateSignupBlock, MembershipPaywallBlock, FormRenderBlock all show distinct messages for `editorMode` vs runtime-empty vs `pluginMissing` ✅.
- Error state: most blocks `.catch(() => { /* silent */ })` and just leave the placeholder. Should at minimum log + show a small inline "Failed to load — refresh" line.
- Hardcoded brand-orange `var(--brand-orange, #ff6b35)` fallback in 8 blocks — should fall back to `var(--brand-accent)` or `var(--brand-primary)` to inherit client's brand kit.
- Hardcoded white-on-dark `rgba(255,255,255,0.x)` colour everywhere — assumes a dark surface. Many of these need a light-mode counterpart driven by brand kit's `--brand-bg` luminance.
- Form blocks (FormRenderBlock, CrmContactFormBlock): inputs lack visible focus rings and field-level validation messages have no `aria-describedby` linkage.

## Prioritised plan (by user impact)

### P0 — ships this round (everyone benefits immediately)

1. **Global focus ring** in `globals.css` `@layer base` — every interactive element gets a 2px brand-coloured outline on `:focus-visible`. Single line of CSS, lights up across all 70 plugin pages + chrome + login + landing.
2. **Skip-to-content** link in `RootLayout` — keyboard users can jump past the sidebar.
3. **Skeleton primitive** `<LoadingSkeleton>` (light + dark variants) — adopt across the foundation pages + 9 plugin "list" pages. Storefront blocks already have inline placeholders; leave for R2.
4. **Empty-state primitive** `<EmptyState heading body cta>` — adopt across the 25+ list pages currently missing one.
5. **Error boundary** `<ErrorBoundary>` wrapping each plugin page (server-side via the catch-all resolver) so a bad render shows a friendly fallback + Retry instead of Next's default error.
6. **Sidebar mobile collapse** — at `<md` add a hamburger toggle in Topbar; sidebar slides over.
7. **`useFocusTrap` + auto focus return** — adopt in the 7 already-dialog-roled modals + the 3 missing dialog-role modals (`TemplatesPage` editor modal, `EditorPage` publish modal, `SitesPage` settings modal).
8. **Live-region toast hook** — `useToast()` returning an `announce(msg)` that mounts a single `role="status" aria-live="polite"` outlet at the layout root. Replace the in-flight pattern of `setError(...)` + un-announced UI changes.
9. **Replace `confirm()` with a `<ConfirmDialog>`** — focus-trapped, brand-styled, keyboard-dismissable. ~29 call sites converge on a single component.
10. **Brand-kit contrast validator** in `lib/a11y/contrastValidator.ts` — pure function `validatePalette({primary, secondary, accent, bg, surface, ink}) -> { ok, warnings }`. Wire into the agency/client brand-kit form (when it exists) + log a console warning on `<ThemeInjector>` mount in dev.

### P1 — ships if time

11. **`useArrowNav`** for table rows + sidebar items — improves keyboard nav on the 8 "list" pages with sortable tables.
12. **Touch-target audit** — sweep the chrome + dense forms; bump anything <44px square to 44px.
13. **ARIA labels on icon-only buttons** — the few `↗`, `…`, `+` labels that reach the user.
14. **Field-level form errors** — `aria-invalid` + `aria-describedby` linking the error to the input.
15. **Storefront block error UX** — replace silent `.catch` with a small inline `Failed to load — Retry` button.
16. **Brand-orange → brand-accent** rewrite across 8 blocks — drop the hardcoded `#ff6b35` fallback in favour of `var(--brand-accent)`.

### P2 — round 2 deferral

17. Drag-and-drop a11y for FormBuilder + EditorPage outliner.
18. Light-mode storefront block variants (driven by `--brand-bg` luminance).
19. Per-plugin CSS → Tailwind utility migration (giant churn, separate round).
20. Visual-regression harness expansion (R1 ships a small Playwright shell only).
21. Real-time announcement for cross-tab session changes.

## Shared primitives — what Phase B-D will ship

Under `04 the final portal/portal/src/components/ui/`:

- `LoadingSkeleton.tsx` — line / box / card variants, light + dark surfaces.
- `EmptyState.tsx` — heading, body, optional icon, optional CTA.
- `ErrorBoundary.tsx` — class component (React still needs class for boundaries) with friendly fallback + reset.
- `ConfirmDialog.tsx` — focus-trapped destructive-action confirmation.
- `Toast.tsx` + `ToastOutlet.tsx` — live-region announcement system.
- `SkipToContent.tsx` — first-tab keyboard shortcut.

Under `04 the final portal/portal/src/lib/a11y/`:

- `useFocusTrap.ts` — modal focus management hook.
- `useArrowNav.ts` — list/grid arrow-key navigation.
- `useViewport.ts` — `{ isMobile, isTablet, isDesktop }` SSR-safe.
- `useToast.ts` + `ToastProvider.tsx` — live-region context.
- `contrastValidator.ts` — pure WCAG AA contrast check.

Under `04 the final portal/portal/src/components/chrome/`:

- `MobileNav.tsx` (new) — hamburger toggle + slide-over for mobile sidebar.
- `Sidebar.tsx`, `Topbar.tsx` — adorned with focus rings + responsive classes (logic untouched).

`globals.css` adds an `@layer base` block with the global focus-visible utility, a `.aqua-skeleton` utility (`@apply animate-pulse bg-black/5`), and a `.aqua-skeleton-dark` (`bg-white/5`).

## Cross-team WARNs to log if surfaced during Phase B-D

These are **logic** issues I'd hand back to the owning terminal rather than fixing myself:

- T2 / `ecommerce/src/components/admin/ProductsList.tsx:24` — `window.location.reload()` after delete is brittle (loses scroll, filter state); should call a router refresh.
- T2 / `affiliates/src/components/AffiliatesList.tsx:94` — same.
- T1 / `lib/chrome/sidebarLayout.ts` — has no per-role tooltip text, so the discovered-panel labels (R6 R5 work) are auto-derived from id with no human-friendly fallback.

## Definition of done for the round

- 0 → ≥6 shared UI primitives shipped under `components/ui/`.
- 0 → ≥3 a11y hooks shipped under `lib/a11y/`.
- 0 → 1 global focus-ring CSS layer.
- 0 → 1 mobile sidebar toggle.
- 7/10 → 10/10 modals trap focus.
- 25+ list pages without empty-state → 0.
- All 70 plugin pages wrapped in `<ErrorBoundary>`.
- 1 visual-regression smoke (3 viewports × ~10 pages, asserts no console errors + no obvious layout failures).
- Chapter `04-ux-accessibility-pass.md` written + MASTER row + tasks.md row.
