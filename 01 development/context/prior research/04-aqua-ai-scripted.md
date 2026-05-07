# 04 — Aqua AI · scripted companion (T4 R007)

Aqua AI ships as a **scripted companion** while real Claude API
plumbing is still in-flight via T6. Honest about its limits — every
surface displays the disclaimer "Aqua AI is currently scripted — full
AI lands when you upgrade to Pro."

> Demo-grade. Real Claude API wires later. Cross-session conversation
> memory and voice/multimodal are explicitly out of scope this round.

## Files

```
04-the-final-portal/milesymedia website/incubator app/lib/
├── aqua-ai.js     — canonical respondTo + REPLIES + context probe
└── aqua-ai-ui.js  — Incubator launcher + chat panel (own session key)
```

The same `aqua-ai.js` is the single source of truth for **both**
Incubator and BOS. BOS lazy-loads it via
`../incubator app/lib/aqua-ai.js` from `bos.js` (`ensureAquaAILoaded()`)
when `mountAi()` runs — so every BOS page picks it up automatically
without per-page script tags. Incubator pages include both files
explicitly.

## Public API — `window.AquaAI`

```js
AquaAI.respondTo(message: string, ctx?: Context) → {
  reply: string,                 // HTML allowed
  suggestedActions: Array<{ label, href, kind?: 'lesson'|'phase'|'human'|'open' }>
}
AquaAI.context()                 // best-effort probe, returns Context
AquaAI.disclaimer                // canonical disclaimer string
AquaAI.starters                  // suggested opening prompts (5)
AquaAI.REPLIES                   // raw entries (debug)
```

`Context` shape:
```js
{ hc, niche, phase, phaseLabel, mode, hcLowest, hcLowestScore }
```
Probed from localStorage (`bos.healthCheck`, `bos.brand`, `bos.user`,
`incubator.phase`, `bos.mode`); callers can override by passing their
own ctx.

## REPLIES — 35 canonical patterns

Keyword router; first-match wins. Substring OR-matched, lowercased.
Six topic clusters:

| Cluster                | Count | Examples                                              |
| ---------------------- | ----- | ----------------------------------------------------- |
| Phase questions        | 10    | "what phase", "blueprint phase", "advance", "live portal" |
| Stuck                  | 3     | "stuck", "overwhelmed", "where to start"              |
| What next              | 3     | "what next", "done with", "today"                     |
| HC interpretation      | 5     | "biggest leak", "health check", "rerun", "low score"  |
| Lesson recommendations | 5     | "which module", "core principles", "super sales", "referral" |
| Talk to a human        | 3     | "talk to", "call", "emergency"                        |
| Meta / disclaimer      | 3     | "are you ai", "upgrade", "hello"                      |

Plus a `FALLBACK` entry that surfaces the disclaimer + 3 suggested
chips when nothing matches.

Each entry can supply `reply` + `actions` as either strings/arrays
(static) or functions of `ctx` (dynamic — e.g. "what's my biggest
leak" pulls `ctx.hcLowest`).

## Suggested-action chips

Three chip kinds (CSS-classed):

- `phase` — gold pill linking into an Incubator phase page.
- `lesson` — green pill linking into a BOS lesson via
  `../business-os app/module.html?id=<id>`.
- `human` — blue pill, opens whatsapp / mailto in a new tab.
- `open` (default) — gold pill for any other Incubator nav.

Special href form `#ai:<message>` triggers a follow-up message in the
panel rather than navigating — used by starter prompts and the
fallback chips so users can keep the conversation going without
leaving.

## Incubator surface (R007 launcher + panel)

- Floating button bottom-right: "✦ Aqua AI" pill.
- Slide-in chat panel right side (380px wide, full height,
  `transform: translateX(105%)` → `translateX(0)`).
- Empty state: greeting + 5 starter buttons.
- Per-message bubble: user (gold-filled) right; bot (carded) left
  with chips below.
- Footer: "Clear conversation" + "Talk to a human ↗" — always present.
- Storage: `aqua.ai.session.incubator` localStorage key, capped at
  last 40 messages.

CSS lives in `incubator.css` `.inc-ai-*` block (~170L appended).
Respects existing dark/gold register.

## BOS surface (R007 refactor)

`bos.js` `mountAi()` already shipped a launcher + panel before R007.
The R007 changes are surgical:

- `mountAi()` first calls `ensureAquaAILoaded()` to inject the shared
  `aqua-ai.js` `<script>` into `<head>` (idempotent via
  `[data-bos-aqua-ai]` attr). Same lib, same patterns.
- `askAi(q)` consults `window.AquaAI.respondTo(q)` first; falls back
  to the legacy 5-pattern router only if the lib hasn't loaded
  (e.g. tests, stale cached HTML).
- Panel disclaimer line updated to "Currently scripted — full AI
  lands when you upgrade · 5/5 free messages" — matches Incubator.

The free-message cap (`bos.ai`) is preserved; counts down each
question regardless of which router answers. Suggested-action chips
are NOT yet rendered in the BOS panel — that's an R+1 (BOS panel
markup pre-dates chips; minimal touch this round).

## Honesty contract

Three layers:

1. Every panel head shows the disclaimer.
2. The `meta / are-you-ai` cluster includes a literal "I'm a scripted
   companion right now" reply for users who ask directly.
3. The fallback explicitly admits "I might not have a canned answer
   for that".

No reply pretends to know facts the script can't verify (HC topics
read from real localStorage; niche pulled from real `bos.brand`;
phase from real `incubator.phase`).

## Smoke (verified 2026-05-07)

- All 9 Incubator pages return 200; `lib/aqua-ai.js` + `lib/aqua-ai-ui.js`
  return 200.
- BOS `app.html` returns 200; opening the BOS Aqua AI panel triggers
  `ensureAquaAILoaded()` → `aqua-ai.js` script appears in `<head>`.
- Asking "what's my biggest leak" with HC seeded returns a context-
  aware reply naming the actual lowest-scored topic.
- Asking "epic intro" returns the canned reply + chip linking to
  `phase-1-epic-intro.html`.
- Empty input is rejected by both surfaces; clearing chat removes the
  localStorage key and re-renders the empty state.
- Starter chips with `#ai:<msg>` href fire a new question instead of
  navigating.

## Q-ASSUMED + R007 follow-ups

- "Per-session" interpreted as per-localStorage-namespace (persists
  across reloads). Per-tab session would need `sessionStorage`; left
  for R+1 if Ed wants stricter scoping.
- BOS panel doesn't render `suggestedActions` chips yet — its markup
  pre-dates the contract; an R+1 can extend `paintAi()` to render
  chips below bot messages once we have the latest reply object on
  hand.
- Starter prompts are 5; could grow / be context-aware (e.g. surface
  "advance my phase?" when a phase is 100% complete) — pure-data
  change in `aqua-ai.js`.
- Real Claude API: T6 will replace `respondTo()` with a server call;
  the contract (`{reply, suggestedActions}`) stays the same so UI
  doesn't need to change.

## Cross-refs

- Chapter #66 ecosystem snapshot (Aqua AI surface placement).
- Chapter #73 architecture reference (`mountAi()` baseline before R007).
- Chapter #74 copy reference (Aqua AI replies section — superseded
  by the 35-pattern REPLIES table here).
- Chapter `04-incubator-phase-portal.md` (R001-R006) — surface this
  rides on top of.
- Chapter #70 free vs Pro gating (the upgrade story the disclaimer
  references).
