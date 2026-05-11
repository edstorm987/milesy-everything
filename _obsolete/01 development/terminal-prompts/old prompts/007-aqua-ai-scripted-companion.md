/loop

# T4 — Round 007: Aqua AI — scripted companion (no API)

Per Ed's standing constraint (no real APIs yet), Aqua AI ships as a
scripted companion: keyword-matched canned responses + helpful link-
outs. Demo-grade until real Claude API wires in via T6.

## Mandatory pre-read

1. T4 chapter #74 copy ref — Aqua AI replies section.
2. T4 chapter #66 — Aqua AI surface placement (BOS + Incubator).
3. T4 chapter #73 — bos.js current Aqua AI placeholder.

## Scope

**A** — `incubator app/lib/aqua-ai.js` + `business-os app/lib/aqua-
ai.js` (shared via single source) — `respondTo(userMessage, context)`
returns `{ reply, suggestedActions[] }`. Keyword router with 30-50
canonical responses covering: phase questions / "stuck" / "what next"
/ HC interpretation / lesson recommendations / "talk to a human".

**B** — Floating Aqua AI button bottom-right in Incubator + BOS.
Opens a slim chat panel (right side, dismissable). Conversation in
localStorage, scoped per session.

**C** — Always-on disclaimer: "Aqua AI is currently scripted — full
AI lands when you upgrade to Pro." Honest about limits.

**D** — Suggested actions render as chips below replies — clicking
deep-links into the relevant section.

**E** — Chapter `04-aqua-ai-scripted.md` + MASTER row.

## NOT in scope

- Real Claude API (T6 wires later).
- Voice / multimodal.
- Cross-session conversation memory.

## When done
DONE referencing `007-aqua-ai-scripted-companion.md`.
