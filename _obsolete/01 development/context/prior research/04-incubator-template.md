# Aqua Incubator template — Notion-style client onboarding (T3 R002)

T3's Round 002 ships the website-editor template that gives every new
Aqua client a Notion-style onboarding portal — the visual pattern Ed
captured in `04-aqua-internals-reference.md` §15. New clients landing
at phase **Epic Intro** auto-populate with a 5-page tree (root +
Onboarding · Client Portal · Resources · Discover) using four new
Notion-style block primitives.

## What changed

### 1. Four blocks added to `@aqua/plugin-website-editor`

- **`icon`** — extended with image-mode props (`image`, `offsetY`,
  `label`). When `image` is set, renders a 64×64 image chip overlapping
  the cover via `marginTop: offsetY`. When absent, falls back to v1
  glyph mode (back-compat).
- **`property-strip`** *(new)* — Notion-style key-value rows in a
  native `<details>` disclosure. Props: `{ rows: { key, type:
  "phase"|"select"|"date"|"text", value }[], collapsedLabel? }`.
  `phase`/`select` rows render as muted pill chips; rest as text.
- **`toggle`** *(new)* — `▸ Header` disclosure that opens to nested
  blocks. Props: `{ label, defaultOpen?, children: BlockNode[] }`.
  Native `<details>` + `<summary>` so keyboard (Enter / Space) and
  screen-readers work without custom handlers. `isContainer: true`.
- **`card-grid`** — extended with Notion-card mode. When `items:
  [{coverImg, icon, label, href}]` is set, renders 2/3-col grid of
  full-card link tiles (cover image + emoji icon chip + label).
  Existing `cards` shape still works (back-compat).

Registry now 60 native blocks (was 58); RENDERER_REGISTRATIONS
auto-derives via NATIVE_RENDERERS so cross-plugin renderer count
unchanged.

### 2. Aqua Incubator template preset (`pageTemplates.ts`)

Five entries in `PAGE_TEMPLATES`:

| ID | Slug | Anatomy |
|---|---|---|
| `aqua-incubator` | `/` | hero · icon · pageTitle · property-strip (Phase/Plan/Started) · 3× toggle (action/help/feedback) · divider · card-grid (4 nav cards) · divider |
| `aqua-incubator-onboarding` | `/onboarding` | hero · icon · h1 · video · toggle (Introduction) · 2 buttons |
| `aqua-incubator-portal` | `/client-portal` | hero · icon · h1 · toggle (Introduction) · **bridge button → `/portal/customer`** |
| `aqua-incubator-resources` | `/resources` | hero · icon · h1 · 2-card grid · 3× toggle |
| `aqua-incubator-discover` | `/discover` | hero · icon · h1 · 6-card grid |

`AQUA_INCUBATOR_TEMPLATE_IDS` exported as readonly array so callers
(starter loader + applyStarterVariant + smoke) iterate consistently.

### 3. `selectStarterForPhase(phase)` helper

Pure function exported from `pageTemplates.ts`. `"Epic Intro"` →
`"aqua-incubator"`; everything else → `null`. T1's "+ New client"
modal calls this when phase is selected to default the
`starterTemplateId` toggle.

### 4. `applyStarterVariant("aqua-incubator")` seeds 5 pages

Extended `portalVariants.ts`: after the standard `createPage` for the
root, when `variantId === "aqua-incubator"` we iterate the 4 sub-page
template ids and create each as a sibling EditorPage on the same site.
Each sibling carries its own `variantId` so they're addressable
individually. The root page is the active variant; sub-pages are
inactive (operator can flip via Portals admin).

### 5. Starter loader — fall-through to PAGE_TEMPLATES

`starterLoader.ts` first checks the static `STARTERS` map; on miss,
falls through to `getTemplate(id)` for any
`AQUA_INCUBATOR_TEMPLATE_IDS` entry, returning a synthesised
`StarterTreeFile` with `role: "account"` (Q-ASSUMED — `PortalRole`
doesn't include "customer" yet; "account" is the closest existing
role for client-landing surfaces). `listStarterIds()` now reports 11
ids (6 round-1 + 5 incubator).

### 6. Cover assets

