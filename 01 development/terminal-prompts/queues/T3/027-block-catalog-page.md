/loop

# T3 — Round 027: In-editor block catalog / docs page

Editor sidebar gets a "Block catalog" tab — rendered list of every
registered block with preview + description + insert-on-click.

## Mandatory pre-read

1. T3 R017 block library polish — full block list.
2. Existing block manifests.

## Scope

**A** — `BlockCatalog.tsx` component renders all blocks grouped by
category (layout / media / commerce / form / chrome / etc.). Each:
preview thumbnail (SVG placeholder ok) + name + description + insert
button.

**B** — Search filter at top.

**C** — Per-block "View source" expander shows the JSON shape
(useful for Code-mode users from R020).

**D** — Smoke + chapter `04-block-catalog.md` + MASTER row.

## NOT in scope

- Live previews (R+1).
- Per-block changelog.

## When done
DONE referencing `027-block-catalog-page.md`.
