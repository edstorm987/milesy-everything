/loop

# T3 — Round 034: Version diff view

R022 lists versions; R034 adds a side-by-side diff between two
selected versions — visual + JSON tree both modes.

## Mandatory pre-read

1. T3 R022 version history.
2. T3 R020 Code mode (JSON tree).

## Scope

**A** — `diffTrees(treeA, treeB)` returns `{added[], removed[],
modified[]}` per block-id. Pure function.

**B** — VersionsDropdown gains "Diff vs..." action — opens a 2-pane
view (left = old, right = current) with summary chips at top.

**C** — JSON-mode diff view (line-by-line text diff) for power users.

**D** — Smoke + chapter `04-version-diff.md` + MASTER row.

## NOT in scope

- Cross-page diffs.
- 3-way merge.

## When done
DONE referencing `034-version-diff-view.md`.
