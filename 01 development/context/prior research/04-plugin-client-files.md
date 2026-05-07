# `@aqua/plugin-client-files` — per-client file vault (T2 R010)

Round-010 of the queue-based T2 worker. Bridges T1 R010's Files-tab
spec — gives every client a vault for brand assets, briefs,
deliverables, invoices, and misc files.

## Shape

| Area | Decision |
| --- | --- |
| `id` | `client-files` |
| `scopePolicy` | `client` |
| `core` | false |
| `requires` | (none) |
| Storage layout | `files/index` · `files/by-id/<id>` · `file-body/<id>` (inline base64) · `files/share/<token>` (reverse-index for share links) |
| API routes | `list / get / upload / delete / share-link` (5) |
| Pages | `FilesPage` — category tile-grid + table + reference-upload form |

## Domain

```
File { id, agencyId, clientId,
       category: brand-assets|brief-strategy|deliverables|invoices|misc,
       name, mimeType, sizeBytes,
       storage: inline|external,
       storageRef,                 // "inline:<id>" or opaque caller string
       uploadedBy, uploadedAt,
       visibleToClient,            // false → agency-only
       shareLinkToken?, shareLinkAt?,
       createdAt, updatedAt }
```

## Inline vs external storage

`INLINE_MAX_BYTES = 2 MB`. `upload()` accepts either:

- `body: string (base64)` — **inline** path. Decoded size is checked
  against the cap; oversize throws `FilePayloadTooLargeError` (HTTP
  413). Bytes persist under `file-body/<id>`.
- `external: { storageRef, sizeBytes }` — **external** path. The
  plugin records the metadata + opaque ref; **dereferencing is the
  caller's responsibility**. T6 wires S3 / signed URLs against this
  contract — the plugin doesn't know how to read S3 / FS in v1.

The split is the simplest viable contract that keeps the operator
unblocked while T6 ships the cloud-storage layer. A future driver
port (`StorageDriverPort.put / get / delete`) is a clean R+1 lift.

## visibleToClient ACL

`canSee(file, isAgency)` — agency callers see everything; non-agency
roles (client-shell, freelancer, end-customer) only see rows where
`visibleToClient: true`. The handler resolves "is agency" from
`ctx.install.config.role` (v1 lift; foundation `ctx.role` would be
cleaner — flagged R+1).

`setVisibleToClient(actor, id, visibleToClient)` flips the flag.
Default on upload is **false** (sensible default — operators promote
files to client view explicitly).

## Share links

`setShareLink(actor, id)` issues a fresh 16-byte hex token, persists
it as `file.shareLinkToken` and stores a reverse-index entry at
`files/share/<token> → fileId`. Calling twice **rotates** — the
previous token is removed from the index (test 8). `revokeShareLink`
deletes the index entry and clears the token.

`resolveByShareToken(token)` looks up via the reverse index, verifies
the token matches the current `file.shareLinkToken` (defends against
deleted-but-not-rotated tokens), and returns the body / external
ref. The link itself is the auth — `visibleToClient` is **not**
honoured on share-token resolution; rate-limiting is the public
route handler's responsibility (deferred to T6 / notifications R+1).

## Smoke (12/12)

`tsx --test src/__smoke__/files.test.ts`. Cases:

1. Inline upload — body persists base64; `sizeBytes` computed from
   base64 length; emits `client-files.file.uploaded`.
2. External upload — `storageRef + sizeBytes` preserved;
   `getWithBody` returns `externalRef` not `body`.
3. Inline upload over `INLINE_MAX_BYTES` throws
   `FilePayloadTooLargeError` (HTTP 413).
4. visibleToClient ACL — agency sees all; client-shell only sees
   rows with `visibleToClient: true`.
5. `setVisibleToClient` flips the flag; subsequent `list` reflects
   the change.
6. `setCategory` moves file between categories; rejects invalid
   category.
7. `delete` removes metadata + body + share-token reverse index;
   emits `client-files.file.deleted`.
8. Share-link issue + resolve — token round-trips; **rotation
   invalidates the previous token** (old token → null,
   new token → fresh metadata).
9. `revokeShareLink` — token stops resolving; emits
   `client-files.file.share_link_revoked`.
10. Category filter narrows; query filter case-insensitively
    matches `name`.
11. `categoryCounts` — `count + totalBytes` sum match the underlying
    list; empty categories return zero.
12. Activity entries (`uploaded / share_link_issued / deleted`) all
    log under `category: "settings"` with `action` prefix
    `client-files.*` (foundation `ActivityCategory` extension to add
    `files` is an R+1 lift — coordinated diff with T1 / R007).

## Files

```
04-the-final-portal/plugins/client-files/
├── index.ts                            (manifest)
├── package.json + tsconfig.json
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          (vendored)
    │   ├── tenancy.ts                  (vendored)
    │   ├── domain.ts                   (FileMetadata, FileCategory, INLINE_MAX_BYTES, FILE_CATEGORIES)
    │   ├── ids.ts · time.ts
    ├── server/
    │   ├── ports.ts                    (StoragePort, ActivityLogPort, EventBusPort)
    │   ├── files.ts                    (FileService — upload/get/list/setCategory/setVisibleToClient/delete/setShareLink/revokeShareLink/resolveByShareToken/categoryCounts)
    │   ├── foundationAdapter.ts        (register / containerFor / _containerFromCtx)
    │   └── index.ts                    (barrel + container)
    ├── api/
    │   ├── handlers.ts                 (5 handlers — 413 on payload too large)
    │   └── routes.ts
    ├── pages/
    │   └── FilesPage.tsx               (5-tile category grid + table + agency-only reference-upload form)
    └── __smoke__/files.test.ts         (12 cases)
```

## NOT in scope

- S3 / cloud upload (T6 prod gate — external-storage path is the
  hook).
- Image transforms / thumbnails.
- Rate-limit on the share-link resolve route (T6 / R005
  notifications-engine R+1).
- Touching milesymedia / business-os / compass-coaching.

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- Foundation-side `StorageDriverPort` so plugin can transparently
  read S3 / FS / signed URLs without knowing the implementation.
- Image transforms / thumbnails (mime-type-driven; ship via Sharp on
  the server side).
- Per-actor download counters + last-accessed timestamps (audit
  trail).
- Versioning (today: deletes are destructive; per-id history would
  let operators undo).
- ZIP export of a category bundle.
- File preview pane (PDF / image / text inline).
- Rate-limit + IP allowlist on the share-link resolve route.
- Foundation `ActivityCategory` extension to add `files` (currently
  rides on `settings`); coordinated diff with T1 + R007 / R009.
- Bulk move-category UI (today: per-row patch only).
