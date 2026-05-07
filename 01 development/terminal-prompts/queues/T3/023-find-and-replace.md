/loop

# T3 — Round 023: Site-wide find-and-replace

Operator can search across all pages of a portal-variant for text
content + replace. Useful for brand-name swaps, copy refresh.

## Mandatory pre-read

1. Existing page tree schema (block text content).
2. T3 R012 portal-variant editor.

## Scope

**A** — Cmd-Shift-F opens find-and-replace modal. Search field +
replace field + scope chips (this page / this variant / all pages).

**B** — Live results: list of matches with surrounding text snippet
+ page name. Click a result jumps to that page + selects the block.

**C** — Replace All confirmation modal — shows count + warning if >50
matches. Atomic transaction across pages.

**D** — Case-sensitive + whole-word toggles.

**E** — Smoke + chapter `04-find-and-replace.md` + MASTER row.

## NOT in scope

- Regex search.
- Find/replace in alt-text or attribute values (text content only).

## When done
DONE referencing `023-find-and-replace.md`.
