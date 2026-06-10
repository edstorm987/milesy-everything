/loop

# T4 — Round 020: "As a client" preview mode

Operator (or Founder) can preview BOS + Incubator from a client's POV.
Swaps `bos.activeBusinessId` to the previewed client + flags
"Preview as {name}" banner. Persisted only for session.

## Mandatory pre-read

1. T4 R012 multi-business localStorage.
2. T4 R009 admin polish — admin already has lead drill-down.

## Scope

**A** — Admin lead-detail row gains "View as this client →" button.
Clicks: writes `bos.previewAs={businessId, expiresAt: +60min}` + opens
BOS in a new tab.

**B** — On boot, every BOS+Incubator page checks `bos.previewAs`. If
set: renders sticky top banner "Previewing as {name} — exit preview"
+ uses preview businessId for storage shim.

**C** — "Exit preview" clears flag + reloads.

**D** — Auto-expire after 60min of inactivity.

**E** — Chapter R020 + MASTER delta.

## NOT in scope

- Multi-operator preview sessions.

## When done
DONE referencing `020-as-client-preview.md`.
