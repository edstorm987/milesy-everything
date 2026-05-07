# Chapter 121 — Unified vision (2026-05-07)

After the 90-round autonomous build sprint, Ed clarified the end-state.
This chapter captures the consolidated vision so future sessions are
aligned on what we're building toward.

## One website, one login, one origin

`milesymedia-website/` is **the website that stitches it all together**.
It's the Next.js project root. The folder no longer has a space in its
name (T4 renamed during unification Phase 8). All of these live under
the same tree:

- Marketing pages (Next.js routes + legacy static HTML in public/)
- Health Check funnel (`public/health-check/`) — lead magnet
- Business Operating System (`public/business-os/`) — free-tier tool
- Incubator portal (`public/incubator/`) — client-facing
- Aqua agency portal (`src/app/portal/agency/...`)
- Aqua customer portal (`src/app/portal/customer/...`)
- Auth (`/login`, `/signup`) — single gate for all audiences
- API (`src/app/api/...`)

**Old shape (pre-2026-05-07):** two hosts — `:3030` portal + `:3033`
milesy. Cross-host iframes for embedding, separate cookie domains, two
deploys. Replaced.

**New shape:** single Next.js app on one origin. Single cookie. Single
deploy.

## Role-routed landing post-login

`effectiveRole(session)` decides where a successful login lands:

| Role | Audience | Lands on |
|------|----------|----------|
| `agency-owner` / `agency-team` | Founder + Milesy staff | `/portal/agency` |
| `client-owner` / `client-staff` | Felicia and future clients | their per-client custom portal (`/embed/[clientSlug]/...` or `/portal/customer/...` with the client's brand kit) |
| `end-customer` | Felicia's shoppers, members, affiliates | iframe or `/portal/customer/...`, branded as the client's |
| `lead` ← **NEW, Phase 9** | HC graduates, tool users, free-tier signups | `/business-os/...` |

The `lead` role is the only piece not yet built. Phase 9 adds it +
auto-creation from HC completion + BOS auth gating.

## The funnel

```
visitor lands on milesymedia.com
     │
     ├─ "Health Check" CTA  → /health-check/...
     │       │
     │       └─ completion → auto-create `lead` user → /business-os/  (Phase 9)
     │
     ├─ "Resources" nav      → /tools/<tool>/...                       (Phase 10)
     │       │
     │       └─ each tool captures email → creates `lead` → /business-os/
     │
     ├─ "Sign in"            → /login → role-routed
     │
     └─ "Get started"        → /signup → creates agency-owner → /portal/agency
```

## Why single-host matters

1. **One cookie domain** in production — no `Set-Cookie; Domain=` games,
   no third-party cookie blocking on iframe embeds.
2. **One origin** — CSP / CORS / postMessage all simpler. Embed iframes
   in client storefronts continue working via the existing
   `/embed/[clientSlug]/[variant]` route (T1 R016).
3. **One build, one deploy, one observability surface** — half the ops
   complexity.
4. **One auth gate** — `/login` and `/signup` are reachable from every
   surface (marketing header, HC, BOS, Incubator, portal). No more "is
   this user signed in to the right host."

## What does NOT change

- **Plugins still per-client.** Per-client brand kits, plugin sets, and
  portal variants are unchanged. Unification is the host shell, not the
  product model.
- **Three-audience recursion** still applies. Whatever works for the
  agency works for clients works for end-customers.
- **Plugin folder location** — `04-the-final-portal/plugins/` is
  unchanged. Imports updated via tsconfig paths only.
- **Honesty contract** (chapter #68) — every numbers surface across the
  unified site honours it.
- **Brand-kit CSS-vars only** — no hardcoded brand colours anywhere.

## The 5-step move (T4 manual, with Ed)

1. **Move portal Next.js into `milesymedia-website/`** (`git mv` of
   package.json, src/, public/, configs). ✅ landed
   2026-05-07T12:10Z — `portal/` directory removed.
2. **Drop HC / BOS / Incubator into `public/`** as static sub-apps.
3. **Seed default founder user** (`ed@milesymedia.com` / `123` —
   confirmed at execution time).
4. **Wire marketing "Sign in" CTAs to `/login`** across all surfaces.
5. **Cleanup + this chapter.**

## Forward roadmap (post-unification)

- **Phase 9**: `lead` role + BOS auth gate + HC→lead auto-signup.
- **Phase 10**: Resources nav + first public tool.
- **Phase 11 (T6)**: production gate — real connectors, custom domains,
  CI/CD, observability.

## See also

- Chapter 19 architecture (pool-model multi-tenancy) — load-bearing for
  the unification.
- Chapter 91 embed-foundation route (T1 R016) — the iframe contract that
  survives unification.
- Chapter 92 sidebar polish (T1 R017) — Aqua HQ canonical six.
- Chapter 117 signup flow (T1 R020) — the auth gate the unification
  hooks marketing CTAs into.
- Chapter 120 session security (T1 R021) — the security surface the
  unified host inherits.
