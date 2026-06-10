/loop

# T4 — Round 023: Aqua AI prompt library — preset prompts

Scripted Aqua AI (R007) responds to ~35 patterns. Add a visible
"prompt library" — preset questions users can click to populate the
chat input, growing on-ramp for new users.

## Mandatory pre-read

1. T4 R007 chapter `04-aqua-ai-scripted.md`.
2. T4 chapter #74 — copy ref / Aqua AI replies.

## Scope

**A** — `lib/aqua-ai-prompts.js` — array of 24-30 preset prompts in
6 categories (Phase help · Strategy · Lessons · Marketing · Operations
· "I'm stuck"). Each prompt has a `text` and a `kind` for analytics.

**B** — Chat panel empty state: render the 6 category chips. Clicking
a category expands its prompts; clicking a prompt writes it to the
input + auto-sends.

**C** — "Try one of these" surfaces below replies when conversation
goes silent for >30s.

**D** — Activity.log emits when prompt clicked.

**E** — Chapter R023 + MASTER delta.

## NOT in scope

- Real AI follow-ups beyond R007 patterns.

## When done
DONE referencing `023-ai-prompt-library.md`.
