# Terminal queues — how the queue architecture works

Each terminal has its own queue dir (`T1/`, `T2/`, `T3/`). Files in a
queue are round prompts named `NNN-<slug>.md` where `NNN` is the order
prefix (`001-`, `002-`, …).

## How a terminal uses its queue

Terminals run a **router prompt** (`T<N>-router.md` at one level up,
pasted ONCE by Ed). The router on each wake:

1. Pulls latest.
2. Reads its inbox.
3. Lists `queues/T<N>/*.md`, sorted lexically.
4. Treats the **lowest-numbered file** as the active round.
5. Executes that round's Scope, logs DONE when shipped.

When a round ships, the terminal does NOT move the file — commander
archives it (moves to `terminal-prompts/old prompts/`). On next wake,
the terminal sees the next-lowest file and starts that round.

## How commander uses the queues

- **Stage**: drop a new `NNN-<slug>.md` into the right terminal's queue
  whenever the next round is decided. Bulk-stage as many ahead as
  desired — the terminal will work through them in order.
- **Archive**: when a `DONE` entry lands in a terminal's outbox
  referencing an active queue file, `git mv` that file to
  `terminal-prompts/old prompts/T<N>-<slug>-shipped.md` (or the original
  name — preserve clarity).
- **Reorder / insert**: just rename files. To bump priority, prepend
  with a smaller `NNN-` prefix.

## Naming convention

`NNN-slug.md`:
- `NNN` zero-padded 3-digit order prefix (`001`, `002`, … `999`).
- `slug` short kebab-case round name.
- File starts with cosmetic `/loop` line (router treats it as
  no-op since the loop is already running).

## Why this is faster than re-paste

Old workflow: Ed pastes round 1 → terminal ships → loop dies →
Ed pastes round 2 → ... (Ed is the bottleneck).

New workflow: Ed pastes router ONCE per terminal → commander stages
rounds in queue → terminal cycles through them autonomously → Ed only
intervenes when the queue is empty or strategic direction shifts.
