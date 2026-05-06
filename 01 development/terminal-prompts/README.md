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
| **T1 → R9** | [T1-round9-oauth-providers.md](T1-round9-oauth-providers.md) | Google OAuth (agency + client roles) + magic-link sign-in (end-customers via T2 R10 email-sender). Provider env unset → button hidden. Updates LoginForm + EmbedLogin. |
| **T2 → R12** | [T2-round12-stripe-connect-payouts.md](T2-round12-stripe-connect-payouts.md) | Stripe Connect Express onboarding for affiliates + Payouts API replacing manual `markPaid`. Uses per-install Stripe pattern. Mock-Stripe smoke covers onboard → status → schedule → process → transfer.paid. |
| **T3 → R7** | [T3-round7-ai-page-builder.md](T3-round7-ai-page-builder.md) | Ship `@aqua/plugin-ai-builder` — eds requirements' "describe a page → block tree" feature. Claude Haiku 4.5 default + Sonnet 4.6 fallback. Per-install API key. Prompt caching on the static system prompt. Editor topbar gets ✨ Generate button + streaming preview modal. |
| **T4 → R2** | [T4-round2-storefront-polish-and-perf.md](T4-round2-storefront-polish-and-perf.md) | Storefront + end-customer + per-client portal polish (apply R1's primitives + a11y patterns) + performance pass (bundle analysis, lazy-load, image opt, server caching, Lighthouse-style smoke). |
| **T5 → R2** | [T5-round2-second-client-portal.md](T5-round2-second-client-portal.md) | Build a SECOND per-client portal in a different industry (coaching/membership). Slim plugin set (website-editor + memberships + client-crm + forms — no ecommerce/affiliates). Validates multi-client variation. |
| **T6 → R3** | [T6-round3-cicd-and-monitoring.md](T6-round3-cicd-and-monitoring.md) | GitHub Actions CI (tsc + smoke + smoke:ux + smoke:perf matrix per package + Vercel preview deploys on PR) + MonitoringPage (uptime + error-rate + slow-routes + cost) + nightly Postgres backup script. |

### Orchestrator

| Role | Prompt | Goal |
|------|--------|------|
| **Chief commander** | [orchestrator-init.md](orchestrator-init.md) | Spawns the autonomous chief-commander session. Reads mesh state, replies to terminal questions, drafts new-round prompts, schedules itself via `/loop` + `ScheduleWakeup`. Full protocol in `../orchestrator.md`. |

## Archive

Superseded prompts move to [old prompts/](old%20prompts/) once shipped.
That keeps the active folder unambiguous — whatever sits at this level
is what to paste into a fresh terminal.
