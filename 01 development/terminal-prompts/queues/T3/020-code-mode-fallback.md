/loop

# T3 — Round 020: Code-mode fallback — JSON tree editor

Per chapter 06 editor has Live / Block / Code modes; Live + Block
shipped, Code is missing. Ship Code mode as a JSON tree editor for
operators who need to debug or paste-import a tree.

## Mandatory pre-read

1. Chapter 06 visual editor — Code mode reference (from `02`).
2. Current Block-tree schema.

## Scope

**A** — Topbar "Code" tab. Splits view: read/write JSON of current
page tree on the left, live preview on the right.

**B** — Validation: on edit, parse + validate against schema; flag
errors inline, don't break preview if invalid (show last-good).

**C** — Save: writes parsed tree back into the page. Confirm modal
warns if structurally different from current.

**D** — Copy-tree / paste-tree buttons — useful for moving blocks
between pages or sharing snippets.

**E** — Smoke + chapter `04-code-mode.md` + MASTER row.

## NOT in scope

- Full TS/Tailwind code editor (out of scope).
- Diff view.

## When done
DONE referencing `020-code-mode-fallback.md`.
