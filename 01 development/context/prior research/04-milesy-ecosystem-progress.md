# 04 · Milesy ecosystem — current state snapshot

Author: T4
Last update: 2026-05-07.
Status: living document. Replaces the snapshot section of itself each round.

This is the **single most up-to-date description** of what T4 has built. Read this first if you're picking up the work cold.

---

## Three apps, one origin

```
04-the-final-portal/milesymedia website/                  ← T4 scope
├── index.html / login.html / admin.html / styles.css     marketing site (rewritten onto /
│                                                          via portal vercel.json + next.config.ts)
├── lead magnet app/                                       Health Check (sub-folder, served at
│   ├── index.html                                         /lead magnet app/ on portal origin)
│   ├── hc-questions.js                                    default AREAS — shared with admin
│   └── styles.css
└── business-os app/                                       Business OS (sub-folder)
    ├── index.html         signup / dev bypass
    ├── app.html           home dashboard
    ├── company.html       editable Company Profile
    ├── leads.html         sales-pipeline kanban (Pro)
    ├── trackers.html      KPIs + time-tracker + connectors (Pro)
    ├── tasks.html         kanban to-dos (Pro)
    ├── docs.html          SOPs / templates (Pro)
    ├── database.html      modules library (Incubator tracks)
    ├── module.html        ?id=… renderer over lessons.js
    ├── marketplace.html   add-ons grid
    ├── roadmap.html       custom roadmap (Pro tease)
    ├── help.html          Need Some Help? page
    ├── request.html       Request a feature (curated free tier)
    ├── admin.html         admin: Overview / Leads / Reports / Questions editor (gated)
    ├── lessons.js         5 fully-written lessons
    ├── bos.js             SHARED runtime (sidebar / branding / mode / AI / progress / etc)
    └── styles.css
```

**Same-origin** — both apps share `localStorage`. HC writes `bos.healthCheck` + `bos.leads`; BOS reads them. No cross-port hack.

Dev: single `python3 -m http.server 3033` from `04-the-final-portal/milesymedia website/`. Log at `/tmp/unified-3033.log`.

Production stitch: portal's `vercel.json` + `next.config.ts` rewrite `/`, `/index.html`, `/login.html`, `/admin.html`, `/styles.css` → `/_milesy/...`. `prepare-milesy.mjs` copies the whole folder into `portal/public/_milesy/` so subfolders (lead magnet app, business-os app) ride along automatically.

**Q-FLAG (still open):** root rewrites don't include `/health-check.html`, `/lead magnet app/`, `/business-os app/`. Direct-URL visits will 404 on production until chief-commander/T6 adds rewrite entries. Same-origin links from rewritten static pages work today via JS shim in index.html.

---

## The funnel (Ed's vision, end-to-end)

```
1. Content marketing (social)
2. milesymedia.co hero CTA → free Health Check
3. End of HC → 🎁 free gift: claim your Business OS
4. Business OS = niche-specific lead-magnet workspace
   (8 niches: Therapist / Roofer / Salon / Coach / Restaurant
    / Retailer / Agency / Generic)
5. Inside BOS, "My Custom Roadmap" is a Pro-locked sidebar item
   — paid 1-off £750 strategy consult (or included w/ retainer)
6. Marketplace add-ons (9 plug-in tiles) — pay-as-you-need
7. Upgrade to Milesy retainer → Aqua agency portal unlocks in
   the same sidebar. BOS renames to "Resources" for customers.
```

Out of T4 scope: Aqua-portal-side **Incubator** (handled by orchestrator / other terminal). T4 stays focused on the BOS lead-magnet tier.

---

## The free-tier sidebar (curated, not exhaustive)

Ed's 2026-05-07 ruling: free should NOT include pipelines / numbers / tasks / files. Free is **personal and curated** — user tells us what they need via the Request-a-feature page, we switch it on.

```
My business     · Home · About my business
Learn           · Lessons · Health check
Get help        · Need help? · Ask Aqua AI · Book a free call · Request a feature
More            · Custom roadmap (Pro) · Aqua agency portal (locked)
```

**Pro mode** unlocks: My customers (leads) · My numbers (trackers) · My to-dos (tasks) · My files (docs). bos.js renders the sidebar mode-aware. Free users hitting Pro pages directly see a clean lockup with Request-access + Marketplace CTAs.

Mode toggle: dev bar (only visible with `?dev=1` sticky flag).

---

## What works on the free tier (genuinely useful)

- **Home page**: friendly greeting + niche tagline + "Customise" branding entry + ONE adaptive "Your next move" card (HC → company profile → first lesson → first to-do → "you're set") + 3 friendly cards (Read a lesson / Ask AI / Need something else?) + HC-derived leak strip when HC complete.
- **Company Profile** (`/company.html`): inline-editable cards — 30-second answer, customer, offer architecture, brand, founder, team rows, suppliers, critical accounts. Edit toggle persists everything to `bos.company`.
- **Health Check assessment** end-to-end (see HC chapter for details).
- **5 lessons** (1.1 Chrome Profile · 1.5 Core Principles · 3.5 Super Sales · 4.4 Operations · 5.2 Referral Alchemy) rendered via `module.html?id=…` from `lessons.js`. Other lessons in the library are visible-but-locked with a Pro tag.
- **Aqua AI floating widget**: 5 free messages, niche- and HC-aware mocked replies. Suggestion chips. Upgrade mailto in footer.
- **Gamification (slim)**: XP / level / streak / time-saved / achievements stored in `bos.progress`. Slim home progress strip only shows after they've earned XP.
- **Branding**: logo file upload (FileReader → data URL, 1MB cap) + colour pickers + company name. Applied via CSS vars and brand-label swaps. First-visit modal nudge. Re-openable from Customise button.
- **Request a feature** (`/request.html`): textarea + 7 category tags + urgency, composes structured mailto with user/business/niche/urgency prefilled.
- **Help page** (`/help.html`): support card + 6-action grid + FAQ.

