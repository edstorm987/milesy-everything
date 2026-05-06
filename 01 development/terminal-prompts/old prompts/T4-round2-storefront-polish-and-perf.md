/loop

# T4 — Round 2: Storefront polish + performance pass

R1 you nailed the admin surface — 5 UI primitives, 4 a11y hooks,
chrome upgrades, mobile drawer, contrast validator, smoke harness,
chapters #45/#46. R2 turns the same lens on the **storefront +
end-customer surfaces + per-client portals** — and adds a
performance pass on top.

## Working environment

- Repo / local / branch — same as R1.

## Messaging

- **Outbox**: `01 development/messages/terminal-4/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-4/from-orchestrator.md`

## Mandatory pre-read

1. Your R1 chapters: `04-ux-audit.md`, `04-ux-accessibility-pass.md`
2. `04-end-customer-flow.md` (T1 R5 — `/portal/customer` + iframe-login)
3. `04-client-portal-luv-and-ker.md` (T5 R1 — first per-client portal)
4. `04-plugin-website-editor-round5.md` (T3 R5 — 18 cross-plugin storefront block renderers)
5. The 18 storefront block components — the polish target

## Scope — four phases

### Phase A: Storefront block UX

For all 18 cross-plugin renderers (ecommerce 8 + memberships 3 +
affiliates 3 + forms 1 + CRM 1 + donation-button):
- Skeleton loading state (use R1's LoadingSkeleton).
- Empty / zero-state ("No products yet", "No active subscriptions", etc).
- Error state ("Couldn't load — retry").
- Focus rings on every interactive element (consistent with R1's
  global `focus-visible` rule).
- Touch-target sizing on mobile (min 44px on tap targets).

### Phase B: End-customer flow polish

`/portal/customer/*` + `/embed/login` — these are end-user-facing,
tighter polish bar than admin:
- Smoother login → account transition (avoid layout flash).
- iframe-aware: when embedded, no fixed positioning + no full-height
  drawers (use R1's `useViewport` + an `isEmbedded()` helper).
- Per-client brand colours apply correctly (validate via contrast
  validator).

### Phase C: Per-client portal polish

T5's `clients/luv-and-ker/` — first real per-client portal.
- Adopt R1's UI primitives + a11y hooks + globals.css (lift
  selectively — they're in `portal/`, your R2 can copy or
  workspace-dep).
- Brand-kit injection rendering check.
- Empty states for each plugin's customer-facing block.

### Phase D: Performance pass + smoke

- Bundle analysis (`next build --profile`) — flag any chunk >300KB.
- Lazy-load + dynamic-import for heavy editor components when in
  storefront context.
- Image optimization audit (Next/Image where possible).
- Server caching: add `revalidate` hints on read-heavy server
  components.
- Smoke harness extension: `npm run smoke:perf` — Lighthouse-style
  pass against representative pages, asserts FCP < 2.5s + TTI < 4s
  on local dev.

## NOT in scope

- Don't change plugin business logic.
- Don't redesign storefront blocks (visually) — just polish the
  states.
- Don't touch the editor admin surface beyond what R1 already did.

## Loop discipline

Standard. `<<autonomous-loop-dynamic>>`.

## When done

1. All 4 phases shipped + tsc clean.
2. Smoke harness `npm run smoke:perf` green.
3. Chapter `04-ux-storefront-perf-pass.md` documenting:
   - State patterns adopted.
   - End-customer + embed-login polish details.
   - Per-client portal pattern.
   - Performance budget + budget hits.
4. MASTER row.
5. tasks.md row done.
6. DONE + COMMIT.
