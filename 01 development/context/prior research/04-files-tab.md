# `04` Per-client Files tab — v0 paste-link surface (T1 R10)

> Authored 2026-05-07. T2 R010's `@aqua/plugin-client-files` isn't
> shipped yet — this round delivers the **fallback** path the prompt
> calls out: a per-client Files tab that lets the operator paste
> Drive / Dropbox / Notion URLs and stores them on
> `client.metadata.files[]`. Real upload + storage land when T2 ships
> the plugin.

## Files touched

- `portal/src/app/api/tenants/client-files/route.ts` (NEW)
  - `POST {clientId, action: "add" | "delete", file?, fileId?}`. Gated
    by `requireRoleForClient(AGENCY_ROLES)`. Persists via
    `updateClient(metadata: { files })`.
  - **add**: validates `file.name` + `file.url` + category in the
    closed set `{brand, brief, deliverable, invoice, misc}`; assigns a
    fresh id (`crypto.randomUUID` with timestamp+rand fallback);
    `uploadedBy` defaults to `session.email`; `uploadedAt = Date.now()`.
    New ref is `unshift`-ed onto the array so newest-first reads
    naturally.
  - **delete**: filters by `fileId`; 404 when missing. 400 on empty
    body / unknown action / invalid category.
- `portal/src/app/portal/clients/[clientId]/_FilesTabClient.tsx` (NEW)
  - Client component. Two-pane layout (`md:grid-cols-[12rem_1fr]`):
    - Left rail: All + 5 categories per chapter §15c (Brand Assets ·
      Brief / Strategy · Deliverables · Invoices · Misc). Each row
      shows a count chip; clicking sets the `filter` state.
    - Right pane: paste-link form (name + URL + category select +
      Add) on top, then a 2-col file grid. Each card shows
      emoji+name link, category chip, uploadedBy, relative time, +
      Open / Delete actions.
  - `add()` POSTs to the route + applies the returned `files` array
    + clears the name/URL drafts. `remove()` POSTs with
    `confirm()` guard.
- `portal/src/app/portal/clients/[clientId]/_OverviewTabs.tsx`
  - NEW `files` tab inserted between `sops` and `tools`.
- `portal/src/app/portal/clients/[clientId]/page.tsx`
  - Imports `FilesTabClient` + `FileCategory` type. New
    `tab === "files"` block renders the tab with `initialFiles`
    sourced from `client.metadata.files`.
- `portal/scripts/smoke.mjs`
  - NEW `§ Files tab` block: `?tab=files` 200, `client-files-tab`
    testid present, add 200 + returns id, empty body → 400, the
    added file name appears in the re-rendered tab, delete 200.

## Storage shape

```ts
client.metadata.files: [
  {
    id: string,            // f_<uuid> | f_<base36>_<rand>
    name: string,
    url: string,
    category: "brand" | "brief" | "deliverable" | "invoice" | "misc",
    uploadedBy?: string,   // defaults to session.email
    uploadedAt: number,    // ms epoch
  },
  ...
]
```

## Q-ASSUMED log

1. **Paste-link only, no real uploads.** Prompt's explicit fallback
   bullet — "files coming soon" + `metadata.files[]` v0. The drag-
   drop UI affordance is intentionally not rendered to avoid the
   "drop files here, nothing happens" trap; the form copy makes
   the v0 stance explicit ("Real uploads land with T2 R010").
2. **`updateClient` array replacement, not array merge.** The patch
   passes the entire `files: ClientFileRef[]` array each call
   (filter or unshift on the read-side, then full replace on
   write). Foundation's metadata merge is shallow — the `files`
   key as a whole gets the new array, which is what we want.
3. **`unshift` for newest-first.** Operators want the latest
   addition at the top of the grid; the alternative was a server-
   side sort by `uploadedAt` desc, but that's redundant when the
   write path already orders correctly.
4. **`crypto.randomUUID` over a domain prefix scheme.** No
   foundation-wide `makeId()` helper exists for the metadata layer;
   inline this round, hoist when other metadata-list features land.
5. **5 fixed categories per chapter §15c.** No "+New category" yet
   — the prompt's left-rail spec is closed, and adding custom
   categories adds a maintenance surface the v0 doesn't need.
6. **Existing `Assets` tab kept distinct** — that one routes into
   the website-editor's image library; this `Files` tab is for
   client deliverables / contracts / invoices, a separate concern.

## NOT in scope

- Real upload + cloud storage (T2 R010 plugin owns).
- Custom categories.
- Drag/drop upload (visual placeholder only — explicitly omitted
  to avoid no-op affordance).
- Per-file share-link expiry / permissions.
- Cross-client file index.
- Touching milesymedia / business-os.

## Smoke results

`§ Files tab` block adds 6 checks. tsc clean. HARD BOUNDARY
honoured.