---

## What's gated to Pro (working but locked)

- **Leads & Clients HQ** (`/leads.html`) — sales pipeline kanban with 6 stages, per-stage £ totals, lead cards w/ source/value/icons + stage-move dropdown.
- **Trackers & KPIs** (`/trackers.html`) — 5 KPIs (manual edit), time-tracker widget, connectors strip (QuickBooks/Stripe/Sheets/Manual).
- **Tasks** (`/tasks.html`) — 4-column kanban (Today/Week/Backlog/Done) with quick-add + inline edit + move buttons.
- **Documents** (`/docs.html`) — 6 folders + live search + seeded file table + 4 free template downloads.

Each shows a clean lockup card to free users with `Request access →` + `See add-ons` CTAs.

---

## Marketplace (9 add-ons)

`/marketplace.html` mirrors the eventual portal-plugin tile set:

| id | name | category | £/mo |
|---|---|---|---|
| inbox | All-in-One Inbox | comms | 49 |
| website | Website Editor | site | 79 |
| ecom | Ecommerce | sell | 89 |
| fulfil | Fulfilment | sell | 39 |
| members | Memberships | retain | 39 |
| affil | Affiliates | grow | 29 |
| crm | Client CRM | comms | 49 |
| marketing | Marketing Suite | grow | 59 |
| finance | Finance | ops | 39 |

All "Add to my OS" CTAs are mailto stubs today. Customer-mode flips them to "Installed / Open" pills.

---

## Admin

`/admin.html` (password gate: `milesy` or `aqua`):

- **Overview** tab — KPIs (HC completed / leads / pipeline £ / sign-ups).
- **Leads** tab — all `bos.leads` rows.
- **Reports** tab — HC headlines + leak £ + topic scores.
- **Questions editor** tab — tree (area → tier → steps) editor over the live HC. Saves to `localStorage['bos.hcQuestions']`. Lead-magnet reads override on next load. Shared default lives in `lead magnet app/hc-questions.js` (`window.HC_AREAS`).

---

## Storage shape (single source of truth)

All BOS state lives under `bos.*` keys in `localStorage`. Schema is deliberately compatible with the future Postgres plugin tables — see `04-business-os-plugin-handoff.md` for the migration mapping.

```
bos.user            { name, business, email, niche, dev? }
bos.mode            'free' | 'customer'
bos.brand           { companyName, logo (data URL), primary, secondary }
bos.progress        { xp, timeSavedHrs, streak, lastActive, completed, achievements[] }
bos.healthCheck     { headline, leakEstimate, topics[{name, icon, score, status}] }
bos.company         { oneliner, mission, usp, customer, problem, area, lead-offer,
                      flagship, premium, aov, tone, colour-1, colour-2, brand-folder,
                      founder-name/role/email/mobile, team[], suppliers[], accounts[] }
bos.kpis            { leads, conversion, aov, ontime, runway }
bos.timer           { running: {task, startedAt} | null, sessions[] }
bos.tasks           { today[], week[], backlog[], done[] }
bos.leads           [{ id, name, source, value, stage, fromHc?, contact? }, …]
bos.docs            [{ name, folder, type, updated }, …]
bos.ai              { remaining, cap, history[] }
bos.adminUnlocked   '1' if password ever entered
bos.dev             '1' if ?dev=1 ever set (sticky)
bos.hcQuestions     full AREAS shape — admin override of HC defaults
hc.contact          { name, contact, capturedAt: 'progress-save' | 'results-grab' }
hc.progressDismissed '1' if user skipped the post-Q5 modal
```

---

## Cross-cutting decisions

- **Tone**: "trust the structure", executive-operating-mode (vault). Every page has an optional Notion-style "Introduction — please open me!" callout (collapsed by default).
- **Honesty contract on the HC results**: no fabricated numbers, range-not-point money headline, per-topic leak cards only fill when answered, transparency block listing real-data connectors. See `04-hc-results-honesty.md`.
- **Personalisation > pre-loaded depth**: free user gets the curated 6-item sidebar, not the 12-page maximalist version. Request a feature is the lever.
- **Future plugin extraction**: the BOS becomes `@aqua/plugin-business-os` mounted in the agency portal sidebar. localStorage shapes deliberately mirror the Postgres tables.

---

## Cross-references

- `04-business-os-plugin-handoff.md` — future plugin shape + storage migration map
- `04-hc-results-honesty.md` — the no-fabricated-numbers ruling + range maths
- `04-admin-questions-editor.md` — tree editor + live HC bridge
- `04-free-vs-pro-gating.md` — sidebar mode rules + Pro lockup pattern
- `04-open-followups.md` — every open Q / TODO / mesh hazard
- `lead magnet app/DELIVERY-PLAN.md` — shippable-tier delivery plan
