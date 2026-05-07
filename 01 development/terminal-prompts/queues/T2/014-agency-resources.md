/loop

# T2 — Round 014: `@aqua/plugin-agency-resources`

Internal team resource library — distinct from `aqua-resources`
(client-facing). Houses team SOPs, training, brand guidelines,
process docs.

## Mandatory pre-read

1. T2 R013 aqua-resources chapter (mirror shape — client-facing).
2. T2 R002 SOPs chapter (overlap on tag taxonomy).
3. Chapter §13 SOP shelf taxonomy.

## Scope

**A** — Manifest (`scopePolicy: "agency"`, `requires: ["sops"]`).
ActivityCategory `"team-resources"`.

**B** — Domain `TeamResource` (id, kind, title, body, tags[],
visibleToRoles[], createdBy, lastEditedAt). Reuse SopService backing
where overlap exists.

**C** — 3 admin pages: Library (list with category filter +
search) · Editor (markdown + frontmatter) · Recent activity (latest
edits + views).

**D** — 6 API routes (CRUD + view-tick + export).

**E** — Smoke + chapter `04-plugin-agency-resources.md` + MASTER row.

## NOT in scope

- Wiki cross-linking (later round).

## When done
DONE referencing `014-agency-resources.md`.
