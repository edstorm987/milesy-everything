# Messages — autonomous comms hub

**Six** terminals (T1 / T2 / T3 / T4 / T5 / T6) and one chief
commander operate asynchronously on this repo. They coordinate by
appending to log files in this folder. The chief commander runs on a
self-paced `/loop` that wakes periodically, pulls the repo, reads the
logs, responds, and re-schedules.

Terminal split (current — refreshed 2026-05-07 for Ship Plan v1):
- **T1** — foundation (auth / chrome / plugin runtime / DB / scope helpers). Sprint 1 owner of WS-A (auth completion) + WS-C (multi-agency core).
- **T2** — plugins (every new plugin lands here — agency-* / client-* / public-funnel / etc). Sprint 1 owner of WS-B (public funnel).
- **T3** — website-editor (blocks / editor admin / cross-plugin renderers).
- **T4** — Milesy Media ecosystem + marketing surface. Reactivated to autonomous 2026-05-07 for Sprint 2 polish (queue: niche-pages mega-menu · Resource sub-pages real · `app/page.tsx` orphan · AquaOasis Demo content · final copy pass).
- **T5** — first real per-client portal (Felicia / Luv & Ker) at `clients/luv-and-ker/`. **Reactivates Sprint 3** for WS-F.
- **T6** — production deployment + custom domains + observability. **Reactivates Sprint 3** for production preview.

Read **chapter #124 `04-ship-plan-v1.md`** for the full plan; this
file is just the protocol.

## Layout

```
01 development/messages/
├── README.md             ← protocol (you are here)
├── commander.md          ← chief commander's running log (cycle summaries)
├── terminal-1/
│   ├── to-orchestrator.md     ← T1 writes here (status + questions)
│   └── from-orchestrator.md   ← commander writes here (replies + new tasks)
├── terminal-2/  (same shape)
├── terminal-3/  (same shape)
├── terminal-4/  (same shape)
├── terminal-5/  (same shape)
└── terminal-6/  (same shape)
```

Each file is **append-only**. Never rewrite earlier entries; only add new ones at the bottom.

## Direction of writes

| File | Written by | Read by |
|------|-----------|---------|
| `terminal-N/to-orchestrator.md` | terminal N | commander |
| `terminal-N/from-orchestrator.md` | commander | terminal N |
| `commander.md` | commander | everyone (status + cycle summaries) |

A terminal **never** writes to another terminal's folder, never writes to
`commander.md`, never writes to its own `from-orchestrator.md`.
The commander **never** writes to any `to-orchestrator.md`.

## Entry format

Every entry: `[ISO timestamp] TYPE: short message`

```
[2026-05-04T14:23:00Z] STARTED: lifting plugin runtime from 02
[2026-05-04T14:25:00Z] Q-ASSUMED: storage backend default = file (matches 02). Continuing.
[2026-05-04T14:30:00Z] PROGRESS: src/plugins/_types.ts + _registry.ts in place
[2026-05-04T14:45:00Z] COMMIT: a1b2c3d "T1 step 1: plugin runtime"
[2026-05-04T15:10:00Z] Q-BLOCKED: which session-cookie name should I use? STOPPING.
[2026-05-04T15:30:00Z] DONE: foundation scaffold complete · commit f4e5d6a
```

Type vocabulary:

| TYPE | who | meaning |
|------|-----|---------|
| `STARTED` | terminal | beginning a new sub-task |
| `PROGRESS` | terminal | a milestone within a task is complete |
| `Q-ASSUMED` | terminal | hit a question, made a reasonable assumption (state it), continuing — non-blocking |
| `Q-BLOCKED` | terminal | hit a question, no reasonable assumption possible, stopped |
| `COMMIT` | terminal | wrote a commit (hash + one-line message) |
| `DONE` | terminal | task complete (chapter written, MASTER updated, tasks.md ticked) |
| `WARN` | terminal | something off but not blocking |
| `RESUMED` | terminal | resuming after a Q-BLOCKED was answered |
| `REPLY` | commander | replying to a Q-ASSUMED or Q-BLOCKED — reference timestamp of the question |
| `TASK` | commander | handing terminal a new sub-task / round-2 prompt |
| `WAKEUP` | commander | start of a wake cycle (in commander.md) |
| `SLEEP` | commander | scheduling next wakeup with delay + reason (in commander.md) |
| `PLAN` | commander | a planning decision affecting future rounds |

## Protocol — every terminal

### Before starting any task
1. `cd ~/Desktop/ker-v3 && git pull --rebase`
2. Read `01 development/messages/terminal-<N>/from-orchestrator.md` — any new commander reply or task addressed to you?
3. Read `01 development/messages/terminal-<N>/to-orchestrator.md` — your own outbox; figure out where you left off.
4. Read `01 development/tasks.md`.

### While working
- **Don't stop on questions.** If a reasonable assumption exists, append a `Q-ASSUMED` entry to your `to-orchestrator.md` with assumption + reasoning, and keep going.
- **Only stop on `Q-BLOCKED`** when no reasonable assumption is possible.
- After every commit, `git pull --rebase` then `git push`. Append a `COMMIT` entry to your `to-orchestrator.md`.

### When done with a task
- Append a `DONE` entry to your `to-orchestrator.md`.
- Add or update the relevant chapter in `01 development/context/prior research/`.
- Add a row to `01 development/context/MASTER.md` for any new chapter.
- Move the row in `tasks.md` to "Done".
- Final commit + push.

### When blocked
- Append `Q-BLOCKED` entry to your `to-orchestrator.md`.
- Stop working.
- Sleep 600s (10 min) — commander will reply within that window.
- On wake: read `from-orchestrator.md`. If a `REPLY` is there, append `RESUMED` to your outbox and continue.

## Protocol — chief commander

Each wake cycle:

1. `git pull --rebase`.
2. Read each `terminal-N/to-orchestrator.md` (find entries newer than your last `WAKEUP` in `commander.md`).
3. Read your own `commander.md` (find your last entry).
4. For each new entry per terminal:
   - `Q-BLOCKED` → write a `REPLY` into that terminal's `from-orchestrator.md` referencing the question's timestamp. Be specific.
   - `Q-ASSUMED` with risky/wrong assumption → write a `REPLY` correcting it.
   - `DONE` → mark task done in `tasks.md`. If terminal is fully done with a round, write a `TASK` for next round into their `from-orchestrator.md`.
   - `WARN` → assess and respond.
   - `PROGRESS` only → just note "T<N> progressing" briefly.
5. Append a `WAKEUP` summary entry to `commander.md`: `[ISO] WAKEUP: <one-line summary>`.
6. Update `tasks.md`, `phases.md`, individual prompt files if priorities shifted.
7. Commit + push.
8. Schedule next wake based on activity:
   - Any `Q-BLOCKED` outstanding (reply not yet sent or not yet acted on): 600s
   - Active progress + commits since last wake: 1500s
   - Quiet (no new entries): 1800s
   - All terminals fully `DONE` for current round: 1200s to draft next round
9. Append a `SLEEP` entry to `commander.md` with the chosen delay + reason.

## Why this works

- **Per-terminal folders** = clean inbox/outbox mental model. Easy to find what's addressed to whom.
- **Append-only** = no race-condition merges of conflicting edits.
- **Git is the message bus.** Pull-before, push-after. Concurrent commits resolve via rebase.
- **Commander is async.** Terminals only wait for commander on `Q-BLOCKED`; everything else continues at full speed.
- **Anyone can audit** with `git log` + `cat` on the message files.
