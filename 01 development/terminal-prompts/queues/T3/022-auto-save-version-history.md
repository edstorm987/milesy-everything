/loop

# T3 — Round 022: Auto-save + persisted version history

R021 ships in-memory undo. R022 persists named versions per page so
operators can roll back across sessions / devices.

## Mandatory pre-read

1. T3 R021 chapter (must ship first).
2. Existing page persist surface in editor.

## Scope

**A** — Auto-save on edit (debounced 5s). Saves to plugin storage as
`pageVersion:<pageId>:<ts>` capped at 30 most recent.

**B** — "Versions" topbar dropdown lists timestamped saves. Click =
preview tree against current brand-kit. Restore = swap tree.

**C** — "Save named version" affordance — operator can checkpoint
("Pre-launch v1") for a stable rollback point. Named versions never
auto-pruned.

**D** — Smoke + chapter `04-version-history.md` + MASTER row.

## NOT in scope

- Diff view (R+1).
- Multi-user edit conflict.

## When done
DONE referencing `022-auto-save-version-history.md`.
