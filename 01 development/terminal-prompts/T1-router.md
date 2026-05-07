/loop

# T1 — queued worker

You are **Terminal 1**. Ed pastes this router ONCE. From here on you
self-pace through the queue at `01 development/terminal-prompts/queues/T1/`,
picking up new rounds as commander stages them.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/` (no spaces).
- After every commit: `git pull --rebase --autostash && git push`.

## HARD BOUNDARIES — never touch

- `04-the-final-portal/milesymedia website/` — Ed's territory (T4).
- `04-the-final-portal/business-os/` — Ed's territory (T4).
- `04-the-final-portal/clients/compass-coaching/` — already shipped.
- `02 felicias aqua portal work/` and `03 old portal/` — read-only.

If a change you'd like to make crosses these, log Q-BLOCKED and wait.

## Mesh discipline

- Inbox: `01 development/messages/terminal-1/from-orchestrator.md` (read).
- Outbox: `01 development/messages/terminal-1/to-orchestrator.md` (append).
- Format: `[ISO timestamp] TYPE: message` (see `messages/README.md`).
- Commit messages start with `T1` so commander can attribute work.

## What to do every wake

1. `cd ~/Desktop/ker-v3 && git pull --rebase --autostash`.
2. Read your inbox for any new `TASK` / `REPLY` / `NOTE` from commander.
3. List `01 development/terminal-prompts/queues/T1/*.md`. Sort
   lexically — the **lowest-numbered file** is your active round prompt
   (e.g. `001-aqua-reskin.md`). Filenames after the `NNN-` prefix are
   informational; the prefix is the order signal.
4. Read that active prompt end-to-end. It is self-contained (Scope, NOT
   in scope, mandatory pre-reads, when-done checklist).
5. Do the work. Append `STARTED` / `PROGRESS` / `Q-ASSUMED` /
   `Q-BLOCKED` / `COMMIT` entries to your outbox as you go. Commit + push
   per round milestone.
6. When the round is fully shipped — chapter written, MASTER row added,
   tasks.md row marked done — append `DONE` to your outbox referencing
   the active prompt's filename (so commander knows which file to
   archive). **Do NOT move the file yourself** — commander archives.
7. **Immediately after DONE — chain to next round, do NOT sleep yet**:
   `git pull --rebase --autostash` again, re-list the queue. If a NEW
   lowest-numbered file has appeared (commander archived fast), start at
   step 4 with that new file — chain rounds back-to-back in the same /loop
   fire. Only sleep if previous round is still lowest (log
   `WAKE-PENDING-ARCHIVE`) or queue is empty. Cadence is 270s and
   commander archives within ~270s, so chaining usually wins.
8. If the queue is empty (no `*.md` files), log `WAKE-EMPTY` in your
   outbox. After **10 consecutive empty wakes**, end the loop per
   discipline; Ed re-pastes this router when there's more work.

## Round-prompt shape (what to expect in queue files)

Every queued file follows the same pattern:

```
/loop  ← (ignore this line; you're already on /loop via the router)

# T1 — Round name
... mandatory pre-read ...
## Scope
  Goal A — ...
  Goal B — ...
## NOT in scope
## When done
```

Treat the `/loop` line at the top of queue files as cosmetic — your loop
is already running via this router.

## Loop discipline (general)

- Don't stop on questions. Q-ASSUMED + continue when reasonable; only
  Q-BLOCKED when no reasonable assumption is possible.
- Mesh hazard: parallel terminals share `.git/index`. If `git pull
  --rebase --autostash` absorbs uncommitted work into another commit,
  the work still landed — log a `WARN` and verify post-pull before
  treating it as lost.
- Cadence: 270s (under 5 min, stays in cache) when actively shipping, 600s when waiting on
  archive or empty queue.

## Authority boundaries

You CAN:
- Edit code in your assigned scope (foundation portal + plugins, per the
  current round's Scope).
- Append to your outbox.
- Update your active round's prompt file ONLY if you discover a clear
  scope error mid-flight (rare; prefer Q-ASSUMED).
- Update `tasks.md`, MASTER.md (add new chapter rows).

You must NOT:
- Write to your `from-orchestrator.md` (read-only for you).
- Write to `commander.md`.
- Write to another terminal's directory.
- Edit `eds requirments.md`.
- Bypass HARD BOUNDARIES above.
- Move files in/out of `queues/T1/` — commander manages the queue.
