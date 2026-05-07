# Ed's requirements — Aqua Portal

> Living document. Ed edits this freely; every Claude session reads it
> before doing work. If a session is about to do something that contradicts
> a rule here, it stops and asks Ed first.
>
> Synthesised from conversation 2026-05-04. Ed: amend as needed.

## Mission

Build **Milesy Media's agency platform** — a single web app where:

- **My team** logs in and runs the agency.
- **Our clients** (Felicia is the first; more to come) log in and use a
  branded portal that's completely custom to them.
- **Our clients' end-customers** (Felicia's shoppers, members, affiliates)
  log in via an iframe embedded on the client's own website — same engine,
  same auth, but rendered with the client's branding.

The platform is called **Aqua portal** — "a portal to anywhere." Same
machinery powers every level. New features ship as plugins.

## The three audiences

| audience | who | logs in where | sees what |
|----------|-----|---------------|-----------|
| Agency team | Me + Milesy staff (Founder, Manager, Employee, Freelancer) | milesymedia.com/login | Agency-internal: HR / finance / fulfillment / client list. Role-gated. |
| Clients | Felicia, future clients (ClientOwner / ClientStaff) | milesymedia.com/login OR iframe on their own site | Branded portal scoped to them. Stage + installed plugins decide the surface. |
| End-customers | Felicia's shoppers / members / affiliates | iframe-embedded on Felicia's own website | Login + their account view, branded as Felicia's. Powered by THIS app under the hood. |

## Core flows that MUST work for v1

