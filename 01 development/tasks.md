# Tasks — Ship Plan v1 sprint backlog

Reset 2026-05-07. Historical log of every shipped round preserved at
`old files/tasks-pre-ship-plan-2026-05-07.md`. From here forward,
this file is a **rolling sprint backlog**, not a chronicle. Each
sprint shows In progress / To do / Blocked. Shipped rounds drop off
once the sprint closes.

Plan reference: chapter #124 `04-ship-plan-v1.md`. Workstream legend
(WS-A through WS-F) defined there.

---

## Sprint 1 (active — week of 2026-05-07)

Goal: WS-A complete, WS-B half, WS-C R1 done. Ship-gate 4/9 met.

### In progress

_(none — terminals on HOLD pending RESUME signal post-unification)_

### To do — T1 (foundation)

- [x] **R022 — Role-aware post-login redirect** (WS-A). NEW
      `lib/server/postLoginRedirect.ts` resolver wired into
      `/api/auth/login` (bootstrap + standard) + `/api/auth/signup` +
      `/api/auth/magic/verify` + `/dev/pov`. LoginForm chains
      `data.redirect` behind `returnUrl`. Smoke 11/11. Chapter #125.
- [x] **R023 — `lead` role added to Role enum + permission grid**
      (WS-A). `Role` union + ALL_ROLES + `isLeadRole`; `LEAD_AGENCY_ID`
      sentinel; `effectiveRole` lead → EMPTY; NEW `requireAgencyScope`
      helper; `createUser` tolerates lead w/ optional agencyId. Smoke
      9/9. Chapter #127.
- [x] **R024 — Founder password rotation** (WS-A). Env-driven creds
      (FOUNDER_EMAIL/PASSWORD/AGENCY_NAME); direct-mutate bypass dropped
      → seed via `createUser`; production fail-closed guard (≥12 chars +
      email-not-default); `.env.example` + runbook §2a updated. Smoke
      12/12. Chapter #129. `grep -r '"123"' src/` clean.
- [x] **R025 — `agencyIds[]` migration** (WS-C R1). Schema dual-write
      (`agencyIds[]` + legacy `agencyId` mirror); SessionPayload
      `activeAgencyId` + `agencyIds`; NEW `userSchemaMigration.ts`
      runner wired into `ensureHydrated`; createUser writes both
      shapes; NEW `assertTenantScope` + 3 active-agency helpers in
      auth.ts. Smoke 10/10. Chapter #131.

### To do — T2 (plugins)

- [x] **R018 — `@aqua/plugin-onboarding-checklist`** (existing queue). MASTER #126.
- [x] **R019 — `@aqua/plugin-client-reports`** (existing queue). MASTER #127.
- [ ] **R020 — `@aqua/plugin-feedback-loops`** (existing queue).
- [ ] **R021 — `@aqua/plugin-public-funnel`** (WS-B R021). HC
      completion → `lead` user → auto-signin → BOS.
- [ ] **R022 — `@aqua/plugin-bos-auth-gate`** (WS-B R022). Wraps
      `/business-os/*` with auth check; reads user state from
      foundation storage.

### To do — T3 (website-editor)

- [x] **R037 — Structured data (schema.org)** — DONE 2026-05-07.
      `lib/structuredData.ts` (buildJsonLd / validateJsonLd /
      serializeJsonLd) + 30/30 smoke + chapter #125.
- [x] **R038 — Image srcset + responsive helper** — DONE 2026-05-07.
      `lib/responsiveImage.ts` (buildImageAttrs / withCdnResize /
      auditImage) + 34/34 smoke + chapter #128.
- [x] **R039 — Block schema migration runner** — DONE 2026-05-07.
      `lib/blockSchemaMigrations.ts` (versioned migrate runner +
      seed v1→v2 / v2→v3 + loadBlockTreeMigrated) + 23/23 smoke +
      chapter #130.

### T4 manual (Ed driving)

- [ ] Niche pages mega-menu mirror — sweep `for-skincare/coaching/
      fitness/agencies` to match `/`'s Resources dropdown (chapter
      #123 carry-forward).
- [ ] `app/page.tsx` orphan resolution — decide JSX rewrite vs delete.
- [ ] Resource sub-page real implementations — replace 3 of 7 stubs
      this sprint (start with `seo-audit`, `site-speed`,
      `accessibility-audit`).
- [ ] Copy polish across marketing surfaces (Ed's flagged items).

### Blocked

_(none yet)_

### Done — Sprint 1

_(populated as rounds ship)_

---

## Sprint 2 (planned)

Goal: WS-B/C complete; WS-D started; WS-E half. Ship-gate 7/9.

- T1: WS-C R026 (Topbar agency switcher) + WS-E R027 (Postgres
  backend) + R028 (durable HMAC nonces).
- T2: WS-B R023 (rank-my-website plugin) + WS-D R024 SMTP outbound.
- T3: R040 editor live-preview iframe + R041 published-only redirect
  helper.
- T4: AquaOasis demo brand pack; iframe→React rewrites if time.

---

## Sprint 3 (planned)

Goal: ship gate met; production preview live.

- T1: WS-E R029 (env secrets) + R030 (observability + Sentry).
- T2: WS-D R025 Stripe + R026 GA4.
- T5: WS-F R001-R003 (Felicia portal end-to-end).
- T6: production deploy preview + DNS + smoke.
- T4: final marketing copy pass + content QA.

---

## Cross-sprint reminders

- **Founder password ≠ `"123"`** before any production flip
  (chapter #122 + chapter #124 ship gate).
- **Deploy runbook** at `runbooks/deploy.md` is **stale post-
  unification** — references the deleted `portal/` folder + `_milesy/`
  copy step. Refresh during WS-E (Sprint 2/3).
- **`messages/README.md`** is **stale** — still says T4 = "UX/
  accessibility polish". Update to reflect "Milesy ecosystem +
  manual unification driver" when convenient.
- T4's chapter-#123 gotchas (no spaces in project root, absolute asset
  paths in public/, Turbopack root one level up) apply to every
  worker terminal touching `milesymedia-website/`.
