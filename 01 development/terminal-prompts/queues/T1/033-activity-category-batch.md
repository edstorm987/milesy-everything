/loop

# T1 — Round 033: ActivityCategory enum batch extension

Multiple T2 plugins flagged R+1 `ActivityCategory` extensions when
they shipped (riding on `settings` or `hr` as placeholders). Promote
them all in one batch so activity-inbox styling + filters can light
them up.

Plan reference: T2 round chapter follow-ups across #117 / #118 / #119
/ #126 / #127 / #131 / #137 / #132.

## Pre-read

- Chapters cited above for the placeholder mappings used.
- `src/server/types.ts` — `ActivityCategory` enum.
- `src/components/chrome/ActivityChip.tsx` (or wherever category
  styling lives) for the visual map.

## Scope

**A** — Extend `ActivityCategory` enum with: `"public-funnel"`
(T2 R021), `"bos-auth-gate"` (T2 R022), `"payroll"` (T2 R015),
`"integrations"` (T2 R016), `"support"` (T2 R017),
`"onboarding"` (T2 R018), `"reports"` (T2 R019),
`"feedback"` (T2 R020), `"team-resources"` (T2 R014),
`"resources"` (T2 R013), `"files"` (T2 R010).

**B** — Visual styling map: each gets a chip color + icon. Defer to
existing pattern — don't introduce new chip aesthetics. Detractor
events from feedback plugin (chapter #131) explicitly need
high-severity styling (red border + bell) — wire that.

**C** — Filter dropdown in activity-inbox UI updated to show new
categories.

**D** — Smoke `§ ActivityCategory batch` (≥6 — enum exhaustiveness;
chip styling resolves for each new category; detractor severity
flag; filter shows new entries).

**E** — Chapter `04-activity-category-batch-extension.md` + MASTER row.

## NOT in scope

- Backfilling existing activity rows that used placeholder
  categories — they continue to render under the placeholder; new
  events use the proper category going forward.
- Real activity-inbox layout overhaul (post-ship).

## When done
DONE referencing `033-activity-category-batch.md`.
