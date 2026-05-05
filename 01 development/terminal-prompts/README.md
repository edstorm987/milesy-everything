# Terminal prompts — chief commander pattern

Ed runs three additional Claude terminals (Opus 4.7 max effort, with subagent
authority). This session acts as chief commander: writes self-contained
prompts for each terminal, integrates their output back into the dev folder.

## Working environment (every terminal)

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local working directory**: `~/Desktop/ker-v3/`
- **Branch**: each terminal commits directly to `main` and pushes when done.
- **If a terminal doesn't have a clone yet**: `git clone https://github.com/edsworld27/ker-v3.git ~/Desktop/ker-v3 && cd ~/Desktop/ker-v3`
- **Folder names contain spaces** — quote paths in shell commands.

## How to use

1. Open a fresh Claude Code terminal in `~/Desktop/ker-v3/`.
2. Paste the contents of the active prompt for that terminal (T1 / T2 / T3 / T4 / T5 / T6) at the prompt.
3. The terminal works the task, writes its outputs into the repo, updates
   the relevant chapter file in `01 development/context/prior research/`,
   updates `tasks.md`, commits + pushes.
4. When done, Ed reports back here ("T1 finished, see commit X"). The
   commander reads the diff + updated chapters, plans Round 2.

## Coordination protocol — every terminal must follow

Before any work:
1. Read `01 development/CLAUDE.md`.
2. Read `01 development/context/MASTER.md`.
3. Read `01 development/context/prior research/04-architecture.md` — **the locked design**.
4. Read the chapters relevant to the task (each prompt lists them).
5. Read `01 development/eds requirments.md` if non-empty.

While working:
- Update `01 development/tasks.md` (move row to in-progress, add follow-ups).

When done:
- Add or update a chapter in `01 development/context/prior research/`.
- Add a row to `01 development/context/MASTER.md` for any new chapter.
- Move row in `tasks.md` to "Done".
- Commit (`Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`).
- Push to `main`.

## Active prompts (paste these)

### Workers

| Terminal | Prompt | Goal |
|----------|--------|------|
| **T1 → R8** | [T1-round8-milesymedia-portal-stitch.md](T1-round8-milesymedia-portal-stitch.md) | Stitch milesymedia + Aqua portal as ONE surface (localhost + Vercel). milesymedia.com is the front door, portal lives at `/portal/*` same origin. Files separate in repo, stitched at edge. Coordinate with T6's Vercel monorepo work. |
| **T2 → R11** | [T2-round11-export-to-repo-and-presets.md](T2-round11-export-to-repo-and-presets.md) | Ship `@aqua/plugin-portal-export` — generator that materializes a Live client's content into `clients/<slug>/` as a self-contained Next.js app. 4 starter presets (skincare-brand / service-portal / membership-only / affiliate-only). T5's Luv & Ker portal is the canonical reference target. |
| **T3 → R6** | [T3-round6-editor-per-client-save-mode.md](T3-round6-editor-per-client-save-mode.md) | Editor's Save button writes to `clients/<slug>/` for Live clients via T2 R11's export plugin. Save-target toggle, branching pipeline, diff preview, GitStatusPage. New optional ports (PortalExportPort, GitOpsPort) — graceful degradation when missing. |
| **T4 → R1** | [T4-round1-ux-accessibility-polish.md](T4-round1-ux-accessibility-polish.md) | UX + accessibility pass across the entire surface — loading / empty / error states, focus rings, keyboard nav, ARIA, color contrast, mobile responsive, visual regression smoke. Shared UI primitives at `portal/src/components/ui/*`. |
| **T5 → R1** | [T5-round1-luv-and-ker-portal.md](T5-round1-luv-and-ker-portal.md) | Build Felicia's actual `clients/luv-and-ker/` portal — the canonical reference target for T2 R11's generator. Branded Next.js shell + plugin workspace deps + API proxy back to milesymedia.com for auth + storage. |
| **T6 → R1** | [T6-round1-deployment-domains-observability.md](T6-round1-deployment-domains-observability.md) | Production infrastructure: Vercel monorepo project config + env-var taxonomy + custom-domain attach (lift from `02`) + observability layer (Sentry / Vercel Analytics + per-tenant breadcrumbs). |

### Orchestrator

| Role | Prompt | Goal |
|------|--------|------|
| **Chief commander** | [orchestrator-init.md](orchestrator-init.md) | Spawns the autonomous chief-commander session. Reads mesh state, replies to terminal questions, drafts new-round prompts, schedules itself via `/loop` + `ScheduleWakeup`. Full protocol in `../orchestrator.md`. |

## Archive

Superseded prompts move to [old prompts/](old%20prompts/) once shipped.
That keeps the active folder unambiguous — whatever sits at this level
is what to paste into a fresh terminal.
