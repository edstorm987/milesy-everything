# Tasks — Ship Plan v1 sprint backlog

Reset 2026-05-07T19:15Z. Rolling sprint backlog (not a chronicle).
Each sprint shows In progress / To do / Done-this-sprint / Blocked.
Shipped rounds drop off once the sprint closes. Historical full log
preserved at `old files/tasks-pre-ship-plan-2026-05-07.md`.

Plan reference: chapter **#124** `04-ship-plan-v1.md`.
Workflow: chapter **#158** `04-subagent-delegation-pattern.md` —
managers delegate to subagents per round.
Workstream legend: WS-A auth · WS-B public funnel · WS-C multi-agency
· WS-D real-data · WS-E hardening · WS-F first real client.

---

## Sprint 1 ✅ closed

WS-A complete · WS-C R1 complete · 9/9 autonomous ship-gate criteria
green by end-of-Sprint-1+2 combined.

Done in Sprint 1: T1 R022 role-redirect (#125) · T1 R023 lead role
(#127) · T1 R024 founder password rotation (#129) · T1 R025
agencyIds[] (#131) · T2 R018 onboarding-checklist (#126) · T2 R019
client-reports (#127) · T2 R020 feedback-loops (#131) · T3 R037
structured-data · T3 R038 image-srcset · T3 R039 block-schema-
migration (#130) · T3 R040 editor-live-preview (#132) · T4 R001
niche-pages mega-menu (#136) · T4 R002 Resource sub-pages real (#139).

## Sprint 2 ✅ closed

WS-B/C/D/E complete on the autonomous-terminal side.

Done: T1 R026 Topbar agency switcher + AquaOasis Demo seed (#133) ·
T1 R027 Postgres backend (#134) · T1 R028 durable nonces (#138) ·
T1 R029 env secrets policy (#142) · T1 R030 observability (#144) ·
T1 R031 BOS middleware integration (#147) · T1 R032 public-funnel
+ BOS port adapters (#150) · T1 R033 ActivityCategory batch (#153) ·
T2 R016 integrations plugin (#118) · T2 R017 support-desk (#119) ·
T2 R021 public-funnel (#132) · T2 R022 BOS auth gate (#137) ·
T2 R023 rank-my-website (#141) · T2 R024 SMTP outbound (#144) ·
T2 R025 Stripe events (#145) · T2 R026 GA4 read-only (#149) ·
T3 R041 slug redirects (#135) · T3 R042 page templates · T3 R043
webhook block · T3 R044 sitemap host routes · T3 R045 jsonld
injection · T3 R046 static export sitemap bundle (#152) · T3 R047
form submission host route (#154) · T4 R003 app/page.tsx orphan
(#140) · T4 R004 AquaOasis Demo content (#143) · T4 R005 final copy
pass (#145) · T4 R006 marketing JSX rewrite (#147) · T4 R007 niche
pages JSX rewrite · T4 R008 HC React rewrite + tracking (#152).

## Sprint 2.5 — Ed's UX feedback batch (active)

Ed's 2026-05-07T17:00Z list. Most landed via subagents in cycle 173
(chapter #158 first parallel run).

### Done — Ed's UX batch

- [x] **Login page premium redesign** — two-pane brand panel, refined
      inputs/buttons/card. Commit `821437c`.
- [x] **Drop "Create your agency" from login form** — duplicate
      removed; footer "Get started →" preserved. Commit `cc2770b`.
- [x] **Dev-bypass slow** — memoized `seedDemoAgency` per-process.
      ~10× faster repeat clicks. Commit `cc2770b`.
- [x] **Dev-bypass cards horizontal** — 2-col grid ≥640px. Commit `cc2770b`.
- [x] **Settings pinned to bottom of sidebar** — `mt-auto` on its
      section. Commit `c7afe35`.
- [x] **HC double-scrollbar** — outer page hard-capped to viewport-
      minus-chrome. Commit `c7afe35`.
- [x] **Sidebar "Clients" → "Pipelines"** label. Commit `c7afe35`.
- [x] **Profile menu (edit / preferences / permissions / sign out)**
      with `/portal/account/*` stubs. Commit `cc2770b`.
- [x] **404 pages** for portal + website (`not-found.tsx` × 2).
      Commit `c7afe35`.
- [x] **`demo portals/` folder scaffold** + README (4 personas).
      Commit `c7afe35`.
- [x] **T1 R034 pipelines refactor** — Pipeline + PipelineCard +
      3-default seed + migration runner + 19/19 smoke. Commit
      `67ba820`. Chapter #156.
- [x] **T1 R035 sidebar collapse toggle** — chevron + localStorage
      persist + sync hydration script + 10/10. Commit `3a50b1b`.
      Chapter #153.
- [x] **T1 R036 profile picture upload** — 256×256 client resize,
      JPEG q=0.85, 50KB cap, fallback initials, 21/21. Commit
      `e834bb7`. Chapter #155.
- [x] **T2 R027 leads-pipeline plugin** — CSV import + Lead/Contact
      domains + Campaign send pipeline + audience filters +
      public-funnel subscriber + 25/25. Commit `1e26005`. Chapter
      #157.
- [x] **Workflow upgrade — chapter #158 manager-with-subagent
      pattern** — all 4 routers refactored + dev folder docs
      updated. Commit `25d7c91`.

### To do — Ed's UX batch (queued)

- [x] **T1 R037 — leads-pipeline foundation glue** (closes T2 R027's
      5 hooks: ActivityCategory "leads" extension · plugin runtime
      registration · EmailEnqueuePort + PipelinePort adapters ·
      event-bus subscription wiring incl `pipelines.card.moved`
      emit). DONE — chapter #159, smoke 17/17 pass, npx tsc --noEmit
      clean. Q-ASSUMED: email-sender plugin not yet in `_registry.ts`
      (foundation-pending — leadsPipelinePorts.emailEnqueuePort throws
      a clear "foundation pending" error until that round lands);
      manifest `id: "@aqua/plugin-leads-pipeline"` is rejected by the
      registry validator regex (T2 plugin-side fix — foundation-pending).
- [x] **T1 R038 — forgotten-password flow** (NEW `lib/server/passwordReset.ts`
      mirroring emailVerification.ts · `NonceKind += "password-reset"` ·
      `/api/auth/password/{request-reset,reset}` routes (5/min IP rate-limit,
      no-leak generic success, sessionRev bump on completion) ·
      `/login/forgot` + `/login/reset` SiteShell-wrapped pages + client form
      components · "Forgot password?" link in LoginForm via `mm-form-toggle`).
      DONE — chapter #160, smoke 12/12 pass via `npm run smoke:password-reset`,
      `npx tsc --noEmit` clean. Q-ASSUMED: email-sender foundation-registration
      still pending so request-reset falls through to dev-console URL log when
      port throws (same caveat as #159); reuses `emailEnqueuePort` over a new
      password-reset-only port to avoid duplicating the foundation-pending
      dance; session invalidation drops EVERY device on reset (leaked-password
      threat model); activity logged at completion layer only (request-reset
      is anonymous-by-design — logging there would be the email-existence
      oracle); chapter numbers in the round prompt did not match the actual
      MASTER index (prompt cited #117/#129/#138/#144 — only #138 lined up; the
      relevant chapters were #117 signup-flow / #129 founder-rotation /
      #138 durable-nonce / #144 observability — NOT SMTP — chapter #144 was
      misremembered, treated `emailEnqueuePort` from #159 as the canonical
      enqueue handle).
- [x] HC + lead-magnet → portal tracking integration verification.
      T4 R008 wired the React rewrite + completion endpoint; verify
      lead really appears in leads pipeline post-R037 foundation glue.
      **Done — chapter #161**. NEW `scripts/smoke-hc-leads-pipeline-integration.test.ts`
      12/12 hybrid source-marker + runtime smoke drives FunnelService
      directly with real ports + eventBus + leadsPipelineFoundation
      subscriber. tsc clean. **4 gaps catalogued honestly**: (1)
      public-funnel NOT in `_registry.ts` — no workspace dep, no
      `registerFunnelFoundation` call → `/api/portal/public-funnel/hc-complete`
      404s in prod today (T1 R032 shipped adapters but never closed
      registry-side wiring); (2) leads-pipeline manifest id mismatch
      breaks `installPlugin` lookup so subscriber short-circuits in
      prod; (3) email-sender foundation registration pending; (4)
      funnelMePort honest skeleton (hcSlot undefined). Manual
      operator checklist (10 steps) in chapter walks Ed through the
      end-to-end happy path once gap 1 + 2 close.

### Done — T1 email-sender foundation registration (chapter #162, 2026-05-07)

- [x] **T1 — email-sender foundation registration (closes ch#161 Gap #3).**
      `@aqua/plugin-email-sender` (chapter #144) was shipped by T2 R024
      but never wired into `src/plugins/_registry.ts`, so the
      `emailEnqueuePort` in `leadsPipelinePorts.ts` (chapter #159) and
      the forgotten-password route (chapter #160) both threw
      `[leads-pipeline.emailEnqueuePort] email-sender foundation not
      registered (foundation-pending)`. **Done — chapter #162**:
      package.json workspace dep + smoke script · `next.config.ts`
      transpilePackages · NEW
      `src/plugins/foundation-adapters/emailSenderFoundation.ts`
      mirroring publicFunnel + leadsPipeline shape · `_registry.ts`
      manifest import + PLUGINS append + side-effect import BEFORE
      `leadsPipelineFoundation` so the order-dependent
      `isFoundationRegistered()` guard passes. Smoke 8/8 via
      `npm run smoke:email-sender-foundation` — 6 source-markers + 2
      runtime (isFoundationRegistered true; emailEnqueuePort no longer
      throws foundation-pending, reaches the "not installed for agency"
      guard). `npx tsc --noEmit` clean. **Q-ASSUMED**: drivers default-
      registry (Postmark + no-op + sendgrid/resend/smtp stubs)
      sufficient — real provider creds are operator action via the
      plugin's per-agency Settings page; marketingTemplates wiring with
      agency-marketing deferred (templateless enqueues — password-reset
      + leads-pipeline campaigns today — work without it).

### Done — T4 R009 (chapter #159, 2026-05-07)

- [x] **T4 R009 — Incubator-inside-BOS wire-in.** Incubator is now
      the BOS setup flow per Ed: *"the incubator lives inside
      business its like to get you setup for it effectively."*
      Canonical `/business-os/incubator` (rewrite to existing
      `public/incubator/`); `/incubator` redirects. Setup-gate in
      `app.html` bounces pre-graduation users to the incubator;
      `bos.incubatorComplete` flips on Brand Builder graduate CTA;
      sidebar Setup section + 5-phase checklist + complete pill.

### Done — T1 Google OAuth activation (chapter #150, 2026-05-07)

- [x] **T1 — Google OAuth audit + gap-fill.** Verified end-to-end
      flow already working since R9 (chapter #109): start route
      302s with all required params + HMAC state, callback verifies
      state + `email_verified`, first-run bootstrap + existing-email
      branch + unknown-email reject, LoginForm gates button on
      `isGoogleOAuthConfigured()`, session cookie HttpOnly+Secure+Lax.
      **Gaps filled**: (G1) callback routes through
      `resolvePostLoginPath` when state's returnUrl is the generic
      `/portal` — leads now land on `/business-os` (#125). (G2) 3
      typed accessors `googleOauth*` in `secrets.ts` (#142). (G3)
      ENV_ALLOWLIST + `PORTAL_KEY_PATTERN` extended with
      `GOOGLE_OAUTH_*`. (G4) `.env.example` documents all 3 vars +
      Google Cloud Console setup steps. (G5) `runbooks/deploy.md`
      env table extended w/ 3 optional rows + "Login still works
      without" caveat. NEW smoke `scripts/smoke-google-oauth.test.ts`
      12/12; pairs w/ existing helper-level smoke (10/10) → 22
      cases full stack. `tsc --noEmit` clean.

### Done — small fixes batch (2026-05-07T22:45→23:05Z)

- [x] **Sign in as employee persona on `/dev/pov`.** Commit `2b77312`.
      `DEMO_STAFF_*` constants in `demoSeed.ts` + idempotent
      `agency-staff` createUser in seed flow + 5th persona card on
      `/dev/pov`.
- [x] **Chapter #161 Gap #1 — public-funnel registry registration.**
      Commit `2b77312`. NEW `publicFunnelFoundation.ts` side-effect
      import + workspace dep + transpilePackages.
      `/api/portal/public-funnel/hc-complete` now reachable in prod.
- [x] **Chapter #161 Gap #4 — `funnelMePort.hcSlot` hydration.**
      Commit `35132a0`. `getMeContextByUserId` walks every agency's
      public-funnel install + invokes `funnel.meContext(userId)` to
      hydrate hcSlot + capturedAt. Falls through to skeleton on any
      failure — BOS `/me` always renders.

### Open Sprint-2.5 items

- [ ] Performance pass beyond dev-bypass memoize — biggest lever
      remaining is `PORTAL_BACKEND=postgres` (T1 R027 wired) on a
      real Postgres URL. Operator action.

## Sprint 3 (planned — Felicia + production)

- T1: WS-E follow-ups (whatever falls out of foundation pass).
- T2: WS-D upgrades — full Postmark integration, Stripe webhook
  consumers, GA4 OAuth.
- T5 (reactivate): WS-F R001-R003 — Felicia portal scaffold +
  content + end-customer flow.
- T6 (reactivate): full deploy runbook rewrite + CI pipeline +
  Vercel config + domain attach + prod-readiness smoke.
- T4: AquaOasis Demo content polish.
- Commander: stage; coordinate; archive.

End of Sprint 3 = ship gate — see chapter #124.

---

## Cross-sprint reminders

- **Founder password ≠ `"123"`** before any production flip
  (chapter #122 + chapter #124 ship gate). T1 R024 enforced via
  env-only seed + prod fail-closed guard.
- **Deploy runbook** at `runbooks/deploy.md` is **STALE post-
  unification** — env table refreshed (T1 R024) but §3-§5 still
  reference the deleted `portal/` folder + `_milesy/` copy step.
  Full rewrite in T6 R001 when reactivated.
- **Founder seed env vars** — `FOUNDER_EMAIL` (real address, not
  default) + `FOUNDER_PASSWORD` (≥12 chars) + `FOUNDER_AGENCY_NAME`
  (defaults "Milesy Media"). All other prod env in chapter #142
  `04-env-secrets-policy.md`.
- **Mesh hazard** — parallel terminals' subagents share `.git/index`.
  When a subagent's commit lands as part of a commander commit, the
  work still ships — verify on `origin/main`, log WARN, treat as DONE.
- **Manager-with-subagent pattern** (chapter #158) — managers
  delegate; outboxes stay short; commander reads them in seconds.
