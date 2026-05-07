/loop

# T4 — Round 006: BOS lessons → Incubator phase-advance signal

Completing all lessons in a category surfaces a "Mark phase complete?"
CTA on the Incubator. Self-report progression — no auto-advance to
keep operator in control.

## Mandatory pre-read

1. T4 chapter #73 (architecture ref — `bos.lessonProgress` shape).
2. R002 per-phase pages.
3. R005 HC recommendations.

## Scope

**A** — Define mapping `phaseId → requiredLessonIds[]`. Per chapter
#74 copy ref (5 lessons currently shipped).

**B** — Per phase page: progress bar showing N/M lessons complete.
When 100%, render "Ready to advance? Mark Blueprint complete →" CTA.

**C** — Click marks `incubator.phaseProgress[phaseId] = "complete"`,
flips current `incubator.phase` to the next phase, fires a
`incubator:phase-complete` event (consumed by HC + BOS for celebratory
toast).

**D** — Confetti / celebratory animation on advance — small,
respectful (no big modal).

**E** — Chapter update + MASTER row delta.

## NOT in scope

- Auto-advance.
- Per-lesson certificates.

## When done
DONE referencing `006-lessons-to-phase-advance.md`.
