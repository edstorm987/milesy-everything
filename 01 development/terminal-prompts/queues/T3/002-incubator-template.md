/loop

# T3 — Round 002: Incubator client-onboarding template (Notion-style)

Ed wants new clients to land in a **Notion-style portal** that looks like
the Opulence Incubator 3.0 — captured in chapter
**`01 development/context/prior research/04-aqua-internals-reference.md`**
§15 (15a–15g). Reference screenshots in
`01 development/ed-dropbox/screenshots/Incubator (client onboarding)/`.

Pre-req: T3 Round 001 (editor deep-link + page picker) shipped.

## Mandatory pre-read

1. Chapter #59 §15 end-to-end — the visual pattern, block taxonomy, page
   anatomy, navigation pattern, template structure (§15e), bridge button
   (§15f).
2. The 7 screenshots in `01 development/ed-dropbox/screenshots/Incubator
   (client onboarding)/`. Look at every one before starting.
3. Your `04-plugin-website-editor-round2.md` chapter — current block
   library shape.

## Scope

**Goal A — Four new blocks**
Add to `@aqua/plugin-website-editor` block registry:

- `icon` — small art chip (~64×64) overlapping a cover. Props:
  `{ image: string, offsetY?: number, label?: string }`.
- `propertyStrip` — Notion-style key-value rows in a disclosure. Props:
  `{ rows: { key, type: "phase"|"select"|"date"|"text", value: string }[],
  collapsedLabel?: string (default "X more properties") }`.
- `toggle` — `▸ Header` disclosure that opens to nested blocks. Props:
  `{ label: string, defaultOpen?: boolean, children: BlockNode[] }`.
  Render `children` only when open. Keyboard: Enter / Space toggles.
- `cardGrid` — 2-col grid of cards (responsive: 1-col on narrow). Props:
  `{ columns: 2 | 3, items: { coverImg, icon, label, href }[] }`. Each
  card renders cover image + icon chip + label, full-card click area.

All four follow the existing `BlockRenderProps` contract; tsc clean.

**Goal B — Incubator Template preset**
- Implement the §15e template structure as a preset in
  `pageTemplates.ts`: id `aqua-incubator`, label "Aqua Incubator",
  body = the BlockTree from §15e.
- Use placeholder cover imagery for v1 (the gold-marble + nature stock
  images Ed referenced live in `01 development/ed-dropbox/screenshots/`
  — copy 2–3 into `04-the-final-portal/portal/public/aqua-incubator/`
  for default covers; operator overrides per client).
- Sub-pages (Aqua Onboarding / My Client Portal / Aqua Resources / Discover)
  ship as seeded sibling pages with the same anatomy. Link via
  `cardGrid` items' `href` to relative paths.

**Goal C — Auto-apply on Epic Intro**
- T1 R001's "+ New client" modal accepts `phase = Epic Intro`. When
  it does, the website-editor's `applyStarterVariant` (foundation) seeds
  the new client's portal with the Incubator Template preset. Add a
  `starterTemplateId` arg to that flow and default to `"aqua-incubator"`
  when phase is Epic Intro. (Foundation hook only; T1 wires the modal
  toggle in their next round if needed.)

**Goal D — Bridge button to portal**
- `cardGrid`'s "My Client Portal - Access" card opens a sub-page that
  renders a single `button` block — label "Click Me To Enter Your Portal!",
  `href` resolves to the client's account hub (relative
  `/portal/customer` or per-portal-variant target). Same-origin, cookie
  flows naturally.

**Goal E — Smoke + chapter**
- Smoke: each of the 4 blocks renders with valid + invalid props (graceful
  degrade); template instantiation creates 5 pages with correct cardGrid
  links; toggle keyboard interaction; bridge button URL resolves.
- Chapter `04-incubator-template.md`. MASTER row. Update website-editor
  R2 chapter with a "Round 002 — Notion-style blocks added" pointer line.

## NOT in scope

- Real-time collaborative editing.
- Vimeo / video embed block — stale ports of `02`'s VideoBlock cover this;
  if missing, ship a stub `videoEmbed` block and flag.
- Marketplace browsing of templates beyond the one Aqua-Incubator preset.
- Touching milesymedia / business-os (HARD BOUNDARY).
- Felicia / Luv & Ker (paused).

## When done

DONE referencing `002-incubator-template.md`. Chapter + MASTER + tasks.md.
