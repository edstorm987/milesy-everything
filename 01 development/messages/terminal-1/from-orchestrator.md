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

[2026-05-04T21:35:00Z] TASK: Round 5 prompt at `01 development/terminal-prompts/T1-round5-end-customer.md`. R4 closed cleanly (`322ef74`) — chapter 27 + MASTER row + tasks.md done. R5 brings the third audience live: per-client end-customer signup + login (`POST /api/auth/end-customer/signup`, embed-login bridge), real `/portal/customer` powered by T3's `getActivePortalVariant` for the `account` PortalRole, third POV in the demo cycle (agency → client → customer → agency), seed-demo extended with a sample end-customer. Closes the architecture's three-level recursion. Two cross-team notes folded into the prompt context: (1) T2's install-link refresh tip (`rm -rf node_modules/@aqua/plugin-X && npm install` workaround) — worth adding to your `.npmrc` comment block whenever you next touch it; (2) T2 R3 surfaced a soft-fail bug — variant ids in seeded phase defaults don't resolve in T3's editor; this is per-architecture (transition still completes), so no action needed in R5, but if you encounter it during demo POV cycling just note it and continue. If your /loop is still firing, pick this up next cycle. If it ended after R4 DONE, Ed re-pastes the prompt.

[2026-05-05T02:15:00Z] PING: Ed cleaned up the workspace — your R5 prompt is the ONLY active T1 prompt at `01 development/terminal-prompts/T1-round5-end-customer.md` (T1-round4-demo-button.md has been archived to `old prompts/`). All previous T1 work (R1/R2/R3/R4) shipped cleanly. R5 is your next round. Ed is re-pasting the prompt now to restart your /loop. While you were silent, T2 has shipped 4 more plugins (memberships, affiliates, agency-finance, agency-marketing) — see chapters #30-#33 in MASTER. Your R5 doesn't need to integrate them; it's purely the end-customer auth surface + variant flow + demo POV. Cross-plugin foundation wire-up will be a separate R6. Welcome back.

[2026-05-05T11:00:00Z] TASK: Round 7 prompt at `01 development/terminal-prompts/T1-round7-postgres-backend.md`. R6 step 1 shipped at `e297f5d` (foundation mass plugin wire-up + cross-plugin event router). R7 swaps the file backend → Postgres for production — architecture §13 parked this as a v1-required item; with the plugin catalogue feature-complete, this is the single biggest production-readiness gap. Five goals: (A) Postgres driver behind existing storage abstraction (single `portal_kv` JSONB table), (B) one-shot migration script `file → postgres`, (C) connection pooling + sync-snapshot-write-flush pattern, (D) RLS-or-deferred per-tenant scoping defense, (E) smoke against both backends + chapter `04-foundation-round7-postgres.md`. Default `DATABASE_URL` unset → file backend (so `npm run dev` keeps working without Postgres). If your /loop is still firing, pick this up next cycle.

[2026-05-05T12:40:00Z] REPLY (ref T1 12:35Z Q-ASSUMED on blob-row vs per-key Postgres layout): Approved for v1. Single-blob row keeps every consumer's sync `getState()` pattern intact and ships fast. Trade-off acknowledged: doesn't scale past ~few-MB state, no concurrent-write safety beyond last-write-wins. Document both clearly in the chapter as v1 limits + flag per-key row layout as the v2 hardening item (alongside RLS). Schema: keep the per-key shape `key TEXT PRIMARY KEY, value JSONB, updated_at TIMESTAMPTZ` you described — even if v1 only writes the single `__portal_state__` key, the table is ready for v2 expansion without migration. Continue.

[2026-05-05T12:40:00Z] PLAN — heads up on architecture pivot: while you were on R6, Ed locked in a major architectural extension (chapter 19b: `04-architecture-extension-per-client-portals.md`). Headline: milesymedia.com is the front door, Aqua portal lives inside it at `/portal`, and at Live phase each client gets `clients/<slug>/` materialized as their OWN Next.js app via "Export to repo". R7 (Postgres) + your R8 (`T1-round8-milesymedia-portal-stitch.md` queued) are both on the path to making this real. R7 doesn't need to anticipate per-client storage yet — that's R8/R9 territory. Just ship the shared portal's Postgres swap clean.

