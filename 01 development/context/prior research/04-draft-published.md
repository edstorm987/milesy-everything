# Draft / published state separation (T3 R035)

## What

Until R035, every editor save went straight live. R035 splits the
two: edits land in `draftBlocks`; an explicit Publish promotes the
draft into `publishedBlocks` and the live `blocks` slot. The
storefront serves `published` only — with a `?preview=1` escape
hatch for the operator to view the in-flight draft without
publishing it.

## Schema fields (already present on EditorPage)

- `blocks`            — the live tree consumers read.
- `draftBlocks?`      — in-flight edits not yet published.
- `publishedBlocks?`  — last published snapshot (Round-2 addition).
- `publishedAt?`      — timestamp of last publish.
- `publishedBy`       — user id (R035 patch shape adds this on promote).
- `status`            — `"draft" | "published"`.

R035 ships pure helpers + chip + storefront resolver. No schema
migration required — pre-R035 rows that only have `blocks` keep
working: helpers fall back to `blocks` on either side and the chip
renders the simple draft/published binary until the row sees its
first explicit publish.

## Files

- `src/lib/draftPublished.ts` (NEW) —
  - `getDraftTree(page)` → `draftBlocks ?? blocks`.
  - `getPublishedTree(page)` → `publishedBlocks` else `blocks` when
    `status === "published"` else `null`.
  - `hasDraftAhead(page)` → true when published + draftBlocks
    differs (JSON-string compare).
  - `pageStatus(page)` → `"draft"|"published"|"draft-ahead"`.
  - `saveToDraftPatch(blocks)` → `{ draftBlocks, updatedAt }`.
  - `promoteToPublishedPatch(page, by)` → full publish patch
    (`status:"published"`, blocks=draft, publishedBlocks=draft,
    `draftBlocks:undefined`, `publishedAt`, `publishedBy`,
    `updatedAt`).
  - `resolveStorefrontTree(page, {preview?})` → `{tree, source,
    isFallback}` where source ∈ `published|draft-fallback|
    draft-preview`.
- `src/components/editor/PageStatusChip.tsx` (NEW) — renders one of
  three chips with distinct border + dot:
    * Draft (dashed neutral).
    * Published (solid green).
    * Draft ahead (solid amber).
- `src/__smoke__/r035-draft-published.test.ts` (NEW) — 25 assertions.
- `package.json` test chain extended.

## Storefront contract

```
resolveStorefrontTree(page)                  // serves published; falls back to draft when none
resolveStorefrontTree(page, {preview:true}) // forces draft (operator preview link)
```

`source` lets the host caller choose whether to render a "Preview"
ribbon (`draft-preview`) or a "This page hasn't been published"
banner (`draft-fallback`).

## Promote patch shape

```ts
{
  status: "published",
  blocks: draftTree,
  publishedBlocks: draftTree,
  draftBlocks: undefined,
  publishedAt,
  publishedBy,
  updatedAt,
}
```

Caller (server `publishPage`, handler, or version-history recorder)
spreads the patch onto the page and writes. The shape lives here so
the version-history recorder can deterministically detect publishes
("a publish event = the patch sets `publishedAt`").

## Q-ASSUMED

- Existing R022 `publishPage` server fn is left as-is — it already
  moves draftBlocks → blocks + clears draftBlocks. R035's
  `promoteToPublishedPatch` is the canonical shape going forward;
  next round (or this one's host wire-up) can refactor publishPage
  to use the helper to keep the two paths in sync.
- "Draft ahead" detection uses `JSON.stringify` compare. Block
  trees here are POJOs by contract, no functions/symbols, so the
  serialisation is stable. Cheap on the page sizes the editor
  handles (≤ a few hundred blocks).
- A page that's never been published with a draft set is **not**
  flagged "draft ahead" — that's `pageStatus === "draft"`. "Draft
  ahead" reads as a state where there's a previous live version
  to compare against. The chip's three labels make the
  distinction visible without operator training.
- `?preview=1` is the contract; host (foundation route) decides
  whether to gate that param behind R022's signed preview tokens.
- Per-block draft state (R+1) isn't here — every save remains a
  whole-tree replacement of `draftBlocks`.
- Scheduled publish (R+1) isn't here — operator clicks Publish
  manually.

## NOT in scope

- Scheduled publishing (`publishedAt > now` queue worker).
- Per-block draft state.
- Refactor of server `publishPage` to call the helper (host
  wire-up; out-of-band one-liner).
- Editor topbar wiring of `<PageStatusChip />` (host EditorPage
  composition).

## R+1 candidates

- `publishPage` server fn refactored to call
  `promoteToPublishedPatch` so editor + storefront + history all
  agree on a single patch shape.
- Editor topbar showing `<PageStatusChip />` next to the page
  title + a "Publish" button that disables when status is
  already `published` (no draft ahead).
- `?preview=1` token-gated in foundation middleware so anonymous
  visitors can't force the draft.
- Scheduled-publish queue: `scheduledPublishAt?: number` field +
  cron-like worker that walks the page index nightly.
- Per-block draft state via `block.draftStyles?: BlockStyles` so
  operators can tweak one block live without disturbing the rest
  of the tree.
- `unpublishPage` helper: `{ status: "draft", publishedBlocks:
  undefined, publishedAt: undefined }` — handy for compliance
  takedowns.
