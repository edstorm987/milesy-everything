/loop

# T3 — Round 6: Editor "save to per-client repo" mode

Round 5 you shipped real React components for all 18 cross-plugin
storefront blocks (`83e6a7e`). Round 6 wires the editor's **Save**
button to write directly into `clients/<slug>/` for Live clients,
instead of (or in addition to) shared portal storage. Per
architecture extension chapter 19b — the editor becomes "the
git-based web editor for portals" Ed described, with the storage
target switching based on the active client's phase.

T2 R11 (queued) ships the export generator. R6 wires the editor to
**reuse the same generator** for incremental saves rather than only
the initial materialization.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-3/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-3/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-architecture-extension-per-client-portals.md` — chapter 19b (your operating spec)
3. `01 development/context/prior research/04-plugin-website-editor-round*.md` — your prior chapters (R3 RENDERER_REGISTRATIONS, R5 cross-plugin renderers)
4. `01 development/context/prior research/04-plugin-portal-export.md` — T2's R11 export plugin chapter (when it lands; if not yet, read the prompt at `terminal-prompts/T2-round11-export-to-repo-and-presets.md` for the contract)
5. `01 development/context/prior research/04-client-portal-luv-and-ker.md` — T5's R1 chapter (when it lands; if not yet, read commits `8f0bb01` + `2fc3ae1` for the canonical per-client shape)
6. T2's `@aqua/plugin-portal-export` source — for the `containerFor` + materialize API surface

## Scope — four goals

### Goal A: Save-mode toggle in editor topbar

Today the editor's Save button writes through your existing
`lib/editorPages.ts` to plugin storage (shared portal). Add a
**Save target** indicator + toggle in the editor topbar:

- **"Save to shared portal"** (default for pre-Live clients).
- **"Save to client repo"** (auto-on for Live clients; visible
  toggle for agency operators).

The active phase comes from foundation's services (the
fulfillment plugin's PhaseService — read via `services.phases.getCurrentPhase(clientId)`
through the foundation port the editor already accepts).

If the active phase is `live` AND the client has been exported (i.e.
`clients/<slug>/` exists), default the toggle to "client repo".
Otherwise default to "shared portal".

### Goal B: Save-pipeline branching

Refactor `lib/editorPages.ts` `savePage` (and parallel methods like
`saveTheme`, `saveCustomPage`, `setActivePortalVariant`) to:

1. Inspect the active save target (from a new `lib/saveTarget.ts`
   helper or a React context).
2. If "shared portal" → existing flow (write to plugin storage).
3. If "client repo" → call into T2's
   `@aqua/plugin-portal-export`'s `containerFor(install).pages.save({clientId, page})`
   helper. The export plugin handles writing to the right file under
   `clients/<slug>/src/...`.

Q-ASSUMED candidate: T2's exact save API may not exist yet (R11
ships the generator first; incremental save is a R12 polish). If
their plugin only exposes `materialize(clientId)` for full re-export,
fall back to: every save in "client repo" mode triggers a full
re-export (slow but correct). Document as Round-7 perf optimisation.

### Goal C: Diff preview + commit semantics

Add a "Preview changes" pane in the editor that, when in "client repo"
mode, shows a git-style diff of what will change in `clients/<slug>/`
before the operator clicks Save. Lift T2's diff strategy if their R11
exposes one; otherwise show a simple file-list of which files will
change.

After Save, surface a banner: "Saved. 7 files changed — [Open commit]".
"Open commit" links into a new git-status surface (Goal D) so the
operator can review + push.

### Goal D: GitStatusPage

A new admin page at `src/pages/GitStatusPage.tsx` (`panelId: "growth"`):
- List of pending file changes under `clients/<slug>/` per Live client.
- "Stage", "Commit", "Push" buttons (calls into a new
  `lib/gitOps.ts` shim that runs git commands via foundation's
  ProcessPort — same shape as T2 R11's GitHub PR-open integration).
- "Open PR" button (lifts T3's existing promote.ts flow).

This page surfaces the otherwise-invisible state of "what edits have
landed in the per-client repo but haven't been pushed yet".

## Foundation port additions

Two new optional ports the editor accepts via container builder:
- `PortalExportPort` — provides the per-client save API. T1's
  foundation broker resolves this from
  `@aqua/plugin-portal-export`'s container when installed for the
  agency.
- `GitOpsPort` — `status(slug) / stage(slug, files) / commit(slug, msg) / push(slug, branch)`.
  T6 R1's deployment work likely lands a candidate impl. T1 brokers.

When neither port is available, "client repo" mode is hidden in the
UI and saves silently fall through to shared storage. Graceful
degradation preserves dev-mode workflow.

## Cross-team coordination

- **T2 R11** — confirm save API shape before relying on it. If their
  R11 only exposes initial materialise, log `Q-ASSUMED` + use the
  full re-export fallback.
- **T5** — your save target writes to their `clients/luv-and-ker/`
  structure. Read their chapter to understand the file layout.
- **T6** — they may ship a `GitOpsPort` impl during their R1 deploy
  work. Read their deployment chapter.
- **T1** — brokering ports is foundation work; coordinate so T1 can
  wire the new ports in their next round.

## NOT in scope

- Don't build the export-to-repo generator itself — that's T2 R11.
- Don't build domain-attach UI — T6's territory.
- Don't refactor existing R3-R5 renderer code beyond what's needed
  for save-target switching.
- Don't add real-time collaboration (Yjs / CRDT) — architecture §13
  parked.
- Don't touch foundation server modules — T1 brokers the ports.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end. Goals A + B are the bulk; C + D lighter.

## When done

1. Save-target toggle in editor topbar.
2. `lib/editorPages.ts` (and siblings) branch on save target.
3. Diff preview + post-save banner.
4. GitStatusPage admin page wired.
5. `tsc --noEmit` clean inside the website-editor plugin.
6. Smoke (`src/__smoke__/save-target.test.ts`) — node:test cases:
   - Save-target defaults correctly per phase.
   - "Shared portal" save calls existing storage path.
   - "Client repo" save calls PortalExportPort with right
     `(clientId, page)` shape.
   - Missing PortalExportPort: target toggle hidden, save falls back.
   - Diff preview returns expected file-change shape.
7. Chapter `04-plugin-website-editor-round6.md` documenting:
   - Save-target switching rule.
   - Branching pipeline + new ports declared.
   - Diff + GitStatus surfaces.
   - Cross-team handoffs (T1 broker, T2 R11 save API contract,
     T6 GitOpsPort wiring).
8. MASTER row.
9. `tasks.md` row done.
10. Final `DONE` + `COMMIT`.
