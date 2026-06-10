/loop

# T3 — Round 021: Undo/redo history for the editor

Snapshot-based undo/redo per page-edit session. Cmd-Z / Cmd-Shift-Z
work everywhere. Capped at 50 snapshots per page.

## Mandatory pre-read

1. T3 R018 keyboard shortcuts (palette infra) — `04-editor-shortcuts.md`.
2. Existing tree-mutation surface in @aqua/plugin-website-editor.

## Scope

**A** — `useEditorHistory(pageId, currentTree)` hook: every tree change
captures `{ts, tree, action}` into ring buffer (max 50). Cmd-Z pops →
restores, Cmd-Shift-Z replays.

**B** — Topbar undo/redo buttons + tooltip showing the last action
("Undo: insert hero").

**C** — History tab in topbar dropdown lists last 20 snapshots with
preview on hover; click jumps tree state.

**D** — Smoke + chapter `04-undo-redo.md` + MASTER row.

## NOT in scope

- Cross-session history (in-memory only).
- Per-block history.

## When done
DONE referencing `021-undo-redo-history.md`.
