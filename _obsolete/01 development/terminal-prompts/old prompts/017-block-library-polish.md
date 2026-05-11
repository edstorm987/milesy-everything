/loop

# T3 — Round 017: Block library polish — fill 5 missing common blocks

Audit `@aqua/plugin-website-editor` block library against the 58-block
catalog (chapter 07) + Felicia portal usage. Ship 5 commonly-needed
blocks that are missing or thin.

## Mandatory pre-read

1. Chapter 07 (block library) — full 58-block taxonomy.
2. Felicia portal block usage (`02 felicias aqua portal work/`).
3. Existing block list in current website-editor manifest.

## Scope

**A** — Audit pass: log every block currently registered vs the 58
catalog. Pick the top 5 missing/thin (likely candidates: `accordion`,
`tabs`, `pricing-table`, `feature-comparison`, `team-grid`).

**B** — For each: add Live renderer, Block-mode card, Properties pane.
CSS-var driven (no hardcoded brand colours).

**C** — Each block ships with a sensible default tree on insert.

**D** — Smoke + chapter `04-block-library-polish.md` + MASTER row.

## NOT in scope

- Reach for full 58-block parity (multi-round project).
- Animation choreography per block.

## When done
DONE referencing `017-block-library-polish.md`.
