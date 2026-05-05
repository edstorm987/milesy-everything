# Round-6 chapter — Website-editor plugin (T3)

Round 6 wires the editor's **Save** button to write directly into
`clients/<slug>/` for Live clients, instead of (or in addition to)
shared portal storage. Per architecture extension chapter 19b — the
editor becomes "the git-based web editor for portals" Ed described,
with the storage target switching based on the active client's phase.

T2 R11 (queued) ships the export generator. R6 wires the editor to
**reuse the same generator** for incremental saves rather than only
the initial materialization. **R6 ships against ports T2 R11 hasn't
yet provided — graceful degradation hides the toggle when ports are
absent, so dev mode still works today.**

Outcome:

- Save-target toggle in the editor topbar (`SaveTargetToggle`)
- `lib/saveTarget.ts` — per-client localStorage cursor + default-
  per-phase resolver
- `lib/savePipeline.ts` — branches on save target, falls back
  gracefully when the port is missing
- `server/extensionPorts.ts` — typed contracts for `PortalExportPort`
  + `GitOpsPort` plus injection helpers
- `DiffPreviewPane` + `SaveResultBanner` for the save UX
- `lib/gitOps.ts` — client-side wrapper around the foundation-injected
  `GitOpsPort`
- `pages/GitStatusPage.tsx` — admin surface showing pending
  `clients/<slug>/` changes with Stage / Commit / Push / Open PR
- New manifest entries (1 navItem + 1 page)

`tsc --noEmit` clean. **Smoke 92 pass · 0 fail** (42 block + 25
cross-plugin renderer + 25 save-target).

---

## Goal A — Save-target toggle

`SaveTargetToggle` is the topbar widget. It reads:

- The active client's phase (from foundation's `services.phases`).
- Whether `clients/<slug>/` exists (via `PortalExportPort.clientRepoExists`).
- Whether `PortalExportPort` is even installed.

And resolves:

| phase | repo exists | port available | default mode |
|---|---|---|---|
| `live` | true | yes | **client-repo** |
| `live` | false | yes | shared-portal (read-only badge) |
| anything else | * | yes | shared-portal (read-only badge) |
| * | * | no | shared-portal (toggle hidden) |

Operator overrides are remembered per `(clientId, browser)` via
`localStorage` with the `lk_editor_save_target_v1|<clientId>` key.
Cross-tab sync via storage event.

`lib/saveTarget.ts` exports:

| Function | Purpose |
|---|---|
| `getSaveTarget(clientId)` | Read the operator's saved choice. |
| `setSaveTarget(clientId, target)` | Persist + broadcast. |
| `onSaveTargetChange(handler)` | Subscribe (the toggle re-renders on storage event). |
| `defaultSaveTargetForClient(input)` | Pure resolver. Used by the toggle and the smoke test. |
| `resolveSaveTarget(input)` | Operator choice + fallback default. |

---

## Goal B — Save-pipeline branching

`lib/savePipeline.ts` is the **only file the editor's save UI talks
to** for routing. New save kinds get added here, not in each consumer.

### Public API

| Function | Behaviour |
|---|---|
| `savePage(input)` | Page save. shared-portal → `updatePage(siteId, pageId, patch)` via existing R2 lib; client-repo → `PortalExportPort.savePage`. |
| `publishPage(input)` | Page publish. client-repo path = `materialize()` (full re-export) since publish needs a site-wide flush. |
| `saveTheme(input)` | Theme save. Shared-portal → R2 `updateTheme`; client-repo → `PortalExportPort.saveTheme`. |
| `saveCustomPage(input)` | localStorage CustomPage save → either R4's `saveCustomPage` or the port's `saveCustomPage`. |
| `setActivePortalVariant(input)` | Active-variant pointer update. |
| `previewChanges(input)` | Diff preview — returns `{available, files, summary}`. shared-portal mode → always unavailable. |

### Fallback behaviour

When the `PortalExportPort` returns `fallbackToFullReexport: true`
(meaning T2 R11 only ships the initial materialize and not yet the
incremental save), the pipeline runs `materialize()` and tags the
result with `fellBackToFullReexport: true`. The `SaveResultBanner`
surfaces this hint so the operator knows to expect a longer turnaround
until R12 incremental save lands.

