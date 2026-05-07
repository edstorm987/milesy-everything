/loop

# T1 — Round 022: Multi-tenant isolation smoke + audit

Verify per-agency isolation: no agency can read/write another's data.
Build a comprehensive smoke that creates 2 agencies + tries every
cross-tenant access vector.

## Mandatory pre-read

1. Chapter 19 architecture (pool-model multi-tenancy).
2. Foundation tenant scope helpers.
3. Existing smoke patterns.

## Scope

**A** — `smoke-multi-tenant-isolation.test.ts` — creates 2 agencies
each with 2 clients + plugin installs. Tests: agency A's session
cannot list agency B's clients, cannot fetch B's plugin storage,
cannot install plugins for B, cannot view kanban boards / SOPs / etc.

**B** — Audit any direct storage access bypassing tenant scoping;
patch escapes.

**C** — Add `assertTenantScope(session, scope)` helper if not
existing — used at every storage read/write boundary.

**D** — Chapter `04-multi-tenant-isolation.md` + MASTER row.

## NOT in scope

- Per-tenant database (chapter 19 v2 future).
- Cross-tenant collaboration features.

## When done
DONE referencing `022-multi-tenant-isolation-test.md`.
