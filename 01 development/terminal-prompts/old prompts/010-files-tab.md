/loop

# T1 — Round 010: Per-client Files tab

Wire T2's `@aqua/plugin-client-files` into each per-client overview
as the **Files** tab. Per-client uploads / downloads / shared links.

If T2 R010 (`client-files` plugin) is not yet shipped, render a
placeholder Files tab that explains "files coming soon" + lists any
file references from `metadata.files[]` (operator-pasted Drive / Dropbox
links work as a v0 fallback).

## Mandatory pre-read

1. T2 R010 chapter (`04-plugin-client-files.md`) once shipped; if not,
   the Sidebar `extra` pattern + per-client tab pattern from R001.
2. `04-aqua-internals-reference.md` §15c (Resources Lite reference).

## Scope

**A** — `_FilesTabClient.tsx` lists files in a 2-col grid (cover / icon
/ name / size / uploaded-by / actions: open · share-link · delete).

**B** — Drag-drop upload zone at top. POST to plugin-files endpoint;
if plugin missing, fall back to "paste a link" form that stores
references in `metadata.files`.

**C** — Categories as left rail: Brand Assets · Brief / Strategy ·
Deliverables · Invoices · Misc. Saved on each file's `category` field.

**D** — Smoke + chapter `04-files-tab.md` + MASTER row.

## NOT in scope

- Building the underlying plugin (T2 R010).
- Real S3 / cloud storage (filesystem or plugin storage v1).
- T4 territory.

## When done
DONE referencing `010-files-tab.md`.
