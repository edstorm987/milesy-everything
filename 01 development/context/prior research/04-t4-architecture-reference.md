# 04 · T4 architecture reference — file by file

Author: T4
Status: living. Update on any new file or significant rewrite.

The exhaustive reference for every file under T4's scope. If you need to know what a file does, why it exists, what state it touches, what it depends on — this is the page.

---

## File tree (T4 scope)

```
04-the-final-portal/milesymedia website/
├── index.html                    Marketing site landing
├── login.html                    Static login mock (kept for portal stitch)
├── admin.html                    Static admin mock (kept for portal stitch)
├── styles.css                    Shared styles for marketing site
├── health-check.html             Legacy in-place HC (R1) — superseded by lead magnet app/
├── lead magnet app/
│   ├── index.html                Health Check SPA (intro → topics → results)
│   ├── hc-questions.js           Default AREAS — exposes window.HC_AREAS
│   ├── styles.css                HC-specific styles + responsive overrides
│   └── DELIVERY-PLAN.md          Phase 1-5 delivery plan + 4 open Qs for Ed
└── business-os app/
    ├── index.html                Signup / signin / dev bypass / niche picker
    ├── app.html                  Home dashboard (the "next move" page)
    ├── company.html              My Company Profile (editable cards)
    ├── leads.html                Sales-pipeline kanban (Pro)
    ├── trackers.html             KPIs + time tracker + connectors (Pro)
    ├── tasks.html                4-column kanban (Pro)
    ├── docs.html                 Docs/SOPs folder grid (Pro)
    ├── database.html             Modules library (the Incubator tracks)
    ├── module.html               ?id=… renderer over lessons.js
    ├── marketplace.html          Add-ons grid
    ├── roadmap.html              My Custom Roadmap (Pro tease)
    ├── help.html                 Need Some Help? page
    ├── request.html              Request a feature
    ├── admin.html                Admin (Overview / Leads / Reports / Editor)
    ├── lessons.js                5 written lessons keyed by id
    ├── bos.js                    Shared runtime — single source of truth
    └── styles.css                BOS styles (extends lead-magnet/styles.css)
```

Plus support folders elsewhere in repo:
- `01 development/ed-dropbox/` — Ed's screenshots / Notion-export / branding drop folder.
- `01 development/context/prior research/04-*.md` — chapters #66-#75.
- `01 development/messages/terminal-4/` — outbox + inbox.

---

## Marketing site (`milesymedia website/`)

### `index.html`
The marketing landing page. Served at `/` on the portal origin (rewritten via `portal/next.config.ts` `MILESYMEDIA_REWRITES`). Sections in order:

1. **Nav** — sticky top, brand mark + brand name + 4 nav links (How we work / Services / Clients / Contact) + 3 CTAs (Sign in / Try the demo / Book a call).
2. **Hero** — split-grid: copy on left (eyebrow + headline w/ accent gradient + lead + 2 CTAs) + decorative `hero-art` block on right (gradient + orbs + 2 floating stat cards: "+312% Avg. ROAS lift" / "$48M Tracked revenue").
3. **How we work** (`#process`) — 5 numbered process cards: 01 Free Health Check → 02 Free Business OS → 03 Quick wins this week → 04 Custom roadmap → 05 Full agency partnership. Each links to the right next step.
4. **VSL** — Founder's intro slot (16/9 frame, play button, "3:14 · Founder's intro" placeholder).
5. **Stats strip** — 500+ campaigns / 150+ brands / $48M tracked / 3.4× ROAS.
6. **Testimonials** (`#testimonials`) — 2 quote cards.
7. **Services** (`#services`) — 6 tiered tiles with tier badge + 3-bullet sublist:
   - Enterprise · Bespoke software platforms (Aqua portal, plugin systems, custom APIs).
   - Mid-market · Conversion-first websites (Next.js, CRO + analytics, hand-off CMS).
   - Retainer · Performance marketing (full-funnel, lifecycle, weekly read-out).
   - Project · Brand & content systems (identity, content engines, video).
   - Local & trades · GMB photoshoots & local SEO (on-location, GMB upload, review-request).
   - Self-serve · Business OS & add-ons (9 plug-in tools, niche templates, Aqua AI).
8. **Trust strip** — Used by 150+, $48M tracked, 3.4× avg ROAS, free-tier no-card.
9. **CTA** (`#contact`) — "Ready when you are" + Take the free health check button.
10. **Footer** — copyright + last-deployed date + 3 footer links.

