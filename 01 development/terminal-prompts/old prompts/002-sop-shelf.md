/loop

# T2 — Round 002: SOP shelf plugin

Aqua HQ's "SOPs, Docs & Templates" section in the canonical sidebar
(chapter §2) needs a real home. Ship a lightweight notes-style plugin so
Ed can paste SOPs in and gate them by tag family for staff (per the
permission keys T1's Employee HQ round defines).

Pre-req: this is independent of T1 002 — they can ship in any order. T2
001 (Aqua kanban templates) should be done first.

## Mandatory pre-read

1. Chapter #59 §2 (sidebar slot), §9c (5 tag families), §13 fold-ins.
2. The Aqua HQ Sops section in
   `~/Desktop/obsidian/Mission Ed/05 Business & Ventures/Aqua Bios -
   Internals/Aqua HQ/Sops, Docs & Templates/Full Aqua System/`
   for the real folder taxonomy. Read-only.
3. Your most-recent T2 plugin chapter (kanban / client-crm / etc.) for
   shape mirror.

## Scope

**Goal A — `@aqua/plugin-sops` plugin**
- `scopePolicy: "agency"`, `core: false`, no required deps.
- Domain: `SOP { id, title, slug, body: string (markdown), tags:
  TagFamily[], status: "draft"|"published"|"archived", updatedAt,
  createdAt }`.
- `TagFamily` enum: `"sales"` / `"service"` / `"leads"` / `"standards"`
  / `"mastery"` (per chapter §9c).

**Goal B — Storage + services**
- `SopService`: list / get / create / update / archive / restore. Filter
  by tag family + status + free-text title query.
- Per-install storage; no cross-plugin ports needed.
- Markdown rendered server-side via existing markdown lib if available;
  otherwise simple paragraph + heading + code-fence rendering.

**Goal C — API surface**
- ~8 routes mounted at `/api/portal/sops/*`: `list` / `get` / `create` /
  `update` / `archive` / `restore` / `tags` (returns tag-family counts).
- `visibleToRoles`: viewers can `list`/`get`; admins can mutate. When
  T1's Employee HQ ships, swap to the new `requires: ["sops.view"]` /
  `requires: ["sops.tag.<family>"]` keys.

**Goal D — Admin UI**
- `SopListPage` — left sidebar with 5 tag-family filters + status
  filter + search; right pane lists SOPs with title + tag chips +
  updated-at. "+ New SOP" CTA opens inline editor.
- `SopDetailPage` — split view: edit markdown on left, rendered preview
  on right. Save / Archive buttons.
- `SopReadPage` — read-only render for staff (no edit affordances; gated
  via `sops.tag.<family>` perms once Employee HQ ships).
- For v1, pre-seed each tag family with a placeholder SOP pulled from
  the Aqua HQ folder names (Communication SOP, Lead Magnets, Sales
  Presentation, etc.) — title only, body left for Ed to paste in.

**Goal E — Smoke + chapter**
- Smoke: CRUD round-trip, tag-family filtering, status transitions,
  rendered markdown contains expected HTML, tag-family count endpoint
  matches actual data. ≥10 cases.
- Chapter `04-plugin-sops.md`. MASTER row.

## NOT in scope

- Permission gating beyond v1 admin/viewer (Employee HQ wires real perms).
- Versioning / revision history.
- Comments / collaboration.
- WYSIWYG editor — use plain markdown textarea for v1.
- File attachments — v2.
- Touching milesymedia / business-os (HARD BOUNDARY).

## When done

DONE referencing `002-sop-shelf.md`. Chapter + MASTER + tasks.md.
