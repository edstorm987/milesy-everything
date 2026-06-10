# `@aqua/plugin-sops` — SOPs, Docs & Templates shelf

T2 Round 002. Lightweight notes-style plugin powering the **SOPs, Docs &
Templates** section of the canonical Aqua HQ sidebar (chapter #59 §2).
Agency-scope only; markdown bodies; gated by the **5 tag families** from
chapter #59 §9c (Sales / Service / Leads / Standards / Mastery).

## 1. Why this plugin exists

Aqua HQ's Obsidian vault has a real SOP HUB that splits into Sales &
Discovery / Onboarding & Service Delivery / Leads & Nurturing / Standards
& Internal / Mastery Plan. The portal needs a place for Ed to paste those
into so contractors and staff can read them — without forcing him into
website-editor pages (which is the v0 stopgap noted in chapter #59 §3a).

Goal: lightest-possible-thing that ships. Markdown in, rendered HTML out.
Zero deps. Per-install storage. Permission model is admin-vs-viewer in
v1; once T1's Employee HQ ships its `requires: ["sops.tag.<family>"]`
key set, the manifest swaps to those without changing the service.

## 2. Domain (`src/lib/domain.ts`)

```
TagFamily = "sales" | "service" | "leads" | "standards" | "mastery"
SopStatus = "draft" | "published" | "archived"

Sop {
  id, agencyId, title, slug, body (markdown),
  tags: TagFamily[], status,
  createdAt, createdBy?, updatedAt, updatedBy?
}
```

`TAG_FAMILIES` + `TAG_FAMILY_LABELS` are exported from the server
barrel for callers (foundation router, future Employee HQ permission
matrix, the admin UI). `slugify()` is the same low-fi normalizer used
elsewhere — lower-case, hyphenate non-alphanum, trim repeats, max 80
chars, falls back to `"sop"`.

## 3. Service (`SopService`)

Storage layout:
- `sops/index` — array of SOP ids
- `sops/by-id/<id>` — Sop record
- `sops/by-slug/<slug>` — id (for slug lookup)

Methods:
- `list(filter)` — agency-scope list with tag / status / case-insensitive
  title query filters; sorted by `updatedAt` desc.
- `get(id)` / `getBySlug(slug)`.
- `create(input, actor)` — slug uniqueness enforced (suffix `-2`, `-3`,
  …), invalid + duplicate tags filtered, default status `"draft"`.
- `update(id, patch, actor)` — partial; tag list re-uniqified; emits
  `sops.sop.published` when patch.status === "published", else
  `sops.sop.updated`.
- `setStatus` / `archive` / `restore` — convenience around `update`.
- `tagCounts()` — non-archived row counts per family (drives sidebar
  badges + `/tags` API).
- `seedDefaults(actor)` — idempotent (only seeds if `index` is empty);
  creates 9 placeholder SOPs across all 5 families using titles pulled
  from chapter #59 §9c — Sales Presentation, Lead Magnets, Aqua
  Incubator 3.0 Onboarding Walkthrough, Recurring Actions, Pre-Sales
  HQ, Re-Nurturing, Communication SOP, Behaviour Standards, Mastery
  Plan — 200+ reviews. Bodies left blank; Ed pastes content in.

Every mutator writes a `category: "sops"` activity row + emits a
`sops.sop.<event>` on the event bus. Same pattern as kanban.

## 4. Markdown (`src/server/markdown.ts`)

Tiny zero-dep renderer — handles ATX headings (`# / ## / ###`), fenced
code (```), unordered lists (`-` / `*`), inline `code`, `**bold**`,
`*italic*`. Anything else renders as escaped paragraph text. Foundation
can swap a richer renderer later without touching the service. Scope is
intentional: SOP bodies are short operational docs, not long-form blog
posts.

## 5. API surface

8 routes mounted at `/api/portal/sops/`:
- `GET list` — `?tag=&status=&q=`
- `GET get` — `?id=` or `?slug=` (returns `{ sop, html }`)
- `GET tags` — tag-family counts (non-archived)
- `POST create`
- `PATCH update`
- `DELETE archive`
- `POST restore`
- `POST seed` — admin-only re-seed entry point

Visibility: viewers (`agency-owner` / `agency-manager` /
`agency-staff`) can `list` / `get` / `tags`; admins (`agency-owner` /
`agency-manager`) can mutate. No public routes. No client roles —
`scopePolicy: "agency"` only.

## 6. Admin UI

Three pages mirroring the spec:

- **`SopListPage`** (`""`) — left filters column (5 tag families with
  counts + status presets + free-text search) + right list of rows
  (title link to edit, status badge, tag chips, updated-at, “read”
  link). `+ New SOP` CTA at the top of the filter pane.
- **`SopDetailPage`** (`new` and `edit/:id`) — split view: textarea
  on the left + `dangerouslySetInnerHTML`-rendered preview on the right.
  Status select + tag-family checkboxes. `Save` posts to
  `/api/portal/sops/{create|update}`; `Archive` link hits
  `/api/portal/sops/archive?id=…`.
- **`SopReadPage`** (`read/:slug`) — read-only render for staff. No
  edit affordances. v1 has no per-tag perm gating; Employee HQ wires
  `sops.tag.<family>` keys later.

Pages read cleanly with JS off (server-rendered). No new dep.

## 7. Manifest

- `id: "sops"` · `category: "ops"` · `status: "alpha"` · `core: false`.
- `scopePolicy: "agency"` (chapter §2 maps the section to the agency
  sidebar — no per-client install).
- Single nav item `"SOPs"` at `panelId: "ops"`, order 60. Visible to
  all agency roles.
- Settings: `defaultTagFamily` (select, default `"standards"`) +
  `seedDefaultsOnInstall` (boolean, default `true`).
- Features: `create` / `archive-restore` / `tag-filtering` (all
  default-on).
- `onInstall` calls `seedDefaults(actor)` when the answer is truthy
  (default), so a fresh install lands with the 9 placeholder rows.
- `healthcheck` returns `<published>/<total> published SOPs`.

## 8. Smoke

`src/__smoke__/sops.test.ts` 13/13 pass via `tsx --test`:

| # | What it pins |
|---|---|
| 1 | TAG_FAMILIES registry = 5 chapter §9c families in canonical order |
| 2 | `slugify` lowercase + hyphenate + truncate fallback |
| 3 | CRUD round-trip — create / get / update / archive / restore |
| 4 | Tag-family filtering on `list({ tag })` |
| 5 | Status transitions draft → published → archived → draft |
| 6 | Markdown render — heading + list + code + bold |
| 7 | `tagCounts` matches data + excludes archived |
| 8 | `seedDefaults` creates 9 rows across 5 families, idempotent on re-call |
| 9 | Agency tenant isolation — other agency sees nothing |
| 10 | Unique slug — duplicate titles get `-2`, `-3` suffixes |
| 11 | Invalid + duplicate tags filtered on create + update |
| 12 | Every mutator writes a `category:"sops"` activity row + emits a `sops.*` event |
| 13 | Title query filter is case-insensitive substring match |

`tsc --noEmit` clean.

## 9. Foundation pending (standard 5-step)

When the foundation team wires this up:

1. Workspace dep: `"@aqua/plugin-sops": "workspace:*"` in the portal
   app.
2. `transpilePackages += ["@aqua/plugin-sops"]` in next config.
3. Side-effect import `@aqua/plugin-sops/server` calling
   `registerSopsFoundation({ activity, events, tenant?, user? })` at
   boot.
4. `_registry.ts` append (manifest list).
5. `ActivityCategory` += `"sops"` (already present in the vendored
   `lib/tenancy.ts` here; mirror the change in foundation types).

No cross-plugin event router subscriptions — SOPs does not consume
events from other plugins.

## 10. NOT in scope (v1)

- Versioning / revision history.
- Comments / collaboration / mentions.
- WYSIWYG editor (textarea + markdown only; v2 if needed).
- File attachments.
- Per-tag permission gating (Employee HQ wires the real `sops.tag.<family>`
  keys; v1 is admin-vs-viewer).
- Touching milesymedia / business-os (HARD BOUNDARY).

## 11. Cross-team handoffs

- **T1 (Agency Shell)**: sidebar `Resources`/`SOPs` row maps to
  `/portal/agency/sops` once this plugin is registered.
- **Future Employee HQ round**: when it ships `permissions: string[]`,
  swap the manifest's `visibleToRoles` to `requires: ["sops.view"]` for
  list/get and `requires: ["sops.tag.<family>"]` per-row gating in
  `SopReadPage`. Service surface needs no changes.
- **T2 (kanban)**: independent — no shared events, no shared storage.
