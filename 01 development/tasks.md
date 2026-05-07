# Tasks

## In progress

Active prompts (R8 / R11 / R7 / R2 / R2 / R2 across the 6 terminals).
Prior rounds (T3 R6 + T4 R1 + T5 R1 + T6 R1) just hit DONE; their
prompts archived to `old prompts/`. T1 R8 + T2 R11 still in flight
from cycle 17.

_(T1 R8 done — see `Done — Round 8` below; commits 7074f49 + c2dc0f1)_
_(T2 R11 done — see `Done — Round 11` below.)_
- [x] **T1 009 — Per-client comms widget (WhatsApp + email)** — DONE.
      Goal A: NEW `_CommsRow.tsx` on per-client header (below name) —
      emerald WhatsApp pill / dashed placeholder; blue mailto pill /
      dashed placeholder; 🕘 last-contact relative time (amber >7d).
      Goal B: NEW `POST /api/tenants/client-comms` route — gated
      `requireRoleForClient(AGENCY_ROLES)`, persists
      `metadata.whatsappLink`/`clientEmail`/`lastContactedAt` via
      `updateClient`; inline Edit modal + Mark-contacted button on
      the row. Q-ASSUMED: empty-string/0 sentinels for cleared values
      since updateClient shallow-merges (can't true-delete keys).
      Goal C: agency home tile chip 💬 — never (muted) / fresh
      (emerald, ≤7d) / stale (amber, >7d). Goal D: smoke
      `§ Comms widget` (5 — comms-row testid + POST 200 + empty-body
      400 + saved WhatsApp re-renders + agency home chip visible).
      Chapter `04-comms-widget.md`; MASTER row #84; tsc clean. HARD
      BOUNDARY honoured.
- [x] **T1 008 — Per-client client-tasks kanban tab** — DONE.
      Goal A: NEW `_KanbanTabClient.tsx` client component on per-client
      Kanban tab. Boots via `/api/portal/kanban/boards?clientId=`,
      finds + auto-creates `templateId==="client-tasks"` scope:"client"
      board, fetches cards, groups by columnId, sorts by order.
      Replaces dashed-placeholder kanban tab card. Goal B: Backlog
      column hosts pinned quick-add form (`+ New task` input + Add)
      POSTing `/boards/cards`; native HTML5 drag/drop on cards POSTs
      `/boards/cards/move` to delegate. Goal C: "Waiting On Client"
      column gets amber palette + amber `{N} waiting on client` chip
      in the tab header when count >0 (auto-email deferred T2 R009
      per prompt). Q-ASSUMED: auto-create on first tab mount (not
      tied to advancePhase event yet — needs foundation event-bus
      hook); chip lives in tab header (foundation can't SSR-fetch
      plugin storage); native HTML5 drag (touch fallback R+1).
      Goal D: smoke `§ Client tasks kanban` (3 — kanban tab 200 +
      testid + boards?clientId 200). Chapter
      `04-client-tasks-kanban.md`; MASTER row #83; tsc clean. HARD
      BOUNDARY honoured.
- [x] **T1 007 — Effective-role resolver in chrome** — DONE.
      Goal A: NEW `lib/server/effectiveRole.ts` — `effectiveRole(session)`
      maps session.role enum → agency-hr DEFAULT_ROLES seed
      (agency-owner→Founder · agency-manager→Admin ·
      agency-staff→Designer · client-*/end-customer→[]);
      `hasAllPermissions` Founder bypass + empty-requires=no-gate.
      Goal B: `NavItem.requires?: string[]` added; `BuildSidebarInput`
      gains permissions+isFounder; `buildSidebar` filters by
      requires-intersection; agency + per-client layouts pass through.
      Goal C: NEW `<RequirePermission>` server component with inline
      403 panel; per-client Tools tab gated on `plugins.install`,
      Finance tab on `finance.view`. Other migrations (agency-finance
      / agency-hr roles / fulfillment phase-advance) one-line follow-on
      pending foundation page-mount adapter — documented in chapter.
      Q-ASSUMED: default-role mapping over customRoleId DB lookup
      (foundation has no plugin-storage resolver — R+1); relative-path
      import of agency-hr internals since node_modules snapshot
      pre-dates R7 exports. Goal D: smoke `§ Effective role` (3 checks
      — Founder POV sees Tools + Finance content w/o 403 panel).
      Chapter `04-effective-role-resolver.md`; MASTER row #82; tsc
      clean. HARD BOUNDARY honoured.
- [x] **T1 006 — Onboarding Dashboard** — DONE.
      Goal A: NEW `_OnboardingDashboardPanel.tsx` client component
      on per-client Overview tab (above 2-col grid) — six-chip
      horizontal phase strip (emerald=complete · brand-primary
      highlighted=active · muted=future) with `{done}/{total}` glyph;
      click chip → expanded deliverables pane. Goal B: NEW
      `lib/server/onboardingMilestones.ts` (`AQUA_PHASE_ORDER` +
      `AQUA_MILESTONES` seed for all six phases; `getMilestoneState`,
      `isPhaseComplete`, `tickMilestone`) + storage at
      `client.metadata.onboardingProgress: Partial<Record<ClientStage,
      [{id,done,doneAt?}]>>` (Q-ASSUMED: keyed by stable stage enum
      not per-agency PhaseDefinition.id UUID). NEW
      `POST /api/tenants/onboarding-tick` foundation route validates
      Aqua-stage + known milestoneId + persists via `updateClient`.
      Goal C: active phase chip carries `Mark phase complete →
      advance` button gated on `allComplete`; POSTs existing
      `/api/portal/fulfillment/phase/advance` with resolved
      from/toPhaseId. Goal D: smoke `§ Onboarding dashboard` (Aqua
      client shows panel testid + heading + tick 200 + unknown-mid
      400 + legacy client omits panel). Chapter
      `04-agency-shell-onboarding-dashboard.md`; MASTER row #81;
      tsc clean. HARD BOUNDARY honoured.
- [x] **T1 005 — Founder Todos home widget** — DONE.
      Goal A: NEW `_FounderTodosWidget.tsx` client component on
      `/portal/agency` home (above clients grid). Boots via
      `/api/portal/kanban/boards?role=founder`, finds
      `templateId==="founder-todos"`, auto-creates if absent, fetches
      cards filtered to Today + This Week columns, shows 5 most
      recent. Inline `+ Add quest to Today` POSTs to `/boards/cards`
      with Today columnId. Click → `/portal/agency/kanban/boards/<id>#card-<id>`.
      Returns null for non-Founder (zero-space). Goal B: mythos copy
      (`Today's Quests` · `No quests today. Forge one.` ·
      `+ Add quest to Today` · `Open board →`). Q-ASSUMED:
      founder=agency-owner; auto-create board on first founder mount
      (kanban server still enforces role/scope guards). Goal C: smoke
      `§ Founder todos widget` (home 200 founder POV + "Today's
      Quests" + testid + boards endpoint 200). Chapter
      `04-agency-shell-founder-todos.md`; MASTER row #80; tsc clean.
      HARD BOUNDARY honoured.
- [x] **T4 R015 — Lessons content gap (10 of 15 locked rows shipped)** — DONE.
      Closes 10 of 17 locked Pro lesson rows from chapter #71 (free
      tier 5→15). 10 lessons added to lessons.js (~50L each: hero +
      lead + outline + 5-section body + callout + practical prompt +
      NEW `phases:[…]` tag for R006 integration): private-hub /
      storage-drives / tech-stack / domain-email / gbp / offer-
      architecture / sales-sops / clarity-page / workflows / kpis.
      Honesty contract: every body opens with "📝 v1 draft. The
      60-minute version. Deeper Pro Mastery lives in the retainer
      cohort." Specific scope notes per lesson (e.g. gbp surface
      changes ~quarterly, kpis defers per-niche modelling to niche
      packs). database.html: 10 rows unlocked (lock pattern → live
      module.html?id=<id> + green Open CTA), intro rewritten naming
      the 7 remaining locked rows (4.3/4.5/5.1/5.3/5.4/5.5/5.6).
      Smoke: all 10 URLs 200; registry has 15 lesson records. R+1:
      swap R006's hardcoded PHASE_LESSON_REQUIREMENTS for derived
      view from `phases` field; ship remaining 7 in R016+. NEW
      chapter `04-lessons-content-gap.md` + MASTER #91.
- [x] **T4 R014 — Niche-specific landing pages** — DONE.
      4 NEW pages under `milesymedia website/`: for-skincare.html 🌿
      · for-coaching.html ✍️ · for-agencies.html 💼 · for-fitness.html
      💪 (~200L each). Each reuses R008 `.mm-*` shell — niche-tailored
      sticky bar + cover hero + 3-card "four levers" + 8-tool→Aqua
      replace strip (per-niche tool list) + founding placeholder w/
      dual CTA. Tiny `?niche=<key>` reader added to incubator.js +
      lead-magnet/index.html — validates against allowed list, writes
      `bos.brand.niche` via JSON merge — R004 IncubatorCopy auto-
      applies pack. Marketing site `index.html` gains nav `Industries
      ▾` hover-dropdown (4 links + keyboard a11y via :focus-within) +
      #industries 4-card anchor section + footer Industries link.
      CSS `.nav-dropdown*` (~22L). Stitching contract intact (no new
      top-level paths beyond 4 HTML files). Smoke: all 7 URLs 200;
      click-through skincare → HC?niche=skincare → Incubator skincare
      pack auto-applies verified. Stitch chapter R014 append + MASTER
      #90.
- [x] **T4 R013 — Activity & timeline view** — DONE.
      NEW `incubator app/lib/activity.js` (~95L) exposes `window.
      Activity.{log,list,byKind,recent,clear,KINDS,metaFor}` w/ 14-kind
      registry (HC/Incubator/lesson/marketplace/Pro/feedback…), record
      shape `{id,ts,kind,payload,business}`, cap 200, dispatches
      `activity:logged` CustomEvent, mirrors via `BOSStorage.set` when
      R012 loaded. **Wired 5 emit-points**: HC completion (idempotent
      guard) + HC→Incubator bridge (replaces R010 raw push) + welcome/
      dismiss (R010 helper delegates) + phase-advance (R006) + lesson
      mark-done/undone (module.html) + marketplace click (alongside
      R009 counter). NEW `business-os app/activity.html` (~115L) —
      full timeline w/ Kind+Range filter chips (prefix-match: kind=
      'hc' catches all hc.*), honest empty state, Clear-log w/
      confirm, auto-repaint on event. Incubator root gains widget
      showing last 5 (hidden when empty, auto-repaint). Admin
      Overview gains 5th KPI tile "Activity events · 7d". CSS in
      both incubator.css (~40L widget) + bos styles.css (~50L
      timeline + chips). Smoke: 6 URLs 200; HC/bridge/lesson/mp/phase
      all logged + visible. Q-ASSUMED: bos.section-visited +
      feedback.submitted kinds registered but no surface emits yet
      (R+1 trivial). NEW chapter `04-activity-timeline.md` + MASTER
      #89.
- [x] **T4 R012 — Multi-business localStorage segregation** — DONE.
      Per-business namespace under `businesses.<id>.<key>` + active-
      business switcher. **Switch-by-mirror approach**: 14
      NAMESPACED_KEYS (bos.user/brand/healthCheck/progress/
      lessonProgress/tasks/leads/activity/entitlement/company +
      incubator.phase/phaseProgress/phaseAdvanced/lastVisitedPhasePage)
      stored namespaced AND mirrored into flat slots — existing
      readers need ZERO changes. NEW `incubator app/lib/storage.js`
      (~155L) exposes `window.BOSStorage = {list, activeId, getActive,
      add, switch, remove, rename, set write-through, snapshot,
      mirror}`. NEW top-level keys: `bos.businesses=[{id,name}]` +
      `bos.activeBusinessId`. **Auto-migration** on first load creates
      `default` business from current flat state (best-effort name
      from bos.user.business || bos.brand.companyName); idempotent.
      NEW `lib/business-switcher.js` (~95L) auto-mounts pill+dropdown
      into `.inc-toprail` (Incubator) AND `.bos-sidebar` (BOS) — pick
      switches + reload, Add prompts for name + snapshots current
      state. CSS in both incubator.css (~52L dark) + bos styles.css
      (~50L light). Wiring: 5 most-visited Incubator pages get
      explicit script tags; BOS via NEW `ensureSwitcherLoaded()` in
      bos.js boot (mirror-pattern of R007 lazy load). Smoke: 5 URLs
      200; auto-migrate + render + add-new + switch-back all verified.
      Q-ASSUMED: switch-by-mirror zero-touch (full reader migration
      R+1); add-new snapshots current as starting (blank-slate R+1);
      transactional Incubator pages skip switcher to keep visual
      noise low. NEW chapter `04-multi-business-storage.md` + MASTER
      #88.
- [x] **T4 R011 — Pro upgrade flow mockup** — DONE.
      NEW source-of-truth `bos.entitlement={tier:free|pro-trial|pro,
      startedAt, expiresAt?, expiredAt?}` in bos.js + `isPro()` helper
      (entitlement OR back-compat `bos.mode==='customer'`);
      `maybeProLock()` rewritten to use `isPro()`. NEW `business-os
      app/upgrade.html` (~150L) — DEMO banner + 3 pricing tiers (Free
      / Pro / Agency-managed) + 10-row comparison matrix + Start-Pro-
      Trial CTA writes pro-trial entitlement w/ +14d expiry then
      redirects to checkout. NEW `business-os app/checkout.html`
      (~95L) — DEMO banner + disabled card fieldset (literally can't
      type card data) + order summary £0 today + submit writes
      `entitlement.tier='pro'` no-expiry + appends bos.activity[].
      NEW `mountTrialBanner()` in bos.js boot — amber ≤2d-remaining +
      day-of-expiry + blue post-expiry "trial ended; data preserved".
      Auto-rollback in getEntitlement (pro-trial past expiresAt →
      free, sets expiredAt, flips mode). Honesty contract: every
      surface labelled DEMO; no real card collection; data preserved
      on expiry. CSS `.bos-upgrade-*` + `.bos-checkout-*` (~140L).
      Window.BOS exposes getEntitlement + isPro. Smoke: upgrade +
      checkout + app all 200; trial-start + checkout-submit + expiry
      rollback + all banner states verified. NEW chapter
      `04-upgrade-flow-mockup.md` + MASTER #87.
- [x] **T4 R010 — HC → Incubator handoff flow** — DONE.
      NEW `.hc-incubator-handoff` primary CTA card inserted between HC
      results leak strip + transparency block. Inline
      `bridgeHcToIncubator()` writes `bos.brand.{companyName,niche}`
      (only-if-unset), appends `incubator.goals[]` from contact.goal,
      sets `incubator.phase='epic-intro'` if unset, sets new flags
      `incubator.bridgedFromHC` + `incubator.userName`, appends to
      NEW `bos.activity[]` log on click. NEW `incubator app/lib/
      welcome.js` (~110L) renders root welcome banner — first-visit
      greets user by name w/ "Based on your HC starting at Epic Intro"
      + Open-CTA + dismiss button writing `incubator.welcomedAt`;
      returning-visit shows blue "Pick up where you left off · {phase
      chip}" linking to last-visited phase page. `incubator.js`
      one-line writer for `incubator.lastVisitedPhasePage` (no per-page
      edits needed). CSS `.inc-welcome*` (~70L) + `.hc-incubator-
      handoff` styled in HC styles.css. Honesty contract: bridge only
      seeds what user actually provided. Smoke: HC + Incubator + lib
      all 200; flow verified. Chapter R010 section + MASTER #86.