When the port isn't injected at all (dev mode without T2 R11
installed), `client-repo` saves return `{ ok: false, target:
"shared-portal" }` with a soft error — the toggle should already have
hidden itself but this is a defensive fallback.

---

## `server/extensionPorts.ts` — typed contracts

Two optional ports the editor accepts via container builder:

### `PortalExportPort` (T2 R11)

```ts
interface PortalExportPort {
  slugForClient(clientId): Promise<string | null>;
  clientRepoExists(clientId): Promise<boolean>;

  savePage({ clientId, page }): Promise<SaveResult>;
  saveCustomPage({ clientId, page }): Promise<SaveResult>;
  saveTheme({ clientId, theme }): Promise<SaveResult>;
  setActivePortalVariant({ clientId, role, variantId }): Promise<SaveResult>;

  previewChanges({ clientId, page?, customPage?, theme?, activeVariant?, blocks? }): Promise<PreviewResult>;
  materialize({ clientId, reason? }): Promise<SaveResult>;
}

interface SaveResult {
  ok: boolean;
  fallbackToFullReexport?: boolean;
  changedFiles?: FilePreviewEntry[];
  error?: string;
}

interface FilePreviewEntry {
  path: string;            // relative to clients/<slug>/
  kind: "added" | "modified" | "deleted";
  diff?: string;
  byteCount?: number;
}
```

### `GitOpsPort` (T6 R1)

```ts
interface GitOpsPort {
  status({ clientId, agencyId }): Promise<GitStatus>;
  stage({ clientId, files }): Promise<{ ok: boolean }>;
  unstage({ clientId, files }): Promise<{ ok: boolean }>;
  commit({ clientId, message, author? }): Promise<GitCommitResult>;
  push({ clientId, branch? }): Promise<GitPushResult>;
  openPullRequest({ clientId, title, body? }): Promise<{ ok, url, error }>;
}
```

### Injection

```ts
import { setPortalExportPort, setGitOpsPort } from "@aqua/plugin-website-editor/server";

setPortalExportPort(myPortalExportImpl);
setGitOpsPort(myGitOpsImpl);
```

The foundation calls these once at boot when the implementing plugins
are present. Order doesn't matter — the editor's components watch the
registry on every render so a late-bind works.

---

## Goal C — Diff preview + save banner

### `DiffPreviewPane`

Inline pane shown above the canvas in client-repo mode. Calls
`previewChanges()` whenever the underlying edit changes (driven by a
`refreshKey` prop). Renders:

- Loading: "Computing diff…"
- Empty: "No changes pending — save will be a no-op."
- Error: "Couldn't compute diff: …"
- Files: per-file row with `A`/`M`/`D` badge + monospace path +
  optional byte-count

Renders nothing in shared-portal mode or when the port is missing.

### `SaveResultBanner`

Shown after every save. Three states:

| State | UI |
|---|---|
| shared-portal + ok | Auto-dismissing "✓ Saved" pill (2s default). |
| client-repo + ok | "✓ Saved. N files changed in `clients/<slug>/`. [Open commit →]" — link to `../git-status`. |
| client-repo + ok + fellBackToFullReexport | Same plus "(full re-export)" hint. |
| ok=false | "✗ Save failed — <error>". |

---

## Goal D — `pages/GitStatusPage.tsx`

New admin page registered at `/portal/clients/[clientId]/git-status`
(panelId `growth`). Surfaces the otherwise-invisible state of "what
edits have landed in the per-client repo but haven't been pushed yet".

### Layout

