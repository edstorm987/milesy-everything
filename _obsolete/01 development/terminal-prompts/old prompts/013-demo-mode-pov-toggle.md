/loop

# T1 — Round 013: Demo mode + agency↔client POV toggle

Per requirements §7: marketing site Demo button drops visitor into a
sandboxed agency with seed data + header toggle to flip between agency
POV and client POV. Polish the existing `/demo` route into a real
demo experience.

## Mandatory pre-read

1. `01 development/eds requirments.md` §7.
2. Existing `/demo` route + seed data.
3. T4 marketing site Demo button placement.

## Scope

**A** — `/demo` lands in a freshly-seeded sandbox agency. Seed = 3
clients across 3 different Aqua phases (Blueprint / Brand Builder /
Mastery), each with realistic kanban + SOPs + activity. Re-seeded on
session start.

**B** — Header POV toggle: "Agency POV" / "Client POV". Client POV
flips into Felicia mirror's per-client portal view (from her side).
Toggle persisted in cookie for the session.

**C** — Demo banner pinned across top: "DEMO MODE — your changes won't
persist past this session" with "Sign up" CTA.

**D** — Iframe-friendly: `/demo?embed=1` strips chrome for marketing
site embed.

**E** — Smoke + chapter `04-demo-mode.md` + MASTER row.

## NOT in scope

- Real signup flow (T6 territory).
- Demo data persistence beyond session.
- T4 territory.

## When done
DONE referencing `013-demo-mode-pov-toggle.md`.
