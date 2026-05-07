/loop

# T1 — Round 006: Onboarding Dashboard for active clients

Per chapter §12 deferred list — old portal had `OnboardingDashboardView`.
Visualises a client's progression through Aqua's six phases (Epic Intro
→ Mastery) with per-phase deliverables and a "what's next" panel.

## HARD BOUNDARIES — standard

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §5 (Aqua phases) + §5a (per-phase plugins).
2. `04-agency-shell.md` (R1 + R2) — current per-client overview.
3. `03 old portal/.../eds-old-portal-idea-fixed/src/components/views/OnboardingDashboardView/` + `OnboardingView/` — read-only reference.
4. fulfillment plugin's phase-board (existing rigid-lifecycle UI).

## Scope

**Goal A — `OnboardingDashboardPanel` component**
- Mounted on per-client overview's Overview tab (above the existing
  recent-activity list when phase is one of the six Aqua phases).
- Horizontal phase strip: 6 chips (Epic Intro → Mastery), current
  phase highlighted, completed phases ticked, future phases muted.
- Click chip → expands a deliverables checklist for that phase
  (deliverables = the per-phase plugin install list from §5a, plus a
  small set of milestone tasks operators tick off).

**Goal B — Per-phase deliverables seed**
- Foundation extension: per-phase deliverable list as a constant
  derived from §5a + a hard-coded per-Aqua-phase milestone set:
  - Epic Intro: send welcome, schedule discovery call, gift sent
  - Blueprint: brand audit, system form returned, playbook drafted
  - Diagnostics: foundations report, first website draft
  - Brand: logo + colours + verification, photography
  - Traffic: first ad campaign live, first lead, first sale
  - Mastery: 100 reviews, 200 reviews, monthly retainer signed
- Stored as `client.metadata.onboardingProgress` (per-phase
  `Record<PhaseId, MilestoneState[]>`).

**Goal C — Advance phase action**
- "Mark phase complete → advance" button on the active phase chip;
  validates required deliverables ticked → calls existing fulfillment
  `advancePhase()` to bump the client into the next phase.

**Goal D — Smoke + chapter**
- Smoke: dashboard renders for each phase, chip selection expands
  deliverables, advance flow validates + calls fulfillment.
- Append "Round 006 — Onboarding Dashboard" to `04-agency-shell.md` or
  new chapter. MASTER row.

## NOT in scope

- Real automation of milestone completion (operators tick manually).
- Per-deliverable file uploads.
- Non-Aqua phase names.
- Touching milesymedia / business-os.

## When done

DONE referencing `006-onboarding-dashboard.md`.