[2026-05-05T13:30:00Z] TASK: Round 8 prompt at `01 development/terminal-prompts/T1-round8-milesymedia-portal-stitch.md`. R7 closed (DONE entry + WARN logged on parallel-session commit bundling — same shared-`.git/index` mesh pattern that's hit several rounds; Postgres backend now behind the existing storage abstraction). R8 stitches milesymedia + Aqua portal as ONE surface — localhost via Next.js rewrites, Vercel via single project. Files stay separate in repo (Ed's "puzzle piece" requirement); end-user sees one site. Three goals: (A) local dev rewrites or proxy script, (B) production Vercel `vercel.json` updates, (C) chapter notes appended to R4 demo + R5 customer flow chapters. Coordinate with **T6** — they're shipping Vercel monorepo project config in their R1 Phase A (commit `359b476`); your R8 should mesh with their Vercel config rather than diverge. Read T6's chapter when it lands. If your /loop is firing, pick this up next cycle.

[2026-05-05T15:05:00Z] REPLY (ref T1 15:00Z Q-ASSUMED on Next.js rewrites vs dev-proxy): Approved. Rewrites are simpler, single port, no extra script — exactly the right call. T6's R1 Phase A Vercel monorepo config (commits `359b476` + `b3d7944` chapter) is the production-side equivalent; read their chapter `04-deployment-domains-observability.md` (MASTER row when added) before finalizing root `vercel.json` so the dev-side rewrites match the prod-side path matrix. Continue.

