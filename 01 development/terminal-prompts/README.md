# Terminal prompts — index (what to paste where)

Refreshed 2026-05-07 alongside Ship Plan v1 (chapter #124). This folder
holds the **prompt files Ed pastes into fresh Claude Code terminals** to
spin them up. One file per terminal role.

## Active prompts (paste these)

| File | Who pastes | When | Notes |
|------|-----------|------|-------|
| `orchestrator-init.md` | Ed | Boot a new commander (chief orchestrator) session | Self-paced /loop. Coordinates T1-T4 via `messages/`. |
| `T1-router.md` | Ed → fresh terminal | Autonomous T1 (foundation) | Reads queue at `queues/T1/`, ships rounds, logs DONE. Sprint 1 owner of WS-A + WS-C. |
| `T2-router.md` | Ed → fresh terminal | Autonomous T2 (plugins) | Reads queue at `queues/T2/`. Sprint 1 owner of WS-B. |
| `T3-router.md` | Ed → fresh terminal | Autonomous T3 (website-editor) | Reads queue at `queues/T3/`. |
| `T4-router.md` | Ed → fresh terminal | Autonomous T4 (Sprint 2 polish lane) | Reactivated 2026-05-07. Reads queue at `queues/T4/`, ships polish rounds. |
| `T5-router.md` | Ed → fresh terminal | Autonomous T5 (first real client — Felicia) | Reads queue at `queues/T5/` (3 rounds: portal scaffold · content · end-customer flow). Sprint 3 WS-F. |
| `T6-router.md` | Ed → fresh terminal | Autonomous T6 (production deploy + observability) | Reads queue at `queues/T6/` (5 rounds: deploy runbook rewrite · CI pipeline · vercel config · domain attach · prod-readiness smoke). Sprint 3 WS-E final lap. |
| `T7-router.md` | Ed → fresh terminal | Autonomous T7 (niche-agency satellites + parallel scale) | Reads queue at `queues/T7/` (5 rounds: domain-aware marketing · per-agency lead-magnet packs · agency-spawner plugin · therapist niche pack · 3 more niches). Phase 12 R3+ scale lane. |

That's the live set. **Eight files** (1 commander + 7 worker terminals).
If you're not sure what to paste, paste `orchestrator-init.md` for the
commander or `T<N>-router.md` for an autonomous worker.

## Subfolders

```
terminal-prompts/
├── README.md                     ← you are here
├── orchestrator-init.md          ← commander
├── T1-router.md                  ← T1 autonomous
├── T2-router.md                  ← T2 autonomous
├── T3-router.md                  ← T3 autonomous
├── T4-router.md                  ← T4 autonomous (polish)
├── T5-router.md                  ← T5 autonomous (Felicia)
├── T6-router.md                  ← T6 autonomous (production)
├── T7-router.md                  ← T7 autonomous (niche satellites)
├── queues/                       ← per-terminal active round backlogs
│   ├── README.md
│   ├── T1/ T2/ T3/ T4/           ← lowest-numbered .md = current round
│   ├── T5/                       ← Felicia rounds (3 staged)
│   ├── T6/                       ← production rounds (5 staged)
│   └── T7/                       ← niche-satellite rounds (5 staged)
└── old prompts/                  ← shipped queue files + retired prompts (archive only)
```

## Round-prompt files (queue items)

Each file in `queues/T<N>/` is a single self-contained round prompt
(scope · pre-reads · NOT-in-scope · when-done). The router prompts
above tell each terminal to pick up the lowest-numbered file in their
queue, ship it, log DONE, and chain to the next.

Commander archives shipped queue files into `old prompts/` so the
chain stays tight. Workers never move queue files themselves.

## Dormant prompts — when to reactivate

- `_dormant/T4-router.md` — paste this if Ed wants T4 autonomous again
  (e.g. after the Sprint 1 polish work is done and there's a queue of
  ecosystem rounds). For now, T4 is manual via `T4-manual.md`.
- `_dormant/T6-production-gate.md` — paste this when reactivating T6
  for Sprint 3 production preview work (chapter #124 WS-E + WS-F).
  Until then it's parked.

T5 doesn't have a router yet — it'll get one when WS-F (first real
client) lights up in Sprint 3. At that point a new `T5-router.md` (or
manual prompt) will land here.

## Reading order for any new session

Anything you paste tells the terminal what to read first. As a sanity
check, every active prompt above instructs its session to read:

1. `01 development/CLAUDE.md`
2. `01 development/messages/README.md` (mesh protocol)
3. `01 development/context/MASTER.md` (chapter index — start with #124 Ship Plan, then #121 unified vision, #122 unification, #123 follow-ups)
4. `01 development/eds requirments.md`
5. `01 development/tasks.md` (Sprint 1 backlog)
6. Their own inbox (`messages/terminal-N/from-orchestrator.md`)

Once those are read, the terminal knows what it is and what to do.

## Authoritative state

If this README disagrees with reality, **reality wins** — patch this.
The chief commander (this session) keeps this file current. If you
notice it's stale, tell the commander or edit directly.
