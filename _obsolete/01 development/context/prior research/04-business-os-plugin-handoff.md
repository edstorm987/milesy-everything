# 04 · Business OS — plugin handoff spec

Author: T4
Status: in-progress · plugin extraction is future-state, not this round.

## Context

The standalone Business OS app at `04-the-final-portal/milesymedia website/business-os app/` is currently a static, self-contained lead-magnet experience served on `:3034`. Ed's stated end-state:

1. The BOS evolves into a **portal plugin** (working name `@aqua/plugin-business-os`) bundled with new agency clients alongside the Incubator plugin.
2. The standalone version stays as the **free lead-magnet tier** — anyone can sign up at `/`. Sufficient features unlocked to be genuinely valuable, but the deepest features are gated behind a marketplace upgrade.
3. When a free user upgrades to a Milesy retainer client, their BOS is rebranded "Resources" in the agency portal sidebar, and the plugin features unlock.

## Scope split (2026-05-07)

- **T4 (this terminal)**: BOS lead-magnet tier completion. Out of scope: Incubator content.
- **Other terminal / orchestrator**: Incubator (Aqua-portal-side onboarding flow). Inspirational reference at `~/Desktop/obsidian/Mission Ed/05 Business & Ventures/Client SystemOs - Database/Aqua Resources - Lite/Aqua Recourses/Incubator Modules - Rebirth/`.

## What the lead-magnet tier ships with

Free for life, no card. Useful immediately:

- Dashboard with onboarding progress, money-mirror summary from Health Check, gamification (XP/level/streak/time-saved/achievements).
- **Run** section: Company Profile (editable), Leads & Clients HQ (kanban), Trackers & KPIs (5 numbers + time tracker), Tasks (4-column kanban), Documents (folders + search + free templates).
- **Learn** section: Modules library (5 written lessons + ~15 coming-soon stubs), Guides, Assessments link.
- **Premium** tease: My Custom Roadmap (Pro-locked).
- **Add-ons**: Marketplace with 9 plug-in tiles (mailto stubs).
- **Get help**: dedicated Help page + tel/mailto links + Aqua AI floating widget.

## What the marketplace plugin upgrade unlocks (future plugin tier)

Mapped to the screenshots Ed dropped at `01 development/ed-dropbox/screenshots/business os/`:

- Full module library (the Incubator content, premium SOPs).
- **Aqua Resources Lite** library — bonus modules, AI assistants, AquaSuite GHL tutorial.
- **SOP Hub** with 6 categories (Standards & Internal · Leads & Nurturing · Sales & Discovery · Onboarding & Service Delivery · Longevity Lagoon · Existing System).
- **Knowledge / Notes / Data** — locked premium docs (Total Clarity Aqua Document, AquaPlaybook).
- **Branding Hub**, **Social Media Planner**, **Upload Zone**, **Collaboration Centre** (each is a separate tile in Ed's Notion TOC).
- Aqua AI unlimited messages.
- Custom Roadmap.

## Plugin extraction shape (when we get there)

The eventual `@aqua/plugin-business-os` will:

- Live at `04-the-final-portal/plugins/business-os/`.
- Mount on the portal sidebar under "Resources" (label-swap done by client niche / mode).
- Read user state from the portal's auth (replacing `localStorage.bos.user`).
- Write to a per-tenant Postgres table (`business_os_state`) instead of localStorage — schemas: `kpis`, `tasks`, `leads`, `docs`, `company_profile`, `progress` (XP/streak/achievements), `health_check_summary`.
- Re-use the same HTML shell + `bos.js` rendering — just swap the storage layer.
- Inherit Aqua portal auth/session — no second login.
- Niche-specific seed data (Therapist OS / Roofer OS / Salon OS / etc) drives initial module visibility, default SOPs, default KPI weights.

The existing data schema in localStorage is deliberately compatible with this future Postgres shape — any local state migrates cleanly when a free user upgrades:

```
bos.user            → tenants.user_profile
bos.mode            → tenants.tier  ('free' | 'customer')
bos.progress        → business_os_progress
bos.healthCheck     → business_os_health_check
bos.company         → business_os_company
bos.kpis            → business_os_kpis
bos.timer           → business_os_time_log
bos.tasks           → business_os_tasks
bos.leads           → business_os_leads
bos.docs            → business_os_docs
bos.ai              → business_os_ai_quota
```

## Gating contract

Every "Pro" / "locked" surface in the BOS today is functionally a marketplace mailto. When the plugin lands, the same surfaces become real entitlement checks (e.g. `if (tenant.has_addon('roadmap'))`). The UI doesn't need to change — only the gating function.

## Open questions

1. **Pricing** — is BOS a single £X/mo plugin, or do individual upgrades (Roadmap / Aqua AI Pro / SOP Hub) sell separately?
2. **Migration UX** — when a free user upgrades, do we silently migrate their localStorage to Postgres on first portal login, or prompt them?
3. **Niche packs** — the niche selector currently sets a label only. Plugin tier should ship niche-specific module sets, default SOPs, default KPI definitions. Spec the per-niche content packs separately when the plugin lands.