1. **Sign in** at milesymedia.com (or via iframe on a client's site). One cookie, role-routed.
2. **Team creates a client.** Picks a phase preset (Discovery / Design / Development / Onboarding / Live / Churned). Phase auto-installs starter plugins + applies a starter portal variant.
3. **Team installs plugins per client** from a marketplace UI (search + filter + presets).
4. **Team and client both work the checklist.** Each phase has internal tasks + client tasks. Both sides tick. Phase advances when complete (team confirms).
5. **Phase transition** auto-disables old phase's plugins (config preserved — reversible) and enables new phase's plugins.
6. **Client opens their branded portal.** Their logo, colours, fonts. Their installed plugins. Their phase's variant.
7. **Demo button** on the marketing site drops a visitor into a sandboxed agency with seed data, header toggle between agency POV and client POV.
8. **First two pre-vetted plugins ship**: website editor (port from `02`) + ecommerce (port from `02`).

## Hard constraints

- **Total customisation per client.** Brand kit (logo, colours, fonts), custom domains later, custom plugin set, custom portal variants — all per-client. Don't bake assumptions about "every client looks the same."
- **Plugin-based.** Every feature ships as a manifest in `04/plugins/`. Adding a feature = adding a plugin folder. Don't bake features into foundation.
- **Three-level recursion.** Agency → Client → End-customer. Whatever works for the agency must also work nested inside a client's own portal. The same login engine that signs in the agency owner also signs in Felicia's customer on luvandker.com.
- **Scalable.** Pool-model multi-tenancy on Postgres. Tens to thousands of agencies must be possible on one deployment.
- **Aqua = a portal to anywhere.** Whatever surface the client wants — login, ecommerce checkout, members area, affiliate dashboard, a custom dashboard with a custom plugin — the same engine renders it, branded to them.
- **No half-built features in production.** If something's stubbed, hide it behind a feature flag or don't ship it. Better to ship 5 working plugins than 20 stubs.

## Aesthetic & UX commitments

- **Felicia's portal is the design north star.** Whatever we build for
  v1 must look at least as polished as her storefront does.
- **Brand kit drives everything.** No hardcoded brand colours in any
  plugin or block. CSS variables only.
- **Fast.** Server-rendered, prompt-cached, lazy-loaded. Slow is worse
  than ugly.

## Future / not in scope for v1

- Real-time collaboration in the editor (CRDT / Yjs).
- AI page builder ("describe a page → block tree").
- Native mobile apps.
- Custom-domain provisioning per client (the code is in `02`, just not wired).
- Stripe Connect for affiliate payouts.
- Marketplace tiers / paid plugins / revenue share.
- Per-tenant database isolation.
- Client-side self-serve plugin install (v1 is team-only install).

## Operating preferences

- **Three Claude terminals + one chief commander session.** Commander
  drafts prompts; terminals execute; results flow through the dev folder.
- **Dev folder is the shared bus.** Phases / tasks / ideas / context
  tree all live in `01 development/`. Every session reads + writes there.
- **NotebookLM** as the outside-research surface. We query it for
  patterns, references, anything not in our codebase.
- **Don't run destructive commands.** No `rm -rf`, no force-pushes, no
  config deletions without explicit ok.

## Brand & identity

- Agency: **Milesy Media** (positioning: performance marketing agency for
  ambitious brands).
- Platform name: **Aqua portal**.
- First client (real): **Felicia / Luv & Ker / Odo by Felicia** (Ghanaian
  heritage skincare).
- Demo client (sandboxed): a Felicia mirror — clearly labelled "Demo".

## What I want to feel

- I should be able to **log in once** at milesymedia.com and run my agency
  for the day. HR, finance, marketing, fulfillment, client switching —
  all in one app.
- A new client should onboard in **minutes**, not days. Pick a phase, fill
  a form, plugins install themselves.
- A client should feel like the portal **belongs to them** — not a
  rebranded SaaS, but THEIR thing. Their logo. Their colour. Their
  vocabulary.
- Anything I want to add later — HR module, payroll, custom client widget
  — should be **a plugin**, not a refactor.

— Ed (synthesised by Claude on 2026-05-04 — edit freely)

---

## Unified vision update — 2026-05-07

After the autonomous build sprint shipped 90+ rounds, Ed clarified the
end-state shape. milesymedia.com is **the website that stitches it all
together** — one origin, one cookie, one login. Folder is now
`04-the-final-portal/milesymedia-website/` (no spaces) and the Next.js
project lives at that root.

### Single-host architecture

```
milesymedia-website/                ← Next.js root, single :3030 (single prod origin later)
├── src/app/
│   ├── page.tsx, (marketing)/...   marketing pages
│   ├── login, signup               single auth gate for ALL audiences
│   ├── portal/agency/...           agency-team surface (T1)
│   ├── portal/customer/...         end-customer surface (T1)
│   └── api/...                     auth + tenant + plugin endpoints
└── public/
    ├── health-check/               HC funnel (lead magnet)
    ├── business-os/                free-tier BOS for leads
    ├── incubator/                  client-facing Incubator-phase portal
    └── tools/                      future Resources nav (rank-my-site, etc.)
```

### One login → role-routed landing

| User type | Role | Lands on |
|-----------|------|----------|
| Founder / agency staff | `agency-owner` / `agency-team` | `/portal/agency` |
| Felicia-type clients | `client-owner` / `client-staff` | their custom portal (`/embed/[clientSlug]/...` or `/portal/customer/...`) |
| Felicia's customers | `end-customer` | iframe-embedded or `/portal/customer/...`, branded as the client's |
| Free-tier leads (HC graduates, tool users) | `lead` ← **new role to add** | `/business-os/...` |

The `lead` role is the one piece not yet built. Natural next round:
- HC completion auto-creates `lead` user and signs them in.
- BOS gates on auth and reads user data from foundation storage instead
  of pure localStorage.

### Resources nav (future, additive)

Public lead-generation tools (rank-my-website, rank-my-xyz, etc.) live
in `public/tools/` as static apps. Each one captures email → creates
`lead` user → drops them into the BOS funnel. Same pattern as HC.
Bespoke client tools build on top of this scaffolding later.

### Why this shape matters

- **One cookie domain** → no auth iframe seams in production.
- **One origin** → CSP / CORS / postMessage all simpler.
- **One Next.js project** → one build, one deploy, one observability surface.
- **Plugins still per-client** — the unification is just the host shell.
  Per-client brand kits, plugin sets, and portal variants are unchanged.

### Standing constraints carry over

- Brand-kit CSS-vars only (no hardcoded brand colours).
- Honesty contract (chapter #68) for any number / metric surface.
- No real API wiring on the public-funnel side until T6 prod gate.
- The website is the funnel; the portal is the product. Both live under
  the same `milesymedia-website/` tree from now on.

— synthesised by Claude on 2026-05-07 with Ed's explicit override of
the "commander must not edit eds requirments.md" rule. Ed: amend freely.

---

## Ship Plan v1 — locked 2026-05-07

The full plan lives in chapter **#124 `04-ship-plan-v1.md`** (the
single source of truth for what ships when). Highlights for Ed's
recall, in 60 seconds:

**What "shipped" means:** Ed signs in as founder (real password) →
creates Felicia → Felicia signs in to her custom-branded portal →
Felicia's customer signs in via embedded login → a milesymedia.com
visitor hits HC → completes → auto-signed-in as `lead` → lands in
BOS. All on a hardened production deploy.

**Six workstreams, three sprints:**

| WS | What | Owner | Sprint |
|----|------|-------|--------|
| A | Auth completion (role-aware redirect, `lead` role, founder password rotation) | T1 | 1 |
| B | Public funnel (HC→lead plugin, BOS auth gate, rank-my-website tool) | T2 | 1–2 |
| C | Multi-agency core (`agencyIds[]`, Topbar agency switcher) | T1 | 1–2 |
| D | Real-data wiring v1 (SMTP, basic Stripe, GA4 read-only) | T2 | 2–3 |
| E | Production hardening (Postgres, durable nonces, env secrets, Sentry) | T1 | 2–3 |
| F | First real client (Felicia / Luv & Ker portal end-to-end) | T5 | 3 |

**Ship gate:** every workstream complete + founder password ≠ `"123"` +
deploy runbook current + smoke 200 across every surface on the deploy
preview + Ed performs a manual operator dry-run and signs off.

**What's NOT in v1:** Phase 12 R3+ (domain-aware marketing satellites),
real Stripe money flow, Resources tools beyond rank-my-website,
iframe→React rewrites of HC/Incubator, AI features. All post-ship.

T4 stays manual through all three sprints for UI/copy polish + the
chapter-#123 carry-forwards. T1/T2/T3 work the autonomous queues.
