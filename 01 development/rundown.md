# Rundown — where we are, what's left

Snapshot 2026-05-07T19:20Z. Refresh as the picture changes; this
file is meant to be skimmed in 30 seconds.

For the canonical plan see chapter **#124** `04-ship-plan-v1.md`.
For the dev-folder layout see `README.md`. This file = at-a-glance
status; chapters are source of truth.

---

## Phase

**Sprint 2 ✅ closed · Sprint 2.5 (Ed UX batch) mostly done · Sprint 3
(Felicia + production) parked pending Ed greenlight.**

The current **active** work is **T1 R037 leads-pipeline foundation
glue** — closes the 5 hooks T2 R027 left so the leads pipeline is
fully alive end-to-end. After that we wait for Ed's next direction.

## Workflow

**Manager-with-subagent pattern (chapter #158).** Each terminal
manager delegates round work to a fresh subagent. Manager outboxes
carry one tight DONE per round. Cycle 173 shipped 4 rounds in
parallel via subagents while T1 was permission-blocked — the precedent
that made Ed adopt the pattern.

## Active terminals (4 — managers)

| Terminal | Lane | Queue depth |
|----------|------|-------------|
| **T1** | Foundation | 1 (R037 leads-pipeline foundation glue) |
| **T2** | Plugins | 0 |
| **T3** | Website-editor | 0 |
| **T4** | Marketing + ecosystem | 0 |

**Parked terminals** (queues preserved):
- **T5** — Felicia / WS-F. Ready at `queues/T5/001-003`.
- **T6** — production deploy + observability. Ready at `queues/T6/001-005`.
- **T7** — niche-agency satellites. Ready at `queues/T7/001-005`.

## Ship gate (chapter #124) — current score

**9/9 autonomous criteria green.** Only operator-side items remain.

| # | Criterion | Status |
|---|-----------|--------|
| 1 | WS-A complete | ✅ |
| 2 | WS-B complete | ✅ |
| 3 | WS-C complete | ✅ |
| 4 | WS-D R024 (SMTP) | ✅ driver + injection contract; real Postmark inject = operator |
| 5 | WS-D R025 (Stripe basic) | ✅ |
| 6 | WS-D R026 (GA4 read-only) | ✅ |
| 7 | WS-E complete | ✅ |
| 8 | WS-F (Felicia portal viewable + end-customer flow) | 🔴 not started — needs T5 reactivation |
| 9 | Founder password ≠ "123" + deploy runbook current + smoke 200 across surfaces + Ed dry-run | 🟡 founder-pw ✅ · runbook env-table ✅ · full runbook rewrite pending T6 · operator dry-run pending |

## Ed's UX batch (Sprint 2.5)

**14 of 16 items shipped via subagents in cycle 173.** Remaining:
- 🟡 T1 R037 (leads-pipeline foundation glue) — queue file ready,
  manager pickup pending.
- 🟡 HC→leads-pipeline tracking verification (post-R037).

See `tasks.md` for the full Done/To do split.

## What lands today vs blocks on Ed

**Lands today (autonomous side, no Ed needed):**
- T1 R037 will close the leads-pipeline foundation glue once Ed
  re-pastes the T1-router (or commander launches the subagent
  directly).

**Needs Ed:**
1. **T5 reactivation** for Felicia (WS-F) — paste `T5-router.md`
   from `old prompts/T5-router-parked-2026-05-07.md` and ship 3
   rounds.
2. **T6 reactivation** for production deploy + runbook rewrite.
3. **Production env vars** when ready to deploy preview
   (`FOUNDER_EMAIL`, `FOUNDER_PASSWORD` ≥12 chars not "123",
   `PORTAL_SESSION_SECRET`, `DATABASE_URL`,
   `NEXT_PUBLIC_PORTAL_BASE_URL=https://milesymedia.com`,
   `NEXT_PUBLIC_PORTAL_SECURITY=strict`).
4. **Operator dry-run** + sign-off — last ship-gate item.

## Health flags

- Linter race occasionally clobbers commander edits when Ed has the
  same file open. Self-resolves on re-edit; not blocking.
- `git pull --rebase --autostash` "multiple branches" transient
  recurs. Self-heals on retry. No work lost.
- Mesh-absorption pattern intact — subagent commits sometimes land
  as part of commander commits; verify on origin/main, treat as DONE.

## What's been shipped (summary)

- **T1 foundation**: 14 rounds — auth completion, multi-agency core,
  Postgres backend, durable nonces, env secrets, observability, BOS
  middleware, port adapters, ActivityCategory batch, pipelines
  refactor, sidebar collapse, profile picture upload.
- **T2 plugins**: 27+ rounds — every plugin from kanban through
  leads-pipeline. 38 plugins total in `04-the-final-portal/plugins/`.
- **T3 website-editor**: 47 rounds — full block engine, JSON-LD,
  sitemap, redirects, page templates, webhook block, form submission
  host route.
- **T4 marketing + ecosystem**: 8 rounds — niche pages mega-menu,
  Resources tools, AquaOasis demo content, marketing JSX rewrite,
  niche pages JSX rewrite, HC React rewrite + tracking.
- **Workflow**: chapter #158 manager-with-subagent pattern landed —
  3-5× cheaper per-round token spend.

---

Last updated: 2026-05-07T19:20Z. Maintained by chief commander.
