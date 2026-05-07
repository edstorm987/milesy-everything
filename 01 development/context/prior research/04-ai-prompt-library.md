# 04 — Aqua AI prompt library (T4 R023)

R007 ships a 35-pattern scripted Aqua AI. R023 adds a **visible
prompt library** — preset questions across 6 categories the user can
click to populate the chat input + auto-send. Lower friction for new
users; better signal for analytics; idle-30s suggestion strip after
each reply keeps the conversation alive.

> Per prompt: real AI follow-ups beyond R007's scripted patterns are
> out of scope.

## NEW `incubator app/lib/aqua-ai-prompts.js` (~80L)

Exposes:

```js
window.AquaAIPrompts = {
  CATEGORIES,           // [{id, label, icon, prompts:[{text, kind}]}]
  all() → flat list with category id on each
  byCategory(id) → prompts
}
```

### 6 categories × ~5 prompts = 28 presets

| Category   | Icon | Prompts                                                                  |
| ---------- | ---- | ------------------------------------------------------------------------ |
| Phase help | 🏛   | What phase am I on? · advance? · Blueprint duration · Diagnostics · Live portal? |
| Strategy   | 🎯   | Biggest leak · this week · cheapest win · pricing · channel-dep         |
| Lessons    | 📚   | Which first? · Core Principles · Super Sales · Referral · HC-recommend   |
| Marketing  | 📣   | GBP · website conversion · grow w/o ads · referral system               |
| Operations | ⚙️   | SOPs · 5 KPIs · workflows break · add-ons first · stop bottleneck       |
| I'm stuck  | 🆘   | What now? · overwhelmed · where to start · talk to a human               |

Each prompt has a `kind` tag (`phase.advance`, `lessons.core-principles`,
etc.) for analytics — `Activity.log('prompt.clicked', {kind, category, text})`.

## `lib/aqua-ai-ui.js` extensions

### Empty state rewritten

When `window.AquaAIPrompts` is loaded, the empty state renders as:

1. Greeting + R007 disclaimer.
2. "Pick a category — or just type your question." subline.
3. 2-col grid of 6 category chips (icon + label).
4. Hidden `[data-ai-cat-prompts]` host.

Click a category → host fills with that category's prompts as button
rows + the chip flips to `.is-on` (gold tint). Click again to
collapse. Clicking a prompt ask()s it (auto-fills input then submits).

Falls back to the old `AquaAI.starters` static-5 list if prompts.js
hasn't loaded.

### Idle-30s suggestion strip

After each bot reply, `ask()` arms a 30-second timer
(`__idleTimer`). On fire: picks 3 random prompts from
`AquaAIPrompts.all()` and appends a small "Try one of these:" chip
strip below the last bot bubble (gold-bordered tinted card). User
typing in the input cancels the timer; the next `ask()` clears any
pending strip + restarts the timer. Strip is single-instance —
re-firing replaces the existing one cleanly.

### Activity log integration

`Activity.log('prompt.clicked', {kind, category, text})` fires on:
- Category-prompt button click — kind from `data-ai-prompt-kind`.
- Idle suggestion chip click — kind prefixed `idle.<…>`.

## `Activity.KINDS` registry addition

```js
'prompt.clicked': { icon: '💬', label: 'Aqua AI prompt clicked' }
```

Surfaces in R013 timeline + admin "Activity events / 7d" KPI.

## CSS — `incubator.css` `.inc-ai-cats` / `.inc-ai-idle` block (~40L)

- `.inc-ai-cats` — 2-col grid of category chips, gold border on hover,
  gold tint background when active.
- `.inc-ai-cat-head` — small muted "Pick a question — or type your own:"
  label above the prompt rows.
- `.inc-ai-idle` — gold-bordered tinted card with header "Try one of
  these:" + 3 vertically-stacked starter buttons. Aligned left + max-width 95%
  to feel like a bot suggestion rather than a UI banner.

## Wiring

All 9 Incubator pages already loaded `aqua-ai.js` + `aqua-ai-ui.js`
(R007). R023 inserts `<script src="lib/aqua-ai-prompts.js">` between
the two via Python loop edit. BOS pages don't need it because the BOS
panel uses its own legacy markup; R+1 could mirror the prompt library
into BOS by extending `paintAi()`.

## Smoke (verified 2026-05-07)

- `lib/aqua-ai-prompts.js`, `lib/aqua-ai-ui.js`, `incubator app/index.html`
  all 200.
- Manual flow:
  1. Open Aqua AI panel on Incubator → empty state renders 6 category
     chips in 2-col grid.
  2. Click "Strategy" → 5 prompt rows render below; chip flips to
     gold-tint active state.
  3. Click "What's my biggest leak right now?" → message ask()'d,
     bot replies (HC-aware via R007 ctx probe), conversation persists.
  4. Wait 30s without typing → "Try one of these:" gold chip strip
     appears below last bot bubble with 3 random prompts.
  5. Type into input → strip stays but next ask() removes it.
  6. R013 Activity timeline shows two `Aqua AI prompt clicked` rows
     (one with `kind:'strategy.biggest-leak'`, one with `kind:'idle.…'`
     for the idle pick).

## Q-ASSUMED + R023 follow-ups

- **BOS panel** isn't extended this round (uses R007's legacy
  `paintAi()` with a static suggest-list). R+1: lift the prompt
  library into BOS panel's empty state.
- **Idle timer** is per-panel, not per-business — switching business
  via R012 doesn't reset it. Acceptable since the panel rebuilds on
  page nav.
- **Translation / niche-aware prompts** — R+1 could swap prompts
  per `bos.brand.niche` (skincare-specific etc.). Today the same
  28 work for all niches.
- **Analytics aggregation** — `Activity.byKind()` already groups
  `prompt.clicked` rows; R+1 admin tile "top 5 prompts" surfaces
  the most-clicked.
- **Mobile category grid** — 2-col might feel cramped under 320px;
  R+1 collapses to 1-col with a media query.

## Cross-refs

- R007 (#83) Aqua AI scripted — prompt library plugs into the same
  `respondTo()` router; no router changes needed.
- R013 (#89) Activity — `prompt.clicked` kind added; surfaces in
  timeline.
- R009 (#85) admin — Activity events KPI now includes prompt clicks.
- R012 (#88) BOSStorage — no namespacing needed (prompt library is
  global, not per-business).
- Chapter #74 copy ref — prompt set drawn from + extends the Aqua AI
  replies catalogue.
