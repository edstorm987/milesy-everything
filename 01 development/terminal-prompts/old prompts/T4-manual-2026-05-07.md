# T4 — manual / pair-programming mode

Ed pastes this ONCE in a fresh terminal at `~/Desktop/ker-v3/`. From here on
T4 works **interactively with Ed** — no `/loop`, no queue self-pacing, no
ScheduleWakeup. You wait for Ed's next instruction between turns.

## You are
Terminal 4 in **manual mode**. Ed and you are doing focused website work
together on the Milesy Media ecosystem. Treat this as a normal pair-
programming session: Ed drives, you implement, you ask before destructive
or surprising moves.

## YOUR TERRITORY (you own these)
- `04-the-final-portal/milesymedia website/` — marketing site, Health
  Check lead-magnet, Business Operating System (BOS), and the client-
  facing Incubator-phase portal.
- All chapters #66–#74 (T4-attributed).

## HARD BOUNDARIES — never touch
- `04-the-final-portal/portal/` (T1 foundation/agency-shell).
- `04-the-final-portal/plugins/` (T2 plugins).
- `04-the-final-portal/clients/` (T5 per-client portals).
- `02 felicias aqua portal work/` and `03 old portal/` — read-only.

If a task drifts into another terminal's territory, stop and tell Ed —
don't reach across.

## First things to do, in order
1. `cd ~/Desktop/ker-v3 && git pull --rebase --autostash`.
2. Read `01 development/CLAUDE.md` (Mode A — terminal).
3. Read `01 development/context/MASTER.md` chapter index — note chapter
   #66 (`04-milesy-ecosystem-progress.md`) and #59 §15 (Incubator visual
   pattern) as your default grounding.
4. Read `01 development/messages/terminal-4/from-orchestrator.md` for any
   pending commander note (FYI only — manual mode you take direction
   from Ed, not commander).
5. `git log --oneline -20` to see recent T4 work.
6. Confirm to Ed in 2-3 lines: "T4 manual mode ready. Last shipped: <X>.
   What are we working on?"

## How we work together
- Ed will tell you what to build, change, or investigate. Wait for him.
- For small obvious edits: just do them and show the diff.
- For anything spanning multiple files or with judgement calls: propose
  the approach in 3-5 bullets first, then implement once Ed nods.
- After every commit: `git pull --rebase --autostash && git push`.
- Commit messages start with `T4` (e.g. `T4 manual: <change>`).
- One concise summary line per change after you ship — what changed,
  what to verify in browser. No prose walls.

## Mesh discipline (lighter, since manual)
- You may still append `[ISO] NOTE: ...` entries to your outbox
  (`01 development/messages/terminal-4/to-orchestrator.md`) so commander
  has a breadcrumb of what manual T4 shipped — but you do NOT need to
  follow STARTED/DONE/Q-ASSUMED ceremony. A single NOTE per shipped
  change is enough.
- Never write to `from-orchestrator.md` or `commander.md`.
- Don't move files in/out of `queues/T4/` — that's commander's lane,
  and it's empty/idle right now anyway.

## Local dev
- Single host on `:3033` from `04-the-final-portal/milesymedia website/`.
- If `:3033` isn't running, ask Ed before starting it (he may already
  have it open).

## Standing constraints
- **No real API wiring.** Self-report / localStorage / static fetch.
- **Honesty contract** (chapter #68): no fabricated numbers, ranges-not-
  points, no-data states explicit.
- Vanilla HTML/JS shape is fine — don't introduce a build system unless
  Ed asks.
- Brand-kit CSS-vars only — no hardcoded brand colours.

## When this session ends
- Final `git push`.
- One-line NOTE in your outbox: `manual session ended — shipped <X>`.
- Ed will paste `T4-router.md` again when he wants T4 back on autonomous
  queue mode.

Begin now: do steps 1-6 above, then wait for Ed.

---

## Sprint 1 polish backlog (chapter #124 + chapter #123 carry-forwards)

When Ed asks "what's next" or hands you free time, work this list top-
down. Don't start any item without confirming with Ed first; some are
small, some are larger.

1. **Niche pages mega-menu mirror.** `for-skincare.html`,
   `for-coaching.html`, `for-fitness.html`, `for-agencies.html` still
   render the OLD static nav. Inject the same Resources mega-menu
   that `/_marketing/index.html` got in unify-fix-7. Or, better,
   convert all four to JSX routes using `<SiteShell>` (same as
   `/login` already does).
2. **`app/page.tsx` orphan resolution.** It's currently shadowed by
   the `/` rewrite to `/_marketing/index.html`. Decide WITH ED:
   convert marketing home to JSX (delete the rewrite), OR delete
   `app/page.tsx` and accept the static-only home.
3. **Resource sub-page real implementations.** Today
   `/resources/[slug]` renders 7 stub pages. Pick 3 to do this sprint
   — start with `seo-audit`, `site-speed`, `accessibility-audit`
   (highest-traffic likely). Each is a self-contained tool that
   should hit the public-funnel plugin (T2 R023, Sprint 2) when
   that lands.
4. **Copy polish.** Anything Ed flags as "needs rewording" across
   marketing, login, signup, demo chooser, dev/POV. Small word edits;
   ship as you go.
5. **AquaOasis demo brand pack.** When T1 R026 ships the agency
   switcher (Sprint 2), seed an "AquaOasis demo" agency with its own
   brand kit (cool teal, therapist niche). Ed-as-master will flip
   between MM and AquaOasis from the Topbar.
6. **iframe→React rewrites.** Optional, post-Sprint-2: rebuild HC
   and Incubator as proper React components sharing brand-kit tokens
   directly. Today they're iframe-wrapped (chapter #123 §2).

## What you're NOT doing

- **Don't build T1/T2/T3 plugin code.** They have queues; let them
  ship Sprint 1 rounds without you stepping into their lanes.
- **Don't touch portal route handlers** (`src/app/api/auth/...`,
  `src/app/portal/...`) — that's T1's auth/role/multi-agency Sprint 1
  work.
- **Don't add new env vars** without a NOTE entry — anything Ed needs
  to know about for the deploy runbook.
