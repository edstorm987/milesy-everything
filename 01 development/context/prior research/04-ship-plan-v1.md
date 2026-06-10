# Chapter 124 — Ship Plan v1 (2026-05-07)

The plan to take the unified Aqua platform from "feature-complete-ish"
to **shipped, usable, and serving a real first client**. Three focused
sprints, six workstreams, a hard ship gate.

Authored after chapters #121 (unified vision) and #123 (unification
follow-ups + multi-agency vision). Read those first if you're cold.

## What "shipped" means for v1

Concretely, all of these work end-to-end:

1. Ed signs in as founder at `milesymedia.com/login` (real password, not `"123"`).
2. Ed creates a new client (Felicia / Luv & Ker) → picks phase preset →
   plugins auto-install → brand kit applies.
3. Felicia signs in → lands on her custom-branded portal at her domain
   or via iframe on her own storefront → uses her installed plugins.
4. One of Felicia's customers signs in via embedded login → sees her
   storefront experience.
5. A visitor on milesymedia.com hits "Health Check" → completes →
   gets auto-signed-in as a `lead` → lands in Business OS.
6. Production deploy is live, hardened, observable, with real Postgres
   + SMTP + secrets management.

Anything outside this list is post-ship. Real Stripe money-flow,
custom-domain provisioning per client, Resources tools beyond
rank-my-website, full multi-agency satellite deploys, AI features —
all post-ship.

## Six workstreams

Each workstream has a primary terminal owner, concrete rounds, and exit
criteria. Workstreams run in parallel where dependencies allow.

### WS-A — Auth completion (T1, 3 rounds)

The auth surface is built but not wired to all audiences. Today every
successful login lands on `/portal/agency` regardless of role.

- **R022 — Role-aware post-login redirect.** `/login` → reads
  `effectiveRole(session)` → routes:
  - `agency-owner` / `agency-team` → `/portal/agency`
  - `client-owner` / `client-staff` → `/portal/clients/<their-slug>`
  - `end-customer` → `/portal/customer`
  - `lead` → `/business-os`
- **R023 — `lead` role added to PortalRole enum + permission grid.**
  Empty grid (read own user only). Update `effectiveRole` resolver.
- **R024 — Founder password rotation.** Move `FOUNDER_EMAIL` +
  `FOUNDER_PASSWORD` to env-only seed; remove the `"123"` hardcode;
  document in deploy runbook. Re-introduce `validatePassword` for the
  founder seed path.

Exit: a `lead` user can sign in and land on BOS. Founder password is
sourced from env. Each role redirects correctly.

### WS-B — Public funnel (T2, 3 rounds)

Today HC ends with a "share email for the report" capture and BOS is
open static. Need the funnel to actually capture leads + auth-gate BOS.

- **R021 — `@aqua/plugin-public-funnel`.** HC completion → server
  endpoint creates a `lead` user (idempotent on email) → auto-signin
  → redirect to `/business-os`. HC can also seed BOS with the user's
  HC slot data so their first-time experience is personalised.
- **R022 — `@aqua/plugin-bos-auth-gate`.** Wraps `/business-os/*`
  responses in an auth check. Unauthenticated → redirect to
  `/login?from=bos`. Reads user state from foundation storage instead
  of pure localStorage (still fall back to localStorage for richness).
