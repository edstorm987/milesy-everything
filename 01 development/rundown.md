# Rundown — where we are, what's left

Snapshot 2026-05-07 ~17:30Z. Refresh as the picture changes; this
file is meant to be skimmed in 30 seconds when Ed wants to know
"where are we right now."

For the canonical plan see chapter **#124 `04-ship-plan-v1.md`**.
This file is the at-a-glance status; the chapter is source of truth
for the plan itself.

---

## Phase

**Sprint 2 closed; Sprint 2.5 (Ed's UX feedback batch) just kicked
off.** Sprint 1 ✅ · Sprint 2 ✅ (all autonomous-terminal scope shipped
— 9/9 ship-gate criteria green on the autonomous side). Sprint 3
(WS-F Felicia + ship dry-run) parked per Ed.

The current active work is **Ed's UX feedback batch from
2026-05-07T17:00Z** — premium login redesign · sidebar polish ·
profile menu · pipelines refactor · leads + CSV + email campaigns ·
HC React rewrite · 404 pages · public demo portals · perf pass.

## Active terminals (4 — Ed's directive)

| Terminal | Lane | What's queued |
|----------|------|---------------|
| **T1** | Foundation (auth · plugin runtime · scope · DB) | R034 pipelines refactor · R035 sidebar collapse toggle · R036 profile picture upload |
| **T2** | Plugins | R027 leads-pipeline (CSV import + email campaigns + contacts) |
| **T3** | Website-editor | (idle — Sprint 2 work shipped) |
| **T4** | Marketing/website polish | R008 HC React rewrite + portal tracking integration |

T5/T6/T7 routers parked at `old prompts/T{5,6,7}-router-parked-2026-05-07.md`
with their queues preserved at `queues/T{5,6,7}/`. Reactivate when Ed
greenlights.

## Ed's UX feedback batch (live)

Ed's 2026-05-07T17:00Z message captured these. Status:

| # | Item | Where it lives |
|---|------|----------------|
| 1 | "New here / Get started" link | Resolves `/login` → `/signup`. Verify on browser refresh. |
| 2 | Drop "Create your agency" inside login form | ✅ commander-side commit `cc2770b` |
| 3 | Login page premium redesign | ✅ commander-side commit `821437c` |
| 4 | Dev-bypass slow | ✅ memoized `seedDemoAgency` (`cc2770b`) |
| 5 | Dev-bypass cards horizontal | ✅ 2-col grid (`cc2770b`) |
| 6 | Tenant/agency switcher in portal | ✅ already shipped (T1 R026) — visible when ≥2 agencies |
| 7 | Profile menu (edit / preferences / permissions / sign out) | ✅ commander-side commit `cc2770b` |
| 8 | Profile circle picture (uploadable) | 🟡 **T1 R036 queued** |
| 9 | Sidebar shouldn't collapse on click; minimise/maximise toggle | 🟡 **T1 R035 queued** |
| 10 | "Clients" → "Pipelines" + multi-pipeline kanban | 🟡 **T1 R034 queued** (sidebar label patched commander-side) |
| 11 | CSV import → leads pipeline + email campaign automation | 🟡 **T2 R027 queued** (depends on T1 R034) |
| 12 | Settings at bottom of sidebar | ✅ commander-side polish |
| 13 | 404 pages for portal + website | ✅ commander-side `not-found.tsx` for both |
| 14 | "Sign in as employee" persona on /dev/pov | ✅ commander-side (DEMO_STAFF + persona option) |
| 15 | `demo portals/` folder (agency / employee / client / clients-client) | ✅ commander-side scaffold + README |
| 16 | HC two side-scrollers | ✅ commander-side outer-scroll cap (full React rewrite is **T4 R008 queued**) |
| 17 | HC + lead-magnet wired into portal tracking | 🟡 **T4 R008 queued** (HC completion → leads pipeline + activity) |
| 18 | App slow generally | ✅ dev-bypass quick-win shipped; full perf pass remains. Big lever = `PORTAL_BACKEND=postgres` (T1 R027 wired). |
| 19 | Clean up dev folder | ✅ this file refreshed; tasks.md aligned with the queued rounds |

## Pre-Ed-feedback ship gate

(Same as before — see chapter #124. 9/9 autonomous criteria green.
Operator items remain — Felicia / runbook / dry-run.)

## Where Ed comes in next

1. **Refresh `:3030/login`, `:3030/dev/pov`, `:3030/portal/agency`**
   to see the commander-side fixes land.
2. **Paste T1 + T2 + T4 routers** to fire off the queued rounds —
   they'll chain through the UX backlog at 270s cadence.
3. **Set production env vars** when ready to deploy preview
   (`FOUNDER_EMAIL`, `FOUNDER_PASSWORD` ≥12 chars not "123",
   `PORTAL_SESSION_SECRET`, `DATABASE_URL`,
   `NEXT_PUBLIC_PORTAL_BASE_URL`, `NEXT_PUBLIC_PORTAL_SECURITY=strict`).
4. **Decide T5 reactivation** for Felicia / WS-F whenever ready.

## Health flags

- Linter has clobbered commander edits twice (demo seed + dev/pov).
  Possible Ed-side editor auto-format; not blocking — re-applied.
- `git pull --rebase --autostash` "multiple branches" transient
  recurs occasionally. Self-heals. No work lost.

---

Last updated: 2026-05-07T17:30Z. Maintained by chief commander.
