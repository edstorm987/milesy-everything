# 04 — Lessons gap final close (T4 R025)

R015 shipped 10 of 17 locked Pro lesson rows; R025 ships the final 7
and closes the chapter #71 lessons content gap entirely. Free tier
now ships with **all 22 lessons** unlocked.

> Per prompt: video / audio versions + per-niche lesson variants are
> out of scope.

## Lessons added (final 7)

| ID                    | Step | Track             | Phase tag(s)                |
| --------------------- | ---- | ----------------- | --------------------------- |
| `daily-rhythm`        | 3.7  | Sales & marketing | brand-builder               |
| `sops-library`        | 4.3  | Operations        | brand-builder               |
| `bos-tutorial`        | 5.1  | Mastery           | blueprint                   |
| `founders-fortune`    | 5.3  | Mastery           | brand-builder               |
| `founder-psychology`  | L.1  | Leadership        | brand-builder               |
| `leadership-scale`    | L.2  | Leadership        | brand-builder               |
| `building-team`       | L.3  | Leadership        | brand-builder               |

Each follows the same shape as R015: hero + lead + outline (4 sections)
+ body (4-section structure with callout + practical prompt) +
`phases:[…]` tag + R006 mark-done toggle target. v1-draft callout at
top of every body opens with the same honesty contract:

> 📝 v1 draft. Cadence patterns / 12 starter SOP templates / quarterly
> facilitator sessions / case studies / etc. deepen in Pro Mastery.

## `database.html` — all rows live, intro rewritten

7 row-changes from `🔒 Pro` lock pattern → live `module.html?id=<id>`
links + green "Open →" CTA. The "5.3 Founder's Fortune" row also lost
its custom "🔒 Mastery" pseudo-status badge and got the standard
"Not started" pip + Bonus-track length.

Intro rewritten:

> Free tier ships with **22 fully-written lessons** — the entire
> library, no locked rows (R025 closed the gap). Foundations · Brand
> & Presence · Sales · Operations · Mastery · Leadership tracks all
> open. Each is a v1 draft (the 60-minute version) — Pro Mastery
> deepens with per-niche walkthroughs, live facilitator sessions, and
> the bigger-team patterns each lesson points at.

## Lesson highlights (substance check)

- **3.7 Daily rhythm** — daily 90 (look/move/close 30s) + Monday +
  Friday + monthly leak-audit cadence.
- **4.3 SOPs library** — 5-line SOP shape (Trigger/Owner/Steps/Tools/Done)
  + 6-tag index (Sales/Delivery/Onboarding/Finance/People/Standards).
- **5.1 BOS tutorial** — sidebar + HC + lessons + daily rhythm walkthrough;
  the user-facing how-to-use-this-portal.
- **5.3 Founder's Fortune** — three forms of leverage (people / capital
  / code-and-content) + the leverage sequence (content → code → people
  → capital).
- **L.1 Founder psychology** — standards-as-ceiling · mood-as-contagion
  · attention-as-asset · doubt-as-information.
- **L.2 Leadership at small-team scale** — context-not-control + 3-meeting
  cadence (standup/retro/1:1) + specific-soon-solo feedback.
- **L.3 Building your team** — when to hire (4-week trigger) / who
  (cover weakness, not strength) / what to pay (top quartile) /
  30-day brief.

## Smoke (verified 2026-05-07)

- All 7 `module.html?id=<id>` URLs return 200.
- `lessons.js` registry now has **22 lesson records** (verified
  `grep -c "track:" === 22`).
- `database.html` `grep -c "bos-row-locked" === 0` — every lock
  pattern removed.
- Each new page renders v1-draft callout + outline + 4-section body +
  next-link + R006 mark-done toggle.

## Q-ASSUMED + R025 follow-ups

- **Pro Mastery cohort** is named consistently across every v1-draft
  callout — the next paid tier above Pro/Free where deeper material
  lives (case studies, live sessions, per-niche walkthroughs). T6 +
  R+1 actually scope it.
- **R006 phase-advance map** is still hardcoded; with R025 closing
  the lesson set, the swap to "derive phase requirements from
  `phases:[…]` field on each lesson" becomes more useful (R+1 trivial).
- **Per-niche lesson variants** out per prompt — niche packs (R004)
  layer through Aqua AI replies + recommended-modules grid instead.
- **Video / audio** explicitly out per prompt.

## Chapter #71 follow-up status

The "**Lessons content gap (15+ locked rows)**" line in chapter #71
is now resolved. R015 (#91) shipped 10; R025 (#100→#101) shipped 7.
22 / 22 lessons live.

## Cross-refs

- R015 (#91) — first 10 lessons; identical shape mirrored here.
- Chapter #74 — copy reference (this round writes the final 7).
- Chapter #71 — open follow-ups (this closes the lessons line).
- Chapter #73 — `module.html` shape (mirrored exactly).
- R006 (#82) — `phases:[…]` tag prepares R+1 derived map swap.
- Chapter `04-incubator-phase-portal.md` — new Mastery + Leadership
  lessons all phase-tagged for R006 consumption.
