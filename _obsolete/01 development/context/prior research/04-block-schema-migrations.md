# Block schema migration runner (T3 R039)

## What

Pure helper that runs forward-compat migrations on a stored
block tree when the editor's block schema evolves. Today, a
schema change risks breaking pages saved before the change.
This round ships a tiny versioned-migration runner so future
shape changes can ship safely: register a `{from, to, migrate}`
step, bump `BLOCK_SCHEMA_VERSION`, and the loader rewrites old
trees on read.

## Files

- `src/lib/blockSchemaMigrations.ts` (NEW)
  - `BLOCK_SCHEMA_VERSION = 3`. Bump on every shape change.
  - `MIGRATIONS` registry — array of `{from, to, migrate}` steps.
    Two seed steps:
    - **v1 → v2** ensures every block carries `id`. Legacy
      pre-id-mandatory rows get a generated id via existing
      `makeId("blk")` helper.
    - **v2 → v3** moves `props.align` (legacy single prop on
      heading/text) into `styles.align` (canonical structured
      location). Preserves the original under `props._legacyAlign`
      so the audit can find rows that were rewritten without
      losing the operator-set value (chapter #68 honesty —
      no silent data drop).
  - `blockVersion(block)` — reads `_v` stamp. Defaults to 1 for
    untyped legacy rows.
  - `treeNeedsMigration(tree)` — short-circuits true on the
    first older block found.
  - `migrateTree(tree, fromVersion?)` — recursive walker that
    applies every applicable step to each block. Stamps
    `_v: BLOCK_SCHEMA_VERSION` and `_migratedFrom: <oldV>` on
    touched blocks for audit. Immutable — clone-on-write.
  - `loadBlockTreeMigrated(tree)` — storage-helper entry point.
    Returns `[migratedTree, didMigrate]`. Idempotent: an
    already-current tree returns the original reference with
    `didMigrate=false`, no allocation.
  - **Cycle guard** (R028 block-group reuse pattern): the
    walker tracks visited block ids and short-circuits on
    revisit. Legitimate trees never repeat ids, but
    defence-in-depth handles malformed imports without
    infinite recursion.
- `src/__smoke__/r039-block-schema-migration.test.ts` (NEW) —
  23 assertions covering schema constants, needs-detection,
  v1→v2 (id generation), v2→v3 (align relocation + legacy
  preserve + drop top-level), full v1→v3 chain, nested block
  recursion, idempotence (`load…` returns original ref + no-op
  re-run), `load…` migration drive, cycle guard, no-silent-
  data-drop on unrelated props.
- `package.json` test chain extended.

## Migration discipline

When you add a new shape change:

1. Append a `{from: N, to: N+1, migrate}` entry to `MIGRATIONS`.
2. Bump `BLOCK_SCHEMA_VERSION` to N+1.
3. Add a smoke case proving the migration AND that unrelated
   props aren't dropped.
4. If the change removes a field, preserve it under a new name
   (`_legacy<Field>`) — never silent-drop. Note the rename in
   this chapter so the audit query can find affected rows later.

## Honesty contract (chapter #68)

The runner records `_migratedFrom: <oldV>` on every touched
block. A host audit can `SELECT pages WHERE blocks.*._migratedFrom IS NOT NULL`
to find rows that were rewritten on load — useful for verifying
no behavioural drift after a schema change ships, and for
data-recovery if a migration ever turns out to be wrong.

Touched blocks also keep their full prior props under either
the standard prop names (when the migration only adds fields)
or `_legacy<Field>` (when a prop was renamed/relocated). No
migration in this round drops data; the contract is enforced
by smoke § "no silent data drop".

## Q-ASSUMED

- Untyped legacy rows default to **v1** (the first published
  schema). If we ever ship a v0→v1 step retroactively, that
  gets registered like any other migration.
- Migrations operate on POJOs — no class instances, no methods.
  Same shape we already store in `EditorPage.blocks`.
- Children are walked AFTER the parent migration runs. Lets a
  parent migration alter `children` (e.g. wrap, unwrap) and
  have the new shape walked normally.
- `loadBlockTreeMigrated` returns the original tree reference
  when no migration was needed — callers can use referential
  equality as a cheap "did anything change" check before
  triggering a save.

## NOT in scope (R+1)

- Auto-running migrations on existing `EditorPage` rows at
  service load (host integration). This round is the helper;
  R+1 wires `editorPages.ts` to call `loadBlockTreeMigrated`
  on every read and persist the result back to the row.
- Backwards migrations (post-ship YAGNI — the editor never
  needs to read a future tree on an older runtime).
- Multi-page batch migration tooling (operator-facing).
- Migration-failure reporting UI (today: throws on bug,
  surfaces in editor as a load error).
