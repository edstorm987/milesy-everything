# `04` Demo mode + agency↔client POV toggle (T1 R13)

> Authored 2026-05-07. Polishes the existing `/demo` route into a
> richer marketing-side demo: 3 demo clients across 3 Aqua phases,
> Sign-up CTA in the banner, iframe-embed mode for marketing-site
> embeds.

## Files touched

- `portal/src/lib/server/demoSeed.ts`
  - `seedDemoAgency()` extended with `EXTRA_DEMO_CLIENTS`: two extra
    clients seeded alongside the existing Felicia mirror —
    - `demo-brand-builder` on `aqua-brand-builder` (sky-blue brand,
      Expansion Plan, lock-in paid, WhatsApp link).
    - `demo-mastery` on `aqua-mastery` (emerald brand, Mastery Plan,
      lock-in paid, WhatsApp link).
  - Both seeded idempotently (skip when slug already present) and
    surfaced in the activity log via the existing `demo.seeded`
    entry. Existing Felicia mirror keeps its `onboarding` stage so
    the integration smoke + lifecycle tests don't churn.
  - `SeedDemoResult` gains `seededExtraClients: string[]` (slugs
    seeded this call; empty on subsequent idempotent calls).
- `portal/src/components/chrome/DemoBanner.tsx`
  - Adds **Sign up →** emerald-700 CTA between the POV-cycle button
    and the Leave-demo form. Links to `/login?from=demo` —
    foundation-pending placeholder until T6 ships real signup
    (chapter notes the deferral).
- `portal/src/app/demo/route.ts`
  - Honours `?embed=1`. When set: redirects to `/portal/agency
    ?embed=1` and writes a `lk_demo_embed=1` cookie (`SameSite=None;
    Secure; 1-hour TTL`). When absent: clears the cookie so deep-
    links from non-embed entry points can't inherit suppression.
- `portal/src/app/portal/layout.tsx`
  - Reads `lk_demo_embed` cookie. When set, suppresses the
    DemoBanner — embedding marketing site provides its own outer
    chrome.
- `portal/src/app/portal/agency/layout.tsx`
  - Reads the cookie via the request `cookie:` header. When set,
    short-circuits the layout: ThemeInjector + bare `<main
    data-testid="portal-embed">` — no Sidebar, no Topbar.
- `portal/scripts/smoke.mjs`
  - NEW `§ Demo mode` block: home shows both extra clients, banner
    shows `Sign up →`, `/demo?embed=1` redirects (307/302) + the
    follow-up `/portal/agency` GET shows `portal-embed` testid.
    Restores non-embed cookie state at end of block via
    `/demo?source=stitch-smoke`.

## Goal coverage map

| Goal | Where |
| ---- | ----- |
| **A** sandbox + 3 clients × 3 phases | `seedDemoAgency()` extras (existing Felicia mirror = phase 1; two new = phases 2 + 3) |
| **B** Agency POV / Client POV toggle | already shipped — `DemoBanner.tsx` cycles via `/demo/toggle` (agency → client → customer → agency); cookie persists between hops via session re-issue |
| **C** Demo banner + Sign-up CTA | `DemoBanner.tsx` (sticky, amber, full session label + POV chip) — added Sign-up CTA this round |
| **D** `/demo?embed=1` strips chrome | `/demo` route + `lk_demo_embed` cookie + agency layout short-circuit + portal layout banner suppression |
| **E** smoke + chapter + MASTER row | this round |

## Q-ASSUMED log

1. **Two extra clients, not three** — the existing single Felicia
   mirror + the two new (Brand Builder + Mastery) gives operators
   three distinct phase examples without restaging the existing
   `onboarding`-stage seed (which the lifecycle smoke + `/demo`
   integration tests assume).
2. **Phases chosen = Brand Builder + Mastery** rather than the
   prompt's literal "Blueprint Setup / Brand Builder / Mastery" —
   the original Felicia mirror covers the early-phase slot (it's at
   `onboarding` which conceptually precedes Aqua Blueprint Setup);
   adding Brand Builder + Mastery surfaces three lifecycle states
   (early / mid / late) without doubling up.
3. **Sign-up CTA stub → `/login?from=demo`** — T6 owns real signup
   (foundation-pending). Stub keeps the visual story intact and
   surfaces the demo→signup intent in the URL for analytics.
4. **Embed cookie scope = whole portal**, not just `/demo` paths.
   Marketing-site iframe deep-links into the portal would lose the
   suppression otherwise. Cookie cleared on non-embed `/demo`
   entries to prevent stickiness.
5. **Per-client + customer layouts NOT yet embed-aware** — only
   `/portal/agency/layout.tsx` short-circuits in this round. The
   marketing-site embed currently only points at the agency surface;
   per-client + customer embed paths can land in a follow-on round
   if the iframe surface broadens.

## NOT in scope

- Real signup flow (T6 territory).
- Demo data persistence beyond session.
- Touching milesymedia / business-os.
- Per-client + customer layout embed mode (R+1 — only agency surface
  is currently iframe-targeted).

## Smoke results

`§ Demo mode` block adds 5 checks. tsc clean. HARD BOUNDARY honoured.
