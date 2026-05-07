# Rundown — where we are, what's left

Snapshot 2026-05-07 ~16:35Z. Refresh as the picture changes; this file
is meant to be skimmed in 30 seconds when Ed wants to know "where
are we right now."

For the canonical plan see chapter **#124 `04-ship-plan-v1.md`**. This
file is the at-a-glance status; that's the source of truth for the
plan itself.

---

## Phase

**Sprint 2 — closing.** Sprint 1 (WS-A auth + WS-C R1 multi-agency
core) was complete by ~14:45Z. Sprint 2 has so far closed WS-B, WS-C
R2, WS-E, T4 polish lane, and most of WS-D. Sprint 3 (WS-D final
GA4 + WS-F Felicia + ship-gate dry-run) is the only thing standing
between us and ship.

## Active terminals (4 — Ed's directive)

| Terminal | Lane | What's in flight | Queue depth |
|----------|------|------------------|-------------|
| **T1** | Foundation (auth · plugin runtime · scope · DB) | R032 next (public-funnel + BOS port adapters — closes T2 R021/R022 deps) | 2 ahead |
| **T2** | Plugins | R026 GA4 (final WS-D round) | 1 ahead |
| **T3** | Website-editor | R045 jsonld-injection mid-flight | 3 ahead (R045 + R046 + R047) |
| **T4** | Marketing/website polish + JSX rewrites | R007 niche-pages JSX rewrite next | 1 ahead |

T5/T6/T7 are **parked** per directive — queues preserved at
`queues/T{5,6,7}/`, routers archived to `old prompts/`. Ed will say
when to bring them back.

## Ship gate (chapter #124) — current score

**8 of 9 hard exit criteria green.**

| # | Criterion | Status |
|---|-----------|--------|
| 1 | WS-A complete (role redirect + lead role + founder pw rotation) | ✅ |
| 2 | WS-B complete (HC→lead funnel + BOS gate + rank-my-website tool) | ✅ |
| 3 | WS-C complete (multi-agency users + Topbar agency switcher) | ✅ |
| 4 | WS-D R024 (SMTP) live with real provider | ✅ (driver shipped; Postmark dep injection at boot is operator step) |
| 5 | WS-D R025 (Stripe basic) shipped | ✅ |
| 6 | WS-D R026 (GA4 read-only) | 🟡 in flight (T2 mid-R026) |
| 7 | WS-E complete (Postgres + nonces + secrets + observability) | ✅ |
| 8 | WS-F (Felicia portal viewable + end-customer flow) | 🔴 not started — needs T5 reactivation |
| 9 | Founder password ≠ "123" + deploy runbook current + smoke 200 across surfaces + Ed dry-run | 🟡 founder-pw ✅ · runbook env-table ✅ · full runbook rewrite pending T6 · operator dry-run pending |

## What landed today (rough)

- **T1 (foundation, Sprint 1+2)**: R022 role-aware redirect · R023
  lead role · R024 founder password rotation · R025 multi-agency
  users (`agencyIds[]`) · R026 Topbar agency switcher + AquaOasis
  Demo seed · R027 Postgres backend · R028 durable HMAC nonces ·
  R029 env-secrets policy · R030 observability (requestLog +
  /healthz/full + error.tsx) · R031 BOS middleware integration.
  **Chapters 125, 127, 129, 131, 133, 134, 138, 142, 144, 147.**
- **T2 (plugins, Sprint 1+2)**: R018 onboarding-checklist · R019
  client-reports · R020 feedback-loops · R021 public-funnel · R022
  BOS auth gate · R023 rank-my-website · R024 SMTP outbound · R025
  Stripe events. **Chapters 126, 127, 131, 132, 137, 141, 144, 145.**
- **T3 (website-editor, Sprint 1+2)**: R037 JSON-LD generators · R038
  responsive image attrs · R039 block schema migration · R040 editor
  live-preview · R041 slug redirects · R042 page templates · R043
  webhook-block · R044 sitemap+robots host routes. **Chapters 130,
  132, 135, +.**
- **T4 (polish + JSX, Sprint 2)**: R001 niche-pages mega-menu mirror
  · R002 Resource sub-page real impls (3 tools live) · R003
  app/page.tsx orphan deleted · R004 AquaOasis Demo content pack
  (3 brand kits + 3 demo clients + 15 contacts + 30 bookings + 9
  leads + 4 campaigns) · R005 final marketing copy pass · R006
  marketing JSX rewrite. **Chapters 136, 139, 140, 143, 145, 147.**

