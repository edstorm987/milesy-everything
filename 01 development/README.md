# `01 development/` — index

The development cockpit for Aqua Portal. **Read this first** if you're
new to the dev folder. For any deeper question, follow the pointers
below to the source-of-truth document.

## What Aqua Portal is

A **multi-tenant agency platform** for Milesy Media. One Next.js app
serves three nested audience tiers — Agency → Client → End-customer —
each on its own branded portal. Every feature ships as a **plugin**
(40 in the registry as of 2026-05-07). Single-host architecture: one
domain, one cookie, one deploy.

The product target lives at `04-the-final-portal/milesymedia-website/`
(Next.js project root post-unification — chapter #122 deleted the
legacy `milesymedia website/` with a space).

For the locked architecture see chapter #19
(`context/prior research/04-architecture.md`). For the unified vision
see chapter #121. For the v1 ship plan see chapter #124.

## Boot order — read these first

If you're a **fresh Claude session** working on this repo, read in
order before doing anything:

1. **`CLAUDE.md`** — top-level directive (mode A vs B, pre-read list,
   authority rules).
2. **`messages/README.md`** (Mode A) OR **`web.md`** (Mode B) — your
   coordination protocol.
3. **`context/MASTER.md`** — chapter index. Read at minimum:
   - **#124** Ship Plan v1 (the active plan)
   - **#19** Architecture (locked design)
   - **#121** Unified vision (single-host model)
   - **#122** Website-portal unification (the move)
   - **#123** Unification follow-ups + multi-agency vision
   - **#158** Subagent delegation pattern (current workflow)
4. **`eds requirments.md`** — Ed's spec (read-only).
5. **`tasks.md`** — current sprint backlog.
6. **`rundown.md`** — at-a-glance status (skim in 30s).
7. Your own message log if you're a manager terminal:
   `messages/terminal-N/from-orchestrator.md` (your inbox) +
   `to-orchestrator.md` (your outbox).

## File layout

```
01 development/
├── README.md                ← you are here (index)
├── CLAUDE.md                ← top-level directive — READ FIRST
├── orchestrator.md          ← chief commander protocol (Mode A)
├── web.md                   ← single-actor protocol (Mode B / web)
├── eds requirments.md       ← Ed's spec — read-only
├── phases.md                ← roadmap + post-ship phases
├── tasks.md                 ← rolling sprint backlog
├── rundown.md               ← at-a-glance status
├── ideas.md                 ← parking lot for surfaced ideas
├── context/
│   ├── MASTER.md            ← chapter index (start here for memory)
│   └── prior research/      ← 158 chapters (durable learnings)
├── messages/                ← autonomous-mesh logs (Mode A only)
│   ├── README.md            ← protocol
│   ├── commander.md         ← commander running log
│   └── terminal-{1..7}/     ← per-terminal inbox + outbox
├── terminal-prompts/        ← prompt files Ed pastes into terminals
│   ├── README.md            ← which file does what
│   ├── orchestrator-init.md ← spawn the commander
│   ├── T1-router.md         ← T1 manager (foundation)
│   ├── T2-router.md         ← T2 manager (plugins)
│   ├── T3-router.md         ← T3 manager (website-editor)
│   ├── T4-router.md         ← T4 manager (marketing + ecosystem)
│   ├── queues/              ← per-terminal active round backlogs
│   └── old prompts/         ← shipped + retired archive
├── runbooks/
│   └── deploy.md            ← ⚠ STALE post-unification (refresh in WS-E)
├── ed-dropbox/              ← brand assets, Notion exports, screenshots
└── old files/               ← legacy handoffs (delete-safe reference)
```

## Operating modes

**Mode A — Mac terminal (Claude Code)**: full shell + filesystem
access, can spawn subagents, runs `/loop` + `ScheduleWakeup`. Four
active terminal MANAGERS (T1/T2/T3/T4) each delegate round work to
fresh subagents per chapter #158. Plus chief commander coordinates
via `messages/`.