- [x] **T4 R009 — Founder admin polish (full dashboard)** — DONE.
      Admin Overview gains 2nd KPI row (Active in Incubator + phase
      chip · Lessons completed · Phase advances · Top marketplace
      clicks). Leads pane: per-row drill-down (HC topics w/ unanswered
      honesty pill + Incubator phase + last-activity + editable note
      saving to NEW `bos.leadNotes[id]`) + Export-CSV button (Blob
      download w/ proper escape). Reports pane: NEW "Run weekly
      snapshot" button → `bos.reports.snapshots[]` + Δ vs closest-to-
      7d-prior snapshot (green/red/grey) + small-n<5 indicative pill
      per #68. Questions editor: per-step phase-scope `<select>`
      (all/epic-intro/blueprint/diagnostics/brand-builder) saving
      `step.phase`; tagged steps render gold sub-line. Auth gate gains
      explicit T6 prod-auth TODO comment. NEW marketplace click
      tracker: `bos.marketplaceClicks[addonId]++` via delegated
      listener on `[data-mp-addon]` cards (data-attr added in
      `bos.js renderMarketplace`). Smoke: admin + marketplace 200; all
      patterns verified end-to-end. NEW chapter `04-founder-admin-
      polish.md` + MASTER #85.
- [x] **T4 R008 — Marketing site overhaul (Incubator visual parity)** — DONE.
      Marketing index.html rebuilt for visual parity with Incubator
      surface §15d. NEW `.mm-stickybar` sticky top bar with persistent
      HC CTA added to index.html + login.html. Hero replaced with
      `.mm-hero-cover` cover-banner (Playfair 56px, gold-marble bg, HC
      primary + Demo secondary + Incubator preview link). NEW
      `.mm-audiences` 3-card section (Agencies/Business owners/End-
      customers). NEW dark `.mm-replaces` 8-tool→Aqua comparison strip.
      Testimonials rebuilt as `.mm-founding` honesty placeholder per
      #68 (no fab quotes — "Founding clients welcome" w/ what-you-get +
      what-we-ask columns + dual CTA). Footer gained Health Check +
      Incubator links. styles.css +~250L R008 block (mobile-responsive).
      Stitching contract intact (no new top-level paths). Smoke:
      index/login/incubator all 200; mm-* classes 24× in rendered HTML.
      Stitch chapter R008 append + MASTER #84.
- [x] **T4 R007 — Aqua AI scripted companion (no API)** — DONE.
      NEW canonical `incubator app/lib/aqua-ai.js` (~245L) — 35-pattern
      keyword router across 6 clusters (phase/stuck/what-next/HC-
      interpret/lesson-rec/human + meta). respondTo(msg, ctx?) →
      `{reply, suggestedActions[]}`; ctx-aware replies probe HC + brand
      + phase + mode from localStorage; chips kinds phase/lesson/human/
      open + `#ai:` self-fire. NEW `lib/aqua-ai-ui.js` (~140L) —
      floating launcher + 380px slide-in chat panel for Incubator with
      `aqua.ai.session.incubator` storage (40-msg cap). All 9 Incubator
      pages wired. BOS refactor: bos.js `ensureAquaAILoaded()` lazy-
      injects shared aqua-ai.js; askAi consults AquaAI first w/ legacy
      fallback; disclaimer copy updated. `.inc-ai-*` CSS block (~170L).
      Honesty contract layered (per-panel disclaimer + meta cluster +
      fallback). Smoke: 9 pages + 2 lib + BOS app all 200. NEW chapter
      `04-aqua-ai-scripted.md` + MASTER #83.
- [x] **T4 R006 — BOS lessons → Incubator phase-advance signal** — DONE.
      Self-report progression (no auto-advance per prompt). NEW
      `incubator app/lib/phase-advance.js` (~165L) carries
      PHASE_LESSON_REQUIREMENTS map distributing 5 shipped lessons
      across phases (Epic Intro orientation-only; Blueprint →
      core-principles; Diagnostics → chrome-profile + super-sales;
      Brand Builder → ops-sustainability + referral-alchemy). NEW
      `bos.lessonProgress` written by new "✓ Mark this lesson done"
      toggle button on `module.html`. NEW `incubator.phaseAdvanced`
      map (Q-ASSUMED separate from R002 phaseProgress to preserve
      both contracts — prompt's literal "complete" overwrite would
      have wiped per-step state). Phase pages render 4 states
      (no-lessons / in-progress + missing list / 100% gold CTA /
      advanced green-done). Click advances `incubator.phase`,
      dispatches `CustomEvent('incubator:phase-complete', {detail})`,
      fires confetti (32 particles, respects prefers-reduced-motion),
      shows toast. `.inc-pa*` CSS block (~70L). Smoke: 6 touched URLs
      all 200. Chapter R006 section + MASTER #82.
- [x] **T4 R005 — HC-driven Incubator next-action recommendations** — DONE.
      NEW `incubator app/lib/recommend.js` (~165L) exposes pure
      `IncubatorRecommend.fromHC(hc)` + DOM `mount()`. TOPIC_MAP keyed
      by 5 HC area names (Visibility & Search → core-principles
      lesson, Your Website → super-sales, Where Customers Come From →
      phase-3-diagnostics, My Business → phase-2-blueprint, Keeping
      Them → referral-alchemy). Filters topics where `score==null`
      (the contract — only answered surface), sorts ascending, takes
      top-3, severity tiers critical/warn/mild (30/55 boundaries),
      adds "Talk to a human" whatsapp row when worst score <30. Three
      explicit states: empty (no HC), partial (null-score honesty
      sub-line), full (3 ranked rec rows). Root `index.html` gains
      `<section data-hc-recommend>` slot + lib/recommend.js script
      tag. `.inc-hc-strip*` CSS block (~95L) added with severity-
      coloured left borders. Smoke: root + lib/recommend.js both 200.
      Honesty contract preserved — no extrapolation, no fab numbers.
      Chapter R005 section + MASTER #81.
- [x] **T4 R004 — Niche-specific Incubator copy packs** — DONE.
      Closed chapter #71 niche-pack follow-up. NEW
      `incubator app/copy-packs/` with 4 packs (agency default,
      skincare, coaching, fitness), loader (`window.IncubatorCopy.{getNiche,
      getPack,apply,listNiches}` reading `bos.brand.niche` w/ legacy
      `bos.user.niche` fallback), and `all.js` single-script bundle
      entry. Pack shape: `{label, heroTagline, aquaResourceCallout,
      phasePromise[4], moduleHighlight[{icon,label,href}], faqs[{q,a}]}`.
      Swap hooks: `[data-niche-tagline]`, `[data-niche-callout]`,
      `[data-niche-promise=N]`, `[data-niche-modules]` (renders cards),
      `[data-niche-faqs]` (renders toggles). Wired hero on index.html,
      "What we're doing" promise on 4 phase pages, callout + 2 NEW
      grid sections (Recommended next + Niche FAQs) on resources.html.
      BOS admin.html Overview pane gained niche `<select>` writing
      `bos.brand.niche` via JSON merge. Honesty contract preserved
      (copy-only). Smoke: 6 Incubator pages + 6 pack files + BOS admin
      all 200. Chapter R004 section + MASTER #80.
- [x] **T4 R003 — Phase-aware BOS deep-linking from Incubator** — DONE.
      `bos.deepLink` (consumed-once JSON `{section,lessonId,ts}` w/ 30s
      TTL) + `bos.returnFromPhase` + `bos.returnFromPhasePage` storage
      contract. `incubator.js` click delegate writes flags on
      `[data-bos-section][data-return-phase]` anchors before nav.
      `bos.js` `mountIncubatorStrip()` reroutes back-strip to "← Back to
      your phase" → originating phase page; new `consumeBosDeepLink()`
      scrollIntoView on matching `#bos-<section>` then clears the flag.
      Added `id="bos-<section>"` to <main> on 7 BOS pages
      (app/company/leads/trackers/tasks/docs/database). Wired phase-2/3/4
      + resources links. Phase-4 gained 2 NEW CTA cards (customers +
      lessons). Smoke: all 11 touched URLs 200. Chapter R003 section +
      MASTER #79.
- [x] **T4 R002 — Per-phase Incubator sub-pages** — DONE.
      Added `phase-1-epic-intro.html` 🌅 / `phase-2-blueprint.html` 📐 /
      `phase-3-diagnostics.html` 🔬 / `phase-4-brand-builder.html` 🎨
      under `incubator app/` per §15a anatomy. Each ships phase-specific
      toggles + a `[data-inc-phase-checks]` checklist (3/4/5/5 steps)
      saved into new `incubator.phaseProgress[phaseId]` localStorage
      key. Extended `incubator.js` (+~110L) with `mountPhaseChecks()` +
      auto-advance: when every step on a phase is ticked, writes next
      phase id to `incubator.phase` + emits a toast (forward-only;
      capped at user's current phase). Extended `incubator.css` (+~50L)
      with `.inc-checks*` (gold-accent checkboxes, line-through on
      completed). Extended root `index.html` with new 4-card "Phase
      Path" cardGrid above existing nav; `applyPhasePathLocks()` adds
      🔒 lock badges (future phases), ✓ Complete (past), ◐ In progress
      (current). Honesty contract preserved. Smoke verified — 4 new
      pages 200; lock/complete badges flip with `?phase=` override.
      Chapter `04-incubator-phase-portal.md` "R002" section + MASTER #78.
- [x] **T4 R001 — Incubator-phase client portal + BOS bridge** — DONE.
      Scaffolded `04-the-final-portal/milesymedia website/incubator app/`
      (sibling of business-os/lead-magnet, served from `:3033`). 5 static
      pages per §15e recipe (root + onboarding + portal-bridge + resources
      + discover) using the 11 Notion-style blocks via shared
      `incubator.css` (372 lines) + `incubator.js` (108 lines). New
      `incubator.*` localStorage namespace (active/phase/completed/
      watched/startedAt) with `?phase=` dev override + soft-lock cards
      via `data-unlock-phase`. BOS bridge: tiny `mountIncubatorStrip()`
      added to `bos.js` — renders "← Back to The Opulence Incubator"
      strip when `incubator.active==='1'`. §15f portal seam stand-in:
      `portal-bridge.html` button → `business-os app/app.html` until Live
      portal exists. Smoke verified — all 7 URLs return 200; phase chip
      + locks + back-strip render. Chapter `04-incubator-phase-portal.md`
      + MASTER row #77. NOT in scope (deferred): block extraction into
      `@aqua/plugin-website-editor` (§15g future T3 round), real videos,
      real APIs, BOS structural rework.
- [x] **T1 004 — SOPs + Resources surfacing** — DONE.
      Goal A: `AgencyToolsBallpark` fetches `/api/portal/sops/list` on
      mount, renders emerald "{N} new" chip on the "SOPs, Docs &
      Templates" row when ≥1 SOP updated within 7d (silent if plugin
      not installed). Goal B: NEW `sops` tab between `assets` and
      `tools` on per-client overview; NEW `_ClientSopsTab.tsx` fans
      out per-family fetches via `?tag=<family>&status=published`,
      read-only links to `/portal/agency/sops/read/<slug>` + "Open
      SOPs shelf →" anchor. Goal C: NEW `lib/server/sopsAccess.ts`
      with `assertSopsAccess(session, family?)` Founder-fallback gate
      (agency-* roles pass v1; client/end-customer 403) +
      `familiesForStage(stage)` phase→family mapping. 403 panel
      surfaces inline on gate throw. Q-ASSUMED: foundation→
      `RoleService` lookup deferred R+1 (no employee-role resolver
      yet); v1 keys off `session.role` per prompt's Founder default.
      Goal D: smoke `§ SOPs surfacing` block (list 200 + per-client
      `?tab=sops` 200 + family heading + agency-shelf link). Chapter
      `04-agency-shell-sops.md`; MASTER row #77; tsc clean. HARD
      BOUNDARY honoured (sops plugin untouched).
- [x] **T1 003 — Live phase custom portal builder gateway** — DONE.
      Goal A: Live detection (`aqua-mastery` ∪ legacy `live`) +
      `node:fs.existsSync` check on `clients/<slug>/`; header gains
      amber Live badge + CTA that flips between **Build custom portal**
      and **Open custom portal ↗**. Goal B: NEW `_BuildPortalWizard.tsx`
      modal — plugin checklist (pre-checked = installed, recommended
      chips for the §5a set), base-template radio (blank / luv-and-ker
      / compass + lazily-fetched portal-export presets), slug confirm;
      submit POSTs `/api/portal/portal-export/clients/export`
      (Q-ASSUMED: prompt's `/materialize` alias = plugin's actual
      `clients/export` route); `router.refresh()` flips CTA on success.
      Goal C: ToolsPicker grew `isLive` + `liveRecommended` optional
      props; Live amber callout names recommended set + missing subset
      + one-click bulk install loop over `marketplace/install`.
      Recommended set: website-editor · client-crm · forms · ecommerce
      · memberships · affiliates · agency-marketing. Goal D: smoke
      `§ Live phase gateway` block (Live badge + Build CTA + callout
      visible on aqua-mastery client; CTA absent on aqua-blueprint
      client). Chapter `04-agency-shell-live-phase.md`; MASTER row #75.
      HARD BOUNDARY honoured. tsc clean.
- [x] **T1 002 — Employee HQ + Role Builder** — DONE.
      Goal A: Staff domain extended additively with `agencyEmployee?`,
      `customRoleId?`, `assignments?: ClientAssignment[]`, `metadata?`;
      `update()` merges metadata. Goal B: NEW `RoleService` in
      `agency-hr/src/server/roles.ts` — `CustomRole` w/ 18-key
      `PermissionKey` union (14 prompt keys + 5 `sops.tag.<family>`),
      seedDefaults idempotent (Founder/Admin/Designer/Copywriter/Ops),
      seed rows refuse mutation; onInstall calls seedDefaults. Goal C:
      NEW EmployeesPage + EmployeeListClient (filter `agencyEmployee||
      customRoleId`, row-expand profile, `+ Add employee` modal) + NEW
      RolesPage + RoleMatrixClient (sticky-leftmost role col + 18 perm
      cols + per-cell checkbox + Clone seed + `+ New role`). Goal D:
      `permissionGuard(role, requires)` exported — opt-in 403-throw;
      `roleHasPermission` predicate. Goal E: data-side wiring of
      `visibleViewIds`; chrome reading documented R+1. Goal F: smoke
      "§ Employee HQ" block (roles GET 200 + 5 seed roles flagged
      seed:true + clone POST + invite employee POST). 4 new API routes
      `/api/portal/agency-hr/roles` (GET viewers; POST/PATCH/DELETE
      admins). Manifest: 2 navItems + 2 pages registered. HARD BOUNDARY
      honoured; tsc clean (agency-hr workspace). Chapter
      `04-employee-hq.md` + MASTER row #65. Live smoke deferred (Next
      single-instance lock collision — same WARN as R7/R8).
- [x] **T1 Agency Shell R2 — Aqua reskin** — DONE.
      Goal A: replaced fulfillment's `DEFAULT_PHASE_PRESETS` with Aqua's
      six (Epic Intro → Mastery & Ascension) + Churned tail. ClientStage
      union extended additively (foundation + fulfillment) with six
      `aqua-*` members; legacy stages kept. Goal B: `_NewClientButton`
      rewritten — therapist + practice name (composed display, auto
      slug), plan tier select w/ hints, starting Aqua phase, WhatsApp /
      Stripe URLs, lock-in £100 checkbox; metadata bag posted. Goal C:
      `Client.metadata?` added on foundation; threaded through tenants
      (merge-on-update), plugins/_types, clientStoreAdapter, fulfillment
      ports + lifecycle + handler. Goal D: AgencyToolsBallpark replaced
      with Aqua HQ six sections + collapsed "More tools" (HR/Forms/
      Email/Ops/Domains/Affiliates). Goal E: tagline "Where Healing
      Meets Revolution." subtitle; audience-framed empty + active copy;
      per-client plan tier caption + Lock-in paid chip + WhatsApp/Stripe
      quick actions. Goal F: smoke "§ Aqua reskin" block (six aqua-*
      preset ids, tagline + "Aqua HQ" in home body, metadata
      persistence + render). HARD BOUNDARY honoured; tsc clean. Chapter
      `04-agency-shell.md` Round-2 section + MASTER row #62.
