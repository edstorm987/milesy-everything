# From orchestrator → T1

Append-only. The orchestrator (chief commander) writes here when:
- Replying to your `Q-BLOCKED` or correcting a `Q-ASSUMED`
- Handing you a new sub-task or Round-2 prompt
- Course-correcting your direction

You (T1) READ this each cycle and ACT on what you find. You never write here.

Format: `[ISO timestamp] TYPE: message`. Same vocabulary as the global protocol (`messages/README.md`).

---

[2026-05-04T07:00:00Z] REPLY (ref T1 23:55:06Z Q-ASSUMED on PluginInstall scope key): Approved. `${agencyId}|${clientId ?? "_agency"}|${pluginId}` is the canonical scope key. Document it in your foundation chapter. T2 + T3 will use this exact format when calling pluginInstalls APIs.

[2026-05-04T07:00:00Z] PLAN: Continue your current scope (auth + middleware + chrome + plugin runtime + pages). Round-1 finish line: working `npm run dev` on `/`, `/login`, `/embed/login`, `/portal/agency`. Once DONE, write `04-foundation.md` chapter and stop — Round 2 prompt will land in this inbox.

[2026-05-04T08:00:00Z] TASK: Round 2 prompt is ready at `01 development/terminal-prompts/T1-round2-wire-and-demo.md`. Read it, follow it, ship it. Goal: wire fulfillment plugin into your shell + add foundation port adapters (PluginRuntime, PluginRegistry, PortalVariant) + catch-all route for plugin pages + `/api/dev/seed-demo` endpoint that seeds Demo Agency + Felicia mirror. Finish line: full smoke-test flow (sign in → /portal/agency → fulfillment in sidebar → click into Felicia → PhaseBoard with seeded checklist → tick a task → see activity). Chapter: `04-foundation-round2.md`. If you're awake on /loop, pick this up next cycle. If your /loop ended after Round-1 DONE, Ed re-pastes the prompt.

[2026-05-04T18:00:00Z] TASK: Round 4 prompt at `01 development/terminal-prompts/T1-round4-demo-button.md`. Three Rounds shipped — foundation + wire-up + multi-plugin live. Round 4 connects the Milesy Media static site to the portal: Sign-in button → /login, Demo button → seeded demo agency + POV toggle banner. Reset endpoint. Chapter `04-milesymedia-demo.md`. Re-paste if /loop ended.

[2026-05-04T20:35:00Z] REPLY (ref T1 20:25:00Z Q-ASSUMED on demo route placement): Approved. Mounting at `src/app/demo/` (URL `/demo`) is correct — the prompt's `/portal/demo/page.tsx` would have triggered the `/portal` layout session-gate before the demo cookie is issued. Top-level `/demo` also matches architecture §11 (`milesymedia.com/demo` listed alongside `/login`, not under `/portal`). Static-site CTA pointing at `${base}/demo?source=milesymedia` is the right wiring. Continue. The POV toggle endpoint can stay under `/demo/toggle` for the same reason — no portal layout dependency until after the demo cookie is set.

[2026-05-04T20:35:00Z] PLAN: Continue your scope (Goals B + C — portal `/demo` flow + isDemo session marker + POV toggle banner; reset endpoint via `?reset=1`). When DONE, write `04-milesymedia-demo.md` chapter, add MASTER row, tick tasks.md, and stop. The architecture deviation (top-level `/demo` instead of `/portal/demo`) is worth a one-line note in the chapter's "deviations" section.
