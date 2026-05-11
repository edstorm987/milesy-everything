/loop

# T3 — Lift Inventory: catalogue everything in the legacy folders

Ed wants nothing lost from the two legacy app folders. This round produces
a **read-only inventory chapter** documenting every screen, feature, snippet,
component, and asset that exists in `02` and `03`, mapped to where it
landed in the new portal (or marked "not yet ported — may want later").

**No code changes, no ports, no edits to the legacy folders.** Just an
exhaustive audit chapter Ed can grep when something feels missing.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.

## HARD BOUNDARIES — do NOT touch

- `04-the-final-portal/milesymedia website/` — Ed owns this.
- `04-the-final-portal/business-os/` — Ed owns this.
- `02 felicias aqua portal work/` — read-only.
- `03 old portal/` — read-only.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/context/MASTER.md`
3. `01 development/context/prior research/04-architecture.md`
4. `01 development/context/prior research/old-portal-overview.md` +
   any other `old-portal-*.md` chapters.
5. `01 development/messages/terminal-3/from-orchestrator.md`

## Scope

**Goal A — Audit `02 felicias aqua portal work/`**
- Walk every page, component, lib file, API route, asset folder.
- For each, note: path, one-line purpose, status in new portal
  (PORTED / PARTIAL / NOT-PORTED / OBSOLETE), pointer to where it
  landed if ported.

**Goal B — Audit `03 old portal/`**
- Same shape. Cross-link with prior `old-portal-*.md` chapters where
  they already cover ground; don't duplicate, just reference.

**Goal C — "Worth coming back for" list**
- Distill the NOT-PORTED rows into a short prioritised list at the end
  of the chapter: features Ed might want to revive (e.g. "real-time
  cursors in editor", "client portal templates beyond the 4 we have",
  specific copy/imagery). Each entry: name, where it lives in legacy,
  rough effort, why it might matter.

**Goal D — Chapter + MASTER row**
- Chapter `04-lift-inventory.md`. MASTER row. Format the audits as
  tables — one row per file/feature — so Ed can ctrl-F.
- Cross-reference plugin chapters (e.g. when a feature was ported into
  `@aqua/plugin-X`, link to its chapter row in MASTER).

## NOT in scope

- Any code changes to legacy folders, new portal, or plugins.
- Porting anything. This round is pure documentation.
- New plugins.

## Loop discipline

Standard. This is a single-deliverable round; one big chapter, one
commit at the end. Q-ASSUMED if scope of "audit" is unclear in places —
prefer thorough over selective.

## When done

DONE + COMMIT; chapter committed; MASTER row added; tasks row added.
