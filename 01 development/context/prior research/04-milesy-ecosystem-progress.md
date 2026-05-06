# 04 · Milesy Media ecosystem — T4 progress log

Author: T4 (Milesy Media website terminal)
Status: in-progress, append-only summary for orchestrator visibility.
Last update: 2026-05-07.

---

## What's being built

The Ed↔T4 thread has expanded from "polish the static milesymedia site" into the full pre-customer ecosystem that funnels into the Aqua portal. Three apps now live side-by-side in `04-the-final-portal/milesymedia website/`:

```
milesymedia website/
├── index.html / login.html / admin.html / styles.css   (the static site, served at :3030 via portal rewrites)
├── lead magnet app/                                    (interactive Health Check, served standalone at :3033)
└── business-os app/                                    (the "omega lead magnet" — served standalone at :3034)
```

The vision Ed has articulated:

1. **Content marketing** drops on social.
2. **milesymedia.co** hero CTA → free **Health Check** (lead magnet app).
3. End of Health Check → **🎁 free gift: claim your Business OS** (BOS app signup).
4. Business OS becomes a **niche-specific** workspace (Therapist OS / Roofer OS / Salon OS / Coach OS / Restaurant OS / Retailer OS / Agency OS / Generic) — pre-customer portal where they read modules, install paid add-ons, talk to Aqua AI, and track XP/level/streak/achievements like a Roblox tycoon.
5. Inside the BOS, **My Custom Roadmap** is a Pro-locked sidebar item — paid 1-off £750 deep-dive consult with a senior strategist (or included with retainer).
6. Once they upgrade to retainer, the **Aqua agency portal** unlocks in the same sidebar (currently locked-with-Upgrade-pill in pre-customer mode), and the BOS gets rebranded to "Resources" while the 9 add-ons (Inbox / Website Editor / Ecommerce / Fulfilment / Memberships / Affiliates / CRM / Marketing / Finance) appear as installed sidebar items.

This is the full funnel: **content → free Health Check → free Business OS → Custom Roadmap (paid) → retainer (Aqua portal unlocks)**.

---

## Lead magnet app (`:3033`) — what's shipped

- 5 topics, each with **Beginner / Intermediate / Professional** tier cards. Per-tier exercise types: task / reveal / choice / multi / slider / url / text.
- "Pub test" interactive opener for SEO Beginner.
- Persistent floating action row on every step (📞 Call us · 📊 Skip to results · ↷ Skip topic).
- Money-mirror dashboard: leak-card row (% find you, attention seconds, channel-dependence), per-topic score cards, **action-rich quick wins** with multi-route CTAs (📖 Read guide / 📞 Call us / ⚡ We'll do it for you), section navigator to re-enter topics.
- **🎁 Gift card at end** — claim your free BOS (cross-port-rewritten in dev to localhost:3034). Flips to "← Back to my BOS" if a `bos.user` already exists on the same origin.
- On completion: writes `bos.healthCheck` summary + grants 250 XP + 8h "time saved" + the "Self-aware" achievement to whoever's logged into the BOS on the same origin.

## Business OS app (`:3034`) — what's shipped

Routes: `/` (signup), `/app.html` (dashboard), `/database.html` (modules table), `/module.html` (lesson), `/marketplace.html` (add-ons), `/roadmap.html` (Pro-locked custom roadmap).

Shared `bos.js` is the single source of truth for: user hydration, mode (free/customer), niche, XP/level/streak/time-saved, health-check ingestion, sidebar adaptation, dev bar, achievements, Aqua AI widget, and marketplace tile rendering.

Notable surfaces:
- **Niche picker** on signup (8 visual tiles).
- **Gamified topbar** (level ring, XP bar, streak flame, time-saved tally).
- **Achievements** grid (8 cards, gold-on-unlock with toast).
- **Health-check summary card** on dashboard (empty-state CTA when missing).
- **Add-ons strip** + featured modules + library slot.
- **Marketplace** with category filters, prices, "Add to my OS" mailto, banner that hides for customers.
- **Module template** with outline-sidebar, callouts, 3-route CTA at bottom.
- **Roadmap page** — Pro-locked hero + blurred sneak-peek timeline (free); active phase cards with milestone pips (customer).
- **Aqua AI** floating launcher + slide-in panel (5 free messages, niche- and HC-aware mocked replies, upgrade mailto).
- **Dev bar** (bottom-centre pill): page links, mode toggle, +50 XP test, reset-session.
- **Dev bypass** on the auth screen seeds a Therapist OS demo user with 350 XP, 2-day streak, and a mock Health Check so the dashboard demos fully on first click.

The Notion export will drop into `business-os app/notion-export/` and replace placeholder content in two clearly-marked slots (one on `/app.html`, one on `/database.html`). Vault context confirmed: AquaOasis-Web (now Milesy Media) → Incubator → BOS Customisation → Resources Lite → Marketing/Billing/Leads/SOPs/Tasks, tone is "executive operating mode / trust the structure".

---

## Stitching contract reminders

- The static milesy site is served at `/` on the portal origin via `vercel.json` + `next.config.ts` rewrites (`/`, `/index.html`, `/login.html`, `/admin.html`, `/styles.css` → `/_milesy/...`). `prepare-milesy.mjs` copies the whole `milesymedia website/` folder into `portal/public/_milesy/` so subfolders (lead magnet app, business-os app, future notion-export) ride along automatically.
- Q-FLAG (still open from earlier rounds): `/health-check.html`, the `/lead magnet app/` and `/business-os app/` subdirs need rewrite entries on the root `vercel.json` + `next.config.ts` for direct-URL visits. Currently only same-origin links from the rewritten static pages work cleanly. Chief commander / T6 to add when ready.
- `lead magnet app/` and `business-os app/` are running on standalone python http.server processes for fast iteration (`/tmp/lead-magnet-3033.log`, `/tmp/business-os-3034.log`).

## Today's plan (Ed-stated, 2026-05-07)

1. Polish responsiveness across all three apps (mobile breakpoints, padding, centering).
2. Revamp `milesymedia website/index.html` to fit the ecosystem narrative: process / quick-wins / earn-our-trust framing, VSL slot, fleshed-out services page (bespoke software → websites → GMB photoshoots).
3. Get the Health Check airtight, then deepen the Business OS (niche-specific module library, real Lighthouse hookup for Pro tier, real Aqua AI hookup).
4. Health-check delivery plan documented in `lead magnet app/DELIVERY-PLAN.md` so we know what "shipping" means.
5. Wait on Notion export to populate BOS library content.
