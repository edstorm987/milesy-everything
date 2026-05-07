/loop

# T2 — Round 010: `@aqua/plugin-client-files`

Per-client file vault. Bridges T1 R010 Files tab.

## Mandatory pre-read

1. T1 R010 Files tab spec (`010-files-tab.md`).
2. T2 SOPs / activity-inbox chapters — plugin storage shape.

## Scope

**A** — Manifest (`scopePolicy: "client"`). ActivityCategory `"files"`.

**B** — Domain: `File` (id / clientId / category / name / mimeType /
sizeBytes / uploadedBy / uploadedAt / storageRef / sharedLink?).

**C** — Storage abstraction: v1 stores file blobs in plugin storage
under `file:<id>` (JSON metadata + base64 body for small files <2MB).
Larger files store as references to filesystem or a TODO endpoint
flagged for T6 to wire S3.

**D** — Services: `FileService` (upload / list / delete / get-share-
link / set-category).

**E** — Categories enum: brand-assets · brief-strategy · deliverables ·
invoices · misc.

**F** — 5 API routes (`POST /upload`, `GET /list`, `GET /:id`,
`DELETE /:id`, `POST /:id/share-link`).

**G** — Per-actor visibility: client-side users see only files where
`visibleToClient: true`; agency sees all.

**H** — Smoke + chapter `04-plugin-client-files.md` + MASTER row.

## NOT in scope

- S3 / cloud upload (T6 prod gate).
- Image transforms / thumbnails.
- T4 territory.

## When done
DONE referencing `010-client-files.md`.
