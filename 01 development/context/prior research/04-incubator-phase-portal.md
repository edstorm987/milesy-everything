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

## Cross-refs

- §15 visual spec — `04-aqua-internals-reference.md` §15a–§15g.
- Ecosystem snapshot — `04-milesy-ecosystem-progress.md` (#66).
- Plugin extraction future-state — `04-business-os-plugin-handoff.md` (#67).
- Honesty contract — `04-hc-results-honesty.md` (#68).
- Free/Pro gating — `04-free-vs-pro-gating.md` (#70).
- Architecture reference (file-by-file conventions mirrored here) —
  `04-t4-architecture-reference.md` (#73).
