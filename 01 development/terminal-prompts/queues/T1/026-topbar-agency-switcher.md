/loop

# T1 — Round 026: Topbar agency switcher (WS-C R2 / Phase 12 R1.5)

Ed-as-master flips between agencies via a Topbar dropdown. Re-issues
session cookie scoped to chosen agency. Reuses the `/dev/pov` cookie-
issuance pattern from chapter #123.

Plan: chapter #124 WS-C R026.

## Pre-read

- Chapter #123 §"Multi-agency vision" + `/dev/pov` cookie pattern.
- T1 R025 (this sprint) `agencyIds[]` + `activeAgencyId`.
- `src/components/chrome/Topbar.tsx` (T4 added back-to-website pill).

## Scope

**A** — `<AgencySwitcher>` component in Topbar (left of the back-to-website
pill). Hidden when `session.agencyIds.length <= 1`. Click opens
dropdown listing each agency by name + brand swatch.

**B** — `POST /api/auth/agency-switch` body `{ agencyId }`. Validates
`session.agencyIds.includes(agencyId)`. Re-issues session cookie with
`activeAgencyId: agencyId`. 200 → client reloads.

**C** — Seed an "AquaOasis demo" agency on first boot (idempotent) so
Ed-as-master sees ≥2 agencies post-merge. Brand kit: cool teal +
heritage-lite. Plugin install set: client-crm + bookings + agency-marketing.

**D** — Smoke `§ Agency switcher` (≥8 — switch happy path; rejects
non-member agency; re-issues with new activeAgencyId; topbar hides for
single-agency users; AquaOasis seed idempotent).

**E** — Chapter `04-topbar-agency-switcher.md` + MASTER row.

## NOT in scope
- Domain-aware marketing (Phase 12 R3, post-ship).
- Per-agency lead-magnet packs (Phase 12 R4, post-ship).

## When done
DONE referencing `026-topbar-agency-switcher.md`.
