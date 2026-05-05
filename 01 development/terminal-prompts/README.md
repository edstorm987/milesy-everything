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
| **T1 → R7** | [T1-round7-postgres-backend.md](T1-round7-postgres-backend.md) | Swap file backend → Postgres for production. Architecture §13 parked v1-required. Five goals: Postgres driver behind storage abstraction (single `portal_kv` JSONB table) + migration script + connection pooling + RLS scoping defense + smoke against both backends. `DATABASE_URL` unset → file backend stays default for dev. |
| **T2 → R10** | [T2-round10-email-sender.md](T2-round10-email-sender.md) | Ship `@aqua/plugin-email-sender` — cross-cutting delivery engine for all other plugins (agency-marketing templates, forms notifications, memberships welcome, affiliates payout, end-customer signup confirmations). Postmark + no-op driver for v1. `scopePolicy: "agency"`. After R10 T2 has shipped 10 plugins. |
| **T3 → R5** | [T3-round5-cross-plugin-block-renderers.md](T3-round5-cross-plugin-block-renderers.md) | Real React components for the 18 cross-plugin storefront blocks (ecommerce 8 + memberships 3 + affiliates 3 + forms 1 + CRM 1 + donation-button). Replaces the stubs from R3 with real fetches against each plugin's API namespace. |

### Orchestrator

| Role | Prompt | Goal |
|------|--------|------|
| **Chief commander** | [orchestrator-init.md](orchestrator-init.md) | Spawns the autonomous chief-commander session. Reads mesh state, replies to terminal questions, drafts new-round prompts, schedules itself via `/loop` + `ScheduleWakeup`. Full protocol in `../orchestrator.md`. |

## Archive

Superseded prompts move to [old prompts/](old%20prompts/) once shipped.
That keeps the active folder unambiguous — whatever sits at this level
is what to paste into a fresh terminal.