**Mode B — Claude on the web**: single chat, single actor, no /loop.
Mesh is OFF. Orchestrator + worker rolled into one. See `web.md`.

## Active terminals (Mode A)

| Terminal | Role | Owns |
|----------|------|------|
| **T1** | Foundation manager | `milesymedia-website/src/{server,lib/server,app/api,app/portal,components/chrome}/`, middleware, next.config, `_registry.ts` |
| **T2** | Plugins manager | `04-the-final-portal/plugins/<id>/` (every plugin except website-editor) |
| **T3** | Website-editor manager | `04-the-final-portal/plugins/website-editor/` |
| **T4** | Marketing + ecosystem manager | `milesymedia-website/public/{_marketing,health-check,business-os,incubator}/`, `src/app/{(marketing),health-check,incubator,page.tsx,for-*,_home,_niches}/`, SiteShell + ResourceFinder + lib/resources/catalog |

**Parked terminals** (queues preserved at `queues/T{5,6,7}/`):
- **T5** — first real client (Felicia / Luv & Ker). Reactivates Sprint 3 (WS-F).
- **T6** — production deploy + observability. Reactivates Sprint 3.
- **T7** — niche-agency satellites (Phase 12 R3+). Post-ship.

## How a round flows (manager-with-subagent — chapter #158)

```
[ commander ]
    │ stages queues/T<N>/<NNN>-slug.md
    ▼
[ manager ]  reads queue → launches subagent → verifies commit → logs DONE → chains
    │
    ▼
[ subagent ]  reads chapters · writes code · runs tsc · writes smoke · authors chapter · commits + pushes
    │
    ▼
work lands on origin/main
```

Manager outboxes carry one short DONE per round (~250 chars referencing
commit hash + chapter # + smoke count + Q-ASSUMED list). Commander
reads outboxes every wake.

## Where things live in the product (`04-the-final-portal/`)

```
04-the-final-portal/
├── milesymedia-website/             ← Next.js project root (T1 + T4 share via territory split)
│   ├── src/
│   │   ├── app/                     ← routes (T1: api, portal; T4: marketing, health-check, incubator)
│   │   ├── components/              ← T1 chrome + T4 SiteShell/ResourceFinder
│   │   ├── lib/                     ← T1 server libs + T4 resources catalog
│   │   ├── server/                  ← T1: types, storage, scope helpers
│   │   └── plugins/                 ← T1 plugin runtime + _registry
│   ├── public/                      ← T4 static apps (_marketing, health-check, business-os, incubator)
│   ├── middleware.ts                ← T1
│   └── next.config.ts               ← T1 (T4 may add rewrites)
├── plugins/                         ← T2 (every non-website-editor) + T3 (website-editor)
│   ├── website-editor/              ← T3
│   ├── public-funnel/               ← T2
│   ├── leads-pipeline/              ← T2
│   └── … 35 more plugins
├── clients/                         ← T5 territory (per-client portals; Felicia first)
└── demo portals/                    ← T7 territory (public playable demos)
```

## What ships are tracked here

- Per-round chapters in `context/prior research/04-<slug>.md`.
- Per-round MASTER row in `context/MASTER.md`.
- Per-round task ticked in `tasks.md`.
- Per-commit attribution via `T<N> R<N>: ...` commit message prefix.

## Pointers to the rest

- **Plan**: chapter #124 `04-ship-plan-v1.md`.
- **Architecture**: chapter #19 `04-architecture.md`.
- **Status snapshot**: `rundown.md`.
- **Sprint backlog**: `tasks.md`.
- **Workflow upgrade**: chapter #158 `04-subagent-delegation-pattern.md`.
- **Deploy**: `runbooks/deploy.md` (currently STALE — refresh in WS-E).

If something here disagrees with reality, **reality wins** — patch
this README and the relevant doc. Maintained by chief commander.

— Last refreshed 2026-05-07T19:10Z.