Plus inline JS at end:
- Reads `meta[name="aqua-portal-base"]` (defaults empty = same-origin) + optional `?portalBase=` query param.
- Rewrites `[data-aqua-action]` hrefs against the portal-base. Routes: `sign-in` → `/login`, `demo` → `/demo?source=milesymedia`.
- Health-check link shim: rewrites `a[href="health-check.html"]` → `/_milesy/health-check.html` on http(s) origins (file:// preview keeps relative).

### `styles.css` (marketing site)
Shared brand tokens (CSS variables on `:root`):
```
--bg #0a0a0f          --text #f2f2f5
--bg-soft #11111a     --text-dim rgba(.65)
--bg-card #161624     --text-mute rgba(.42)
--border rgba(255,255,255,0.08)
--border-2 rgba(255,255,255,0.14)
--accent #ff6b35      milesy orange
--accent-2 #ffb800    milesy amber
--accent-3 #7c5cff    milesy violet
--good #34d399        success green
--radius 14px         --maxw 1200px
```

Component sections in order:
1. Buttons (`.btn`, `.btn-primary` (orange-amber gradient), `.btn-secondary`, `.btn-ghost`, `.btn-block`, `.btn-lg`).
2. Navbar (`.nav`, `.nav-row`, `.brand`, `.brand .mark`, `.brand-name`, `.nav-links`, `.nav-cta`).
3. Hero (`.hero`, `.hero-grid`, `.hero h1`, `.hero p.lead`, `.hero-actions`, `.hero-art` w/ ::before/::after orbs, `.stat-card`).
4. Sections / cards / stats / testimonials / CTA.
5. Auth pages (`.auth-shell`, `.auth-card`, `.field`, `.divider`, `.admin-link`).
6. Admin dashboard placeholder (`.admin-shell`, `.sidebar`, `.workspace`, `.kpi`, `.panel`).
7. Health Check (legacy; superseded by lead magnet app/).
8. Process / VSL / services (`.mm-process-grid`, `.mm-vsl-card`, `.mm-services-grid`, `.mm-service`, `.mm-trust`).
9. Mobile responsive overrides (`@media (max-width: 720px)` block).

### `login.html` / `admin.html`
Static mocks kept for portal stitch (the portal's `vercel.json` rewrites `/login.html` → `/_milesy/login.html`). Visually consistent with the BOS auth page but hardcoded to the marketing brand.

### `health-check.html`
Legacy single-file HC built in R1 (commit `9b5a7e1`). Superseded by `lead magnet app/`. Kept in place because the marketing index hero still links to it (via the same-origin rewrites). Either delete and update marketing CTA, or leave as the in-place portal-served version.

---

## Health Check (`lead magnet app/`)

### `index.html`
Single-page SPA. Step machine via `<section class="hc-step" data-step="…">` — only the active step is visible. State held in a single `state` object.

**Step sequence**: `intro` → `gate` (Service/Product/Hybrid) → `overview` (per topic) → `tiers` (3 cards) → `exercise` (renders one step at a time) → `building` (1.2s spinner) → `results`.

Key markup:
- **Intro**: eyebrow + h1 with `<span class="accent">` gradient + lead + 3 dotted bullets + "Let's go →" CTA.
- **Gate**: 3 niche tier cards (Service business / Product business / Hybrid).
- **Overview**: eyebrow ("Topic 1 of 5") + h2 ("Up next: Visibility & Search") + blurb + area-progress pill row + 2 CTAs (Pick how we explore this / See my results so far).
- **Tiers**: 3 hc-tier-cards (Beginner/Intermediate/Professional) per area + skip-area button.
- **Exercise runner**: progress bar + question card (rendered by `renderStep()` based on step.type) + nav (Back / Next) + persistent floating action row (📞 Call / 📊 Skip results / ↷ Skip topic).
- **Progress-save modal** (`.hc-modal[data-hc-progress-modal]`): post-Q5 trigger asking name + contact. Skip dismisses, submit saves to `hc.contact`.
- **Building**: spinner + headline.
- **Results**: money-mirror headline + 3 leak cards + transparency block (Howe we got this / What we'd verify against) + quick wins (expandable cards from area `quickwins(slot)` builders) + section-navigator (re-enter unfilled topics) + 🎁 gift card (claim free BOS or back-to-BOS) + Aqua AI assistant tease + final CTA + share row (📧 / 🔗 / 📄) + secondary signup grab.

**JS architecture**:
- `state` object: `{ step, type, areaIdx, tier, exerciseIdx, answers: {[areaId]: {tier, raw: {[stepIdx]: answer}}} }`.
- `AREAS` loaded via: `localStorage['bos.hcQuestions']` override → `window.HC_AREAS` (from hc-questions.js) → `[]` empty fallback.
- `show(name)` toggles step visibility.
- `renderQuestion()` renders the step body based on `step.type`. 7 renderers: task / reveal / choice / multi / slider / url / text.
- `wireStepInputs(step, slot)` attaches event handlers per step type.
- `stepIsAnswered(step, raw)` validates a step is complete (different rules per type — text needs >0 chars, url needs >3 chars, choice needs raw != null, multi needs at least 1 selection, etc).
- `scoreArea(areaId)` computes the average score from a slot's raw answers.
- `buildResults()` aggregates pillars + computes range-based money headline + paints leak cards + per-topic only-when-answered + persistToBOS() + transparency-block-show.
- `persistToBOS(pillars, moneyEstimate)` writes summary to `bos.healthCheck` + grants 250 XP + 8h time-saved + Self-aware achievement to `bos.progress` on first completion.
- `paintResultsExtras()` shows secondary signup grab if no `hc.contact` captured earlier.
- `maybeShowProgressModal()` triggers post-Q5 modal if `hc.contact` not captured.
- Click delegation handles all `[data-hc-action]` buttons.

### `hc-questions.js`
Shared module. Exposes `window.HC_AREAS = [...]` containing the default 5-area question set:

1. **Visibility & Search** (`seo`, ⌕) — 3 tiers w/ Pub Test for Beginner.
2. **Your Website** (`site`, ◎) — 3 tiers w/ 5-second test for Beginner.
3. **Where Customers Come From** (`flow`, ↗) — 3 tiers w/ dependence sliders.
4. **My Business** (`business`, ✪) — 3 tiers w/ flagship / referrals / extra-mile / USP.
5. **Keeping Them** (`retain`, ✉) — 3 tiers w/ post-purchase / lifecycle.

Each area shape:
```js
{
  id, name, icon, blurb,
  tiers: {
    beginner:     { label, time, summary, exercise: [...] },
    intermediate: { label, time, summary, exercise: [...] },
    professional: { label, time, summary, exercise: [...] }
  },
  quickwins(slot) → [{ title, why, actions: [...] }]
}
```

Each exercise step:
```js
// Choice / multi
{ type: 'choice'|'multi', prompt, options: [{ label, score, tag? }] }
// Task / reveal
{ type: 'task'|'reveal', title, body (HTML allowed), done? (label) }
// Slider
{ type: 'slider', prompt, min, max, value (default), suffix }
// URL / text
{ type: 'url'|'text', prompt, body?, placeholder, optional? }
```

Quickwins builders inspect tagged answers (e.g. `gmb-missing`, `cta-weak`, `referrals-blind`, `no-followup`) and return action-rich cards with `actions: [{ label, type: 'guide'|'callus'|'doitforme'|'diy', href? }]`.

### `styles.css` (HC)
Extends the marketing brand tokens. New sections:
- `.hc-shell` / `.hc-step` (with fade-in animation) / `.hc-intro` / `.hc-bullets`.
- `.hc-progress` / `.hc-progress-bar`.
- `.hc-question-card` / `.hc-q-cat` / `.hc-q-prompt` / `.hc-q-options` / `.hc-opt` (with custom radio dot via `::after`) / `.hc-q-chips` / `.hc-chip`.
- `.hc-slider-wrap` (custom range thumb + track) / `.hc-slider-val`.
- `.hc-url-input` / `.hc-text-input`.
- `.hc-mock-scan` (for Pro-tier reveal step) / `.hc-task-done`.
- `.hc-tiers` / `.hc-tier-card` / `.hc-tier-tag` / `.hc-tier-time` / `.hc-tier-cta`.
- `.hc-floating-actions` / `.floating-pill`.
- `.hc-results-head` / `.hc-leak-cards` / `.leak-card` / `.leak-num` (gradient text).
- `.hc-pillars` / `.hc-pillar` (with status colour) / `.hc-pillar-bar`.
- `.hc-recos` / `.hc-reco-list` (Playfair `.reco-rank` numbers).
- `.qw-card` (`<details>` expandable) / `.qw-actions` / `.qw-guide` / `.qw-callus` / `.qw-doitforme`.
- `.hc-section-nav-card` / `.hc-section-nav-icon`.
- `.hc-assistant-card` / `.hc-assistant-icon`.
- `.hc-cta` / `.hc-cta-actions`.
- `.hc-gift-card` / `.hc-gift-ribbon` / `.hc-gift-bullets`.
- `.hc-modal` / `.hc-modal-card` / `.hc-modal-icon` / `.hc-modal-form`.
- `.hc-share-row` / `.hc-share-btn`.
- `.hc-signup-grab` / `.hc-signup-grab-icon` / `.hc-signup-grab-body`.
- `.hc-transparency` / `.hc-transparency-detail` / `.hc-verify-list` / `.hc-verify-icon`.
- Mobile responsive block (`@media (max-width: 720px)`).

### `DELIVERY-PLAN.md`
5-phase plan: UX (Phase 1) → Content (Phase 2) → Pro tier audit (Phase 3) → Funnel measurement (Phase 4) → Production wiring (Phase 5). 4 open Qs for Ed:
1. Niche-specific questions — 1 per topic, or fully forked tiers per niche?
2. Pro tier audit — real Lighthouse + GMB lookup now, or v2?
3. Email capture at gift card — friction vs lead recovery trade-off.
4. Quick-win guides — ship blog posts to milesymedia.co/blog/, or fold into BOS modules?

---

## Business OS (`business-os app/`)

### `bos.js` — the shared runtime

**The single most important file.** Loaded by every BOS page. Provides:

#### Storage helpers
```
KEY_USER          'bos.user'
KEY_MODE          'bos.mode'        free | customer
KEY_PROGRESS      'bos.progress'    XP / streak / achievements
KEY_HEALTH        'bos.healthCheck' summary written by HC
KEY_AI            'bos.ai'          AI quota
KEY_BRAND         'bos.brand'       companyName / logo / primary / secondary
```

`getJSON(k, d)` / `setJSON(k, v)` / `getUser()` / `setUser(u)` / `getMode()` / `setMode(m)` / `getProgress()` / `setProgress(p)` / `getNiche()` / `nicheMeta()`.

#### Constants

`NICHES[]` — 8 niche definitions: therapist · roofer · salon · coach · restaurant · retailer · agency · generic. Each: `{ slug, label, icon, tagline }`.

`LEVELS[]` — 6 levels: Apprentice (0) → Owner (250) → Operator (700) → Captain (1500) → Founder (3000) → Legend (6000).

`ADDONS[]` — 9 add-ons (see Marketplace section).

`ACHIEVEMENTS[]` — 8 cards (see chapter #75).

#### Functions

`levelInfo(xp)` — returns `{ current, next, pct, into, span }` for the XP value.

`gainXP(amount, reason, timeSavedHrs)` — updates `bos.progress`, fires sliding toast, plus level-up toast on threshold cross. Calls `paintProgress()`.

`unlockAchievement(id)` — adds to `bos.progress.achievements`, fires achievement toast, repaints.

`tickStreak()` — runs once per day. Same-day: no-op. Yesterday's date: streak +=1. Older or null: streak = 1. Unlocks `on-fire-3` and `on-fire-7` at the right milestones.

`toast(text, kind)` — slides a toast in from the right (kind: `xp` / `level` / `achievement`). Hosted in `.bos-toast-host`.

`paintProgress()` — re-renders all `[data-bos-xp]` / `[data-bos-level-num]` / `[data-bos-level-name]` / `[data-bos-level-bar]` / `[data-bos-level-pct]` / `[data-bos-streak]` / `[data-bos-time-saved]` hooks. Also paints the achievements grid via `[data-bos-achievements]` if present (currently only on legacy app.html — simplified home doesn't show grid).

`hydrateUser()` — reads `bos.user`, paints all `[data-bos-name]` / `[data-bos-business]` / `[data-bos-initial]` / `[data-bos-greet]` / `[data-bos-niche-label]` / `[data-bos-niche-icon]` / `[data-bos-niche-tagline]` hooks. Initials from first 2 words. Greeting time-of-day aware (Good morning/afternoon/evening, FirstName).

`applyBranding()` — reads `bos.brand`, sets `--accent` / `--accent-2` CSS vars on `:root`, swaps brand mark to `<img>` if logo set, swaps brand label to companyName. Re-runs after every signup or branding-modal save.

`maybeBrandNudge()` — first-visit modal trigger on app.html only. Sticky `bos.brandNudgeShown` flag.

`showBrandModal()` — builds the branding modal: companyName + logo file input + colour pickers + "no logo? we'll design one →" mailto + Skip / Save. File-upload reads via FileReader → data URL with 1MB cap + live preview swatch.

`buildSidebarNav(activePath)` — returns the full sidebar HTML for the given page. Mode-aware (free vs customer):
- **Free**: My business (Home / About my business) · Learn (Lessons / Health check) · tools-slot · Get help (Need help? / Ask Aqua AI / Book a call / Request a feature) · More tiny (Custom roadmap Pro / Aqua portal locked).
- **Customer**: My business + (My customers / My numbers / My to-dos / My files) · Learn · tools-slot fills with all 9 add-ons · Get help · More tiny (active).

`mountAutoSidebar()` — fills every `<nav data-bos-auto-nav>` slot with `buildSidebarNav()`. Active link auto-marked via `data-bos-active` attribute matching the current page filename.

`applyMode()` — sets `<body data-bos-mode="…">`, swaps the `data-bos-os-label` text ("Workspace" → "Resources" in customer mode), unlocks the Aqua portal section (removes lock class, swaps innerHTML). Fills `[data-bos-tools-slot]` with the installed-tools list (customer) or marketplace teaser (free).

`maybeProLock()` — runs on `leads.html` / `trackers.html` / `tasks.html` / `docs.html`. If `getMode() !== 'customer'`, replaces `<main>` with the Pro lockup card (icon + name + blurb + "this isn't in your free tier yet" + Request access / See add-ons CTAs).

`mountTierUI()` — mounts the tier pill on every topbar (free → "Free tier · upgrade →" w/ orange dot, customer → "Pro · all add-ons active" w/ green dot, links to marketplace) + mounts slim `.bos-upgrade-foot` link on every page in free mode.

`paintHealthCheck()` — reads `bos.healthCheck`, paints `[data-bos-healthcheck]` slot. Empty state if no HC. Otherwise: money headline + per-topic pills + actions row.

`mountAi()` — bottom-right pulsing pill launcher + slide-in panel. Suggestion chips. 5-message free cap. Niche+HC-aware mocked replies via `askAi(q)` simple keyword routing. `bos.ai = { remaining, cap, history[] }`. Listens for `[data-bos-open-ai]` clicks anywhere on the page to open.

`paintAi()` — re-renders message thread + remaining count.

`mountMobileNav()` — detects sidebar, injects `☰ Menu` button + slide-down drawer cloning the nav (under 900px breakpoint). Esc + outside-click close. Auto-close on link click.

`mountDevBar()` — only renders if `?dev=1` was set once (sticks via `localStorage.bos.dev`). Bottom-centre pill: page links + mode toggle + +50 XP test + Reset. `?dev=0` clears.

`renderMarketplace(targetSel, opts)` — used by marketplace.html. Renders the 9 add-on cards filtered by category. Owned (customer mode) shows "Installed" pill + Open button; free shows £/mo + "Add to my OS →" mailto.

#### Boot sequence
```
DOMContentLoaded:
  mountAutoSidebar()
  hydrateUser()
  applyBranding()
  applyMode()
  maybeProLock()        // may replace <main> wholesale
  tickStreak()
  paintProgress()
  paintHealthCheck()
  mountMobileNav()
  mountTierUI()
  maybeBrandNudge()
  mountDevBar()
  mountAi()
```

Window-exposed API (used by other inline page scripts):
```
window.BOS = {
  NICHES, ADDONS, ACHIEVEMENTS, LEVELS,
  getUser, setUser, getMode, setMode,
  getNiche, nicheMeta,
  getProgress, gainXP, unlockAchievement,
  renderMarketplace
};
```

### `index.html` — Signup / signin
- Brand mark + brand name + nav.
- Auth card with tab toggle (Create account / I already have one).
- Source banner (hidden by default; revealed when arriving via `?source=healthcheck`).
- Form: Name / Business name / Email / Password / Niche picker (8 visual tiles) → "Create my Business OS".
- Divider + admin-link "Take the free Health Check first ↗" + dev-bypass dashed button.
- URL params pre-fill name / business / email if present.
- Niche picker: 8 buttons (one per NICHES[] entry) — click → `is-on` + sets hidden `niche` input.
- Submit → sets `bos.user` (name / business / email / niche) + seeds `bos.progress` with 100 XP + first-step achievement (+ niche-locked if niche !== 'generic') → redirects to `app.html`.
- Dev bypass → seeds Jordan Lee / Northbeam Apparel / 350 XP / 2-day streak / mock Health Check + therapist niche → redirects to `app.html`.

### `app.html` — Home dashboard
The simplified home (R17). Single `<main class="bos-main bos-home">`:

1. **Greeting**: h1 with `data-bos-greet` ("Good evening, Jordan.") + niche tagline + `✎ Customise` button.
2. **Your next move card** (`bos-home-next`): adaptive single-CTA card. JS picks the next state:
   - HC not done → "Take the free Health Check" + Start CTA.
   - HC done, no company → "Tell us about your business" + Open Company Profile.
   - HC done, company filled, no lessons → "Read your first quick-win lesson" + Open Core Principles.
   - HC done, company filled, lesson done, no tasks → "Add your first to-do" + Open My To-dos.
   - All four done → "You're set. Keep going at your own pace." + Browse lessons.
3. **HC leak strip** (`bos-home-leak`, hidden until HC done): "Based on your Health Check — Your biggest leak right now is **Visibility**. Your visibility score was 38/100. We'd start with the lesson that fixes it directly." + single CTA. Maps lowest-scoring topic name to a written lesson via topicMap.
4. **Three friendly cards** (`bos-home-cards`): 📚 Read a quick lesson · 🤖 Ask the AI · ✨ Need something else? (request page).
5. **Tiny admin entry**: subtle dashed link at the bottom — `⚙ Admin (lead-magnet traffic)` → admin.html.
6. **Progress strip** (`bos-home-progress`, hidden until any XP earned): single line "Level 1 · Apprentice · 0-day streak 🔥 · 0h saved" + slim XP bar.

### `company.html` — My Company Profile
Inline-editable. `<form>`-less; everything writes to `bos.company` on input. `Edit` button toggles `disabled` on all inputs and `is-on` on the body.

Two-column grid (`bos-cp-grid`):
- **Main column**: 4 cards — 30-second answer (oneliner / tagline / mission / USP) · Customer (primary / problem / area) · Offer architecture (lead-in / flagship / premium / AOV) · Brand (tone / colour-1 / colour-2 / brand-folder).
- **Sidebar column**: 4 cards — Founder (name / role / email / mobile) · Team (rows: label + detail + delete) · Suppliers · Critical accounts.

Team / suppliers / accounts use `data[name]` arrays. `renderList(name)` paints the rows; `+ Add person` etc adds a new empty row.

### `leads.html` — Leads & Clients HQ (Pro)
Sales-pipeline kanban. 6 stages: `unsorted` (warn) · `new` (good) · `responded` (info) · `qualified` (good) · `won` (won-orange) · `spam` (bad).

Per-stage summary strip across top: count + £ value.

Kanban columns: each shows count chip + lead cards. Lead card: name + delete button + source + value + 4 quick-action icon buttons (📞 💬 📝 🏷 — visual only) + stage-move dropdown.

Seeded with 11 leads matching screenshot vocabulary. `bos.leads[]` array of `{ id, name, source, value, stage, fromHc?, contact? }`.

`+ New lead` triggers prompt-driven row addition.

### `trackers.html` — Trackers & KPIs (Pro)
Three sections:

1. **5 KPI cards**: leads · conversion · AOV · on-time · runway. `Edit numbers` walks through each via prompts. `bos.kpis = { leads, conversion, aov, ontime, runway }`.

2. **Time tracker widget**: 56px display (HH:MM:SS) + task input + Start / Stop&log. Today's session log list (HH:MM | task | duration). Daily total. `bos.timer = { running: { task, startedAt }, sessions: [{ task, startedAt, endedAt, seconds }] }`. Resumes if running across reloads.

3. **Connectors strip**: 4 cards — QuickBooks (mailto) · Stripe (mailto) · Google Sheets template (live link) · Manual entry (active). Each: icon swatch + name + blurb + Connect button + status pill.

4. **Weekly review prompt**: "The 15-minute weekly review" CTA → ops module.

### `tasks.html` — Tasks (Pro)
4-column kanban: Today / This week / Backlog / Done.

Quick-add form: text input + column dropdown + Add button.

Each task row: ○ check button (toggles done) / contenteditable text / hover-reveal action row (Move to Today/Week/Back/Done + delete).

`bos.tasks = { today: [], week: [], backlog: [], done: [] }`.

### `docs.html` — Documents (Pro)
Two main sections:

1. **Folders strip**: 6 buttons — All · SOPs · Templates · Contracts · Brand · Knowledge — each shows count.
2. **File table**: name + folder badge + type + relative-time updated + Open. Search input filters live. `+ New document` prompt-driven add.

Plus **free templates strip** below: 4 download cards (5-KPI tracker / service agreement / SOP starter pack / sales messages).

`bos.docs[]` array — seeded with 6 placeholder docs.

### `database.html` — Modules library (the Incubator)
6 track sections, each its own `<h2 class="bos-track-head">` + `<table class="bos-table">`:

1. **Foundations · Step 1** — 1.1 Chrome / 1.2 Hub / 1.3 Storage / 1.4 Tech / 1.5 Core principles.
2. **Online Setup · Step 2** — 2.1 Domain / 2.2 GMB.
3. **Super Sales · Step 3** — 3.1 / 3.5 / 3.6 / 3.7 / 3.8.
4. **Operations · Step 4** — 4.1 Workflows / 4.2 KPIs / 4.3 SOPs / 4.4 Sustainability.
5. **Acquisition · Step 5** — 5.1 BOS tutorial / 5.2 Referral alchemy / 5.3 Founder's Fortune (locked Mastery).
6. **Leadership bonus** — L.1 Founder psych / L.2 Leadership / L.3 Team.

Each row: title link + sub-line description + track badge + status pip (todo / doing / done) + length + Open CTA (or 🔒 Pro tag if unwritten).

Filter chips at top — All / Foundations / Psychology / Sales / Operations / Growth / Leadership / Tools. Hides empty track headers when filtering.

Search input filters live across all rows.

Page intro callout above the chips.

Five rows pass `?id=…` to module.html (the written ones); the rest go to `marketplace.html` with greyed name + 🔒 hint.

### `module.html` — Lesson renderer
Reads `?id=` query param. Pulls lesson from `window.BOS_LESSONS[id]`. Renders:
- Sidebar: auto-nav + "In this module" outline (built from `lesson.outline`).
- Topbar: back-link to library + module pill (icon + track + step) + h1 title + lead + meta row (lesson n of N · X% complete + Stuck-call-us button).
- Body: prose article filled with `lesson.body` HTML.
- Final CTA card: 3 buttons — Continue (lesson.next.label / href) · Want me to walk you through? (tel) · Help me apply this (mailto with lesson title prefilled).

If id not found in BOS_LESSONS → "Lesson not found" + back-to-library CTA.

### `marketplace.html` — Add-ons
9 add-on cards in a 3-col grid (responsive). Filter chips: All · Communications · Website · Sell · Grow · Retain · Operations.

Upgrade banner above grid (free mode only, hidden in customer): "Become a Milesy client and unlock all 9 add-ons" + Talk to us.

FAQ-grid below: 4 common-questions cards.

Cards rendered by `BOS.renderMarketplace([selector], { filter })`. Each card: icon + name + category label + blurb + price (£X/mo) or Installed pill + "Add to my OS" mailto or Open button.

### `roadmap.html` — Custom roadmap (Pro tease)
Two views, JS toggles based on mode:

**Locked (free)**: violet hero card with 🗺 icon + eyebrow ("Premium · 1-off £750 or included with retainer") + h2 + lead + 5 deliverable bullets (Full HC by us / niche benchmark / 3-month action plan / 2 consult calls / 30+ hours saved) + 2 CTAs (Unlock my roadmap mailto / Talk to a strategist tel).

Below: blurred sneak-peek timeline (4 phases · `is-blurred` class adds the "🔒 Unlock to reveal" pill overlay).

**Active (customer)**: green active card with status (7/12 milestones) + 3 phase timeline cards each with milestone checklists (✓ done / ◇ doing / ○ todo) + 2 CTAs (Book your check-in / Message your strategist).

### `help.html` — Need Some Help?
Animated 👋 + h1 ("Need some help? Get in touch.").

Support card: copy ("We've got you covered..." / "Most questions can be answered..." / "If you still need help...").

6-action grid:
- 📚 Modules & Resources → database.html.
- 🤖 Ask Aqua AI → triggers AI panel via JS click.
- 📞 Book a support call → tel.
- 📝 Submit a support form → mailto.
- 💬 WhatsApp the team → wa.me.
- 🗺 Unlock a custom roadmap → roadmap.html.

FAQ strip below: 4 common questions.

### `request.html` — Request a feature
Headline ("Tell us what would help.") + lead.

Form:
- Free-text textarea ("What would help your business right now?").
- 7 category tag chips (Tracking numbers / Customers / Tasks / Content / Finance / Learning / Other).
- Urgency dropdown (Nice to have / This month / Pretty urgent).
- Submit composes mailto with prefilled subject `[Feature request] <category>` and body containing user name / business / email / niche / urgency / category / request body.

3 explainer cards: Already have it · Will build it · Won't build but here's the workaround.

### `admin.html` — Admin dashboard
Password-gated. Defaults `milesy` or `aqua`. `bos.adminUnlocked = '1'` after correct entry.

Tabs: Overview · Leads · Health-check reports · Questions editor.

**Overview**: 4 KPI cards (HC completed / leads captured / pipeline £ / sign-ups) read from localStorage. Plus an info card explaining "this admin reads from localStorage on this device".

**Leads**: full table from `bos.leads[]` — name / source / stage / value / contact / Open link.

**Reports**: HC headlines + leak £ + topic scores + capturedAt.

**Questions editor (tree)**:
- Loads via `<script src="../lead magnet app/hc-questions.js">`.
- Reads `bos.hcQuestions` first (admin override), falls back to `window.HC_AREAS`.
- Tree structure:
  ```
  [Area card collapsed]
    └ click to expand:
      [Area meta: name / icon / blurb]
      [Tier tabs: Beginner | Intermediate | Professional]
      [Tier meta: label / time / summary]
      [Steps:
        Step 1 (type select / fields per type / delete)
        Step 2 ...
        + Add step]
      [× Delete area]
  + New area
  Restore defaults
  ```
- Per-step type-aware fields: choice/multi (prompt + options textarea, format `label | score`), task/reveal (title + body HTML + done-label), slider (prompt / min / max / suffix), url/text (prompt / placeholder).
- Saves to `bos.hcQuestions` on every input change. Lead-magnet picks up the override on next page load.

### `lessons.js`
`window.BOS_LESSONS = { … }` — 5 lessons keyed by id:
- `chrome-profile` (1.1 · Foundations · 🧰)
- `core-principles` (1.5 · Psychology · 🧠)
- `super-sales` (3.5 · Sales · 💰)
- `ops-sustainability` (4.4 · Operations · ⚙)
- `referral-alchemy` (5.2 · Growth · 🤝)

Each lesson schema:
```js
{
  id, track, step, icon, title, lead,
  progress: { current, total, pct },
  outline: [{ id, title }],         // for sidebar
  next: { href, label },             // for "continue" CTA
  body: '<h2 id="…">Section</h2><p>…</p>...'  // full lesson HTML
}
```

Detailed lesson copy is in chapter #75.

### `styles.css` (BOS)
Extends the lead-magnet styles. Major sections:

**Auth**: `.bos-auth-card` / `.bos-tabs` / `.bos-tab` / `.bos-fineprint` / `.bos-niche-picker` / `.bos-niche-tile` / `.bos-source-banner`.

**Shell**: `.bos-body` / `.bos-shell` (CSS grid 280px 1fr) / `.bos-sidebar` (sticky h-100vh) / `.bos-side-nav` / `.bos-side-section` / `.bos-side-label` / sidebar links / `.bos-side-tiny` / `.bos-aqua-section` (locked/unlocked variants) / `.bos-side-user`.

**Main / topbar**: `.bos-main` / `.bos-topbar` / `.bos-topbar-eyebrow` / `.bos-topbar-actions` / `.bos-search`.

**Home (simplified)**: `.bos-home` / `.bos-home-greet` / `.bos-home-tagline` / `.bos-home-customise` / `.bos-home-next` / `.bos-home-cards` / `.bos-home-card` / `.bos-home-leak` / `.bos-home-progress` / `.bos-home-admin-link`.

**Hero card / orbs (legacy/customer use)**: `.bos-hero-card` / `.bos-hero-card-art` / `.orb-1/2/3` / `.bos-hero-stat`.

**Onboarding strip**: `.bos-onboard` / `.bos-onboard-grid` / `.bos-onboard-card`.

**KPI / panel / module grid**: `.kpi-row` / `.kpi` / `.bos-mod-grid` / `.bos-mod-card` / `.bos-mod-card-locked` / `.bos-mod-meta`.

**Notion table**: `.bos-table` / `.bos-table-wrap` / `.bos-pip` (-todo/-doing/-done) / `.bos-row-cta` / `.bos-row-sub` / `.bos-track-head` / `.bos-row-locked` / `.bos-row-locked-name`.

**Filter chips / search**.

**Notion content slot**.

**Module / lesson page**: `.bos-module` / `.bos-mod-head` / `.bos-mod-cat-pill` / `.bos-mod-meta-row` / `.bos-prose` (h2 / p / ol / ul / em / strong) / `.bos-callout` (warn / good) / `.bos-mod-cta` / `.bos-mod-outline-host` / `.bos-mod-lesson`.

**Featured add-ons mini**: `.bos-addons-grid` / `.addon-mini`.

**Marketplace**: `.bos-mp-banner` / `.bos-addon-grid` / `.addon-card` (with hover gradient) / `.addon-head` / `.addon-icon` / `.addon-cat` / `.addon-foot` / `.addon-price` / `.bos-installed-tag`.

**FAQ grid**.

**Page intro callout**: `.bos-page-intro` (`<details>` styled).

**Branding modal**: `.bos-brand-modal` / `.bos-brand-modal-card` / `.bos-brand-icon` / `.bos-brand-form` / `.bos-brand-no-logo` / `.bos-brand-colours` / `.bos-brand-actions` / `.bos-logo-img` / `.bos-brand-logo-preview`.

**Roadmap**: `.bos-roadmap-locked-card` / `.bos-roadmap-icon` / `.bos-roadmap-bullets` / `.bos-roadmap-peek` / `.bos-roadmap-timeline` / `.rm-num` / `.is-blurred` / `.bos-roadmap-card` (active variant) / `.bos-roadmap-status-num`.

**Health-check summary card**: `.hc-summary-empty` / `.hc-summary-card` / `.hc-summary-card-head` / `.hc-summary-money` (gradient text) / `.hc-summary-pills` / `.hc-summary-pill` (status colours) / `.hc-summary-actions`.

**Toast system**: `.bos-toast-host` / `.bos-toast` (xp / level / achievement variants).

**Aqua AI**: `.bos-ai-launcher` / `.bos-ai-launcher-orb` (pulse animation) / `.bos-ai-panel` / `.bos-ai-head` / `.bos-ai-body` / `.bos-ai-msg` (user / bot variants) / `.bos-ai-empty` / `.bos-ai-suggest` / `.bos-ai-form` / `.bos-ai-foot`.

**Tier pill / upgrade band / upgrade foot**: `.bos-tier-pill` / `.bos-tier-dot` / `.bos-upgrade-band` (legacy hidden) / `.bos-upgrade-foot`.

**Pro lockup**: `.bos-pro-lock` / `.bos-pro-lock-icon`.

**HC leak strip on home**: `.bos-home-leak`.

**Mobile drawer**: `.bos-mobile-nav-btn` / `.bos-mobile-drawer` / `.bos-mobile-drawer-close`.

**Dev bar**: `.bos-dev-bar` / `.bos-dev-tag`.

**Niche brand mark**: `.bos-brand-niche`.

**Game / progression block (legacy/customer)**: `.bos-game` / `.bos-game-level` / `.bos-game-ring` / `.bos-game-stats` / `.bos-game-stat`.

**Achievements grid (legacy)**: `.bos-ach-grid` / `.ach-card`.

**Active sidebar accent bar**: `.bos-side-nav a.active::before`.

**Module-card shimmer sweep**: `.bos-mod-card::after`.

**Marbled cover gradients (TOC + dashboard tiles)**: `.bos-cover-1` through `.bos-cover-10` — each a unique radial-gradient combo from the brand palette + marble streak overlay via `::before`.

**TOC grid / leads pipeline**: `.bos-toc-grid` / `.bos-toc-card` / `.bos-toc-cover` / `.bos-toc-meta` / `.bos-leads-summary` / `.bos-leads-stat` / `.bos-leads-kanban` / `.bos-leads-col` / `.bos-lead-card` / `.bos-lead-actions` / `.bos-lead-icon` / `.bos-lead-move-select`.

**Help page**: `.bos-help-hero` / `.bos-help-wave` (animated) / `.bos-help-card` / `.bos-help-actions` / `.bos-help-action`.

**Company Profile**: `.bos-cp-grid` / `.bos-cp-card` / `.bos-cp-fields` / `.bos-cp-list` / `.bos-cp-row`.

**Trackers (timer)**: `.bos-tracker-card` / `.bos-timer` / `.bos-timer-display` / `.bos-timer-tag` / `.bos-timer-actions` / `.bos-timer-log`.

**Connectors**: `.bos-connector-grid` / `.bos-connector` / `.bos-connector-icon` / `.bos-connector-status`.

**Weekly review**: `.bos-tracker-review`.

**Tasks (kanban)**: `.bos-task-add` / `.bos-kanban` / `.bos-kanban-col` / `.bos-task` / `.bos-task-check` / `.bos-task-text` / `.bos-task-actions` / `.bos-task-move` / `.bos-task-del`.

**Documents**: `.bos-doc-folders` / `.bos-doc-folder` / `.bos-doc-table-head` / `.bos-doc-templates` / `.bos-doc-template`.

**Module outline host**: `.bos-mod-outline-host`.

**Admin tabs / KPIs / tree**: `.bos-admin` / `.bos-admin-tabs` / `.bos-admin-tab` / `.bos-admin-tree` / `.bos-admin-tree-area` / `.bos-admin-tree-area-head` / `.bos-admin-tree-icon` / `.bos-admin-tree-fields` / `.bos-admin-tier-tabs` / `.bos-admin-tier-tab` / `.bos-admin-tier-meta` / `.bos-admin-steps` / `.bos-admin-step` / `.bos-admin-step-head` / `.bos-admin-step-del`.

**Request-a-feature form**: `.bos-request-form` / `.bos-request-tags` / `.bos-request-tag`.

**Mobile responsive blocks** at the bottom: `@media (max-width: 900px)` for sidebar collapse, `@media (max-width: 720px)` for everything else.

---

## Server / dev infrastructure

`python3 -m http.server 3033 --bind 127.0.0.1` started from `04-the-final-portal/milesymedia website/` parent.

Background log at `/tmp/unified-3033.log`. Killed previous `:3033` (lead-magnet alone) and `:3034` (BOS alone) when consolidating.

Routes accessible:
- `localhost:3033/` — marketing site
- `localhost:3033/lead magnet app/` — HC
- `localhost:3033/business-os app/index.html` — BOS signup
- `localhost:3033/business-os app/app.html` — BOS home
- `localhost:3033/business-os app/admin.html` — admin
- … and any other file as relative path

Production stitch (chief commander / T6 territory):
- `vercel.json` rewrites `/`, `/index.html`, `/login.html`, `/admin.html`, `/styles.css` → `/_milesy/...`.
- `prepare-milesy.mjs` copies the whole `milesymedia website/` into `portal/public/_milesy/`.
- **Q-FLAG**: rewrites for `/health-check.html`, `/lead magnet app/...`, `/business-os app/...` not yet added — direct visits 404 in production.

---

## Cross-page state contract

All BOS state lives under `bos.*` keys in `localStorage`. Same-origin means the lead-magnet (under `/lead magnet app/`) and the BOS (under `/business-os app/`) share storage.

Cross-app data flow:
- HC → BOS: `bos.healthCheck` (summary), `bos.leads` (HC contact mirrored as a lead), `bos.progress` (XP + achievement).
- BOS → HC: `bos.hcQuestions` (admin's question override, read by HC on next load).
- HC ↔ HC: `hc.contact` (captured progress-save / results-grab), `hc.progressDismissed` (skipped flag).

Schema details in chapter #66 (master snapshot).
