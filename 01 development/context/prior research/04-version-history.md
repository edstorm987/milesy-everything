# 04 — Auto-save + persisted version history (T3 R022)

T3 Round 022. R021 ships in-memory undo (per-session ring buffer);
R022 persists named + auto-save versions per page so operators can
roll back across sessions / devices.

## 1. Server registry

NEW `server/pageVersions.ts`:

```ts
interface PageVersion {
  id; pageId; ts; blocks: Block[]; label?; savedBy;
}

saveVersion(storage, { agencyId, clientId, pageId, blocks, savedBy, label? })
  → { version, pruned: string[] }
listVersions(storage, a, c, pageId, limit?) → PageVersion[] (newest-first)
getVersion(storage, a, c, pageId, versionId) → PageVersion | null
deleteVersion(storage, a, c, pageId, versionId) → boolean
renameVersion(storage, a, c, pageId, versionId, label) → PageVersion | null
```

`AUTO_VERSION_CAP = 30` — auto-saves cap at 30, named versions
never auto-pruned. On every save, the cap routine walks the index
oldest-first and drops unnamed entries until under the cap.

Storage:
- `t/<a>/<c>/website-editor/page-versions/<pageId>/index` — id list
- `t/<a>/<c>/website-editor/page-versions/<pageId>/<versionId>` — record

## 2. API endpoints

`api/handlers/pageVersions.ts` mounts 5 routes at
`/api/portal/website-editor/`:

- `POST /pages/versions` body `{ pageId, blocks, label? }` → 201
  with `{ version, pruned[] }`. 400 on missing pageId or non-array
  blocks.
- `GET /pages/versions?pageId=…&limit=…` → newest-first feed.
  400 missing pageId.
- `GET /pages/versions/get?pageId=…&versionId=…` → 200 / 404.
- `PATCH /pages/versions?pageId=…&versionId=…` body `{ label }` →
  promotes auto-save into named (or strips label when label is
  empty). 400 on missing label string. 404 unknown.
- `DELETE /pages/versions?pageId=…&versionId=…` → 200 / 404.

Restore is intentionally caller-composed: a host that wants
"Restore" reads the version's blocks via GET and writes them
back to the live page record via the existing pages PATCH. Keeps
the version surface orthogonal to page CRUD.

## 3. VersionsDropdown UI

NEW `components/editor/VersionsDropdown.tsx`. Lazy-loads versions
when opened; separates Named (★ amber header) from Auto-saves
(grey header); each row shows label-or-"Auto-save" + timestamp +
savedBy + Preview / Restore buttons; emerald-tinted Restore CTA
mirrors the Make-Live affordance from R012.

Top-of-list "Save checkpoint" input + Save button calls
`onSaveNamed(label)` — host POSTs `/pages/versions` with
`label`; on success the dropdown re-fetches the list. CSS-var
driven (R011 surface).

## 4. Auto-save flow (host-side)

Pure components — host page wires the auto-save:

```ts
const debouncedSave = useDebouncedCallback((tree: Block[]) =>
  fetch("/api/portal/website-editor/pages/versions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pageId, blocks: tree }),
  }), 5_000);

useEffect(() => debouncedSave(currentTree), [currentTree]);
```

5s debounce per prompt; the server caps at 30 unnamed
automatically. Named checkpoints route through the dropdown's
"Save checkpoint" affordance.

## 5. Smoke

NEW `__smoke__/r022-version-history.test.ts` 32/32 pass:

- `AUTO_VERSION_CAP = 30`.
- saveVersion record shape (id starts `v_`, blocks reference,
  no label on auto-save, savedBy populated).
- Named save preserves label.
- listVersions newest-first; limit honoured.
- getVersion hit / null on miss.
- deleteVersion true / drop from list / false on miss.
- renameVersion add-label / strip-label-on-empty / null on miss.
- Capacity trim: 1 named + 32 unnamed → named survives, unnamed
  capped at 30.
- HTTP shape: POST 201/400 missing pageId/400 missing blocks;
  GET list 200; GET get 200/404; PATCH 200/400 missing label;
  DELETE 200/404; GET list without pageId → 400.

`@aqua/plugin-website-editor` package.json test chain extended.
website-editor tsc-clean.

## 6. Files

- `plugins/website-editor/src/server/pageVersions.ts` (NEW —
  saveVersion + listVersions + getVersion + deleteVersion +
  renameVersion + capacity trim + AUTO_VERSION_CAP).
- `plugins/website-editor/src/api/handlers/pageVersions.ts`
  (NEW — 5 handlers).
- `plugins/website-editor/src/api/routes.ts` patch (5 new routes).
- `plugins/website-editor/src/components/editor/VersionsDropdown.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/r022-version-history.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- Restore is caller-composed (host reads version + writes to
  live page) — keeps version surface orthogonal to page CRUD;
  same pattern as R012 portal-variants flow.
- Auto-save debounce (5s) + dispatch is host-page concern —
  pure component is just the dropdown. Skeleton in §4.
- Capacity walks the index per save (O(N) reads). Fine at
  N=30; if the cap grows or a hot edit fires many saves per
  second, batch the trim (R+1).
- "Saving" button in the dropdown shows `…` while the named-
  save POST is in-flight; no separate "saved!" toast — closing +
  re-opening the dropdown reflects the change.
- Per the prompt: diff view + multi-user edit conflict
  explicitly out of scope.

## 8. R+1 candidates

- Diff view (compareTrees from R020 already exists; surface
  side-by-side).
- Multi-user edit conflict — last-write-wins today; CRDT or
  optimistic-concurrency token would protect simultaneous
  editors.
- Snapshot deduplication — back-to-back identical trees should
  collapse into one save (saves storage + lets the trim be
  more meaningful).
- Storage compression — gzip the BlockTree per record once
  storage volume becomes a concern.
- "Restore here" inline button on a version that flips the
  page tree without leaving the dropdown.
- Editor settings: per-page auto-save cap (some operators want
  100, others 5).