That's roughly **30 rounds** shipped today on top of the existing
~120 round backlog from prior sessions.

## What's left to ship v1

Critical path (must close ship gate):

1. **T2 R026 GA4 read-only** — last WS-D round. T2 mid-flight; lands
   next cycle.
2. **WS-F — Felicia portal end-to-end**. Requires reactivating T5
   (parked) OR splitting the 3 rounds (T5/001 portal scaffold ·
   T5/002 content · T5/003 end-customer flow) onto T1+T2/T4 if Ed
   wants it stays-with-4. Recommend reactivating T5 just for these
   3 rounds + then re-park.
3. **Deploy runbook full rewrite** — flagged STALE; env table is
   current (T1 R024 patched it) but the §3-§5 process refs the
   deleted `portal/` folder. Write a short T1 round to handle, OR
   reactivate T6 just for that one round.
4. **Operator dry-run** — Ed runs through the founder onboarding +
   first-client onboarding manually on a Vercel preview deploy.

Nice-to-haves (post-ship-blocker):

- **T1 R032 public-funnel port adapters** (closes T2 R021/R022 deps).
- **T1 R033 ActivityCategory enum batch** (cosmetic — chip styling
  for new categories).
- **T3 R045/R046/R047** — jsonld injection wired into page head /
  static-export sitemap bundle / form-submission host route. All
  polish over already-live helpers.
- **T4 R007 niche-pages JSX** — drops the mega-menu sync gotcha to
  zero files.

Post-ship work (Phase 12 + beyond):

- **Multi-agency satellites** — T7 queue preserved (5 rounds:
  domain-aware marketing · per-agency lead-magnet packs · agency
  spawner · therapist niche pack · 3 more niches).
- **Production hardening upgrades** — T6 queue preserved (5 rounds:
  deploy runbook rewrite · CI pipeline · vercel config + crons ·
  domain attach · prod-readiness smoke).
- **Real Stripe money flow / Stripe Connect / tax** — post-ship.
- **iframe→React rewrites** of HC + Incubator — post-ship.
- **Resources tools beyond rank-my-website** — post-ship.

## Where Ed comes in (sooner than you think)

To actually ship v1, Ed needs to:

1. **Decide T5 reactivation strategy** — bring T5 router back for the
   3 Felicia rounds, or fold them into T1/T2/T4 lanes? Recommend
   bringing T5 back (queue is concrete, scope clear). Same for T6 if
   the runbook rewrite is anything more than a single round.
2. **Set production env vars** — `FOUNDER_EMAIL`, `FOUNDER_PASSWORD`
   (≥12 chars, NOT `"123"`), `PORTAL_SESSION_SECRET`, `DATABASE_URL`,
   `NEXT_PUBLIC_PORTAL_BASE_URL=https://milesymedia.com`,
   `NEXT_PUBLIC_PORTAL_SECURITY=strict`. Optional: `SENTRY_DSN`,
   `VERCEL_TOKEN` for domain attach.
3. **`vercel link` to a Vercel project** — first deploy is interactive
   (T6 R001-R005 prep most of this when reactivated).
4. **Sign off on operator dry-run** — last ship-gate item.

## Health flags / things to watch

- **`git pull --rebase --autostash` "Cannot rebase onto multiple
  branches"** — recurring transient when terminals + commander commit
  in parallel. Self-heals on retry; no work lost. Worth real
  investigation if it ever causes a lost commit (none yet).
- **Mesh hazard** — terminals' source files frequently get absorbed
  into commander's commits before terminal commits its own. Origin
  always carries the work; terminals log WARN entries. Acceptable
  at current pace.
- **Cross-plugin debt** — T2 plugins flagged 11 R+1
  ActivityCategory extensions + several foundation port adapters
  that T1 R032/R033 will close. None blocking ship; cosmetic / shape
  cleanup.

## Timeline guess

At today's pace (~30 rounds shipped this session), the remaining
critical-path work is: 1 round (T2 R026) + 3 rounds (T5 Felicia) + 1
round (runbook rewrite) + Ed's operator dry-run. Net: **could be
ship-ready inside another 1-2 working days** if Ed greenlights T5
reactivation + does the env+vercel+dry-run lift. The original
3-week sprint estimate is now looking conservative.

---

Last updated: 2026-05-07T16:35Z (cycle 166).
Maintained by chief commander; refresh whenever the picture moves.