- Client picker (defaults to the active site's clientId).
- Status header: `branch <name>` · `↑ N ahead` · `↓ N behind` ·
  `no remote configured`.
- Action buttons: **Commit** (when staged > 0), **Push** (when ahead
  > 0 + remote configured), **Open PR**.
- Two file-list sections:
  - **Staged for commit** (per-row Unstage button + bulk Unstage all)
  - **Changed (unstaged)** (per-row Stage button + bulk Stage all)
- Each row: `A`/`M`/`D`/`R`/`?` badge + monospace path + per-row action.

### Graceful degradation

When `GitOpsPort` isn't wired (T6 R1 not yet shipped), the page
renders an inline amber notice:

> Git ops port not wired
>
> T6 R1's deployment work will ship the `GitOpsPort` implementation
> that powers this page. Until then, edits made in client-repo mode
> land on disk under `clients/<slug>/` but commits + pushes are
> manual (run `git` in the client's folder).

### `lib/gitOps.ts`

Client-side wrapper. Each function calls `/api/portal/website-editor/git/*`
HTTP proxies (foundation responsibility) which delegate to the
injected `GitOpsPort`. Returns `{ available: false }` on 404 so the
page can render the "not wired" notice without crashing.

```ts
fetchClientStatus(clientId)        // -> ClientStatus
stageFiles(clientId, files)
unstageFiles(clientId, files)
commitFiles(clientId, message, author?)
pushBranch(clientId, branch?)
openPullRequest(clientId, title, body?)
```

---

## Smoke — `src/__smoke__/save-target.test.ts`

25 new assertions:

- 4 default-resolution tests (live+repo+port → client-repo;
  no-repo → shared; non-live → shared; no-port → shared).
- 4 routing tests (shared-portal hits `/api/portal/website-editor/pages`;
  client-repo calls `PortalExportPort.savePage` once with the right
  clientId + pageId; no fall-back-to-materialize unless asked).
- 3 fallback tests (port returns `fallbackToFullReexport:true` →
  materialize() called once + flag surfaced).
- 2 missing-port tests (saves return `ok:false` + downgrade to
  shared-portal target).
- 4 previewChanges tests (available when wired, returns 2 files,
  echoes summary; available=false when port missing or shared-portal
  mode).

Plus 8 additional passes from the strict-equal `target` checks
embedded in those flows. Total 25.

Combined smoke: **42 (blocks) + 25 (cross-plugin) + 25 (save-target)
= 92/92 pass · 0 fail**.

The mock fetch implementation is restored to the original after the
test exits.

---

## Manifest changes

- **navItems**: +1 (`git-status` under panel `growth`)
- **pages**: +1 (`/portal/clients/[clientId]/git-status` →
  `GitStatusPage`)

navItems went 8 → 9; pages went 11 → 12. blocks.test.ts updated.

---

## Cross-team handoffs

| Team | What |
|---|---|
| **T1 (foundation, R7+)** | Broker the new optional ports — when `@aqua/plugin-portal-export` is installed for the agency, call `setPortalExportPort(impl)` from the foundation adapter; same for `GitOpsPort` once T6 lands. Mount `/api/portal/website-editor/git/*` HTTP proxy routes that delegate to the injected `GitOpsPort`. |
| **T2 R11 portal-export** | Implement `PortalExportPort`. Initial round can ship `materialize()` + `previewChanges()` + `clientRepoExists()` + `slugForClient()` only — return `fallbackToFullReexport: true` from the incremental `save*` methods so this plugin's pipeline triggers a full re-export until T2 R12 polish ships incremental save. |
| **T2 R12 portal-export** | Polish: incremental save APIs land. R6 pipeline auto-detects via the `fallbackToFullReexport` flag. |
| **T5 (Luv & Ker portal R1)** | Read commits `8f0bb01` + `2fc3ae1`. The `clients/<slug>/` shape T5 ships is what `PortalExportPort.materialize()` writes to. |
| **T6 (deployment + git ops, R1)** | Implement `GitOpsPort`. Wraps `git` CLI via foundation's process port (or a JS git lib). Honours the `clients/<slug>/` working dir + remote config from each client's `portal-config.json`. |

## R7+ deferrals (per prompt)

- Real-time collaboration (Yjs / CRDT) — architecture §13 parked.
- Domain-attach UI — T6's territory.
- Auto-staging strategy when the operator clicks Save: currently
  R6 leaves the operator to stage+commit explicitly via GitStatusPage.
  R7 polish: optional "auto-stage saved files" toggle on the
  SaveTargetToggle.
- SSR/static export of the per-client portal — T6 deployment round.
