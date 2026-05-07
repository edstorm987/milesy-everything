/loop

# T3 — Round 039: Block schema migration runner

Pure helper that runs forward-compat migrations on a stored block tree
when the editor's block schema evolves. Today, schema changes risk
breaking pages saved before the change. This round ships a tiny
versioned-migration runner so future block-shape changes can ship
safely.

Plan reference: chapter #124 `04-ship-plan-v1.md` (Sprint 1 T3 R039).

## Mandatory pre-read

- Existing block schema + `BlockTree` type.
- R028 block-group reuse (cycle guard pattern — relevant for
  recursive walks).
- Honesty contract chapter #68 (no silent data drop on failed
  migration).

## Scope

**A** — `src/lib/blockSchemaMigrations.ts`:
- Versioned migrations array — `[{ from: 1, to: 2, migrate: (block) => block }]`.
- `BLOCK_SCHEMA_VERSION` constant — current version.
- `migrateTree(tree, fromVersion?)` walks every block (recursive),
  applies every migration step from `fromVersion` to current.
- `treeNeedsMigration(tree)` returns `boolean` (any block carries
  older `_v` than `BLOCK_SCHEMA_VERSION`).
- Migrations run in order; each receives a single block POJO and
  returns the migrated block (immutable; clone-on-write).
- `migrateTree` records `_migratedFrom: <oldV>` on touched blocks for
  audit; never silently drops data.

**B** — Seed migrations:
- v1 → v2: ensures every block has `id` (legacy may lack); generates
  `id` via existing helper if missing.
- (Add 1-2 more example migrations to prove the pattern.)

**C** — Storage helper integration: NEW `loadBlockTreeMigrated(tree)`
that returns a tuple `[migratedTree, didMigrate]`. Editor's load path
should call this; smoke verifies idempotence (running migrations on
an already-current tree is a no-op).

**D** — Smoke `§ Block schema migration` (≥15 cases — empty tree;
single block needing migrate; nested blocks all migrated; idempotent
re-run; cycle guard from R028 not triggered; `_migratedFrom` audit
field set; missing-id v1→v2 migration adds id; tree at current
version returns unchanged).

**E** — Chapter `04-block-schema-migrations.md` + MASTER row.

## NOT in scope

- Auto-running migrations on existing site rows (host integration is
  an R+1 — this round is the helper).
- Backwards migrations (post-ship; YAGNI).

## When done
DONE referencing `039-block-schema-migration.md`.
