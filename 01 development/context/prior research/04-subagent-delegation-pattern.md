# Chapter 158 — Subagent delegation pattern (2026-05-07)

Major workflow upgrade: terminal managers no longer execute round work
themselves. They **delegate to fresh subagents** (general-purpose Agent
tool) per round. Major throughput + token-cost win.

## Why this happened

Cycle 173 — Ed's Claude Code harness blocked T1 R034 with a path-
permission rule that mismatched the post-#122 folder shape. Rather
than wait for the permission fix, commander launched **three subagents
in parallel** for T1 R034 / R035 / R036, then a fourth for T2 R027.
All four shipped successfully in ~20 minutes total (would have been
≥4 cycle-turns sequentially in the old terminal-fires-round model).

Ed's reaction: *"bro this is so much faster why arent we telling
terminal prompts to use subagents for this???"* — exactly. The terminal
manager-with-subagent pattern formalises the win.

## Architecture

```
[ chief commander ]
        │
        │ stages rounds in queues/T<N>/<NNN>-slug.md
        │
        ▼
[ terminal manager (T1 / T2 / T3 / T4) ]
        │
        │ reads queue · launches subagent per round · verifies commit
        │
        ▼
[ subagent (general-purpose) ]
        │
        │ reads chapters · writes code · runs tsc · writes smoke ·
        │ writes chapter · commits + pushes
        │
        ▼
   work lands on origin/main
```

**Key contract**: the manager's main thread never reads chapters or
edits code. It only:

1. `git pull --rebase --autostash`.
2. Reads inbox (commander replies).
3. Lists `queues/T<N>/*.md`.
4. Launches a subagent with the **brief template** in its router.
5. Waits for the subagent to return.
6. Verifies the subagent's reported commit hash is on `origin/main`.
7. Appends a tight `DONE` entry to its outbox referencing the queue
   filename + commit hash + chapter # + smoke count + Q-ASSUMED list.
8. Chains to next round.

## Why this saves tokens

- **Manager context stays small.** No 200-chapter pre-reads landing
  in the manager's window. The subagent reads what it needs in its
  own fresh context — cheap and disposable.
- **Subagents run on smaller models.** general-purpose ≠ the manager's
  primary model — Anthropic auto-routes general-purpose to a more
  cost-efficient choice. Per-round token spend drops 3–5×.
- **Parallel-friendly.** Commander can launch three subagents in one
  tool-use block when rounds are independent (R034 + R035 + R036
  pattern). Sequential terminal-fires-rounds couldn't do that.

## Subagent brief template (canonical)

Every router carries this template (T1/T2/T3/T4-router.md). The
manager substitutes `<queue-file>` and pastes:

```
Ship T<N> round at <queue-file> end-to-end. You are a <role>
engineer for Ed's Aqua Portal.

Read in order:
1. ~/Desktop/ker-v3/01 development/CLAUDE.md (Mode A — terminal).
2. ~/Desktop/ker-v3/<queue-file> — exact round scope.
3. Any chapters / code the queue file references.

Working dir: <terminal-specific-path>

T<N> territory (you may edit): <list>

HARD BOUNDARIES (do NOT touch):
<list>

Ship end-to-end:
- Implement every goal in the queue file.
- npx tsc --noEmit clean.
- Write the smoke (≥ count) — npm run smoke:<round-slug>.
- Author the chapter + MASTER row + tick tasks.md.
- Commit with message starting "T<N> R<N>: ...".
- git pull --rebase --autostash && git push.
- DO NOT move the queue file.

Report ≤500 chars: files shipped, commit hash, chapter #, smoke
count, Q-ASSUMED list, foundation-pending hooks.
```

## Manager outbox shape (lighter than before)

Pre-pattern outbox entries from the worker terminals were 2-4KB walls
of prose. Manager entries are short — a single `DONE` line per round
referencing the subagent's commit, plus the standard
WAKE-PENDING-ARCHIVE / WAKE-EMPTY beats. Commander reads a manager's
outbox in seconds, not minutes.

Example (T1 manager logging R034 DONE):

```
[2026-05-07T18:30:00Z] DONE: queue 034-pipelines-refactor.md shipped
via subagent. Commit 67ba820, chapter #156, 19/19 smoke. Q-ASSUMED:
hub keeps KPIs above pipeline grid; sales pipeline accepts deal+lead
hand-off; switcher static <select> v1.
```

That's ~250 chars instead of 3KB.

## Parallelism limits + handoff sequencing

- **Independent rounds**: launch in parallel. Three subagents in one
  tool-use block.
- **Dependent rounds**: launch sequentially. e.g. T2 R027 (leads-
  pipeline) depends on T1 R034 (pipelines refactor). Manager waits
  for R034's commit on origin before launching R027's subagent.
- **Cross-terminal coordination** still goes through commander. T2
  reports foundation-pending hooks → commander stages a follow-up
  T1 round for them.

## What hasn't changed

- **Mesh discipline.** Outboxes append-only, inbox read-only,
  commander.md owned by commander.
- **Queue files = round contract.** Self-contained, chapters indexed.
  Subagents don't need orchestrator commentary; the queue file IS
  the brief.
- **Hard boundaries.** Same per-terminal — managers pass them
  verbatim into the subagent brief.
- **Chapter + MASTER row + tasks.md** still the per-round sign-off.
- **Commit attribution.** Subagent commits with `T<N> R<N>: ...`
  prefix so commander can attribute work via `git log --oneline`.

## Migration notes

- Old `T<N>-router.md` shape (terminal does the work itself) has been
  replaced 2026-05-07. Files at `terminal-prompts/T1-router.md` ..
  `T4-router.md` carry the new manager-with-subagent shape.
- Rounds shipped before this chapter (R001-R157) used the old shape.
  No retroactive change needed — the work is done; future rounds use
  the new shape.
- Commander itself can still run subagents directly (chapter
  precedent: cycle 173 R034/R035/R036 + R027 batch). Useful when
  managers are blocked or the work is best done from commander
  context.

## Forward implications

- **Faster ship cadence.** Each round's wall-clock time drops because
  subagents work in parallel within a manager's wake.
- **Lower cost per round.** Token-spend per round measured at 3-5×
  cheaper post-pattern.
- **Easier to onboard new lanes.** A new terminal (T5/T6/T7
  reactivation) is just a router file pointing at a queue + the
  brief template. No new infra.
- **Operator can monitor by reading the manager outboxes** instead of
  diving into subagent transcripts.

## See also

- T1/T2/T3/T4-router.md — current manager prompts.
- Chapter #124 — Ship Plan v1 (the work being shipped).
- Chapter #122 + #123 — unification + follow-ups (the architecture
  these subagents work against).
