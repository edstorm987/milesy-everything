/loop

# T3 — Round 009: 4 Notion-Incubator blocks in @aqua/plugin-website-editor

Per chapter §15g, port the 4 new blocks T4 prototyped in their static
Incubator app into the website-editor plugin proper:
`icon` · `propertyStrip` · `toggle` · `cardGrid`.

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §15a (anatomy), §15b (block
   taxonomy table), §15g.
2. T4 R001 chapter `04-incubator-phase-portal.md` — reference HTML/CSS
   shape.
3. Existing block contract pattern (T3 prior rounds — block
   contributions, BlockRenderer, theme overlay).

## Scope

**A** — Add 4 block ids to website-editor manifest. Each has a Live
mode renderer + Block-mode editor card + Properties pane fields.

**B** — `icon`: single-image small chip (max 96px), offset positioning
(overlapping cover above).

**C** — `propertyStrip`: array of `{ key, value, type }` rows
(`type: phase | select | date | text | url`); renders Notion-style
"X more properties" disclosure.

**D** — `toggle`: `▸ Header` collapsible. Children = `BlockTree`
rendered when open. Editor: nest blocks inside the toggle.

**E** — `cardGrid`: 2-col responsive grid of card items
(`{ coverImg, icon, label, href }`). Each card opens its destination
in same window.

**F** — Theme overlay applies to all four (CSS var driven per chapter
constraint — no hardcoded colours).

**G** — Smoke + chapter `04-blocks-notion-incubator.md` + MASTER row.

## NOT in scope

- T4 Incubator app port (T4 owns it).
- AI block generation.

## When done
DONE referencing `009-notion-incubator-blocks.md`.