- **R023 — `@aqua/plugin-resource-tools-base` + first tool.**
  Shared scoring/UX library for Resources tools. First instance:
  `rank-my-website` — public form, returns honest score (no fake
  numbers per chapter #68), captures email → lead user → BOS.

Exit: the funnel works end-to-end from milesymedia.com cold visit →
HC → BOS as a logged-in lead. rank-my-website tool live.

### WS-C — Multi-agency core (T1, 2 rounds)

Phase 12 R1 + R2 — Ed's master/satellite vision (chapter #123).

- **R025 — agencyIds[] migration.** `ServerUser.agencyIds: string[]`
  (replaces `agencyId`). All session-issuance + scope checks updated.
  Migration runner converts existing single-value rows. Default is
  `[primaryAgencyId]` so legacy paths keep working.
- **R026 — Topbar agency switcher.** Dropdown listing the user's
  agencies → click re-issues session cookie scoped to chosen agency.
  Reuses the `/dev/pov` cookie-issuance pattern from chapter #123.
  Seeds an "AquaOasis demo" agency on first boot so the switcher has
  something to show in the unified-host demo.

Exit: Ed-as-master can flip between "Milesy Media" and "AquaOasis demo"
from the Topbar. Both agencies share one DB but feel separate.

### WS-D — Real-data wiring v1 (T2, 3 rounds)

The minimum real connectors needed for the flow above to feel real,
not fake. Real money-flow / tax / payouts / inventory deferred to T6.

- **R024 — SMTP outbound.** Ed's existing `email-sender` plugin gets a
  real transport (Postmark or SES). Wire signup-verify, invites
  (T1 R024), support-desk replies. Per-install creds in
  `pluginInstalls[*].config` per existing pattern.
- **R025 — Stripe basic plumbing.** Just webhook ingestion + event
  log + subscription state mirror. NO charges, NO portal embed yet —
  just "we can see Stripe events for a tenant." Per-install creds.
- **R026 — GA4 read-only connector.** Founder dashboard's
  "touchpoints" tile reads real GA4 events instead of marketing
  leads.contactedAt. Per-install Service Account JSON.

Exit: signup verify emails actually send. Stripe events for a connected
tenant land in the activity-inbox. Founder dashboard touchpoint tile
shows real GA4 data when configured.

### WS-E — Production hardening (T1, 4 rounds)

The gap between "works on :3030" and "can serve real users on the
internet."

- **R027 — Postgres backend wired.** Default `PORTAL_BACKEND=postgres`
  when `DATABASE_URL` set. Migration runner. Smoke against a real
  Postgres URL.
- **R028 — Durable HMAC nonce store.** Magic-link, email-verify, and
  CSRF nonces today are in-memory single-process. Move to Postgres
  (or Redis if added). Multi-instance-safe.
- **R029 — Env secrets policy.** Secrets manager pattern (Vercel env
  by default + a runtime check that fails-closed if required env is
  missing). Founder password no longer hardcoded.
- **R030 — Basic observability.** Request log middleware + Sentry
  wiring (`SENTRY_DSN` already in deploy runbook). Health check
  endpoint reports DB connection + plugin registry status.

Exit: portal can multi-instance, secrets aren't in code, errors land
in Sentry, healthcheck reflects real state.

### WS-F — First real client (T5 reactivated, 3 rounds)

The proof that the whole system works for the use case it was built for.

- **R001 — Felicia portal scaffold.** `clients/luv-and-ker/` Next.js
  app skeleton consuming foundation API. Brand kit seeded (ochre +
  cream + heritage-script font). 4 plugin installs: website-editor,
  ecommerce, memberships, client-crm.
- **R002 — Felicia content.** Real product catalog (3 SKUs minimum),
  homepage hero + about + product grid, brand-page templates from
  her existing assets (ed-dropbox/luvandker/).
- **R003 — End-customer flow.** Felicia's customer signs up via
  storefront → embed-login on her domain → sees her account/orders.

Exit: `luvandker.com` (or staging URL) shows Felicia's real branded
storefront, an end-customer can sign in and see their account.

## Sprint sequencing

### Sprint 1 (~1 week, ~12 rounds)

| Track | Rounds |
|-------|--------|
| T1 | WS-A complete (R022 / R023 / R024) + WS-C R025 |
| T2 | WS-B R021 (HC→lead) + WS-B R022 (BOS gate) + existing queue (onboarding-checklist / client-reports / feedback-loops) |
| T3 | existing queue (structured-data / image-srcset) + R039 schema-migration-runner |
| T4 | manual: niche pages mega-menu mirror; app/page.tsx orphan; first 3 Resource sub-page real impls (per chapter #123 carry-forwards) |

End-of-sprint check: WS-A complete, WS-B half, WS-C R1 done. Ship-gate
4 of 9.

### Sprint 2 (~1 week, ~12 rounds)

| Track | Rounds |
|-------|--------|
| T1 | WS-C R026 (agency switcher) + WS-E R027 + R028 |
| T2 | WS-B R023 (rank-my-website) + WS-D R024 SMTP |
| T3 | R040 editor live-preview iframe + R041 published-only redirect helper |
| T4 | manual: AquaOasis demo brand pack; iframe→React rewrites for HC and Incubator if time |

End-of-sprint: WS-B/C complete; WS-D started; WS-E half. Ship-gate 7 of 9.

### Sprint 3 (~1 week, ~10 rounds)

| Track | Rounds |
|-------|--------|
| T1 | WS-E R029 + R030 |
| T2 | WS-D R025 Stripe + R026 GA4 |
| T5 | WS-F R001 + R002 + R003 |
| T6 | production deploy preview + DNS + smoke |
| T4 | final marketing copy pass + content QA |

End-of-sprint = **ship gate**.

## Ship gate (hard exit criteria)

Every line below must be green before flipping production DNS.

- [ ] WS-A complete: each role redirects correctly; lead role works.
- [ ] WS-B complete: HC→lead→BOS funnel works end-to-end.
- [ ] WS-C complete: agency switcher functional; AquaOasis demo present.
- [ ] WS-D R024 (SMTP) live with real provider.
- [ ] WS-E complete: Postgres backend, durable nonces, env secrets,
      Sentry capturing.
- [ ] WS-F R001-R003 done: Felicia portal viewable, end-customer
      flow tested.
- [ ] **Founder password is NOT `"123"`.** Verified manually.
- [ ] Deploy runbook reflects post-unification architecture (no
      stale `_milesy/` references, no separate `portal/` folder).
- [ ] Smoke 200 across all surfaces on the deploy preview:
      `/`, `/for-*`, `/health-check`, `/business-os`, `/incubator`,
      `/login`, `/signup` (+ all chooser routes), `/dev/pov`,
      `/portal/agency`, `/portal/clients/<slug>`, `/portal/customer`,
      `/embed/<slug>/<variant>`, `/api/auth/me`, `/healthz`.
- [ ] Operator dry-run: Ed performs the entire founder onboarding
      flow on the staging preview and signs off.

## Out of scope for ship (post-ship work)

These are real and matter, but block on shipping first:

- Phase 12 R3 — domain-aware marketing front (`aquaoasis-web.com`).
- Phase 12 R4-R5 — per-agency lead-magnet packs + spawner CLI.
- Real Stripe money flow + tax + payouts.
- Custom-domain provisioning per client (`@aqua/plugin-domains` is
  scaffolded; activation is T6 post-ship).
- AI page builder, AI content generation surfaces.
- Resources tools beyond rank-my-website.
- iframe→React rewrites of HC and Incubator (visual seam acceptable
  for v1).
- Real-time editor collaboration / CRDT.

## Risk register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Postgres migration breaks file-backed rows | Med | R027 ships a one-time importer + dual-read fallback. Smoke against staging DB before flipping. |
| Multi-agency `agencyIds[]` migration breaks existing single-agency rows | Med | R025 ships a default-to-`[primaryAgencyId]` reader so legacy data is auto-upgraded; migration is idempotent. |
| SMTP rate limits or domain reputation issues | Low | Pick Postmark (good rep) over raw SES. Use a subdomain (`mail.milesymedia.com`) so main domain isn't on the line. |
| First-client onboarding (Felicia) reveals a hole in the model | High | T5 reactivates early in Sprint 3 so unknowns surface before ship gate. If the hole is foundational, declare it a blocker; defer non-blocking holes to post-ship. |
| Production secrets leak (founder password, session secret) | Critical | R024 + R029 land in Sprint 1 + 2 respectively. Pre-deploy checklist verifies env not committed. |
| Plugin registry ordering causes route conflicts under load | Low | Existing tests cover this. Add a load smoke before ship. |

## What this plan supersedes

- The free-form "Phase 7+ — Feature plugins" approach in `phases.md`.
  Plugins are still the unit of feature, but the plan is now sprint-
  shaped, not "ship plugins forever."
- Any prior round backlog implying we'd build before unifying. Single
  host is now the assumed substrate; rounds operate within it.

## How sessions read this

- **Commander** (this session): track sprint progress against the
  workstream tables; archive shipped rounds; surface blockers to Ed.
- **Workers (T1-T3)**: queue files in
  `01 development/terminal-prompts/queues/T<N>/` carry the per-round
  scope. This chapter is the why; queue files are the how.
- **T4 (manual)**: polish backlog in `terminal-prompts/T4-manual.md`;
  no autonomous queue, Ed drives.
- **T5 / T6**: dormant until reactivated for Sprint 3.

## See also

- Chapter #19 — Architecture (load-bearing for everything below).
- Chapter #66 — Milesy ecosystem progress (T4 ecosystem snapshot).
- Chapter #121 — Unified vision (single-host model).
- Chapter #122 — Website-portal unification (the move).
- Chapter #123 — Unification follow-ups + multi-agency vision.

---

Authored 2026-05-07 by Claude (chief commander) under Ed's max-effort
directive. Edit freely as sprints unfold; the ship gate is the only
fixed point.
