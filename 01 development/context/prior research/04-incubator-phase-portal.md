# 04 — Incubator-phase client portal (T4 round 001)

The client-facing **Opulence Incubator** surface — the templated portal
every Aqua client sees during phases 1–4 (Epic Intro → Blueprint Setup →
Diagnostics/Foundations → Brand Builder), before they graduate to a Live
custom portal. Built per chapter `04-aqua-internals-reference.md` §15
(Notion-style visual pattern). Sibling of `business-os app/` and
`lead magnet app/`, served from the same `:3033` host.

> Static, self-report, localStorage-only this round. No real APIs.
> Honesty contract (chapter #68) preserved — locked cards show the path,
> they don't fake completion.

## File tree

```
04-the-final-portal/milesymedia website/incubator app/
├── incubator.css           — dark theme tokens + 11 Notion-style block styles
├── incubator.js            — incubator.* localStorage, ?phase= override, lock pass
├── index.html              — root: THE OPULENCE INCUBATOR 3.0 (per §15e recipe)
├── onboarding.html         — 💎 Aqua Onboarding — Start Here!
├── portal-bridge.html      — 🏛 My Client Portal — Access  (the §15f bridge)
├── resources.html          — ✨ Aqua Resources Lite — Bonus!  (BOS CTA lives here)
└── discover.html           — 🌊 Discover AquaOasis-Web (6-card grid)
```

All five pages use the same anatomy: `inc-toprail` strip · `inc-cover`
banner · `inc-icon` chip overlapping · `inc-title` + `inc-caption` ·
`inc-props` propertyStrip details · body blocks · footer back-link row.

## Block taxonomy (§15b implementations)

| Block          | Implementation                                      |
| -------------- | --------------------------------------------------- |
| `cover`        | `.inc-cover[data-variant="forest|marble|water"]`    |
| `icon`         | `.inc-icon` chip with `margin-top: -36px`           |
| `pageTitle`    | `h1.inc-title` + `p.inc-caption`                    |
| `propertyStrip`| `<details class="inc-props">` w/ key/val grid       |
| `videoEmbed`   | `.inc-video` w/ `<iframe>` slot or placeholder      |
| `toggle`       | `<details class="inc-toggle">` (vanilla)            |
| `cardGrid`     | `.inc-grid` 2-col (1 col mobile) of `a.inc-card`    |
| `button`       | `.inc-btn` / `.inc-btn--big`                        |
| `divider`      | `<hr class="inc-divider">`                          |
| `helpRow`      | `.inc-row` with whatsapp link                       |
| `feedbackRow`  | `.inc-row` with feedback anchor                     |

Visual register per §15d: black bg, `#0F0F0F` cards, `#C9A76A` gold
accent, Playfair Display headlines, mythos copy register.

## localStorage schema — `incubator.*` namespace

| Key                    | Type          | Purpose                                          |
| ---------------------- | ------------- | ------------------------------------------------ |
| `incubator.active`     | `'1' \| null` | Set by `incubator.js` on every page load. BOS reads to render the back-to-Incubator strip. |
| `incubator.phase`      | string        | `'epic-intro' \| 'blueprint' \| 'diagnostics' \| 'brand-builder'`. Defaults to `epic-intro`. |
| `incubator.completed`  | JSON map      | `{ stepId: true }` — for step-completion ticks (future).      |
| `incubator.watched`    | JSON map      | `{ videoId: true }` — video-watch flags (future).             |
| `incubator.startedAt`  | ISO string    | Set on first page load. Rendered in propertyStrip.            |

Coexists cleanly with `bos.*` (chapter #66) — same origin, no key
collisions.

## Phase awareness + soft lock

`incubator.js` reads `incubator.phase` and renders the property-strip
chip via `[data-inc-phase-chip]`. Cards declare their unlock phase via
`data-unlock-phase="N"` (1-4). When current phase < N, the card gets
`.is-locked` (opacity + pointer-events: none) plus a `🔒 Unlocks at
<Phase>` badge in the top-right.

Dev affordance: `?phase=blueprint` query param sets `incubator.phase`
(mirrors BOS `?dev=1` pattern). Public API:

```js
window.Incubator.setPhase('blueprint');   // re-renders chip + locks
window.Incubator.markComplete('step-id'); // future progress ticks
```

## BOS bridge contract (§15c "Aqua Resources Lite")

- `resources.html` exposes a primary card: **Open My Business OS** →
  same-origin link to `../business-os app/app.html`.
- `incubator.js` sets `incubator.active='1'` on every load, so once the
  user lands in BOS, the new `mountIncubatorStrip()` (in `bos.js`,
  added at `DOMContentLoaded`) renders a fixed-top strip:
  `← Back to The Opulence Incubator` linking to
  `../incubator app/index.html`.
- No structural BOS rework — single function added, run before all
  other mount calls. Q-ASSUMED: BOS mode while in Incubator stays
  whatever the user already chose; we did **not** force `pro` since
  the lockup pattern in chapter #70 deliberately exposes the path
  without lying about access.

## The §15f bridge → Live custom portal

`portal-bridge.html` ships the single big button **"Click Me To Enter
Your Portal!"** Until a real Live custom portal exists, the button
points to `../business-os app/app.html` as a stand-in. **Future swap:**
when T1/T5 publish a per-client portal at e.g.
`/portal/customer/{slug}`, change the `href` on this one button. No
other Incubator surface needs updating.

## Smoke (verified 2026-05-07)

- `:3033/incubator app/index.html` → 200, propertyStrip toggles, phase
  chip renders, 4 navigation cards render with covers + emoji + label.
- `:3033/incubator app/{onboarding,portal-bridge,resources,discover}.html` → 200.
- `:3033/incubator app/incubator.{css,js}` → 200.
- `?phase=brand-builder` removes lock badges from all cards.
- After visiting any Incubator page, navigating to BOS (`../business-os
  app/app.html`) renders the back-to-Incubator strip at the top of `<body>`.

## Open follow-ups

- **Real video URLs** — `videoEmbed` placeholders need Vimeo/YouTube
  links per cohort (operator content, not engineering).
- **Live portal swap** — `portal-bridge.html`'s primary button still
  lands in BOS; swap when the Live custom portal is published (T1/T5).
- **Block extraction → website-editor** — porting the 4 new blocks
  (`icon`, `propertyStrip`, `toggle`, `cardGrid`) into
  `@aqua/plugin-website-editor` is the §15g future T3 round; explicitly
  NOT in scope here.
- **Mode coercion** — chapter #67 plugin-handoff treats Incubator
  clients as paying. If product wants BOS to auto-flip to `customer`
  mode while `incubator.active==='1'`, add one line to
  `mountIncubatorStrip()`. Left out this round per honesty contract.

## R002 — Per-phase Incubator sub-pages (2026-05-07)

Added 4 phase-specific pages alongside the R001 generic sub-pages, each
following §15a anatomy:

| File                              | Phase                       |
| --------------------------------- | --------------------------- |
| `phase-1-epic-intro.html`         | 🌅 Epic Intro               |
| `phase-2-blueprint.html`          | 📐 Blueprint Setup          |
| `phase-3-diagnostics.html`        | 🔬 Diagnostics & Foundations|
| `phase-4-brand-builder.html`      | 🎨 Brand Builder            |

Each page ships:

- §15a anatomy (toprail · cover variant · icon · pageTitle/caption ·
  propertyStrip with phase chip + Started · phase-specific toggles).
- A **`<section class="inc-checks" data-inc-phase-checks="<phaseId>">`**
  checklist of 3–5 items — each `<label data-step="…">` ticks save into
  `incubator.phaseProgress[phaseId][stepId] = true`. The header chip
  `[data-inc-phase-progress-chip]` shows live `done / total`.
- Phase-specific cardGrid links into BOS / Health Check / Database
  where relevant (e.g. Blueprint → BOS company + docs; Diagnostics →
  HC + reading list).
- A "What happens next" toggle that names the next phase explicitly.

### New `incubator.*` storage

| Key                          | Type                                       |
| ---------------------------- | ------------------------------------------ |
| `incubator.phaseProgress`    | `{ [phaseId]: { [stepId]: true } }` JSON   |

### Auto-advance contract

`incubator.js` adds `mountPhaseChecks()` (called at DOMContentLoaded).
Whenever a check toggles, if **every** `[data-step]` for the phase is
ticked, `maybeAdvancePhase(phaseId)` writes the next phase id to
`incubator.phase` and shows a toast (`Phase advanced → <next>`). Guards:

- Only advances forward.
- Will not advance past the user's existing phase (so reviewing earlier
  phases doesn't bump them backwards or jump them forward unexpectedly).

### Root "Phase Path" cardGrid

`index.html` gains a second cardGrid above "Incubator Navigation" with
4 cards — one per phase, ordered. JS pass `applyPhasePathLocks()` adds:

- 🔒 lock badge for cards whose `data-phase-index` > current phase.
- ✓ Complete badge for cards whose phase is below current.
- ◐ In progress badge for the current phase if any step is ticked.

The honesty contract still holds: locked cards aren't hidden, they show
the path with the unlock label.

### Public API additions

```js
window.Incubator.getPhaseProgress();   // returns full map
window.Incubator.resetPhaseProgress(); // dev / debug only
```

### Files added/changed in R002

- NEW `phase-1-epic-intro.html` · `phase-2-blueprint.html` ·
  `phase-3-diagnostics.html` · `phase-4-brand-builder.html`.
- `incubator.js` — `+~110 lines`: `phaseProgress` getters/setters,
  `mountPhaseChecks`, `renderPhaseProgressChip`, `maybeAdvancePhase`,
  `showToast`, `applyPhasePathLocks`. Public surface extended.
- `incubator.css` — `+~50 lines`: `.inc-checks*` styling (gold-accent
  checkboxes, line-through on completed items).
- `index.html` — added "Phase Path" cardGrid block.

### R002 smoke (verified 2026-05-07)

- All 4 new pages return 200 from `:3033`.
- Root page renders Phase Path grid with phase-2/3/4 lock badges when
  `incubator.phase=epic-intro`.
- `?phase=brand-builder` removes lock badges; cards show ✓ Complete
  for phases 1-3 and ◐ In progress for phase 4.
- Ticking all checks on a phase advances `incubator.phase` once and
  emits a toast.

## R003 — Phase-aware BOS deep-linking (2026-05-07)

The R001 BOS bridge was generic — it just put the user inside BOS with
a "← Back to The Opulence Incubator" strip. R003 makes the bridge
**phase-aware** so phase pages can land the client on the right BOS
section and bring them back to the originating phase page.

### Storage flags (the contract)

| Key                         | Lifetime          | Written by               | Read by    |
| --------------------------- | ----------------- | ------------------------ | ---------- |
| `bos.deepLink`              | consumed once     | incubator.js click delegate | bos.js  |
| `bos.returnFromPhase`       | persistent        | incubator.js             | bos.js     |
| `bos.returnFromPhasePage`   | persistent        | incubator.js             | bos.js     |

`bos.deepLink` is JSON: `{ section: "<id>", lessonId: "<id>"|null, ts: <ms> }`.
`section` matches the `id="bos-<section>"` anchor on the destination
page's `<main>` element. The 30-second TTL on `ts` guards against stale
links surviving a tab re-open.

`bos.returnFromPhase` + `bos.returnFromPhasePage` persist across BOS
navigation so the back-strip still routes to the originating phase
page even after the user clicks around inside BOS. Cleared implicitly
on the next deep-link write.

### Deep-link map (per-phase Incubator → BOS)

| Phase            | Incubator card                                     | BOS section / page                  |
| ---------------- | -------------------------------------------------- | ----------------------------------- |
| Blueprint        | "Open About my business in BOS"                    | `about` / `company.html`            |
| Blueprint        | "Strategy worksheets"                              | `files` / `docs.html`               |
| Diagnostics      | "Run the Business Health Check"                    | (lead-magnet, no deeplink — out of BOS scope) |
| Diagnostics      | "Diagnostics reading list"                         | `lessons` / `database.html`         |
| Brand Builder    | "My customers — who's the brand for?" (NEW)        | `customers` / `leads.html`          |
| Brand Builder    | "Brand lessons" (NEW)                              | `lessons` / `database.html`         |
| Resources Lite   | "Open My Business OS"                              | `home` / `app.html`                 |

HC stays a direct nav (it's the lead-magnet app, not a BOS section).
Phase-1 Epic Intro doesn't surface BOS — it's still the welcome video
+ first-action checklist phase.

### Anchor IDs added to BOS pages

| Page              | `id` on `<main>`     |
| ----------------- | -------------------- |
| `app.html`        | `bos-home`           |
| `company.html`    | `bos-about`          |
| `leads.html`      | `bos-customers`      |
| `trackers.html`   | `bos-numbers`        |
| `tasks.html`      | `bos-todos`          |
| `docs.html`       | `bos-files`          |
| `database.html`   | `bos-lessons`        |

bos.js consumes `bos.deepLink` after rendering the strip:
`scrollIntoView({behavior:'smooth', block:'start'})` on the matching
anchor (when present + ts within TTL), then `removeItem('bos.deepLink')`.
On pages without the matching anchor (e.g. landed on a different page
than expected) the consume is a no-op — the flag is still cleared so
it doesn't trip on subsequent loads.

### Back-strip routing

`mountIncubatorStrip()` reads `bos.returnFromPhase` / `bos.returnFromPhasePage`
and rewrites the strip:

- with phase: `← Back to your phase` → `../incubator app/phase-N-<slug>.html`
- without:    `← Back to The Opulence Incubator` → `../incubator app/index.html`

A static lookup `PHASE_PAGE_BY_ID` in bos.js maps the four phase ids
to their html filenames. If `returnFromPhase` is set but unknown, falls
back to the explicit `returnFromPhasePage` that incubator.js wrote.

### Public surface (incubator.js)

```js
// Click delegate — automatic for any <a data-bos-section="…" data-return-phase="…">
// No imperative API; declarative attribute is the contract.
```

### R003 smoke (verified 2026-05-07)

- All 7 BOS pages still 200 with new `id` on `<main>`.
- All 4 touched Incubator pages (phase-2/3/4 + resources) 200.
- Clicking a `[data-bos-section]` link writes the three flags then
  navigates; bos.js renders "← Back to your phase" strip and scrolls
  the matching `#bos-<section>` into view.
- Refreshing the BOS page after consume: strip stays (returnFromPhase
  persists), no second scroll (deepLink consumed).
- Deep-link with stale ts > 30s: scroll skipped, strip still renders.

### Q-ASSUMED + R003 follow-ups

- HC stays a direct nav (not a BOS section). If we later treat the
  lead-magnet as `section: 'health-check'` we'd need a second consumer
  in the lead-magnet shell.
- Cross-tab sync explicitly out of scope (per prompt). Today the flag
  is per-tab via localStorage; opening BOS in a new tab carries the
  flag but the originating Incubator tab still sees it until consumed.
- `lessonId` slot is in the deepLink JSON for R006 (`lessons-to-phase-
  advance`) but no card writes it yet.

## R004 — Niche-specific copy packs (2026-05-07)

Per chapter #71 follow-up: niches were labels-only. R004 ships 4 actual
content packs that swap Incubator copy + module recommendations
without touching the page templates.

### Storage contract

`bos.brand.niche` ∈ `{ agency | skincare | coaching | fitness }` —
defaults to `agency`. Falls back to legacy `bos.user.niche` for
back-compat. Loader picks `agency` when the active value isn't a known
pack.

### Pack shape

```js
window.IncubatorCopyPacks[<niche>] = {
  label,                  // human label (admin selector)
  heroTagline,            // index.html caption
  aquaResourceCallout,    // resources.html callout line
  phasePromise: [4],      // one promise string per phase 1-4
  moduleHighlight: [{ icon, label, href }, …],  // recommended-next grid
  faqs: [{ q, a }, …]     // niche-aware FAQ
}
```

Honesty contract: copy-only swaps. No numbers, no claims, no
fabricated outcomes — packs change words, not promises.

### Files

```
incubator app/copy-packs/
├── agency.js     — DEFAULT pack (full English copy)
├── skincare.js
├── coaching.js
├── fitness.js
├── index.js      — IncubatorCopy loader: getNiche / getPack / apply / listNiches
└── all.js        — single-script bundle entry; document.writes the 5 above in order
```

Each Incubator page now loads `copy-packs/all.js` *before* `incubator.js`
— one extra script tag per page (5 pages: index + 4 phase pages +
resources).

### Swap mechanism

Loader runs at DOMContentLoaded (`IncubatorCopy.apply(document)`).
Hooks:

| Selector                                | Source field             |
| --------------------------------------- | ------------------------ |
| `[data-niche-tagline]`                  | `pack.heroTagline`       |
| `[data-niche-callout]`                  | `pack.aquaResourceCallout` |
| `[data-niche-promise="N"]` (1-4)        | `pack.phasePromise[N-1]` |
| `[data-niche-modules]`                  | `pack.moduleHighlight[]` rendered as `.inc-card`s |
| `[data-niche-faqs]`                     | `pack.faqs[]` rendered as `<details class="inc-toggle">` |
| `[data-niche="<topLevelKey>"]`          | string-typed `pack[key]` (generic) |

Body gets `data-incubator-niche="<niche>"` for future CSS hooks.

### Page wiring

| Page                        | Hooks added                                          |
| --------------------------- | ---------------------------------------------------- |
| `index.html`                | hero `[data-niche-tagline]`                          |
| `phase-1-epic-intro.html`   | promise `[data-niche-promise="1"]` in "What happens" |
| `phase-2-blueprint.html`    | promise `[data-niche-promise="2"]`                   |
| `phase-3-diagnostics.html`  | promise `[data-niche-promise="3"]`                   |
| `phase-4-brand-builder.html`| promise `[data-niche-promise="4"]`                   |
| `resources.html`            | `[data-niche-callout]` + `[data-niche-modules]` grid + `[data-niche-faqs]` block |

### BOS admin selector

`business-os app/admin.html` Overview pane gains a "Incubator niche
pack" slot — `<select>` of the 4 packs + Save button. Writes
`bos.brand.niche` directly (preserves any other `bos.brand.*` fields
via JSON merge). Status message confirms save; user reloads any
Incubator page to see the new pack apply. Hot-reload not forced —
Incubator pages are pull-based on load.

Public surface:
```js
window.IncubatorCopy.getNiche();    // string
window.IncubatorCopy.getPack(?);    // current or named pack
window.IncubatorCopy.apply(?root);  // re-render swaps
window.IncubatorCopy.listNiches();  // ['agency','skincare',…]
```

### R004 smoke (verified 2026-05-07)

- All 6 Incubator pages 200; all 6 copy-pack files (4 packs + index +
  all bundle) 200; BOS admin 200.
- Default load with no `bos.brand` shows agency pack (verified by
  inspecting `document.body.dataset.incubatorNiche` after DOMContentLoaded).
- Setting `bos.brand={"niche":"skincare"}` then reloading the
  Incubator hero shows the skincare tagline; resources.html shows the
  skincare modules + FAQ.
- BOS admin niche selector: change → Save → status confirms; reload
  Incubator → new pack applied.

### Q-ASSUMED + R004 follow-ups

- Storage key per prompt is `bos.brand.niche`; existing BOS code uses
  `bos.user.niche`. Loader supports both with `bos.brand.niche` taking
  precedence. **R+1**: BOS sign-up flow could write both keys to keep
  the two surfaces in sync without legacy fallback.
- Per-niche imagery is explicitly out of scope (placeholder gold-marble
  for all). Future round can swap cover variants per pack.
- Module hrefs all point at the existing 5 written modules
  (`module.html?id=core-principles | super-sales | ops-sustainability |
  referral-alchemy`). Locked module ids could ship later when those
  lessons exist (chapter #71 follow-up).

## R005 — HC-driven next-action recommendations (2026-05-07)

Per honesty contract (chapter #68): HC results map to specific
Incubator-surface next moves. Root page now renders a "Your next move
— based on your Health Check" strip when HC has at least one answered
topic. Empty / partial states are explicit.

### Files

- NEW `incubator app/lib/recommend.js` — pure `IncubatorRecommend.fromHC(hc)` + DOM `mount()`.
- `incubator app/incubator.css` — `.inc-hc-strip*` block (~95 lines).
- `incubator app/index.html` — `<section class="inc-hc-strip" data-hc-recommend>` slot + `<script src="lib/recommend.js">` tag.

### HC topic → recommendation map

`recommend.js` carries a `TOPIC_MAP` keyed by the 5 HC area names (per
the lead-magnet `persistToBOS()` shape):

| HC topic                       | leakHeadline                            | deepLinkTo (lesson / phase / human) |
| ------------------------------ | --------------------------------------- | ----------------------------------- |
| `Visibility & Search`          | hard to find when people search         | lesson · core-principles            |
| `Your Website`                 | landing but not converting              | lesson · super-sales                |
| `Where Customers Come From`    | channel-dependent                       | phase · phase-3-diagnostics         |
| `My Business`                  | foundations need shoring up             | phase · phase-2-blueprint           |
| `Keeping Them`                 | customers leave after first sale        | lesson · referral-alchemy           |

If the worst score is `< 30`, an extra **Talk to a human** row is
appended (whatsapp link). Each rec gets a `severity` ∈
`critical|warn|mild` (boundaries 30 / 55) which colours the left
border + drives the "Biggest leak / Worth fixing soon / Mild" pill.

### Pure function contract

```js
window.IncubatorRecommend.fromHC(hc) → [
  { topic, icon, score, severity, leakHeadline, suggestedAction, deepLinkTo: { kind, label, href } },
  …
]
```

Honest behaviour:

- Topics with `score == null` are filtered out (the contract).
- Sorted ascending by score (lowest = biggest leak).
- Top 3 + optional human-CTA row.
- `null` HC or zero answered topics → empty array → explicit empty
  state in the strip ("No Health Check on file yet — Run the 12-min HC").

### Strip rendering

- **Empty** — single card with 🩺 icon + "Run the Health Check →" CTA.
- **Partial** — header sub-line "N topic(s) still unanswered.
  Recommendations only cover what you answered — that's the honesty
  contract." Visible when `hc.topics` contains any null-score entry.
- **Full** — head row "Your next move — based on your Health Check"
  + "Re-run the HC ↗" link, then the rec rows.

Each rec row: topic chip (icon + name + score pill + severity pill),
leak headline, suggested action, single CTA (`→` for in-portal,
opens new tab for human).

### Auto-update behaviour

`mount()` runs at DOMContentLoaded — every visit to the root page
re-reads `bos.healthCheck` and re-renders, so re-running the HC is
reflected immediately on next page load. No live-update inside the
same tab; that's an R+1 if needed.

### R005 smoke (verified 2026-05-07)

- Root page returns 200; `lib/recommend.js` returns 200.
- Default visit (no HC) → strip shows "No Health Check on file yet"
  empty state with Run-the-HC CTA.
- Setting `bos.healthCheck` with a `topics:[…]` payload (some
  null-score, some scored) → strip renders 3 ranked recs by ascending
  score + partial-state sub-line listing unanswered count.
- Worst-score < 30 → adds the "Talk to a human" row with whatsapp
  link.

### Q-ASSUMED + R005 follow-ups

- `TOPIC_MAP` matches the 5 area names emitted by the lead-magnet's
  `persistToBOS()` (`Visibility & Search` / `Your Website` /
  `Where Customers Come From` / `My Business` / `Keeping Them`). If
  admin's questions editor (chapter #69) renames an area, recs for
  that topic will fall through (filtered by `Boolean()`); R+1 should
  surface "no map for X — patch TOPIC_MAP".
- Severity boundaries (30 / 55) are gut-feel; could be tuned once
  there's enough HC data to calibrate.
- Live in-tab update on HC re-completion is out of scope; could
  listen on `storage` events as R+1.

## R006 — BOS lessons → Incubator phase-advance signal (2026-05-07)

Self-report progression: completing all required BOS lessons surfaces
a "Mark phase complete →" CTA on the relevant phase page. Click marks
the phase advanced, flips `incubator.phase` forward, fires a
CustomEvent for other surfaces to celebrate, and pops a small
confetti burst.

> No auto-advance — operator stays in control. Lesson-mark is also
> reversible (toggle button on `module.html`).

### New keys

| Key                          | Type                          | Notes                                                |
| ---------------------------- | ----------------------------- | ---------------------------------------------------- |
| `bos.lessonProgress`         | `{ [lessonId]: true }`        | NEW — written by `module.html` "✓ Mark this lesson done" toggle. |
| `incubator.phaseAdvanced`    | `{ [phaseId]: true }`         | NEW — written by phase-advance click handler. Kept separate from R002's `incubator.phaseProgress` per-step map so neither shape collides. |

> **Q-ASSUMED deviation from prompt**: The round prompt says
> `incubator.phaseProgress[phaseId] = "complete"` but R002 uses that
> key as a per-step `{ [stepId]: true }` map — a literal "complete"
> overwrite would have wiped the per-step state. Used a separate
> `incubator.phaseAdvanced` map to preserve both contracts.

### Phase → required lessons map

```js
PHASE_LESSON_REQUIREMENTS = {
  'epic-intro':    [],
  'blueprint':     ['core-principles'],
  'diagnostics':   ['chrome-profile', 'super-sales'],
  'brand-builder': ['ops-sustainability', 'referral-alchemy']
}
```

Distribution covers all 5 currently-shipped lessons (chapter #74).
Epic-intro requires no lessons — it's orientation-only — so its
"phase-advance" block renders "No lessons required for this phase."
and no CTA.

### Files

- NEW `incubator app/lib/phase-advance.js` (~165L) — `IncubatorPhaseAdvance.{statusFor, markComplete, mount, PHASE_LESSON_REQUIREMENTS}`.
- `incubator app/incubator.css` — `.inc-pa*` block + `.inc-pa-confetti` keyframes (~70L). Confetti respects `prefers-reduced-motion`.
- 4 phase pages — added `<section class="inc-pa" data-phase-advance="<phaseId>"></section>` slot before back-link, plus `<script src="lib/phase-advance.js">` tag.
- `business-os app/module.html` — added "✓ Mark this lesson done" button + status line; click toggles `bos.lessonProgress[id]`.

### Phase-advance render states

- **No lessons required** (Epic Intro) — head line only, no bar / no CTA.
- **In progress** — bar + "Lessons still to complete: id, id" line.
- **All complete + not yet advanced** — bar at 100% + gold "Ready to advance? Mark <Label> complete →" button.
- **Already advanced** — green "✓ Phase marked complete. You're on <next-phase>." line. No re-fire.

### CustomEvent contract

```js
document.dispatchEvent(new CustomEvent('incubator:phase-complete', {
  detail: { phaseId, nextPhaseId }
}))
```

Fires on each successful `markComplete()`. R+1 wiring: HC + BOS pages
can listen and pop their own celebratory toast (today only the
Incubator's own confetti + toast fires).

### Confetti

32 coloured particles fall from the top with randomised horizontal
positions, animation delay (0–0.4s) and duration (1.2–2.0s). Removes
itself from DOM after 2.4s. Hidden under
`@media (prefers-reduced-motion: reduce)`.

### R006 smoke (verified 2026-05-07)

- All 4 phase pages 200; `lib/phase-advance.js` 200; `module.html` 200.
- Default visit to `phase-2-blueprint.html` shows "Lesson progress · 0
  / 1 complete" + "Lessons still to complete: core-principles".
- Visit `module.html?id=core-principles` → click "✓ Mark this lesson
  done" → status confirms; reload → button reads "✓ Done — undo".
- Reload `phase-2-blueprint.html` → progress bar at 100% + "Ready to
  advance? Mark Blueprint Setup complete →" gold CTA.
- Click CTA → confetti burst + toast "Phase complete → Diagnostics &
  Foundations" + body of section flips to green "✓ Phase marked
  complete." `incubator.phase` advanced to `diagnostics`. Re-render
  shows the done state on subsequent visits.
- `phase-1-epic-intro.html` shows "No lessons required for this phase."
  (no CTA / bar) — orientation-only behaviour intentional.

### Q-ASSUMED + R006 follow-ups

- `bos.lessonProgress` shape introduced fresh — no prior writer in
  bos.js. R+1: `module.html`'s "Next" link could auto-mark on click;
  for now it's an explicit toggle.
- Lesson distribution per phase is a defensible default; admin could
  flip via a future editor.
- Confetti DOM-creation lives in the helper (no library dependency).
  Acceptable; if more surfaces want celebrations, lift into a shared
  primitive.
- Round prompt mentions HC + BOS celebratory listeners on the
  CustomEvent — wiring those is genuinely on-scope for those surfaces
  but not strictly required ("consumed by HC + BOS for celebratory
  toast" is descriptive). Left as R+1 hook (`document.addEventListener('incubator:phase-complete', …)`)
  rather than touching HC + BOS unnecessarily this round.

## R010 — HC → Incubator handoff (2026-05-07)

The Health Check is the front door; the Incubator is the path. R010
wires the two: a primary CTA on the HC results page seeds Incubator
state from the user's HC inputs, then drops them into a populated
Incubator surface.

### HC results page

NEW `.hc-incubator-handoff` card inserted **between the leak strip
and the transparency block** — top-of-fold for the next-step decision.
Header: "🏛 Continue your journey in the Incubator." + 3-line lead +
big primary CTA `→ ../incubator app/index.html?from=hc`.

Click handler runs `bridgeHcToIncubator()` (inline in lead-magnet
script block), then default navigation proceeds.

### `bridgeHcToIncubator()` contract

Reads:
- `hc.contact` for name + business + goal.
- `bos.user` as fallback for name + business + niche.
- `bos.brand` (existing) — preserves any existing fields via JSON merge.

Writes:
- `bos.brand.companyName` — from `contact.business || user.business`, only if not already set.
- `bos.brand.niche` — from `user.niche || existing brand.niche || 'agency'`, only if not already set.
- `incubator.goals[]` — appends `contact.goal` if present and not already in the array.
- `incubator.phase = 'epic-intro'` — only if unset.
- `incubator.bridgedFromHC = '1'` — flag the welcome banner consumes.
- `incubator.userName = <name>` — used by the welcome banner.
- `bos.activity[]` — appends `{ts, type:'hc-to-incubator', msg}`.

Honesty contract: bridge only seeds what the user actually provided —
no defaults are invented for missing fields, no scores are
extrapolated.

### Incubator welcome banner

NEW `incubator app/lib/welcome.js` (~110L) renders into the new
`<section data-inc-welcome>` slot at the top of root `index.html`.

Two states:

- **First visit** (`incubator.welcomedAt` unset): "Welcome, {name}.
  Based on your Health Check, you're starting at <strong>Epic Intro</strong>.
  Watch the welcome video to begin." Primary CTA "Open Epic Intro →"
  + dismiss button "Got it · don't show again". Dismiss writes
  `incubator.welcomedAt = <iso>` + logs to `bos.activity[]`.
- **Returning visitor** (welcomed AND `incubator.lastVisitedPhasePage`
  set): blue-tinted "Pick up where you left off." card with last-
  visited phase chip; entire card is a link back to that phase page.

If the user wasn't bridged from HC, the first-visit copy degrades
gracefully — "You're starting at Epic Intro. Watch the welcome video
to begin — or jump into any phase from the Phase Path below."

### Last-visited phase tracker

`incubator.js` adds a one-line writer at boot — when current page
matches `phase-N-…html`, writes `incubator.lastVisitedPhasePage = <page>`.
No per-phase-page edits needed.

### New / updated localStorage keys

| Key                                 | Type   | Purpose                                          |
| ----------------------------------- | ------ | ------------------------------------------------ |
| `incubator.bridgedFromHC`           | `'1'`  | Flag — welcome banner uses for HC-aware copy.    |
| `incubator.userName`                | string | Captured at bridge; used by welcome banner.      |
| `incubator.welcomedAt`              | ISO    | Banner-dismissed timestamp.                      |
| `incubator.lastVisitedPhasePage`    | string | Last `phase-N-…html` visited.                    |
| `incubator.goals[]`                 | array  | Appended from HC `contact.goal`.                 |
| `bos.brand.companyName`             | string | Seeded by bridge.                                |
| `bos.activity[]`                    | array  | Append-only `{ts, type, msg}` log; admin R+1 surfaces. |

### CSS — `.inc-welcome*` block (~70L)

Gold-bordered first-visit card on dark gradient; blue-bordered resume
card with `.inc-chip-resume` blue-tint variant. Both use Playfair for
the greet line and the existing Inc button-style for CTAs.

### Smoke (verified 2026-05-07)

- `lead magnet app/index.html` 200; `incubator app/index.html` 200;
  `incubator app/lib/welcome.js` 200.
- Manual flow: complete HC → results page renders new "Continue your
  journey" CTA between leak strip and transparency. Click → bridge
  writes the 7 keys → navigation to `incubator app/index.html?from=hc`.
- First Incubator visit shows the welcome banner with "Welcome, <name>."
  Dismiss writes `incubator.welcomedAt` + logs to `bos.activity[]`.
- Visit `phase-2-blueprint.html` → returns to root → resume card
  reads "Pick up where you left off · Blueprint Setup" linking back.

### Q-ASSUMED + R010 follow-ups

- "Real account creation" remains out of scope per prompt — bridge is
  pure-localStorage seed.
- `bos.activity[]` is a new append-only log; no consumer yet but
  R009's admin Reports tab is the natural surface (R+1 add an
  "Activity" tab pulling the last 50 entries).
- `phaseFromPage()` slug-matches against the existing 4 phase pages
  by suffix (epic-intro / blueprint / diagnostics / brand-builder);
  works as long as filenames stay `phase-N-<slug>.html`.
- HC `contact.goal` field doesn't exist in current HC schema — bridge
  is forward-compatible (only writes if present). Could be added as
  an R+1 step in the HC funnel.

## Cross-refs

- §15 visual spec — `04-aqua-internals-reference.md` §15a–§15g.
- Ecosystem snapshot — `04-milesy-ecosystem-progress.md` (#66).
- Plugin extraction future-state — `04-business-os-plugin-handoff.md` (#67).
- Honesty contract — `04-hc-results-honesty.md` (#68).
- Free/Pro gating — `04-free-vs-pro-gating.md` (#70).
- Architecture reference (file-by-file conventions mirrored here) —
  `04-t4-architecture-reference.md` (#73).