- [x] **T1 Agency Shell — Ed's home** — DONE.
      Goal A: `/portal/agency` rewritten as a hero — Welcome banner +
      single primary "New client" CTA + clients grid (brand mark, name,
      phase chip, plugin count, last-activity timestamp, hover/focus
      footer with Open / Edit website / View portal). Empty state
      replaces grid entirely. Goal B: NEW `_NewClientButton.tsx` inline
      modal (name / slug auto / email / brand colour / logo URL / phase
      preset). Phase presets fetched from `GET /api/portal/fulfillment/
      presets` with static fallback. Live preset shows "skips presets —
      land in custom-portal builder". Submit POSTs `/api/portal/
      fulfillment/clients`, redirects to new client. Goal C: per-client
      `[clientId]/page.tsx` rewritten as tabbed screen via `?tab=`
      (Overview / Website / Portal / Kanban / Finance / Assets / Tools).
      `_OverviewTabs.tsx` thin client component for active state; tab
      content all server-rendered. Goal C2: `_ToolsPicker.tsx` "+ Add
      capability" picker — install / enable / disable / uninstall via
      fulfillment marketplace endpoints; `from preset` chip when plugin
      id is in current phase preset. Goal D: extended `Sidebar.tsx` with
      `extra?: ReactNode` slot; agency layout passes
      `<AgencyToolsBallpark />` — collapsible Tools group with HR,
      Finance, Marketing, Forms, Email, Ops, Domains, Affiliates. Goal
      E: smoke extended with §Agency shell (home 200 + welcome/CTA
      strings + every tab 200 + add-client happy path 200/201). HARD
      BOUNDARY honoured: zero touches to `milesymedia website/` or
      `business-os/`. tsc clean. Chapter `04-agency-shell.md`, MASTER
      row #59.
- [x] **T1 R9 — OAuth providers (Google + magic-link)** — DONE.
      Goal A Google OAuth at `/api/auth/oauth/google/{start,callback}`,
      env-gated (`GOOGLE_OAUTH_CLIENT_ID`/`_SECRET` both unset →
      button hidden + routes 404), HMAC state token (cookie-less,
      serverless-safe), tokeninfo verification (Q-ASSUMED v1; JWKS
      deferred R10), first-run bootstrap mirrors password form. Goal
      B magic-link at `/api/auth/magic/{request,verify}` + `/login/magic`
      consume page: HMAC-signed 15-min single-use tokens via
      `lib/server/magicLink.ts`, in-memory nonce replay guard (v1
      limit: process-local; shared store flagged R10), pluggable
      `registerMagicLinkDelivery` hook (T2 R10 wires email-sender at
      boot; dev fallback logs URL), per-client `signupsEnabled` gate,
      auto-creates end-customer on first verify (token = email-
      ownership proof). Goal C LoginForm + EmbedLogin: new props
      `googleEnabled`/`magicLinkEnabled`, new `"magic"` mode,
      Continue-with-Google button + "Email me a magic link" toggle.
      Smoke 18/18 pass via `tsx --test`
      (`scripts/smoke-auth-{oauth,magic}.test.ts`); npm aliases
      `smoke:auth-oauth` + `smoke:auth-magic`. tsc clean. Chapter 55
      `04-foundation-round9-oauth-magic.md` + MASTER row 55.
      Deviations: smoke `.test.ts` not `.mjs` (matches T6 R2
      precedent); tokeninfo not JWKS (Q-ASSUMED); no password reset.
      Cross-team: T2 R10 register MagicLinkDelivery hook at boot;
      T6 R2 set `GOOGLE_OAUTH_REDIRECT_URI` env in prod deploys.
- [x] **T3 R015 — Forms-as-block** — DONE.
      Forms plugin already exposes the public surface this round
      needs (public/form, public/submit, admin /forms). NEW
      `FormEmbedBlock.tsx` (block id `form-embed`, 📋, content) —
      fetches schema on mount, full field-kind coverage
      (text/email/phone/textarea/select/multiselect/radio/
      checkbox/number/date/hidden), honoured submitAction.kind
      (redirect → window.location, thank-you → message,
      store-only/external-webhook → inlineThankYou prop), honeypot
      `_h` field with silent-success bot rejection, brand-kit CSS
      vars throughout. Multiselect → array, checkbox → boolean,
      others → string serialisation matches forms-plugin
      submissions validator. NEW `FormPickerModal.tsx` operator-
      facing picker (free-text search + status filter + status
      pills + field/submission counts + "+ Create new form ↗"
      external anchor + fetchImpl override). NEW
      `__smoke__/r015-forms-as-block.test.ts` 14/14 (registry,
      SSR rendering, endpoint URL contract, defaults).
      package.json test chain extended. tsc-clean. Chapter
      `04-forms-as-block.md` + MASTER row #96.
      Q-ASSUMED: formId operator-typed today (sidebar picker
      wire-up R+1); runtime fetch (no SSR pre-render); honeypot
      is plugin's anti-bot; external-webhook returns inline
      thank-you. Deferred: properties-sidebar Open-picker button,
      server-side schema cache, field-level conditional logic,
      submission analytics in picker, A/B variants, multi-step
      forms.
- [x] **T3 R014 — SEO meta + favicon + sitemap + OG card** — DONE.
      `EditorPageSeo` (R002+) already covered most Goal A; R014
      added `canonical?: string` + `keywords?: string[]` to the
      type. Goal B: NEW `lib/faviconUrls.ts` ships
      `deriveFaviconUrls(brand, override?)` (5-URL set, brand
      logo wins, fallback to `/favicon-default-*`,
      per-variant override) + `faviconHeadLinks(urls)` (5 head
      fragments). Goal C: NEW `server/sitemap.ts` ships pure
      builders `buildSitemapXml` (published-non-noIndex-non-
      portal-variant-non-underscore-slug filter, `<lastmod>`,
      XML-escape) + `buildRobotsTxt` (User-agent + Disallow
      per noIndex + always `/_*` + `/embed/` + sitemap pointer);
      NEW endpoints `GET /sitemap.xml` (application/xml, 5min
      cache) + `GET /robots.txt` (text/plain, 5min cache).
      Goal D: NEW `server/ogImageGenerator.ts` ships
      `buildOgCardSvg` (1200×630, title wrap ≤4 lines, brand
      line, luminance-derived text colour, XML escape) +
      `buildOgCardDataUrl` (base64 data URL); NEW
      `GET /og?title=…&color=…&brand=…` endpoint (image/svg+xml,
      1-day immutable cache, 400 missing title). No `@vercel/og`
      dependency — plain SVG. Goal E: NEW
      `__smoke__/r014-seo-meta.test.ts` 33/33 + package.json
      test chain extended. tsc-clean. Chapter `04-seo-meta.md`
      + MASTER row #95.
      Q-ASSUMED: editor SEO sidebar tab visual deferred (type
      extension lights up R+1 UI); foundation lands
      `/favicon-default-*` static assets; SVG OG cards (raster
      R+1 via `sharp`); per-variant favicon override hook
      shipped, wire-up R+1; structured data stays free-form
      `schemaJsonLd` field. Deferred: SEO sidebar tab,
      foundation favicon assets, raster PNG cards, custom
      fonts in OG generator, `/sitemap_index.xml` for >50k
      pages, schema.org pickers.
- [x] **T3 R013 — Iframe-embed customer surface** — DONE.
      Editor-side primitives shipped; foundation route
      `/embed/[clientSlug]/[variant]` is T1 Q-FOLLOWUP.
      Goal C: NEW `lib/embedBridge.ts` postMessage protocol —
      `EmbedEvent` union (aqua:ready/auth-ok/height-changed/
      navigate/error), `dispatchToParent`, `subscribeToBridge`
      with allow-list filtering, `measureContentHeight`,
      `buildFrameAncestorsHeader` for CSP. Goal B: NEW
      `server/embedAllow.ts` per-client allow-list registry
      (de-dup + trim + invalid-strip; `isValidOrigin` regex
      rejects paths/trailing-slash); 2 endpoints
      `GET/POST /embed/allowed-origins` with set-and-tell
      pattern (invalid surfaced separately, not 400-batch).
      Goal D: NEW `EmbedSnippetBuilder.tsx` paste-ready
      HTML+JS generator with auto-resize listener (exact-origin
      checked) + clipboard copy. Goal A: foundation route
      Q-FOLLOWUP — contract documented in chapter §5 (T1
      middleware reads `getEmbedAllowList` + emits
      `frame-ancestors` CSP). Goal E: NEW
      `__smoke__/r013-iframe-embed-surface.test.ts` 37/37
      (event guards + frame-ancestors + SSR-safety + origin
      validation + registry round-trip + HTTP shape).
      package.json test chain extended. tsc-clean. Chapter
      `04-iframe-embed-surface.md` + MASTER row #94.
      Q-ASSUMED: foundation route deferred (T1); set-and-tell
      POST pattern; auto-resize exact-origin; isValidOrigin
      rejects paths; child suggests redirect, host enforces
      allow-list. Deferred: foundation `/embed/<slug>/<variant>`
      route + middleware (T1), `EmbedAutoResize.tsx` React
      component, custom-domain (T6 out of scope), per-variant
      allow-list, auth-ok telemetry, locale-changed event.
- [x] **T3 R012 — Portal-variant editor** — DONE.
      Server CRUD + singleton enforcement live since R002. R012
      adds the flat-across-all-roles read + 2 UI components.
      Goal A/D: NEW `listAllPortalVariants` server helper +
      `GET /portal-variants/all?siteId=…` endpoint returning
      `PortalVariantSummary[]` sorted by PORTAL_ROLES order,
      active-first within role, updatedAt desc. Goal B: NEW
      `PortalVariantSwitcher.tsx` topbar dropdown (lazy-fetch,
      per-role grouping with "+ New variant" callback, active
      green pip, current cyan tint, brand-kit CSS-var driven
      from R011). Goal D: NEW `PortalVariantGallery.tsx` full-
      screen modal (16:9 preview tile, role-tinted chip,
      live/draft chip, last-edited date, Edit + Make live CTAs;
      POSTs `/portal-variants/active` directly with busy state).
      Goal C: `setActivePortalVariant` already shipped (R002).
      Both UI components accept `fetchImpl` override. NEW
      `__smoke__/r012-portal-variant-editor.test.ts` 21/21
      (sort, status, variantId surface, HTTP shape, flip-flow,
      singleton invariant ≤1 active/role) + package.json test
      chain extended. tsc-clean. Chapter
      `04-portal-variant-editor.md` + MASTER row #93.
      Q-ASSUMED: 4 PortalRoles per foundation
      (login/affiliates/orders/account); wider role set
      (account/customer/member/affiliate/start-here/other) is
      Q-FOLLOWUP for T1; preview thumbnails are placeholder
      tiles (real screenshot R+1); host-page topbar wiring
      unchanged (pure components ready to mount). Deferred:
      foundation PortalRole extension, screenshot capture,
      drag-to-reorder, host-page topbar mount, variant
      duplication, A/B testing (out of scope per prompt).
- [x] **T3 R011 — Brand-kit CSS variables** — DONE.
      Per `eds requirments.md` §5 (no hardcoded brand colours).
      Goal A: vendored `BrandKit` (`lib/tenancy.ts`) gains 9 optional
      fields — bg, bgElevated, text, textMuted, border, radiusSm,
      radiusMd, radiusLg, darkMode. Foundation source-of-truth
      `BrandKit` left untouched (T1 territory). Goal B-style
      `BrandKitProvider` deferred — foundation `ThemeInjector`
      already emits 7 vars per-tenant; new vars layer additively
      via NEW `lib/brandKitCss.ts::extendedBrandToCss` (16 vars
      with dark-friendly fallbacks; `extendedBrandToStyleString`
      with custom scope; `looksLikeHardcodedBrandColour` regex
      heuristic for the audit smoke). Goal C: 90 hex hardcodes
      surveyed in `components/blocks/`; most utility (error red /
      muted / dark surfaces) — kept. Brand-coloured defaults
      already read `var(--brand-accent, #ff6b35)` (R002+ pattern);
      only `IconBlock::color` default patched + `// brand-kit-todo`
      grep marker landed. Goal D: 2 new routes `GET /brand-kit/
      extended` + `POST /brand-kit/extended` (allow-list partial,
      empty-string clears one field, 400 on malformed). Visual
      settings page (colour pickers + logo upload + font picker)
      deferred — endpoints + helper are the structural prereq.
      Goal E: NEW `__smoke__/r011-brand-kit-css-vars.test.ts`
      31/31 pass + package.json test chain extended. tsc-clean.
      Chapter `04-brand-kit-css-vars.md` + MASTER row #92.
      Q-ASSUMED: vendored BrandKit only (foundation absorbs later);
      `BrandKitSettingsPage` deferred to R+1; 90-hex audit kept
      utility colours as-is. Deferred: T1 foundation BrandKit
      extension, CI step running heuristic over blocks, BrandKit
      picker for `--inc-*` Notion-Incubator vars (R009), darkMode
      propagation into block rgba lightness.
- [x] **T3 R010 — Incubator template preset (§15e)** — DONE.
      Templates already shipped from R002 — `AQUA_INCUBATOR_TEMPLATE_IDS`
      exports root + 4 sub-pages (onboarding/portal/resources/
      discover); marketplace already surfaces them under "Aqua
      Incubator" tag (R006). R010 closes remaining gaps:
      NEW `server/incubatorTemplate.ts` ships
      `IncubatorClientMetadata` (with index signature for arbitrary
      `{{custom_key}}` placeholders) + `applyIncubatorClientMetadata
      (blocks, metadata)` deep-cloning placeholder walk +
      `DEFAULT_INCUBATOR_METADATA` for preview. Root template's
      propertyStrip rows now carry `{{phase}}` / `{{planTier}}` /
      `{{onboardingStartedAt}}` rather than literals. Foundation/T1
      wire-up of "+ New client" modal toggle + post-create
      `applyStarterVariant`+resolver invocation is Q-FOLLOWUP per
      prompt — contract documented in chapter §3. NEW
      `__smoke__/r010-incubator-template-preset.test.ts` 43/43 +
      package.json test chain extended. tsc-clean. Chapter
      `04-incubator-template-preset.md` + MASTER row #91.
      Q-ASSUMED: preset id stays `aqua-incubator` (canonical from
      R002, not `incubator-template` per prompt); videoEmbed on
      onboarding sub-page not root per §15e per-page recipe;
      helpRow/feedbackRow render as toggles in root per §15a.
      Deferred: T1 modal toggle + wire-up; per-phase placeholder
      packs; `previewIncubatorTemplate(client)` admin helper;
      auto-link cardGrid hrefs once T1 persists 5-page set.
- [x] **T3 R009 — Notion-Incubator blocks (icon/property-strip/toggle/card-grid)** — DONE.
      All 4 block ids already registered (R002 Aqua Incubator
      template). R009 closes §15g gaps: Goal C added `url` type
      to propertyStrip row union (renders external link). Goal F
      applied CSS-var theme overlay across all 4 blocks with
      rgba-white fallbacks (zero breakage) — 11 new vars in the
      `--inc-*` namespace covering text/heading/muted/divider/
      card chrome/chip pill/link/icon ring + shadow. NEW
      `__smoke__/r009-notion-incubator-blocks.test.ts` 30/30 via
      `react-dom/server.renderToStaticMarkup`. package.json test
      chain extended. website-editor tsc-clean. Chapter
      `04-blocks-notion-incubator.md` + MASTER row #90.
      Q-ASSUMED: blocks already registered (evolution not
      re-creation); rows/cards arrays still hand-edited as JSON;
      offsetY remains free-form number; rgba-white fallbacks
      preserve existing dark-mode hosts. Deferred: array editors
      in properties sidebar, auto-load Incubator preset stylesheet,
      cover+spacer-overlap helper, url-cluster Resources widget.
- [x] **T3 R008 — Storefront blog admin** — DONE.
      Goal A: NEW `server/blog.ts` — `BlogPost` w/ BlockTree body
      (richer than 02's HTML), per-site CRUD scoped by
      `(agencyId, clientId, siteId)`, slug→id sidecar index for
      O(1) /blog/[slug] lookup. createBlogPost auto-disambiguates
      slugs `-2/-3/…`; updateBlogPost throws `BlogSlugConflictError`
      on collision. `draft→published` stamps `publishedAt`;
      subsequent edits keep original (SEO-stable). listBlogPosts
      filter: `{ status?, tag?, query?, limit? }` — default hides
      archived; `status:"all"` surfaces them. Goal B: NEW
      `api/handlers/blog.ts` + 6 routes — GET list / GET get /
      GET by-slug (404 on archived = storefront gate) / POST
      (201/400) / PATCH (200/404/409) / DELETE (200/404). Goal C:
      NEW `BlogFeedBlock.tsx` (`blog-feed` 📰) + NEW
      `BlogPostBlock.tsx` (`blog-post` 📄) registered in
      blockRegistry; feed renders cards (grid/list, cover, tag
      chips, N-min-read excerpt-derived); post block reads slug
      from URL last-segment when `slug="auto"`, body renders via
      host-injected `window.__aquaRenderBlocks` (debug fallback if
      not injected). Goal D: sitemap deliberately NOT auto-injecting
      `/blog`+`/blog/[slug]` — operator drops the blocks where they
      want them. Goal E: NEW `__smoke__/r008-blog.test.ts` 49/49
      pass + package.json test chain extended. tsc-clean. Chapter
      `04-blog-admin.md` + MASTER row #85.
      Q-ASSUMED: BlockTree body not HTML; read-time excerpt-derived
      at 250 wpm (body-walk R+1); admin list/edit pages deferred —
      operators drive end-to-end via API today; archived gated 404
      from public by-slug. Deferred: admin pages mounted on existing
      editor visual, auto-inject /blog routes via editor-settings
      toggle, RSS feed, comments/Disqus, multi-author permissions,
      scheduled posts (domain shape already absorbs the field).
- [x] **T3 R007 — Cookie consent + force-password-change** — DONE.
      Goal A: NEW `CookieConsentBlock.tsx` registered in blockRegistry
      under `cookie-consent` (🍪, content category). Props
      `{ message, acceptLabel, declineLabel?, policyUrl?, position }`
      with bottom-bar/corner/modal layouts; localStorage key
      `aqua_cookie_consent_v1` (exported `COOKIE_CONSENT_KEY`) +
      `CustomEvent("aqua-cookie-consent")` on `window` so plugins
      can subscribe. Goal B: NEW `server/forcePasswordChange.ts`
      registry — per-user + agency-wide `_all` flags under
      `t/<agencyId>/_agency/website-editor/force-password/`; NEW
      `api/handlers/forcePassword.ts` — `GET /users/force-password`
      (roster or `?userId=…`), `POST /users/force-password` (per-user
      or `all:true`); 400 paths covered. Q-ASSUMED on T1: login-time
      redirect itself is foundation territory — chapter §3
      documents the read-and-clear contract for T1's post-auth hook.
      Goal C: NEW `__smoke__/r007-cookie-force-password.test.ts`
      29/29 + package.json test-chain extended. tsc-clean. Chapter
      `04-cookie-consent-and-password-change.md` + MASTER row #80.
      Q-ASSUMED: single-binary cookie consent v1; cookie block NOT
      auto-injected into pageTemplates; agency-wide `_all` flag not
      auto-cleared per-user (safer failure mode); editor admin UI
      surfacing the toggle in T1's user-detail view deferred.
      Deferred: granular categories + manage-prefs UX, T1
      foundation post-auth redirect + `/account/change-password`
      page, per-user `lastChanged` so agency-wide flag falls off
      naturally.
- [x] **T3 R006 — Portal template marketplace** — DONE.
      Goal A: NEW `server/templateMarketplace.ts` —
      `listBuiltinTemplates()` surfaces every `PAGE_TEMPLATES` entry
      + `brand-page-pack` composite with id-prefix-inferred tags
      (Login / Aqua Incubator / Brand Pack / Composite / Storefront /
      Service Portal / Affiliate Site / Marketing / Generic page).
      Goal B: operator-saved per-agency templates under
      `t/<agencyId>/_agency/website-editor/templates/<id>` with
      `saved-<slug>-<base36-ts>` id; `listAllTemplates()` saved-first
      merge; `saveTemplate / deleteSavedTemplate` round-trip; cross-
      agency isolation. Goal C: 3 new API routes — `GET /templates`,
      `POST /templates` (label+blocks required, 400 otherwise;
      201 on success), `DELETE /templates?id=…` (200/404/400). Goal
      D: NEW `TemplateGallery.tsx` modal (search + auto-tag-chip
      filter + 3-col card grid + right-pane preview + "Use this
      template" CTA fires `onPick(id, kind)`); NEW
      `SaveAsTemplateButton.tsx` (modal captures BlockTree +
      label/desc/tags/coverUrl, POSTs, auto-closes on success). Both
      accept `fetchImpl` override. Goal E: 25/25 smoke pass in
      NEW `__smoke__/template-marketplace.test.ts` (registry
      contract + HTTP shape, 400/404 paths, per-agency isolation).
      website-editor tsc-clean. Chapter
      `04-template-marketplace.md` + MASTER row #76.
      Q-ASSUMED: tag inference by id-prefix; default tag
      "Operator template" when none provided; topbar wiring
      out-of-scope (host page owns applyStarterVariant). Deferred:
      screenshot-based cover capture, cross-agency curated
      marketplace, paid templates, composite-pack sibling-seeding
      for saved templates, agency-shell "+ New client" gallery
      wire-up.
- [x] **T3 R005 — AI image editing (variations + inpaint)** — DONE.
      Goal A: `POST /api/portal/ai-builder/image/variations` (body
      `{ sourceImageUrl, count?=4, strength? }`) → 4 stub picsum URLs
      keyed by `hash(sourceUrl + strength + i)`. Goal B:
      `POST /api/portal/ai-builder/image/inpaint` (body
      `{ sourceImageUrl, mask, prompt }`) → stub returns source URL
      unchanged with `stub:true`. Both consult R9's
      `monthlyImageCeiling`, bump usage on success, surface
      `CeilingReachedError` as 429. `ImageProviderPort` extended with
      optional `variations()` + `inpaint()`; `stubImageProvider`
      implements both. Goal C: `EditorPropertiesSidebar.tsx` grows
      "AI tools" sub-section on `image-src` selection — ✨ Generate
      variations + 🖌 Edit with mask buttons mount NEW
      `ImageVariationsModal.tsx` (2×2 thumbs grid, "Use this"
      replaces draft via existing patch flow) and NEW
      `ImageInpaintModal.tsx` (512×384 canvas, white strokes mask,
      prompt textarea, `toDataURL("image/png")` serialization, stub-
      flag honest hint, Clear/Cancel/Generate). Goal D: 6 new smoke
      tests in `__smoke__/ai-builder.test.ts` (stub variations +
      ceiling, stub inpaint + ceiling, handler 200/400/429).
      `@aqua/plugin-ai-builder` 14/14 pass. ai-builder +
      website-editor tsc-clean. Chapter
      `04-ai-image-editing.md` + MASTER row #72.
      Q-ASSUMED: variations stub size fixed 1024×1024; inpaint
      canvas 512×384; AI-tools section only renders with non-empty
      draft URL. Deferred: real OpenAI provider impl, brush
      controls + eraser, variation history strip, before/after
      preview, video editing.
- [x] **T3 R004 — Brand-page templates (therapist storefront)** — DONE.
      Goal A: 7 starter brand presets in `pageTemplates.ts` re-using
      existing block catalogue — `brand-about` / `brand-our-story` /
      `brand-philosophy` / `brand-sustainability` / `brand-faq` /
      `brand-contact` / `brand-lab-tests`. Felicia mythos placeholder
      copy; cover images empty (operators drop via R003 asset upload).
      Goal B: composite `brand-page-pack` starter — root from About's
      tree + 6 sibling pages auto-seeded via `applyStarterVariant`
      (same pattern as R002 Aqua-Incubator). `BRAND_PAGE_TEMPLATE_IDS`
      + `BRAND_PAGE_PACK_ID` exported. starterLoader fall-through;
      `listStarterIds()` 11→19. Goal C: NEW `__smoke__/brand-page-
      templates.test.ts` 39 cases. Plugin total **254/254**
      (68+25+25+26+39+32+39). tsc clean. Chapter
      `04-brand-page-templates.md` + MASTER row #66.
      Cross-team: T1 surfaces brand-page-pack as featured composite
      in "+ New page" picker. Q-ASSUMED: starter role="account".
      Deferred: industry-vertical packs, rich copy library,
      preview thumbnails, auto-sitemap navbar.
- [x] **T3 R003 — videoEmbed + asset upload + LivePreview polish** — DONE.
      Goal A: NEW `videoEmbed` block — auto-detect provider (vimeo /
      youtube / loom / raw) via `lib/videoEmbed.ts`; `toEmbedUrl`
      rewrites to canonical embed URLs with autoplay+muted appendage.
      Registry 60→61. Aqua-Incubator onboarding `video` → `video-embed`.
      Goal B: rewrites `api/handlers/assets.ts` (was R1 501 stubs) —
      real storage round-trip, 8 MiB per file + 64 MiB per client cap,
      `decodeDataUrlSize` exported helper. AssetPicker uploads now
      actually land. Goal C: LivePreview "↗ New tab" button +
      `lastSaveAt` prop (auto-refresh on save) + per-page localStorage
      open/closed state via `useLivePreviewOpenState(pageId)`. Goal D:
      NEW `__smoke__/video-and-preview.test.ts` 32 cases. Plugin
      smoke **199/199** (52 + 25 + 25 + 26 + 39 + 32). tsc clean.
      Chapter `04-website-editor-round-003.md` + MASTER row #64.
      Cross-team: T1 swaps inline-dataUrl for CDN adapter when ready
      (API surface stable). Deferred: drag-drop onto cover-block target,
      Vimeo Showcase/playlist embeds, LivePreview split mode.
- [x] **T3 R002 — Aqua Incubator template (Notion-style)** — DONE.
      Goal A: 4 Notion blocks — `icon` extended with image-mode props
      (image/offsetY/label, back-compat with glyph); NEW `property-strip`
      (Notion key-value disclosure with phase/select pill chips); NEW
      `toggle` (`▸ Header` native `<details>`, `isContainer:true`);
      `card-grid` extended with Notion `items[]` mode alongside back-compat
      `cards` shape. Registry 58→60. Goal B: `aqua-incubator` page-template
      preset (§15e tree) + 4 sub-pages (onboarding/client-portal/resources/
      discover) seeded as siblings via `applyStarterVariant("aqua-incubator")`.
      `AQUA_INCUBATOR_TEMPLATE_IDS` exported readonly; `selectStarterForPhase
      ("Epic Intro") === "aqua-incubator"`. Goal C: foundation hook ready —
      T1 calls `selectStarterForPhase(phase)` from "+ New client" modal.
      Goal D: bridge button on portal sub-page — label "Click Me To Enter
      Your Portal!" → `/portal/customer` (same-origin). Goal E: NEW
      `__smoke__/incubator-template.test.ts` 39 cases (registry/template/
      sub-pages/bridge/selectStarterForPhase/graceful-degrade/loader). Plugin
      smoke **167/167** (52 + 25 + 25 + 26 + 39). tsc clean. Chapter
      `04-incubator-template.md` + MASTER row #63 + R2 chapter pointer.
      Cover-asset placeholder dir + README at
      `04-the-final-portal/portal/public/aqua-incubator/`. Q-ASSUMED:
      starter role="account" (PortalRole has no "customer" yet);
      operator-supplied final cover imagery.
      Cross-team: T1 wires `selectStarterForPhase` into the agency-shell
      modal; foundation widens `PortalRole` when ready. Deferred: cover
      upload pipeline; Vimeo embed; marketplace browsing; dedicated
      `customer`/`incubator` PortalRole; generalised `siblingPages?:`
      starter field.
- [x] **T3 R10 — Editor deep-link + page picker** — DONE.
      Goal A: deep-link contract `/portal/clients/[clientId]/edit-website?page=&variant=`
      with pure helpers in `lib/editorDeepLink.ts` (parse/build/pagesForVariant/
      availableVariants/resolveStartPage/slugify/uniqueSlug); EditorPage now
      URL-aware via `useSearchParams` + `router.replace` so links are
      bookmarkable. Goal B: NEW `components/editor/PagePickerToolbar.tsx`
      above the canvas — page dropdown (title + slug + relative-time) + "+ New
      page" inline (window.prompt → slugify+uniqueSlug → createEditorPage).
      Goal C: variant switcher right of picker, hidden when `availableVariants`
      length 1. Unsaved-changes guard via existing `confirm()` shim. Goal D:
      NEW `__smoke__/deep-link.test.ts` 26 cases (≥6 required); chapter R2
      appended with "Round 10 — deep-link + page picker"; MASTER row #29
      pointer updated. Smoke total **118/118** (42 + 25 + 25 + 26). tsc clean.
      Cross-team: T1 should call `buildEditorDeepLink({clientId,pageId,variant})`
      from agency-shell "Edit website" CTA (re-export from server entry if
      needed). Deferred: server-side pageOrder; auto-create blank `/` on first
      deep-link when no pages exist; styled confirm host.
- [x] **T3 Lift Inventory — `02` + `03` audit** — DONE.
      Pure documentation chapter `04-lift-inventory.md` + MASTER row
      #58. Goal A: 9 sections covering `02 felicias aqua portal work/`
      (config / storefront marketing / 61 admin sub-areas / 34 in-tree
      plugins / 41+ components / lib / portal runtime / 72 API route
      dirs / public assets) — each row marked PORTED / PARTIAL /
      NOT-PORTED / OBSOLETE with pointer. Goal B: 6-row index over
      existing `old-portal-*.md` chapters for `03`. Goal C: prioritised
      revival list (19 entries across 4 tiers — reservations / KB+wiki
      / marketplace / forum+livechat / CRM deals+tasks / reviews / i18n
      / SEO / webhooks / compliance / blog / brand-page templates /
      consent / force-password-change / chatbot / A/B / automation runs /
      funnel split-tests / notification channels). Hard boundary
      honoured: read-only on `02` + `03`; did NOT touch
      `04-the-final-portal/milesymedia website/` or `business-os/`.
- [x] **T3 R9 — AI image generation + cost ceilings** — DONE.
      Goal A: NEW `imageService.ts` with pluggable `ImageProviderPort`
      + `setImageProviderPort()` injection + `stubImageProvider`
      (picsum.photos URLs hashed by prompt). NEW `POST /image` route
      (HTTP 429 on ceiling-reached). GenerateModal walks tree post-
      complete, fills empty `src` on hero/image/productCard/gallery/
      banner blocks, soft-fails. Goal B: `monthlyTokenCeiling` (10M)
      + `monthlyImageCeiling` (200) on AiBuilderConfig. Storage
      `metrics/usage/<YYYY-MM>` auto-rolls per-month, no cron.
      Both `generate()` and `generateStream()` pre-check token
      ceiling → synthetic rejected w/ `ceiling-reached:` prefix; both
      bump usage post-call by `input+output+cacheRead+cacheWrite`.
      `ImageService` throws `CeilingReachedError`. NEW `GET /usage`.
      SettingsPage gains Image-gen + Usage panels (emerald/amber/red
      meters; ceiling inputs `min` = current usage). Goal C: 3 new
      R9 smoke cases → ai-builder 8/8; website-editor 92/92 unchanged.
      tsc clean both. Chapter `04-plugin-ai-builder-round9.md` +
      MASTER row #57.
- [x] **T3 R8 — AI streaming + LivePreview iframe** — DONE.
      Goal A SSE streaming on Generate: `streamMessage()` on the
      Anthropic client + `GenerationService.generateStream()` +
      `POST /generate/stream` SSE handler emitting
      `data:{delta|complete|error}` frames + `[DONE]`; GenerateModal
      rewritten as SSE consumer with `tryParsePartial` partial-tree
      parser, Cancel→AbortController, cyan→emerald done state.
      Goal B LivePreview.tsx side-by-side iframe (sandbox
      `allow-same-origin allow-scripts`, postMessage select/highlight
      channel) mounted as fixed-position right-rail in Block + Code
      modes via footer toggle; reuses storefront URL `?preview=1`
      (Q-ASSUMED dedicated `/preview/[pageId]` route deferred to T1
      R9 — single-line swap). Goal C smoke 5/5 ai-builder
      (+2 R8 cases) + 92/92 website-editor unchanged. tsc clean both.
      Chapter `04-plugin-website-editor-round8.md` + MASTER row #54.
- [x] **T3 R7 — AI page builder** — DONE. `@aqua/plugin-ai-builder`
      shipped at `04-the-final-portal/plugins/ai-builder/` (3 navItems,
      4 admin pages, 6 API routes, 0 storefront blocks; Generation
      domain + read-only block-schema projection of BLOCK_REGISTRY +
      18 cross-plugin ids; anthropicClient with prompt caching on the
      static block-library system prompt; generationService with
      Haiku 4.5 default + Sonnet 4.6 fallback on schema-validation
      failure + cache-hit metrics; per-install `anthropicApiKey` on
      `install.config`). Editor integration: `GenerateModal.tsx` NEW
      + `EditorTopBar.tsx` ✨ Generate button + `EditorPage.tsx` owns
      modal lifecycle + onInsert appends tree to active page. Smoke
      3/3 pass via `tsx --test`; website-editor 92/92 unchanged.
      tsc clean both plugins. Streaming SSE preview deferred to R8
      (POST + spinner is v1). Chapter `04-plugin-ai-builder.md` +
      MASTER row #52.
- [x] **T4 R2 — Storefront + per-client portal polish + perf pass** —
      DONE. Phase A storefront block UX (`27c78ed`) — 60-occurrence
      brand-orange→accent sweep across 31 blocks + loading/error/empty/
      aria/touch on 6 highest-impact cross-plugin renderers (Affiliate
      Leaderboard / PayoutMeter / Signup, Membership Signup, FormRender,
      CrmContactForm + ProductGrid). Phase B end-customer + embed-login
      (`a223692`) — `useIsEmbedded()` hook, Suspense skeleton, logo
      height-reserved, `MobileNav` absolute-when-embedded. Phase C
      per-client portal (`9023d95`) — Luv & Ker adopts foundation
      primitive set in-tree (SkipToContent / ErrorBoundary / EmptyState /
      contrastValidator + globals.css polish layer + `id="main-content"`
      on every `<main>`). Phase D perf smoke (`da37a93`) —
      `scripts/smoke-perf.mjs` + `npm run smoke:perf` asserts response
      time ≤2.5s + HTML payload ≤ per-page KB budget. Chapter
      `04-ux-storefront-perf-pass.md` + MASTER row #51. tsc clean across
      all 4 commits. R3 deferred: real Lighthouse w/ Puppeteer,
      `<BrandImage>` next/image wrapper, bundle analyzer, lazy-load
      editor admin gate, ConfirmDialog adoption (carried over from R1).
- [x] **T5 R2 — Second per-client portal** — DONE. Compass Coaching
      portal at `04-the-final-portal/clients/compass-coaching/` —
      coaching/membership business shape (slim 4-plugin set: website-
      editor + memberships + client-crm + forms; no ecommerce/
      affiliates). Brand kit diverges deliberately from Luv & Ker:
      `#3B6EAE` steel-blue + `#1B3D6F` navy accent + DM Serif Display
      heading + `0.25rem` radius. Pages: `/` Hero + PricingTiers +
      Newsletter, `/login` + `/embed/login` branded, `/account` with
      memberships + contact cards, NEW `/members` gated library, NEW
      `/contact` forms+CRM. portalVariants keyspace `{login, account,
      members}` (no orders/affiliates). Dev port 4041. `npm install
      --legacy-peer-deps` clean (52 packages); `npx tsc --noEmit`
      clean; smoke green across all 6 routes + API proxy 502 with
      structured payload + iframe-friendly CSP + zero ecommerce/
      affiliates leak in homepage HTML + no contrast warnings.
      Chapter `04-client-portal-second.md` + MASTER row #53. Gives
      T2 R11's generator a second concrete target shape — the
      `installedPlugins`-driven contract (deps + transpilePackages +
      manifestImports + pages + variant keyspace + account-page
      branches all derived from one list) is now validated against
      6→4 plugin variation, ecommerce-led vs memberships-led
      homepage, font-pair variation. Open Q logged: keep presets as
      install-time scaffolding hints only.
- [x] **T6 R3 — CI/CD + monitoring + backups** — DONE. Goal A:
      `.github/workflows/ci.yml` (typecheck-portal + typecheck-plugins
      matrix×14 + smoke-plugins matrix×13 + smoke-portal +
      smoke-vercel-domain + smoke-ux + smoke-perf + ci-status
      aggregator; per-package node_modules cache); `preview-deploy.yml`
      (Vercel preview on PR, no-op when secrets unset; bot upserts
      one PR comment with the URL). Goal B: new `@aqua/plugin-ops`
      at `04-the-final-portal/plugins/ops/` — server-rendered
      MonitoringPage with four panels (uptime / Sentry errors /
      slow routes / cost MTD), PluginStorage-backed UptimeStore
      with 24h sample window, Sentry/Vercel/Stripe/Postmark
      provider stubs that return null until R4 wires real REST
      calls; `runHealthcheckPass` pings each target's /healthz
      with 10s timeout. 9/9 smoke pass via `npm run smoke`.
      tsc clean standalone. NEW `/healthz` route in portal app at
      `04-the-final-portal/portal/src/app/healthz/route.ts`
      (force-dynamic, no-store, never touches Postgres). Goal C:
      `scripts/backup-postgres.mjs` (pg_dump | gzip | retain 30
      days; BACKUP_DEST=s3://… stub for R4); runbook §8 extended
      with unified `crons` block proposal (demo-reset + healthcheck
      hourly + backup 03:30) — block stays commented in vercel.json
      until Ed flips on. Chapter `04-cicd-and-monitoring.md` +
      MASTER row #56 + this row done. R4 candidates: real provider
      integrations (Stripe → Postmark → Vercel → Sentry), foundation
      registration of @aqua/plugin-ops (5-step pattern),
      per-client healthz via T2 R11 generator, un-comment vercel.json
      crons block + add `/api/portal/ops/backup` route, real S3 /
      Vercel Blob upload, Lighthouse smoke workflow (Puppeteer +
      Chromium, label-gated), restore-test cron, healthcheck
      escalation channel.
- [x] **T6 R2 — Real deploy + custom domains** — DONE. Phase A
      operator runbook (`2f93a18`) + Phase B foundation Vercel
      client + CLI helper + 11/11 mock smoke (`b61f587`) + Phase C
      DNS-verify polling badge (`14c5b2a`) + Phase D chapter +
      MASTER row #50 + this row done. `01 development/runbooks/deploy.md`
      is the operator-facing ship doc (10 sections incl. custom-
      domain runbook + rollback). Foundation Vercel client at
      `portal/src/lib/server/vercelDomain.{ts,impl.ts}` (server-only
      re-export over plain-JS impl so the smoke runs via tsx). CLI
      helper `scripts/attach-domain.mjs` mirrors the same surface
      as pure JS. `@aqua/plugin-domains` admin badge auto-polls
      `/verify` every 30s up to 5 min — flips Pending → Active or
      Failed without manual re-check. tsc clean. Real-creds smoke
      against a sandbox Vercel project deferred (no token in the
      autonomous loop; manual runbook in chapter §3f).
      R3 candidates: real-creds smoke run + bake into deploy.md,
      foundation-plugin client dedup, `scripts/stitch-rewrites.json`
      single source-of-truth (per T1 R8 §9), polling refinements,
      demo cron wiring.
- [x] **T4 R1 — UX + accessibility polish** — DONE. Phase A audit
      (`b89ee01`) + Phase B step 1 shared UI primitives + a11y hooks +
      layout adoption (`15acfbe`) + Phase B step 2 plugin-admin
      baseline + ErrorBoundary on the 3 catch-all resolvers + 6 list
      empty states (landed under `a943673` due to T5 autostash mesh
      hazard — content shipped + tsc clean) + Phase C+D chrome a11y +
      mobile sidebar drawer + Topbar wrap + contrast validator wired
      (`24f2cd0`). 5 UI primitives (LoadingSkeleton + EmptyState +
      ErrorBoundary + SkipToContent + ConfirmDialog) at
      `portal/src/components/ui/`; 4 a11y hooks (useFocusTrap +
      useArrowNav + useViewport + contrastValidator) at
      `portal/src/lib/a11y/`. Global focus-visible ring lights up
      every interactive element across all 9 plugins for free; the
      `globals.css` plugin-admin baseline brings the 9 plugins'
      prefixed CSS classes (`affiliates-*` / `ecom-*` / etc.) to a
      polished brand-aware default with zero plugin-side churn.
      Mobile collapse via `MobileNav.tsx` slide-over (focus-trapped,
      Esc-to-close, auto-close on route change). Smoke harness
      `scripts/smoke-ux.mjs` + `npm run smoke:ux` hits 8 pages × 3
      viewports (375/768/1280). Chapter
      `04-ux-accessibility-pass.md` + audit `04-ux-audit.md` + MASTER
      rows #45 / #46. tsc clean. R2 deferred: ConfirmDialog adoption
      across 29 `confirm()` sites, useArrowNav adoption, toast system,
      brand-orange→accent rewrite, real Playwright visual regression.
- [x] **T5 R1 — Luv & Ker portal** — DONE. Phase A+B scaffold
      (`8f0bb01`) + Phase C+D pages+proxy (`2fc3ae1`) + Phase E smoke
      pass + dev-default upstream + 502 fallback + chapter
      `04-client-portal-luv-and-ker.md` + MASTER row #43. `clients/luv-and-ker/`
      boots `npm run dev -p 4040` clean; tsc clean; storefront landing,
      branded login, iframe-able embed login, gated /account|/orders|/affiliates
      (redirects to /login when unauth), shop with placeholder fallback,
      proxy round-trips to localhost:3030 (or PORTAL_API_ORIGIN) — all 200/3xx
      as expected. Ready for T2 R11's generator to reverse-engineer.
- [x] **T6 R1 — Deployment + domains + observability** — DONE.
      Phase A Vercel monorepo (`359b476`) + Phase B env-var taxonomy
      (`ef2e82f`) + Phase C `@aqua/plugin-domains` (`a943673`,
      mislabel-bundled under T5's outbox commit due to parallel
      staging — content correct, 8/8 smoke pass, tsc clean) +
      Phase D observability wrapper (`6045568`) + Phase E chapter
      `04-deployment-domains-observability.md` + MASTER row #44.
      Single Vercel project deploys portal + bundled milesymedia
      static; per-Live-client portals = separate Vercel projects.
      `@aqua/plugin-domains` lifted from 02; without VERCEL_TOKEN it
      captures hostname locally + manual-DNS runbook applies.
      Sentry server wrapper is env-gated optional-dep — no rewire of
      existing routes; production turn-on = npm install
      @sentry/nextjs + set SENTRY_DSN + redeploy. Foundation pending:
      domains plugin workspace dep + transpilePackages +
      side-effect-import + `_registry.ts` append +
      `ActivityCategory` += "domains".

## Done — Round 1
- [x] **T1 — Foundation** — shipped. `04-the-final-portal/portal/` scaffolded
      on Next 16 + React 19 + Tailwind 4. Plugin runtime, three-level
      tenancy (Agency/Client/EndCustomer), HMAC cookie auth with role +
      tenant-scope gating, server-rendered chrome with brand-kit injector,
      file-backed storage abstraction. Working `/`, `/login`, `/embed/login`,
      `/portal/agency` after first-run bootstrap. `npm run build` and
      `npx tsc --noEmit` both clean. See
      `context/prior research/04-foundation.md`.
- [x] **T2 — Fulfillment plugin** — shipped. See `context/prior research/04-plugin-fulfillment.md`. tsc-clean standalone. Pending: foundation wires `PluginRuntimePort` + `PluginRegistryPort` (T1) and brokers `applyStarterVariant` adapter (T3 stubbed body, signature locked).
- [x] **T3 — Website-editor port** — shipped. `@aqua/plugin-website-editor`
      at `04-the-final-portal/plugins/website-editor/`. Manifest (8 navItems /
      11 pages / 41 api / 58 storefront.blocks / 8 features), full server
      runtime (pages.ts variant helpers + themes/content/sites/embeds/
      preview/discovery), `applyStarterVariant({agencyId, clientId, role:
      PortalRole, variantId, actor?}, storage)` for T2, 6 starter JSON
      trees, storage-keys namespacing under `t/{agencyId}/{clientId}/...`,
      smoke 31/31 pass, tsc clean. Block component UIs and admin page UIs
      ship as Round-1 structural placeholders for Round-2 lift. See
      `context/prior research/04-plugin-website-editor.md`. Pending T2
      one-line refactor: swap `PortalVariantPort.role: Role` →
      `role: PortalRole` (commander confirmed correction).

## Deferred
- [ ] NotebookLM setup — skipped for now. Revisit when we need outside research.

## Done — Round 2
- [x] **T1 R2 — wire fulfillment + demo seed** — shipped.
      `@aqua/plugin-fulfillment` mounted as `file:..` workspace dep
      (Turbopack + `install-links=true` + `transpilePackages`). Foundation
      port adapters bridge T2's ports → T1 server modules. Catch-all
      routes resolve `/portal/agency/[...rest]`,
      `/portal/clients/[clientId]/[...rest]`,
      `/api/portal/[plugin]/[...rest]` to plugin pages + handlers.
      Agency creation auto-installs core plugins (fulfillment seeds 6
      phase defaults via `onInstall`). `/api/dev/seed-demo` provisions
      Demo · Aqua + Felicia mirror at onboarding stage with half-ticked
      checklist. Smoke pass end-to-end. See
      `context/prior research/04-foundation-round2.md`.
- [x] **T2 R2 — ecommerce plugin** — shipped.
      `@aqua/plugin-ecommerce` at `04-the-final-portal/plugins/ecommerce/`.
      `scopePolicy: "client"`, `requires: ["website-editor"]`. Server
      domain (orders, products, gift cards, referrals, discounts, billing
      vestigial) backed by per-install storage. 23 API routes including
      Stripe webhook (idempotent) + checkout + billing-portal — keys read
      from per-install config, NOT env. 13 admin pages, 7 storefront UI
      components, CartContext with API-driven inventory reservations.
      8 block ids contributed (rendering delegated to T3). tsc-clean
      standalone. See `context/prior research/04-plugin-ecommerce.md`.
      Foundation pending: `registerEcommerceFoundation` call site + T3
      block-renderer registration.
- [x] **T3 R2 — Block + admin UIs lift** — shipped. Phase A: 58 blocks
      faithfully ported from 02 (absorbed in `e702415`). Phase B:
      canvas + admin siblings + libs (`5ce6cbf`) + 1429-LOC EditorPage
      faithful port (folded into `f678ef6`). Phase C: 444-LOC
      PortalsPage (`c10432e`). Phase D: Sections / Assets / Popups /
      Themes (`36404ea`). tsc-clean throughout, smoke 31/31. Final
      DONE @ `079a666`. Round-3 deferred: PageDetailPage /
      CustomisePage / ThemeDetailPage / SitesPage (depend on libs not
      yet lifted or file-size budget). Chapter
      `context/prior research/04-plugin-website-editor-round2.md`,
      MASTER row #29.

## Done — Round 3
- [x] **T3 R3 — CustomisePage + ThemeDetailPage + cross-plugin block
      renderers** — DONE. Goal A: 898-LOC CustomisePage faithful port
      with five tabs (Branding / Sidebar / Custom-tabs / Login /
      Export) + new lib/customise + lib/sidebarLayout +
      lib/loginCustomisation upgrade. Goal B: RENDERER_REGISTRATIONS
      cross-plugin renderer map (58 native + 8 ecommerce + 3
      memberships + 3 affiliates) + getBlockRenderer +
      registerExternalBlockRenderers + BlockRenderer consults the map
      first. 6 NEW stub block components for memberships + affiliates
      (paywall/signup/tier-grid/affiliate-signup/payout-meter/
      leaderboard) hitting their plugins' API namespaces. Goal C:
      ThemeDetailPage clean rewrite (architectural mismatch with 02's
      localStorage singleton — wired to plugin's per-site lib/theme.ts
      instead) + PagesPage re-pointed at EditorPage list. tsc clean;
      smoke 40/40 (was 31; +9 cross-plugin renderer tests). Chapter
      `context/prior research/04-plugin-website-editor-round3.md`,
      MASTER row #34. R4 deferred: PageDetailPage / SitesPage (3264
      LOC) / customise server-side persistence.
- [x] **T2 R3a — phase-lifecycle smoke (Goal A)** — shipped. Two smoke
      harnesses under `04-the-final-portal/plugins/fulfillment/src/__smoke__/`:
      in-process `lifecycle.test.ts` (9 `node:test` tests, mocks all 8
      foundation ports, walks `seedPhases → createWithPhase → tick → advance ×4`)
      and HTTP `lifecycle.http.mjs` (~50 assertions against a live
      `npm run dev`, hits seed-demo + login + every fulfillment endpoint).
      Surfaced + fixed Bug A: default phase presets referenced unregistered
      plugins (`brand`, `forms`, `email`, `analytics`, `seo`, `support`)
      causing 422 on `phase/advance`. Trimmed presets to plugins that
      actually ship (`website-editor`, `ecommerce`). Variant id soft-fail
      (Bug B) is per-architecture (logged for T3 alignment, not blocking).
      Both smokes 0 failures. `npm run smoke` script added. See
      `context/prior research/04-phase-lifecycle-smoke.md`.
- [x] **T2 R3b — agency-HR plugin (Goal B)** — shipped.
      `@aqua/plugin-agency-hr` at `04-the-final-portal/plugins/agency-hr/`.
      `scopePolicy: "agency"`, `core: false` (opt-in). Staff +
      departments + leave-request domain (Staff with status/role/manager
      graph + locationType/hourlyRate; Department tree with cycle-safe
      parentId; LeaveRequest with pto/sick/sabbatical types and
      pending/approved/rejected workflow). Three services with cycle
      checks + email uniqueness. Four ports declared (TenantPort,
      ActivityLogPort, EventBusPort, PluginInstallStorePort). 13 API
      routes at `/api/portal/agency-hr/*` with per-route
      `visibleToRoles`. 5 admin pages + 4 client components. Foundation
      adapter (`registerAgencyHrFoundation` + `containerFor` singleton)
      ready for T1 to side-effect-import. `onInstall` seeds five default
      departments. tsc-clean; 6/6 smoke tests green. See
      `context/prior research/04-plugin-agency-hr.md`. Foundation
      pending: workspace dep + transpilePackages + side-effect-import
      file + `_registry.ts` append + `ActivityCategory` += "hr".
- [x] **T1 R3 — three plugins live** — shipped. `@aqua/plugin-ecommerce`
      and `@aqua/plugin-website-editor` mounted as workspace deps
      alongside fulfillment. `_routeResolver.ts` handles two manifest
      path conventions side-by-side (relative `:name` and full-URL
      `[name]`). API path leading-slash normalised. Real
      `portalVariantAdapter` calls T3's `applyStarterVariant` bound to
      the website-editor install's plugin storage.
      `ecommerceFoundation.ts` side-effect-import registers
      `EcommerceFoundation` at boot. Cross-team patch added re-exports
      to `plugins/ecommerce/src/server/index.ts`. `ActivityCategory`
      extended with `"ecommerce"`. Demo seed installs both client-scoped
      plugins on Felicia. Smoke green: 14 pages 200 + multi-plugin API
      dispatch. See `context/prior research/04-foundation-round3.md`.

## Done — SOPs (T2)
- [x] **T2 R002 — `@aqua/plugin-sops`** — DONE.
      Lightweight SOP shelf for Aqua HQ's `SOPs, Docs & Templates`
      sidebar slot (chapter #59 §2 + §9c). `scopePolicy: "agency"`,
      `core: false`, no required deps. Domain: `Sop {id, agencyId,
      title, slug, body (markdown), tags: TagFamily[], status:
      draft|published|archived, createdAt/By, updatedAt/By}`. Five tag
      families per chapter §9c — sales / service / leads / standards /
      mastery. SopService: list (tag/status/case-insensitive title-query
      filters) + get + getBySlug + create (slug uniqueness w/ `-2`/`-3`
      suffix, invalid + duplicate tags filtered) + update (partial,
      emits `sops.sop.published` when status flips) + setStatus +
      archive + restore + tagCounts (non-archived) + seedDefaults
      (idempotent — only seeds empty index, 9 chapter §9c titles).
      Tiny zero-dep markdown renderer (heading / fenced code / list /
      inline code / bold / italic). 8 API routes at `/api/portal/sops/`
      (list / get / tags / create / update / archive / restore / seed).
      3 admin pages: SopListPage (left filter pane w/ 5 tag-family
      counts + status presets + search + `+ New SOP` CTA; right list)
      + SopDetailPage (split-view textarea + rendered preview) +
      SopReadPage (read-only). `onInstall` seeds defaults when answer
      truthy. Smoke 13/13 pass via tsx --test; tsc clean. Chapter
      `04-plugin-sops.md` + MASTER row #63. Foundation pending: 5-step
      registration (workspace dep + transpilePackages + side-effect
      import + `_registry.ts` + ActivityCategory `+= "sops"`).
      Cross-team: T1 sidebar `/portal/agency/sops` placeholder maps
      live once registered; Employee HQ later swaps `visibleToRoles`
      for `requires: ["sops.view"]` / `requires:
      ["sops.tag.<family>"]`. HARD BOUNDARY honoured — zero touches to
      milesymedia website/ or business-os/.

## Done — Kanban (T2)
- [x] **T2 — Kanban R2 — Aqua-real templates + founder-todos** — DONE.
      Swapped placeholder template columns for Ed's actual Aqua
      operating columns from chapter #59 §6+§11. fulfillment-mirror →
      Epic Intro / Blueprint Setup / Diagnostics / Brand Builder /
      Traffic / Mastery. lead-pipeline → Pre-Sales / DCB / DCD /
      Invoice Sent / Aqua Incubator Active / Shock & Awe Sent / System
      Build / Onboarded. client-tasks → Backlog / This Week / Doing /
      Waiting On Client / Review / Done. blank unchanged. NEW 5th
      template `founder-todos` (Today / This Week / Backlog / Done)
      gated to Founder role + agency-scope. Domain: TemplateDefinition
      gains `requiresRole?: string` (case-insensitive) + `requiresScope?:
      BoardScope` (BoardService.create enforces). New
      `listTemplatesForRoles(roles?)` helper + `GET /templates?role=`
      query param. Existing boards untouched by registry changes
      (template-id-tag isolation, smoke #18). Smoke 12→18 (6 new
      cases). tsc clean. Chapter `04-plugin-kanban.md` R2 section
      appended; MASTER row #60 updated. Foundation pending: surface
      actorRoles on PluginPageProps; project Founder role for Ed.
- [x] **T2 — `@aqua/plugin-kanban`** — DONE.
      Generic kanban engine + 4 install-time templates
      (fulfillment-mirror / lead-pipeline / client-tasks / blank).
      `scopePolicy: "either"` — installs at agency or per-client; scope
      contract enforced (mismatched scope on creation rejected;
      cross-scope `get()` returns null). Domain: Board / Column
      (embedded) / Card with renormalized integer order. BoardService
      (CRUD + addColumn + renameColumn + recolorColumn + moveColumn +
      removeColumn — refuses if cards present or last column).
      CardService (CRUD + moveCard renormalizing both src+dst columns
      + archive closes gap + restore appends back). 16 API routes at
      `/api/portal/kanban/`. 3 admin pages (BoardListPage with template
      picker, BoardDetailPage server-rendered with HTML5 drag/drop +
      keyboard hooks, ArchivedCardsPage cross-board listing). Coexists
      with fulfillment phase-board (additive, not replacement). Vendored
      types — tsc-clean standalone, zero runtime deps. Smoke 12/12 pass.
      Chapter `04-plugin-kanban.md` + MASTER #60. Foundation pending:
      standard 5-step wire-up; `ActivityCategory` += `"kanban"`. R2
      follow-up: swap placeholder columns for chapter #59 Aqua-HQ-aware
      sets. HARD BOUNDARY honoured: zero touches to `milesymedia
      website/` or `business-os/`.

## Done — Round 12
- [x] **T2 R12 — Stripe Connect payouts for affiliates** — DONE.
      Affiliate.stripeAccountId + stripeOnboardingStatus
      ("pending"|"complete"|"restricted") added to domain. New
      StripeConnectPort (createAccount / createOnboardingLink /
      retrieveAccount / createTransfer with idempotencyKey /
      verifyWebhookSignature) declared locally — no `stripe` or
      `@aqua/plugin-ecommerce` import; foundation projects from
      ecommerce's per-install Stripe key (mirrors R4 memberships
      StripePort precedent). NEW `OnboardingService` (`server/onboarding.ts`)
      with idempotent `start()` (reuses existing Connect account on
      retry), `applySnapshotForAccount()` for webhook entry, and
      `snapshotToStatus()` collapsing `chargesEnabled / payoutsEnabled
      / detailsSubmitted / disabledReason` into the 3-state status.
      `PayoutService.processPayout(id)` validates complete onboarding
      + creates Stripe Transfer with idempotencyKey `payout:<id>` +
      records externalRef + flips scheduled→in_progress; throws
      cleanly when stripeConnect absent. `confirmTransferPaid(transferId)`
      is the `transfer.paid` webhook entry — flips in_progress→completed,
      attributions paid, lifetime earnings advance; idempotent on
      redelivery. 4 routes added: POST /payouts/process (admin),
      POST /me/stripe/onboard + /me/stripe/refresh (customer),
      POST /webhooks/stripe (PUBLIC, verifies signature internally;
      handles account.updated + transfer.paid). PayoutsList admin
      gains "Process via Stripe" button (disabled with reason caption
      when affiliate's onboarding incomplete; in_progress payouts show
      "Stripe transfer pending" caption). MyAffiliatePanel customer
      gains "Payouts setup" section with 4 shapes (undefined → Set up
      payouts via Stripe; pending → Resume + I'm done refresh;
      restricted → Reopen + needs-info copy; complete → green check).
      Container builder gains `onboarding: OnboardingService | null`;
      foundation adapter + containerWithDeps propagate optional
      stripeConnect. Smoke `src/__smoke__/affiliates.test.ts` grew
      9→14 cases (added steps 9-13: onboard start + idempotent reuse,
      account.updated snapshot flips status, processPayout requires
      complete + idempotency-key shape `payout:<id>` + retry short-
      circuit, transfer.paid completes + lifetime earnings + redeliver
      idempotent, processPayout refuses without Stripe). `npx tsc
      --noEmit` clean; 14/14 smoke pass. Catalogue 99/99 across 11
      plugins. Chapter `04-plugin-affiliates-round12-stripe-connect.md`
      + MASTER row #55. Foundation pending: T1 lift Stripe Connect
      driver into `@aqua/foundation/stripeConnect.ts` (share with
      memberships' StripePort eventually), per-install
      `stripeWebhookSecret` encrypted at rest, subscriber forwarding
      `affiliate.stripe_onboarding_status_changed` →
      email-sender for welcome/restricted notifications. NOT in scope
      (R13+): 1099-K, auto-cadence, transfer.reversed,
      multi-currency UX.

## Done — Round 11
- [x] **T2 R11 — Portal-export plugin** — shipped.
      `@aqua/plugin-portal-export` at
      `04-the-final-portal/plugins/portal-export/`. `scopePolicy: "either"`,
      `core: false`, no hard deps (soft-reads website-editor via
      optional `WebsiteEditorReaderPort`). Generator that materializes
      a Live client's content into `clients/<slug>/` as a self-contained
      Next.js app — mirrors T5's `clients/luv-and-ker/` shape exactly
      (package.json with file:.. plugin workspace deps, next.config.ts
      with security headers + CSP, tsconfig + postcss + tailwind with
      brand injected, src/app/{layout, page, globals.css}, src/lib/
      {brandKit, portalConfig}, portal-config.json with
      `_generatedFingerprints` ledger).
      **Idempotent re-export** via fingerprint ledger: on re-run the
      diff classifies each planned file as added (write) / changed
      (we owned, overwrite) / preserved (operator hand-edited, KEEP) /
      unchanged. Operator hand-edits to materialized files are
      preserved byte-for-byte; first-time runs treat all existing
      files as preserved (no ledger means no claim of authorship).
      Domain: PortalPreset, CollectedClientState, MaterializedFile,
      ExportPlan/Diff/Record, PortalConfigDoc. Two services
      (PresetService + ExportService — collect → plan → diff →
      export(write); HistoryService folded into ExportService.
      listHistory/getHistory). Five standard ports + 2 OPTIONAL:
      `WebsiteEditorReaderPort` (active variants + custom content +
      theme tokens), `FilesystemPort` (foundation supplies real
      `fs/promises` in dev; smoke injects in-memory Map).
      8 API routes (presets list/get + state preview + plan + export +
      history + pr/open stub). 3 admin pages (Export / Presets /
      History). 4 v1 preset starters bundled JSON: `skincare-brand`,
      `service-portal`, `membership-only`, `affiliate-only`.
      Brand-kit override on plan(): client wins over preset default;
      explicit brandOverride beats both. Editor-supplied portal
      variants override preset where they overlap; preset fills
      missing roles.
      tsc-clean; 5/5 smoke pass via
      `npx tsx --test src/__smoke__/export.test.ts`. Foundation
      pending: workspace dep + transpilePackages + side-effect-import +
      `_registry.ts` append + `ActivityCategory` += "export" +
      FilesystemPort wiring (real `fs/promises`, root at
      `04-the-final-portal/clients/`) + WebsiteEditorReaderPort
      projection from website-editor + GitHub PR-open integration
      (replaces `pr/open` stub; out of scope for v1).
      T2 plugin catalogue now: 11 shipped (fulfillment / ecommerce /
      agency-HR / memberships / affiliates / agency-finance /
      agency-marketing / client-crm / forms / email-sender /
      portal-export); 94 smoke cases catalogue-wide. See
      `context/prior research/04-plugin-portal-export.md`.

## Done — Round 10
- [x] **T2 R10 — Email-sender plugin** — shipped.
      `@aqua/plugin-email-sender` at
      `04-the-final-portal/plugins/email-sender/`. `scopePolicy: "agency"`,
      `core: false`, no hard deps. Single point of egress for every
      transactional / notification email across the agency portal.
      Domain EmailMessage (state machine queued→sending→sent/failed/bounced,
      idempotency key `${triggeredByPlugin}:${externalRef}` else
      `${plugin}:${sortedTo}:${fnv1a(body)}` — collapses event-bus
      retries), SenderIdentity (per-agency, isDefault flag, status
      active/pending/failed, verifyDomain stub), ProviderConfig
      (postmark/sendgrid/resend/smtp/none, masked apiKeyMasked + full
      key kept at `provider/api-key`, webhookSecret, status
      active/unconfigured/error).
      Four services: EmailService (enqueue + state transitions + 4
      cross-plugin subscribers), DeliveryService (queued→sending→
      sent/failed via active driver, retry path via resetForRetry),
      WebhookService (verify-by-driver + dedupe by
      `${RecordType}:${MessageID}` + status update + emit),
      IdentityService, ProviderService.
      Driver pattern: PostmarkDriver (live; injectable fetchImpl,
      query-param `?secret=` exact-match webhook verify), NoopDriver
      (live; synthetic `noop_<id>` ref), StubDriver (sendgrid/resend/
      smtp throw "R11 stub"). Five standard ports + one OPTIONAL
      MarketingTemplatePort (agency-marketing's EmailTemplate store +
      optional render fn — absent → templateless enqueue still works,
      templateId throws cleanly).
      12 API routes including 1 PUBLIC (`POST public/webhook/postmark`).
      3 admin pages (Outbox / Settings / Logs). No storefront blocks
      (server-side only).
      Cross-plugin subscribers declared via `EVENT_SUBSCRIPTIONS` const
      array on the foundation adapter — foundation R6 router reads at
      boot + subscribes 4 handlers on the live EmailService:
      forms.notification.requested → onFormsNotificationRequested,
      membership.subscription_changed → onMembershipSubscriptionChanged
      (welcome/cancellation), affiliate.payout_completed →
      onAffiliatePayoutCompleted, auth.bootstrap.signup →
      onAuthBootstrapSignup. `onInstall` bootstraps default sender
      identity from settings (defaultFromName/defaultFromEmail).
      tsc-clean; 7/7 smoke pass via
      `npx tsx --test src/__smoke__/email-sender.test.ts`. Foundation
      pending: workspace dep + transpilePackages + side-effect-import +
      `_registry.ts` append + `ActivityCategory` += "email" +
      cross-plugin event router subscriber wiring (now load-bearing
      across forms/memberships/affiliates/auth) +
      MarketingTemplatePort projection from agency-marketing +
      catch-all `public: true` honouring for the Postmark webhook.
      T2 plugin catalogue now: 10 shipped (fulfillment / ecommerce /
      agency-HR / memberships / affiliates / agency-finance /
      agency-marketing / client-crm / forms / email-sender); 89
      smoke cases catalogue-wide. See
      `context/prior research/04-plugin-email-sender.md`.

## Done — Round 9
- [x] **T2 R9 — Forms plugin** — shipped.
      `@aqua/plugin-forms` at `04-the-final-portal/plugins/forms/`.
      `scopePolicy: "either"`, `core: false`, no hard deps.
      Soft-integrates with client-CRM/affiliates/memberships via
      cross-plugin event payloads + admin-configurable webhook URLs
      (zero source coupling).
      Domain FormDefinition (11 field kinds, state machine
      draft→published→archived, per-form submissionCount), FormField
      (validation rules + per-kind checks + attributeKey hint for
      CRM), SubmitAction (4 kinds incl. external-webhook),
      Submission (idempotent on fnv1a hash of
      formId+identifier+sortedValues — collapsed re-submits don't
      bump count), FormTemplate (3 seeded defaults Contact /
      Newsletter Signup / Lead Capture).
      Four services (Form/Submission/Notification/Template). Six
      standard ports + one OPTIONAL EmailQueuePort (agency-marketing
      brokers when installed). 13 API routes including 2 PUBLIC
      (`POST public/submit/:formId` + `GET public/form/:formId`).
      5 admin pages — structured FormBuilderPage (no drag-drop in
      v1). 1 storefront block id (`form-render` — T3 owns).
      Stable event payloads (`forms.submission.created`,
      `forms.submission.validation_failed`,
      `forms.submission.status_changed`,
      `forms.notification.requested`).
      tsc-clean; 8/8 smoke pass via `npm run smoke`. Foundation
      pending: workspace dep + transpilePackages + side-effect-import +
      `_registry.ts` append + `ActivityCategory` += "forms" + catch-all
      `public: true` honouring + cross-plugin event router fan-out +
      EmailQueuePort wiring (no-op stub until agency-marketing
      send-time integration ships).
      T2 plugin catalogue now: 9 shipped (fulfillment / ecommerce /
      agency-HR / memberships / affiliates / agency-finance /
      agency-marketing / client-crm / forms); 82 smoke cases
      catalogue-wide. See
      `context/prior research/04-plugin-forms.md`.

## Done — Round 8
- [x] **T1 R8 — milesymedia ↔ portal stitch** — shipped.
      Stitch milesymedia static site + Aqua portal as ONE origin in
      both dev (`localhost:3030`) and production (Vercel single
      project). Files stay separate in repo per Ed's "puzzle piece"
      requirement (`milesymedia website/` + `portal/`).
      `portal/scripts/prepare-milesy.mjs` copies the static site →
      `portal/public/_milesy/` (idempotent; runs as `predev` and
      `prebuild` so dev + Vercel build use one canonical copy step).
      `next.config.ts` `rewrites().beforeFiles` mirrors the production
      `vercel.json` rewrites (`/`, `/index.html`, `/login.html`,
      `/admin.html`, `/styles.css` → `/_milesy/<file>`). T6 R1 Phase A
      shipped the production-side root `vercel.json` +
      `build-portal.mjs` (commit `359b476`); R8 mirrors the surface
      in dev. `npm run dev:all` is an alias for `npm run dev` —
      Q-ASSUMED single-port single-server over the prompt's
      two-server `concurrently` pattern (simpler, no extra script,
      no config drift). Static site `data-portal-base` meta defaults
      to `""` (same-origin) since R8 across all 3 pages
      (index/login/admin); `?portalBase=…` query overrides for
      standalone-preview workflows. R4 demo + R5 end-customer
      chapters appended with same-origin notes. `public/_milesy/`
      added to portal `.gitignore`. Smoke green: `/` → milesymedia
      landing, `/styles.css` → 200 text/css, `/login` → Next.js
      login, `/login.html` → static login mock, `/admin.html` →
      static admin mock, `/demo` → 307 + isDemo cookie. tsc clean.
      See `context/prior research/04-milesymedia-portal-stitch.md`.
- [x] **T2 R8 — Client-CRM plugin** — shipped.
      `@aqua/plugin-client-crm` at
      `04-the-final-portal/plugins/client-crm/`. `scopePolicy: "client"`,
      `core: false`, no hard deps (soft-integrates with memberships +
      ecommerce via OPTIONAL injected ports). Pairs with T1 R5:
      end-customer signups auto-appear as Contacts via `mergeFromUser`.
      Domain Contact (per-(agency,client) email uniqueness, optional
      endCustomerUserId link, status active/unsubscribed/bounced/deleted,
      tags + attributes, firstSeenAt + lastSeenAt with engagement bumps),
      Segment (4 seeded defaults All/New/Engaged/Dormant with sliding
      `{{now-Nd}}` window resolution, AND-of-conditions evaluator),
      ActivityRecord (10 kinds, idempotent cross-plugin ingest).
      Three services (Contact/Segment/Activity). Six standard ports +
      two OPTIONAL (MembershipBenefits / EcommerceOrders).
      14 API routes including `/events/ingest` for foundation event
      router. 6 admin/customer pages including auto-bootstrapping
      `MyProfilePage`. 1 storefront block id `crm-contact-form`.
      Bulk import (≤1000 rows). tsc-clean; 10/10 smoke pass via
      `npm run smoke`. Foundation pending: workspace dep +
      transpilePackages + side-effect-import + `_registry.ts` append +
      `ActivityCategory` += "crm" + UserPort projection +
      MembershipBenefitsPort + EcommerceOrdersPort wiring + cross-plugin
      event router. T2 plugin catalogue now: 8 shipped (fulfillment /
      ecommerce / agency-HR / memberships / affiliates / agency-finance /
      agency-marketing / client-crm); 74 smoke cases all green. See
      `context/prior research/04-plugin-client-crm.md`.

## Done — Round 7
- [x] **T1 R7 — Postgres backend (production storage)** — shipped.
      Architecture §13's parked v1-required item closed. New
      `src/server/storagePostgres.ts` driver — lazy `pg.Pool` from
      `DATABASE_URL` with TLS auto-detect (Neon / Supabase /
      Vercel Postgres); `loadBlob` / `saveBlob` against a single-row
      JSONB blob in `portal_kv` keyed `__portal_state__`. Slotted
      into the existing `Backend` abstraction in `storage.ts` next to
      file/memory/kv via dynamic import (so `pg` stays out of the
      parse-time path when PORTAL_BACKEND=file). Implicit promotion:
      `DATABASE_URL` set + `PORTAL_BACKEND` unset → postgres takes
      over (prod is "set DATABASE_URL and go"; dev stays on file).
      `scripts/schema.sql` (key/value/updated_at + `portal_kv_key_prefix`
      btree on `text_pattern_ops`), `scripts/migrate-file-to-postgres.mjs`
      (idempotent ON CONFLICT upsert, DRY_RUN=1 supported, exit codes
      0–4), `scripts/smoke-postgres.mjs` (8/8 pass — schema + index +
      round-trip + idempotent re-write + prefix scan + payload-size
      sanity + cleanup). RLS deferred to R8 — single-row blob layout
      would gate the row not the in-blob fields; existing
      `withTenantScope` is the operating defense. Q-ASSUMED documented:
      blob-row over per-key rows so every existing `getState()` call
      site keeps working without consumer refactor. `npm run
      smoke:postgres` + `npm run migrate:file-to-postgres` aliases.
      `.env.example` documents DATABASE_URL + pool tunables. tsc clean.
      Verified end-to-end against a local Postgres (eds@localhost):
      schema applied + migration moved 24KB blob from
      `.data/portal-state.json` into `portal_kv`. Production runbook
      in chapter. The Next-hosted HTTP smoke against postgres was
      blocked by a parallel session holding the Next single-instance
      dev lock; the postgres-direct smoke covers the driver surface
      independently. See
      `context/prior research/04-foundation-round7-postgres.md`.
- [x] **T2 R7 — Phase preset consolidation + agency-marketing
      plugin** — shipped.
      Goal A (commit `a80daa9`): updated `DEFAULT_PHASE_PRESETS` in
      fulfillment/src/server/presets.ts to reflect the actual plugin
      lifecycle — Discovery=[website-editor], Design=[website-editor],
      Development=[website-editor, ecommerce], Onboarding=[+memberships],
      Live=[+affiliates], Churned=[]. Added soft-fail in
      TransitionService.advancePhase + ClientLifecycleService.createWithPhase:
      when runtime returns "not found"/"not in registry"/"not registered"
      error, the install is SKIPPED (WARN activity entry +
      `phase.preset_plugin_skipped` event), phase still advances.
      AdvancePhaseResult gains `skipped: { pluginId, error }[]`;
      installs[i] gains optional `skipped:true`. Real registry-side
      errors (auth/scope/dep) still hard-fail. Lifecycle smoke
      extended with R7 describe-block: catalogue assertion + soft-fail
      walkthrough (REGISTRY=[website-editor, ecommerce] only; onboarding
      hop skips memberships, live hop skips memberships+affiliates).
      11/11 smoke (9 original + 2 R7).
      Goal B: `@aqua/plugin-agency-marketing` at
      `04-the-final-portal/plugins/agency-marketing/`.
      `scopePolicy: "agency"`, `core: false`. Domain Campaign (state
      machine draft→scheduled→running→paused/completed→archived,
      budget+goal+result rollup), Lead (funnel new→contacted→qualified
      →converted/unqualified/lost with re-engage paths, append-only
      contactHistory, secondary indexes by email/campaign/staff),
      EmailTemplate (3 seeded defaults Welcome/Re-engagement/Newsletter,
      `{{placeholder}}` substitution). Four services
      (Campaign/Lead/Template/Report). Six ports. 13 API routes.
      5 admin pages. campaignSnapshot + leadFunnel reports.
      tsc-clean; 8/8 smoke. Foundation pending: workspace dep +
      transpilePackages + side-effect-import + `_registry.ts` append +
      `ActivityCategory` += "marketing" + UserPort projection.
      T2 plugin catalogue now: 7 shipped (fulfillment / ecommerce /
      agency-HR / memberships / affiliates / agency-finance /
      agency-marketing) — full Milesy-internal trio + customer-facing
      trio. See
      `context/prior research/04-plugin-agency-marketing.md`.

## Done — Round 6
- [x] **T3 R6 — Editor save-to-per-client-repo** — DONE. Four
      goals shipped against ports T2 R11/T6 haven't yet provided —
      graceful degradation hides UI when ports absent so dev mode
      still works. Goal A: SaveTargetToggle topbar widget +
      `lib/saveTarget.ts` (per-client localStorage cursor +
      default-per-phase resolver). Goal B: `lib/savePipeline.ts`
      branches savePage/publishPage/saveTheme/saveCustomPage/
      setActivePortalVariant on save target; auto-falls-back to
      `materialize()` when port returns `fallbackToFullReexport`.
      `server/extensionPorts.ts` declares PortalExportPort + GitOpsPort
      contracts with injection helpers. Goal C: DiffPreviewPane +
      SaveResultBanner ("Saved. N files changed in clients/<slug>/.
      Open commit →"). Goal D: GitStatusPage admin page (panelId
      growth, route `/portal/clients/[clientId]/git-status`) with
      branch + ahead/behind + staged/unstaged file lists + Stage/
      Unstage/Commit/Push/Open PR; `lib/gitOps.ts` 404→
      `{available:false}` graceful degradation. New smoke
      `save-target.test.ts` (25 assertions). Total smoke 92/92 pass
      (42 + 25 + 25). tsc clean. Manifest +1 navItem +1 page.
      Chapter `04-plugin-website-editor-round6.md`, MASTER row #47.
      R7+ deferred: real-time collab, domain-attach UI, auto-stage
      saved files toggle, SSR/static export. Cross-team: T1 brokers
      ports + mounts /api/portal/website-editor/git/* HTTP proxy;
      T2 R11 implements PortalExportPort; T6 R1 implements GitOpsPort.
- [x] **T1 R6 — Foundation mass plugin wire-up + cross-plugin event
      router** — shipped. After R5 the foundation hosted 3 plugins
      live while T2 had 6 more on disk un-wired. R6 catches up — all
      9 plugins installable end-to-end. 6 file:.. workspace deps + 9
      transpilePackages, 6 new `foundation-adapters/<plugin>Foundation.ts`
      side-effect-imports, `_registry.ts` append for all 6 manifests.
      Shared `_foundationPorts.ts` (tenant/activity/events/pluginInstalls
      /user) + `_crossPluginPorts.ts` (ecommerceOrders projections +
      membershipBenefits) keep per-plugin adapters small. `ActivityCategory`
      += hr/memberships/affiliates/finance/marketing/crm. Each
      `register*Foundation` call uses `as unknown as Parameters<...>` to
      bridge plugin-vendored ActivityCategory drift. **Cross-plugin
      event router**: `eventBus.subscribeForPlugin(pluginId, eventName,
      handler)` with tenant-filtered fan-out (only fires for plugins
      installed in the emit's scope). `_eventSubscribers.ts` wires
      affiliates ← `order.created`, client-crm ← order.created /
      affiliate.attribution_recorded / membership.subscription_*. R6
      also widens `_validate.ts` (categories + panel ids) and adds a
      "discovered panels" render path in `sidebarLayout.ts` so
      future plugins ship new panel ids without a foundation patch.
      `membershipsFoundation.stripeFor` returns a NOOP StripePort so
      memberships's containerFor builds in dev (paid flows throw
      clearly; real Stripe SDK adapter is foundation-pending).
      `seedDemoAgency` extended to install 5 client-side
      (website-editor → ecommerce → memberships → affiliates →
      client-crm) + 3 agency-side (agency-hr / agency-finance /
      agency-marketing) for a 9-plugin demo. `scripts/smoke.mjs`
      35/35 pass: /demo cold + 9 install entries + 11 nav URLs 200 +
      6 API surfaces 200 + full POV cycle. tsc + build clean. See
      `context/prior research/04-foundation-round6.md`.
- [x] **T2 R6 — Agency-finance plugin + ecommerce affiliates wiring**
      — shipped.
      Goal A (commit `db60015`): closes the affiliates attribution
      loop. ecommerce now persists `referralCodeId` on `ServerOrder`,
      reads `metadata.referralCodeId` + `metadata.endCustomerUserId`
      from Stripe sessions, and emits `order.created` exactly once
      with full payload (orderId, clientId, amountTotal, currency,
      subtotal=amountTotal+discountAmount, referralCodeId,
      endCustomerUserId, discountSource). `upsertOrderByStripeSession`
      now returns `{ order, isNew }` so the handler can dedupe across
      Stripe webhook retries. New ecommerce smoke at
      `src/__smoke__/order-created-event.test.ts`, 5/5 pass.
      Goal B: `@aqua/plugin-agency-finance` at
      `04-the-final-portal/plugins/agency-finance/`.
      `scopePolicy: "agency"`, `core: false`. Domain Invoice (per-year
      sequence INV-YYYY-NNNN, state machine draft→sent→paid/overdue/
      void/refunded with markPaid as the sole path into paid),
      Expense (pending→approved/rejected→reimbursed, secondary indexes
      by category + staff), ExpenseCategory (six seeded defaults).
      Four services (Category/Invoice/Expense/Report). Six ports
      (Storage/Tenant/User/Activity/Events/PluginInstallStore). 15
      API routes. 5 admin pages including InvoiceDetail with
      renderInvoiceHtml output. RevenueSnapshot reports
      trailing-window invoicesIssued/Paid/Overdue, expensesByCategory,
      monthly aggregate, netCents. tsc-clean; 9/9 smoke pass via
      `npm run smoke`. Foundation pending: workspace dep +
      transpilePackages + side-effect-import + `_registry.ts` append +
      `ActivityCategory` += "finance" + UserPort projection (shared
      with memberships/affiliates). T2 plugin catalogue now: 6
      shipped (fulfillment / ecommerce / agency-HR / memberships /
      affiliates / agency-finance). See
      `context/prior research/04-plugin-agency-finance.md`.

## Done — Round 5
- [x] **T3 R5 — Real cross-plugin block renderers** — DONE.
      Phase A: ecommerceBridge upgraded (real localStorage cart with
      cross-tab sync, real ProductVariantPicker swatch UI,
      goToStripeCheckout adapter); OrderSuccess fetches by
      ?session_id, PaymentButton invokes Stripe, DonationButton
      re-pointed at ecommerce, ProductSearch credentials + correct
      URL. Phase B: 6 stub renderers replaced with real fetches:
      MembershipPaywall consults /memberships/me, MembershipSignup
      corrected body shape `{planId, billing}` + 401/404 flows,
      MembershipTierGrid display-only, AffiliateSignup body shape
      `{payoutEmail, displayName}`, AffiliatePayoutMeter rolls up
      attributions + payouts, AffiliateLeaderboard graceful 404.
      NEW FormRenderBlock (renders 11 field kinds from
      /forms/public/form/:id, submits with thank-you/redirect),
      NEW CrmContactFormBlock (delegates to FormRenderBlock when
      formId set, else built-in contact form). RENDERER_REGISTRATIONS
      grew to 66 entries. New cross-plugin smoke (25 tests); total
      67/67 pass. tsc clean. Chapter
      `context/prior research/04-plugin-website-editor-round5.md`,
      MASTER row #40. R6 deferred: server-side cart, Stripe
      Subscription mode for recurring donations, storefront SSR.
      T2 R10 cross-team: /affiliates/leaderboard,
      /client-crm/public/contact endpoints.
- [x] **T1 R5 — End-customer flow** — shipped. Closes the architecture's
      three-level recursion (Agency → Client → End-customer).
      `users.ts` storage key for end-customers becomes
      `email|c:<clientId>` so two clients of the same agency may both
      have a customer named jane@gmail.com; agency/client tier keep
      the legacy plain-email key. `getUser`/`verifyPassword`/
      `setUserPassword`/`updateUser` accept optional `UserLookupScope`.
      New `POST /api/auth/end-customer/signup` with rate limits +
      `signupsEnabled` gate + 409 on duplicate; issues `lk_session_v1`
      with `clientId + role=end-customer`. `/api/auth/login` accepts
      an embed-supplied `clientId` and tries the per-client pool first.
      `Client.endCustomers: ClientEndCustomerConfig` (`signupsEnabled`
      default true, optional `postLoginReturnUrl`).
      `/portal/customer/page.tsx` is variant-driven — looks up the
      website-editor install, calls T3's `getActivePortalVariant` for
      "account" then "login", renders blocks via `<BlockRenderer>`,
      falls back to a welcome card + customer-panel plugin links.
      New `/portal/customer/[...rest]` catch-all + `resolveCustomerPluginPage`
      in the resolver. `PanelId += "customer"`; `buildSidebar` filters
      by `panelId === "customer"` (or `/portal/customer` href) when
      scope is `customer`. Demo seed adds `demo-shopper@aqua.test`;
      `/demo/toggle` cycles agency → client → customer → agency;
      `DemoBanner` shows three POV labels + "Next view → X" button.
      Embed `LoginForm` carries `clientId` + `allowSignup` + signup
      toggle + parent-frame return URL. tsc + build clean. See
      `context/prior research/04-end-customer-flow.md`.
- [x] **T2 R5 — Affiliates plugin + ecommerce↔memberships discount
      integration** — shipped.
      Goal A (ecommerce edit, commit `640d98b`): extended
      `DiscountService` chain with a 5th step keyed on userId — calls
      injected `MembershipBenefitsPort.getDiscountPercentForUser` and
      applies the largest membership discount, persisting
      `order.discountSource: "membership"` + planId snapshot. New
      `DiscountType: "membership"`. `ServerOrder` gains
      discountSource/discountAmount/discountCode/discountSnapshot/
      endCustomerUserId with idempotent webhook-retry preservation.
      Backward-compat: port absent → null. New ecommerce smoke at
      `src/__smoke__/discount-membership.test.ts`, 7/7 pass.
      Goal B: `@aqua/plugin-affiliates` at
      `04-the-final-portal/plugins/affiliates/`. `scopePolicy: "client"`,
      `requires: ["ecommerce"]`, `core: false`. Domain
      Affiliate/ReferralCode/Attribution/Payout. Four services.
      Six ports including new `EcommerceOrdersPort` (cross-plugin
      order projection — reads `metadata.referralCodeId` until
      ecommerce ships first-class field). 16 API routes, 6 admin
      pages + 1 customer page. 3 storefront block ids. Heavy use of
      secondary indexes for O(1) lookups. tsc-clean; 9/9 smoke pass.
      Foundation pending: workspace dep + transpilePackages +
      side-effect-import + `_registry.ts` append +
      `ActivityCategory` += "affiliates" + UserPort projection (shared
      with memberships) + ecommerceOrders adapter + cross-plugin
      event subscription routing ecommerce `order.created` →
      affiliates `attributions/record`. See
      `context/prior research/04-plugin-affiliates.md`.

## Done — Round 4
- [x] **T3 R4 — SitesPage + PageDetailPage + customPages backend** —
      DONE. Goal A: 3,264-LOC SitesPage faithful port with new libs
      (`sitesAdmin`, `portalSettings`, `themeVariants` rebuilt,
      `portalEditMode`, `domains` Vercel stub). Goal B: faithful port
      of 02's `customPages.ts` (9 typed block kinds, full CRUD,
      onCustomPagesChange listener). Goal C: 269-LOC PageDetailPage
      faithful port consuming customPages — title/slug/nav inputs +
      per-block editors + SEO panel (title/description/OG/canonical/
      robots/JSON-LD) + publish/duplicate/delete + sticky footer;
      RichEditor stub at `components/RichEditor.tsx`. After R4 the
      website-editor admin surface is parity-with-02. tsc clean;
      smoke 40/40 unchanged. Chapter
      `context/prior research/04-plugin-website-editor-round4.md`,
      MASTER row #37. R5 deferred: server-side persistence for
      sitesAdmin/customPages/customise/loginCustomisation; Vercel
      domain proxy; portal-settings persistence; real RichEditor host.
- [x] **T2 R4 — Memberships plugin** — shipped.
      `@aqua/plugin-memberships` at `04-the-final-portal/plugins/memberships/`.
      `scopePolicy: "client"`, `requires: ["ecommerce"]`, `core: false`.
      Domain: Plan + Benefit + Subscription. Four services
      (PlanService / BenefitService / SubscriptionService / WebhookService).
      Seven ports — including new StripePort (decoupled from ecommerce
      per the prompt's preferred default; 13 methods covering customer +
      subscription + checkout + billing-portal + price + webhook-verify)
      and new UserPort (resolve EndCustomerProfile from foundation Users).
      16 API routes split admin / customer / public-webhook
      (`public: true` flag for catch-all bypass). 7 admin pages + 1
      customer-facing "My membership" page. 3 storefront block ids
      (membership-paywall / membership-signup / membership-tier-grid —
      T3 owns rendering). `onInstall` seeds Bronze/Silver/Gold defaults
      ($0 / $9.99 / $24.99 monthly + annual variants). tsc-clean
      standalone; 9/9 smoke pass via `npm run smoke`. Foundation pending
      list: workspace dep + transpilePackages + side-effect-import file
      + `_registry.ts` append + `ActivityCategory` += "memberships" +
      UserPort projection + `stripeFor({agencyId, clientId})` reading
      per-install Stripe keys from the ecommerce install + catch-all
      honouring `public: true`. See
      `context/prior research/04-plugin-memberships.md`.
- [x] **T1 R4 — Milesy Media demo button + sign-in wiring** — shipped.
      Static site declares `<meta name="aqua-portal-base">`; an inline
      rewriter retargets `[data-aqua-action="sign-in"|"demo"]` hrefs at
      load (sign-in → `${base}/login`, demo → `${base}/demo`).
      `SessionPayload` gains optional `isDemo` baked into the HMAC
      cookie. New top-level Route Handlers: `GET /demo`
      (seed-then-cookie-then-redirect to `/portal/agency`) +
      `GET /demo/toggle` (POV flip agency-owner ↔ client-owner via the
      Felicia mirror). Seed body factored into
      `src/lib/server/demoSeed.ts`; `resetDemo()` wipes demo agency +
      every descendant before re-seeding; `/api/dev/seed-demo?reset=1`
      gated reset. `DemoBanner` server component injected at
      `/portal/layout.tsx` so POV toggle spans agency + client surfaces.
      Real `/api/auth/login` never sets `isDemo` — banner only renders
      for sandboxed sessions. Footer "Last deployed YYYY-MM-DD" + README
      doc the bump-on-deploy convention. Smoke green: `/demo` cold,
      toggle both directions, `?reset=1` wipes/re-seeds, real auth
      unaffected. tsc + build clean. See
      `context/prior research/04-milesymedia-demo.md`.

## Up next (after Round 4)
- [x] T3 R2: lift website-editor block UIs + admin UIs from `02` —
      DONE. See above (under "Round 2 in flight" → moved to Done).
      Round-3 follow-ups: PageDetailPage (depends on lifting 02's
      `customPages.ts` localStorage block system distinct from
      EditorPage), CustomisePage (898 lines, deps on adminConfig +
      sidebarLayout + loginCustomisation), ThemeDetailPage (1063
      lines), SitesPage (3264 lines — split across multiple sub-loops).
- [ ] T2 follow-up: real Stripe webhook smoke (foundation already routes
      `/api/portal/ecommerce/stripe/webhook` correctly).
- [ ] Build the first phase-preset end-to-end (create client → pick
      Onboarding → fulfillment installs starter plugins → checklist appears
      → both sides tick → advance phase). Foundation runs the preset
      machinery; T2 owns preset definitions.
- [ ] Demo cron — wire a Vercel cron to `GET /api/dev/seed-demo?reset=1`
      at 04:00 UTC nightly (architecture §8) once we're ready.

## Done
- [x] Phase 0 — Prior research. 18 chapters in
      `01 development/context/prior research/`. Indexed in `MASTER.md`.
- [x] Architecture lock-in. `04-architecture.md` chapter covers:
      pool-model multi-tenancy, Aqua-manifest plugins, server-rendered
      chrome, single-cookie auth, phase lifecycle, brand kit per client.
      14 decisions logged.
- [x] Round 1 terminal prompts drafted (T1 / T2 / T3).
- [x] Vercel pinned to deploy only `04-the-final-portal/milesymedia website/`.
- [x] `eds requirments.md` populated. Drafted by Claude from conversation;
      Ed amends as needed.
- [x] T2 R003 — `@aqua/plugin-activity-inbox` shipped (chapter #74,
      smoke 12/12, chrome bell wired into agency layout via
      `Sidebar.extra`).
- [x] T2 R004 — `@aqua/plugin-credentials-vault` shipped (chapter
      #75, smoke 10/10, AES-256-GCM at rest, rate-limited reveals,
      sharedWith ACL).
- [x] T2 R005 — `@aqua/plugin-notifications` shipped (chapter #76,
      smoke 12/12, 4 pluggable channel drivers email/slack/whatsapp-stub/webhook,
      cooldown dedup per (userId, eventId)).
- [x] T2 R006 — `@aqua/plugin-bookings` shipped (chapter #77, smoke
      12/12, services + weekly availability + slot generator with
      buffer + capacity > 1 group sessions + ICS confirmation email +
      CRM merge on completion; storefront `booking-form` block).
- [x] T2 R007 — `@aqua/plugin-agency-finance` extended (chapter #78,
      smoke 20/20: 11 new R007 cases over Payment + Plan + PnL +
      lock-in + honesty contract; 4 new admin pages; 7 new API
      routes; default landing flipped to FounderDashboardPage).
