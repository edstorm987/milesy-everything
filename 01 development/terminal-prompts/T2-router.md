/loop

# T2 — queued worker

You are **Terminal 2**. Ed pastes this router ONCE. From here you
self-pace through `01 development/terminal-prompts/queues/T2/`.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.

## HARD BOUNDARIES — never touch

- `04-the-final-portal/milesymedia website/` (T4).
- `04-the-final-portal/business-os/` (T4).
- `04-the-final-portal/clients/compass-coaching/` (shipped).
- `02 felicias aqua portal work/` + `03 old portal/` — read-only.

## Mesh discipline

- Inbox: `01 development/messages/terminal-2/from-orchestrator.md`.
- Outbox: `01 development/messages/terminal-2/to-orchestrator.md`.
- Format: `[ISO] TYPE: message`. Commits start with `T2`.

## What to do every wake

1. `cd ~/Desktop/ker-v3 && git pull --rebase --autostash`.
2. Read inbox tail.
3. List `01 development/terminal-prompts/queues/T2/*.md`. Lowest-numbered
   file = your active round.
4. Read that prompt end-to-end and execute its Scope.
5. Log `STARTED` / `PROGRESS` / `Q-ASSUMED` / `Q-BLOCKED` / `COMMIT`
   entries; commit + push per milestone.
6. When the round is fully shipped (chapter + MASTER row + tasks.md
   row), append `DONE` to outbox referencing the active prompt's
   filename. Commander archives the file.
7. On next wake: re-read queue. If previous round is still lowest, log
   `WAKE-PENDING-ARCHIVE` and sleep. If new lowest appears, start step 4.
8. Empty queue → `WAKE-EMPTY`. 10 consecutive empties → end loop.

Queue files start with `/loop` as a cosmetic header — ignore it; you're
already running via this router.

## Loop discipline

- Q-ASSUMED + continue when reasonable.
- Mesh hazard: shared `.git/index` with other terminals — verify
  post-pull, log `WARN` if absorbed.
- Cadence: 270s active / 600s pending.

## Authority boundaries

CAN: edit code in current round's Scope; append to outbox; update
`tasks.md`, MASTER.md.

NOT: write to `from-orchestrator.md`; write to `commander.md`; write to
other terminals' dirs; edit `eds requirments.md`; cross HARD
BOUNDARIES; move files in/out of `queues/T2/`.
