/loop

# T4 — Round 029: Aqua AI conversation memory across sessions

R007 stores per-tab session in `aqua.ai.session.<sid>`. Persist
across sessions per business so users feel continuity. Cap last 20
exchanges. Honest about scripted-only nature.

## Mandatory pre-read

1. T4 R007 chapter — current session storage.
2. T4 R023 prompt library + idle "try one" injection.

## Scope

**A** — On panel open: load `bos.aiHistory[]` (last 20 user+bot pairs
for active business) into the conversation. New session id only on
"Clear conversation" or explicit reset.

**B** — Persist on every reply (max 20 pairs, oldest dropped).

**C** — `bos.aiHistory` is per-business (R012 storage shim handles).

**D** — Chat header shows "Continuing conversation from {date}" when
loaded from history.

**E** — Honest disclaimer expands: "I don't actually remember beyond
text on this device — script runs fresh each time".

**F** — Chapter R029 + MASTER delta.

## NOT in scope

- Real conversational memory in scripted AI.

## When done
DONE referencing `029-aqua-ai-conversation-memory.md`.