[2026-05-05T15:50:00Z] TASK: Round 9 prompt at `01 development/terminal-prompts/T1-round9-oauth-providers.md`. R8 closed @ `7074f49` — milesymedia ↔ portal stitch shipped. R9 widens the auth front door: Google OAuth (agency + clients) + magic-link sign-in (end-customers via T2 R10's email-sender). Three goals: (A) `/api/auth/oauth/google/{start,callback}`, (B) `/api/auth/magic/{request,verify}` HMAC-signed single-use tokens, (C) LoginForm + EmbedLogin updates. Provider env unset → button hidden (graceful degradation). Coordinate with T6 R2's domains plugin if any `redirect_uri` patterns conflict.

[2026-05-06T22:45:00Z] TASK: Round 10 prompt at `01 development/terminal-prompts/T1-round10-encryption-and-rls.md`. R9 closed @ `ef8b494` (Google OAuth + magic-link — clean solo commit). R10 closes two long-parked production-readiness gaps: per-install secret encryption (Stripe + Anthropic + OpenAI keys at rest) + Postgres row-level scoping defense (per-tenant rows + RLS policy). R9 prompt archived.

[2026-05-06T23:15:00Z] TASK: Fresh slate per Ed's directive — all prior active prompts archived. New prompt at `01 development/terminal-prompts/T1-agency-shell.md`. Agency Shell — Ed's home (clients grid, add-client modal, per-client overview tabs, '+ Add capability' picker). Stop building new plugins — stitch the agency UX out of what's shipped.

**HARD BOUNDARY** (in every prompt): do NOT touch `04-the-final-portal/milesymedia website/` or `04-the-final-portal/business-os/` — Ed owns those (T4's territory). Q-BLOCKED if your work would cross the line.

[2026-05-06T23:50:00Z] NOTE: NEW reference chapter `01 development/context/prior research/04-aqua-internals-reference.md` (MASTER row #59). Read it before / mid-flight — it grounds T1's agency-shell work in Ed's REAL operating shape pulled from his Obsidian vault. Concrete fold-ins for you:

1. **Sidebar "Tools" section** — mirror Aqua HQ's 6 sections (chapter §2): Leads & Clients · Client Billing & Finance · Tasks & To-Do's · SOPs Docs & Templates · Social Media Planner · Passwords & Access. The plugin-map table shows which existing plugin each one maps to.

2. **Phase-preset picker** in "+ New client" modal — replace placeholder Discovery/Development/Onboarding/Live with Aqua's REAL phases (chapter §4): Epic Intro → Blueprint Setup → Diagnostics/Foundations → Brand Builder + Verification → Traffic → Mastery & Ascension. Plan tier (Foundational Flow / Expansion Plan / Mastery Plan) is a separate field.

3. **Add-client modal fields** (chapter §7) — therapist name + practice name, plan tier, starting Aqua phase (default 1), contact email, WhatsApp group invite link, lock-in deposit boolean, Stripe/invoice link. Most lives in `metadata: {}` — no schema change.

4. **Brand voice** — tagline "Where Healing Meets Revolution"; audience is therapists. Reflect in welcome copy on the home screen.

If you've already started — fold these in mid-flight where natural; don't restart the round. Q-ASSUMED + continue if anything's unclear.

[2026-05-07T00:10:00Z] TASK: Next prompt at `01 development/terminal-prompts/T1-aqua-reskin.md`. Agency Shell DONE @ `04f7186` + MASTER #61 — beautiful work, all goals A-E shipped. R+1 fold-in is the Aqua reskin you flagged: replace placeholder phases (Discovery/Dev/Onboarding/Live) with real Aqua phases (Epic Intro → Mastery), expand "+ New client" with therapist + practice + plan tier + WhatsApp + lock-in + Stripe fields, swap "Tools" sidebar for Aqua HQ's six canonical sections, add brand voice copy. All sourced from chapter #59 — read it first. Previous prompt archived.

[2026-05-07T00:35:00Z] ARCHITECTURE CHANGE — queue-based loop. Ed asked for a self-pacing queue so we don't bottleneck on his re-paste. New workflow:

1. Ed pastes `01 development/terminal-prompts/T1-router.md` into your terminal ONCE. That router is now your persistent /loop input.
2. On each wake, you list `01 development/terminal-prompts/queues/T1/*.md` lexically, treat the lowest-numbered file as your active round, follow its Scope, log DONE referencing the filename.
3. Commander archives the shipped file to `old prompts/`. Next wake you see the next-lowest file and start that round automatically — no Ed re-paste needed.
4. Empty queue → `WAKE-EMPTY` x3 → end loop. Ed re-pastes router when more work is staged.

Currently in your queue:
  - 001-aqua-reskin.md
  - 002-employee-hq.md

Read `01 development/terminal-prompts/queues/README.md` for the full discipline. Your previous active prompt has been moved into the queue at position 001 — pick up where you left off, and 002 is staged for when you finish.

[2026-05-07T00:42:00Z] REPLY: 001 round shipped + archived to `old prompts/`. Your queue now has only `002-*` active — next /loop fire reads it and starts Employee HQ + Role Builder. Beautiful work shipping the queue's first round under the new architecture.

[2026-05-07T11:10:00Z] NOTE — WEBSITE HANDS-OFF (Ed directive)
Ed is now driving T4 manually on the Milesy website. **Do NOT touch any file under `04-the-final-portal/milesymedia website/`** for the foreseeable future, regardless of what your queue prompts may suggest. This reinforces your existing HARD BOUNDARY but is now an active-conflict zone.

If a queue prompt requires editing milesymedia website/ files, log Q-BLOCKED instead of Q-ASSUMED — commander will rewrite the prompt or defer the round. No "I'll just touch one file" exceptions.

Your territory is unchanged otherwise:
- T1 → portal/ (foundation/agency-shell)
- T2 → plugins/ (agency + customer plugins)
- T3 → plugins/website-editor/ (block engine + editor)

Carry on.

[2026-05-07T11:50:00Z] HOLD — STOP CHAINING (Ed directive)
Ed is starting a major restructure with T4: moving the Next.js project root into `04-the-final-portal/milesymedia website/` so portal + marketing + HC + BOS + Incubator all live on one host. While T4 works, **do NOT start any new round** — `portal/` is about to be `git mv`'d wholesale and any in-flight work there will conflict.

What to do on next wake:
- If you currently have a DONE pending archive: log WAKE-PENDING-ARCHIVE and sleep 1800s.
- If you'd otherwise chain into a new round: log `[ISO] HOLD-ACK: paused for unification` and sleep 1800s. Do NOT START a new queue file.
- Repeat until commander posts `RESUME` in this inbox.

Especially T1: this affects you most — R022 multi-tenant-isolation lives in portal/ and would collide. T2 + T3 are plugins/-only and technically safer, but plugin imports may briefly break during T4's tsconfig path update — same hold applies.

Commander will post RESUME when the move is verified green on :3030 and Ed lifts the freeze.
