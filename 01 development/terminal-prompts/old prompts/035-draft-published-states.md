/loop

# T3 — Round 035: Draft / published state separation

Currently every save goes live. Add a draft/published split: edits
go to draft; explicit "Publish" promotes draft → live. Storefront
serves published only.

## Mandatory pre-read

1. T3 R022 version history (paired concept).
2. Existing page persistence shape.

## Scope

**A** — Per-page `draft?: BlockTree` + `published?: BlockTree` (and
`publishedAt`, `publishedBy`).

**B** — Editor saves go to draft. "Publish" button promotes
draft → published + appends version-history entry.

**C** — Storefront renders `published` only (falls back to draft if
no published version exists, with a `?preview=1` param to force
draft).

**D** — Per-page status chip in editor: Draft (dotted) / Published
(solid) / Draft ahead (amber).

**E** — Smoke + chapter `04-draft-published.md` + MASTER row.

## NOT in scope

- Scheduled publishing (R+1).
- Per-block draft state.

## When done
DONE referencing `035-draft-published-states.md`.