`04-the-final-portal/portal/public/aqua-incubator/` directory created
with a README documenting the three default cover paths
(`cover-roots.jpg`, `icon-incubator.png`, `card-cover.jpg`).
Operators drop final assets in this folder; until then, the editor
renders graceful broken-image markers + correct surrounding chrome
(per chapter §15a). Q-ASSUMED: not copying the 7 reference screenshots
verbatim because they're Notion screenshots, not the actual nature/
gold-marble imagery Ed wants — operators source those.

### 7. Bridge button (chapter §15f)

The `aqua-incubator-portal` sub-page contains a single primary
`button` block with label *"Click Me To Enter Your Portal!"* and
`href: "/portal/customer"`. Same-origin link; existing session cookie
flows through. Smoke asserts the literal label + href so future
refactors don't silently change the gateway URL.

## Smoke

NEW `__smoke__/incubator-template.test.ts` — 39 cases covering:

- Registry: 4 Notion blocks present + icon image-mode field +
  toggle is `isContainer: true` + getBlockDefinition lookups.
- Template tree: aqua-incubator builds with hero / icon / property-
  strip / ≥3 toggles / card-grid in items[] mode + 4 nav cards +
  every card has href + label + "My Client Portal" → `./client-
  portal`.
- Sub-pages: 4 ids resolve via `getTemplate()` + portal sub-page
  contains bridge button with exact label + `/portal/customer` href +
  onboarding sub-page has toggle + video.
- Discover sub-page card-grid has 6 cards.
- `selectStarterForPhase`: Epic Intro → aqua-incubator, unknown →
  null, null/empty → null.
- Default-prop graceful degrade: property-strip rows[], toggle
  defaultOpen false, card-grid cards[] back-compat, icon glyph mode.
- Starter loader round-trip: `loadStarterTree("aqua-incubator")`
  resolves with role=account + non-empty blocks; `listStarterIds()`
  includes all 5 incubator ids.

Plugin total: **167/167 pass** (52 blocks +25 cross-plugin renderers
+25 save-target +26 deep-link +39 incubator-template). `tsc --noEmit`
clean.

## Cross-team handoffs

- **T1** — When the agency-shell "+ New client" modal lands the new
  client, call
  `applyStarterVariant({variantId: selectStarterForPhase(phase) ??
  "login-default", role: "account", ...})`. The Epic-Intro toggle in
  the modal can default to checked when `selectStarterForPhase(phase)
  !== null`.
- **T1 / Foundation** — When `PortalRole` widens to include
  `"customer"` or `"incubator"`, swap the `role: "account"` constant
  in `starterLoader.ts` (Q-ASSUMED v1).
- **Operators** — Drop final cover images into
  `04-the-final-portal/portal/public/aqua-incubator/`. Per-page
  overrides via the editor properties panel.

## Deferred to next round

- Cover-asset upload pipeline so operators can drop images via the
  editor rather than the public folder.
- Vimeo / loom embed block (the prompt suggests a stub `videoEmbed`
  if missing — existing `video` block covers v1; richer embed deferred).
- Marketplace browsing of templates (only one Aqua-Incubator preset
  for now).
- Dedicated `customer` / `incubator` PortalRole — touches the Portals
  admin UI tabs + variant labels; widening can wait for T1's next
  agency-shell round.
- Sibling-pages `siblingPages?:` field on `StarterTreeFile` — for
  v1 the seeding is hard-coded for `aqua-incubator`; generalising
  unlocks any future starter to declare siblings.

## Files touched

- `src/components/blocks/IconBlock.tsx` (extended)
- `src/components/blocks/CardGridBlock.tsx` (extended)
- `src/components/blocks/PropertyStripBlock.tsx` (NEW)
- `src/components/blocks/ToggleBlock.tsx` (NEW)
- `src/components/blockRegistry.ts` (registry entries +
  imports)
- `src/types/block.ts` (BlockType union)
- `src/components/pageTemplates.ts` (aqua-incubator + 4 sub-page
  templates + `selectStarterForPhase`)
- `src/server/starterLoader.ts` (fall-through to PAGE_TEMPLATES)
- `src/server/portalVariants.ts` (sibling-page seeding)
- `src/__smoke__/incubator-template.test.ts` (NEW, 39 cases)
- `src/__smoke__/blocks.test.ts` (counts 58→60, 6→11)
- `04-the-final-portal/portal/public/aqua-incubator/README.md` (NEW)
- `package.json` (test script wires new smoke)

HARD BOUNDARY honoured throughout — zero touches to
`04-the-final-portal/milesymedia website/` or
`04-the-final-portal/business-os/`.
