/loop

# T4 — Round 001: Incubator-phase client portal + BOS wired in

Build the **client-facing Incubator-phase portal** — the templated portal
every Aqua client sees during phases 1–4 of the Aqua Incubator 3.0 (Epic
Intro → Blueprint Setup → Diagnostics/Foundations → Brand Builder), before
they graduate to a Live (custom) portal. Wire **Business OS** into it as
the working tool surface for the design / blueprint stage.

**No real API wiring this round.** Self-report / localStorage / static —
matching the rest of the Milesy ecosystem. Real connectors are a future
round.

## Mandatory pre-read

1. `01 development/context/prior research/04-aqua-internals-reference.md`
   §5 (real 6-phase Aqua Incubator progression) and §15 (Notion-style
   Incubator visual pattern — page anatomy, block taxonomy, navigation,
   visual register, the §15e template recipe, §15f bridge to portal).
2. `01 development/context/prior research/04-milesy-ecosystem-progress.md`
   (#66) — current ecosystem snapshot (apps, origin, file tree, sidebar,
   localStorage schema). The Incubator app must fit this same shape.
3. `01 development/context/prior research/04-business-os-plugin-handoff.md`
   (#67) — the future-state extraction spec. We're NOT extracting this
   round; we're embedding the existing BOS into the Incubator surface.
4. `01 development/context/prior research/04-free-vs-pro-gating.md` (#70)
   — `bos.mode` gating contract. Incubator clients are effectively
   pre-paying customers — choose a sensible default mode (Q-ASSUMED).
5. `01 development/context/prior research/04-t4-architecture-reference.md`
   (#73) — file-by-file shape; mirror conventions in the new app.
6. `01 development/ed-dropbox/screenshots/Incubator (client onboarding)/`
   — the 7 source screenshots.

## Scope

**Goal A — Scaffold the Incubator app**

- New surface: `04-the-final-portal/milesymedia website/incubator app/`
  (sibling of `business-os app/` and `lead magnet app/`). Vanilla
  HTML/JS, served by the same `:3033` host.
- Shared origin → can read/write the same `bos.*` localStorage namespace
  used by HC + BOS. Add a new `incubator.*` namespace for Incubator-only
  state (current phase, completed steps, video-watch flags, etc.).
- Visual register per §15d: dark theme baseline (`#0F0F0F` cards on
  black), gold-marble + nature/forest hero imagery, mythos copy register
  in starter copy.

**Goal B — Page anatomy + the 4 new blocks (HTML/CSS, not the editor port)**

Implement §15a anatomy and §15b blocks as static HTML components:
- `cover` — full-bleed banner image at top.
- `icon` — small art chip overlapping the cover, left-aligned.
- `pageTitle` — H1 + optional caption.
- `propertyStrip` — Notion-style key-value disclosure ("X more properties").
- `videoEmbed` — Vimeo/YouTube iframe.
- `toggle` — `▸ Header` collapsible (vanilla `<details>` is fine).
- `cardGrid` — 2-col responsive grid, each card = cover image + emoji + label + link.
- `button`, `divider`, `helpRow`, `feedbackRow` per spec.

This ships as static markup + small JS for toggle/disclosure/property
edits. **The website-editor block extraction is deferred to a future T3
round** — we are NOT touching `@aqua/plugin-website-editor` here.

**Goal C — The §15e template, instantiated as the Incubator root page**

Build the root page exactly per the §15e recipe:
```
cover · icon · pageTitle("THE OPULENCE INCUBATOR 3.0",
  caption="Your Onboarding Control Panel — Please Follow Each Step in Order.")
propertyStrip(Phase / Plan / Started)
videoEmbed (placeholder)
toggle("Your First Action Step - Please Open Me!")
helpRow · feedbackRow · divider
cardGrid("Incubator Navigation", [
  💎 Aqua Onboarding - Start Here!  → onboarding.html
  🏛 My Client Portal - Access      → portal-bridge.html
  ✨ Aqua Resources Lite - Bonus!   → resources.html
  🌊 Discover AquaOasis-Web         → discover.html
])
```

Each card destination is its own page using the same anatomy. Ship
**all five pages** (root + 4 sub-pages) per §15c with the cardGrids /
toggles / videoEmbed slots described in the screenshots. Copy can be
mythos-register placeholder; operators rewrite.

**Goal D — Wire BOS in as the design / blueprint tool**

- The "Aqua Resources Lite - Bonus!" page (per §15c shows a "My Business
  OS Tutorial" toggle) gets a primary CTA card: **"Open My Business OS"**.
- That CTA opens BOS — same-origin link to `/business-os app/app.html` —
  so existing `bos.*` localStorage works untouched.
- Add a small **breadcrumb / back-to-Incubator** widget into BOS that
  appears only when `incubator.active === true` (set when the user came
  in via the Incubator surface). Implementation: tiny edit to `bos.js` —
  read `incubator.active` flag and render a header strip "← Back to
  Incubator" linking to `/incubator app/`. No structural BOS changes.
- Q-ASSUMED ok: BOS mode while in Incubator. Default to whatever makes
  sense (likely `pro` since these are paying clients) and document.

**Goal E — Incubator phase awareness**

- `incubator.phase` localStorage key (string: `epic-intro`, `blueprint`,
  `diagnostics`, `brand-builder`). Defaults to `epic-intro`.
- Root `propertyStrip` reads this and renders the chip.
- Add a tiny dev affordance: `?phase=blueprint` query param sets
  `incubator.phase` (mirrors the existing `?dev=1` BOS pattern).
- Per phase, soft-gate cards: cards available at later phases render
  with a subtle "🔒 Unlocks at Brand Builder" overlay rather than being
  hidden. Honesty contract — show the path, don't fake completion.

**Goal F — Bridge from Incubator → custom portal (§15f)**

- The "My Client Portal - Access" sub-page contains a single primary
  button **"Click Me To Enter Your Portal!"**. For now this links to a
  placeholder (`/business-os app/app.html` is fine as a stand-in until
  the Live custom portal exists). Document the future swap in the
  chapter.

**Goal G — Smoke + chapter + MASTER row**

- Smoke: all 5 Incubator pages return 200 from `:3033`. cardGrid renders
  4 cards. Toggles open/close. Phase chip reflects `?phase=` override.
  BOS bridge lands and the back-to-Incubator strip renders only when
  `incubator.active=1`.
- New chapter `04-incubator-phase-portal.md` — what was built, file
  tree, the localStorage `incubator.*` schema, the BOS bridge contract,
  the future-state migration to a portal plugin (defer to chapter #67).
- Add MASTER row.
- Append a row to `tasks.md`.

## NOT in scope

- Porting the 4 new blocks into `@aqua/plugin-website-editor` — that's
  a future T3 round per §15g.
- Real video URLs / final copy — placeholders are fine.
- BOS structural rework — only the back-to-Incubator strip touch.
- Wiring real APIs (HC connectors, Lighthouse, GA4, etc.).
- Any change inside `04-the-final-portal/portal/`, `plugins/`, or
  `clients/`.
- Auth — Incubator runs as same-localStorage user as HC/BOS for now.

## When done

DONE referencing `001-incubator-phase-portal.md`.
