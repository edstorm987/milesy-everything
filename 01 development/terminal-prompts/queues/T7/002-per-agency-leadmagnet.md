/loop

# T7 — Round 002: Per-agency lead-magnet packs (Phase 12 R4)

Today `public/health-check/` is one global lead magnet. For
satellites, each agency should ship its own pack — different
questions, different niche-specific copy, different scoring weights.
Today's HC has localStorage override (`bos.hcQuestions`) which
becomes the substrate.

Plan ref: chapter #123 §"Gaps to close" item #4. chapter #124 Phase 12 R4.

## Pre-read

- T7 R001 domain-aware marketing (must ship before — this round
  consumes the agency-by-domain resolver).
- Chapter #143 AquaOasis Demo (precedent for per-agency content).
- HC source `public/health-check/` (read-only — T4 territory).
  Chapter #123 §"HC schema versioning" (HC_SCHEMA_VERSION migration).

## Scope

**A** — NEW directory pattern
`public/agencies/<slug>/health-check/questions.json` — per-agency
override. Defaults to global pack when absent.

**B** — HC question loader patched (single-line in HC's `bos.js` —
lives in T4 territory; coordinate via Q-BLOCKED if you can't touch).
Reads agency slug from URL or cookie set by middleware (R001),
fetches `/agencies/<slug>/health-check/questions.json`, falls back
to global on 404.

**C** — Seed AquaOasis Demo a real pack — 5-7 therapist-niche
questions (distinct from Milesy's broad-niche set). Save under
`public/agencies/aquaoasis-demo/health-check/questions.json`.

**D** — Smoke `§ Per-agency lead magnet` (≥8 — pack loader resolves
host → slug; fallback to global when no per-agency pack; AquaOasis
pack different from default).

**E** — Chapter `04-per-agency-leadmagnet-packs.md` + MASTER row.

## NOT in scope

- Editor UI for editing per-agency packs (R+1 — operator edits JSON
  directly v1).
- Per-agency BOS lessons (post-ship — separate large surface).
- Multiple lead-magnet variants per agency (post-ship).

## When done
DONE referencing `002-per-agency-leadmagnet.md`.
