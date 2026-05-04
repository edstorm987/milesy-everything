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
2. Paste the contents of `T1-foundation.md` (or T2 / T3) at the prompt.
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
| **T1 → R4** | [T1-round4-demo-button.md](T1-round4-demo-button.md) | Wire static Milesy Media site → live portal. Sign-in button + Demo button + POV toggle banner + reset endpoint. |
| **T2 → R3** | [T2-round3-validation.md](T2-round3-validation.md) | (A) End-to-end phase-preset smoke walking 5 phase advances. (B) Build `@aqua/plugin-agency-hr` (staff/departments/leave). |
| **T3 → R2** | [T3-round2-block-uis.md](T3-round2-block-uis.md) | Lift the real 58 block components + real EditorPage (Live/Block/Code) + PortalsPage + Pages/Customise/Sites/Themes/Sections/Assets/Popups admin pages from `02`. |

### Orchestrator

| Role | Prompt | Goal |
|------|--------|------|
| **Chief commander** | [orchestrator-init.md](orchestrator-init.md) | Spawns the autonomous chief-commander session. Reads mesh state, replies to terminal questions, drafts new-round prompts, schedules itself via `/loop` + `ScheduleWakeup`. Full protocol in `../orchestrator.md`. |

## Queued (drafted ahead — not for paste yet)

| Terminal | Prompt | Trigger |
|----------|--------|---------|
| **T1 → R5** | [T1-round5-end-customer.md](T1-round5-end-customer.md) | Drop into T1 inbox once R4 (`T1-round4-demo-button.md`) hits `DONE`. Brings the third audience (end-customers) live: per-client signup + login, real `/portal/customer` via website-editor variant flow, third POV in the demo cycle. |

## Archive

Superseded prompts move to [old prompts/](old%20prompts/) once shipped.
That keeps the active folder unambiguous — whatever sits at this level
is what to paste into a fresh terminal.
