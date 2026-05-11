/loop

# T1 — Round 023: `lead` role + permission grid (WS-A R023)

Adds the `lead` role to the auth model. Free-tier users (HC graduates,
Resources tool users) sit here. Drives the public-funnel WS-B work.

Plan reference: chapter #124 `04-ship-plan-v1.md` WS-A.

## Mandatory pre-read

- Chapter #121 unified vision (`lead` role table).
- R007 effectiveRole + role grid.
- R022 (this sprint, just shipped) post-login redirect.

## Scope

**A** — `Role` enum gains `"lead"`. Update `ROLES` const, type guard,
fallback paths.

**B** — Permission grid: `lead` reads only own user (`account.read`,
`account.update.email-name`). No agency/client/customer scoping —
leads aren't bound to an agency. They're a global tenant.

**C** — `effectiveRole(session)` returns `lead` when
`user.role === "lead"`. `resolvePostLoginPath` (R022) returns
`/business-os` for it.

**D** — `bootstrapAgency` is NOT called for leads — they exist as
standalone users without an agency. Adjust signup flow / public-funnel
plugin (T2 R021) accordingly: lead signup creates user only.

**E** — Defensive: protected route handlers that today assume `agencyId`
on session must tolerate `null` for leads. Add a `requireAgencyScope`
helper that 403s on lead role. Wire it where `getCurrentUser` callers
read agency-scoped data.

**F** — Smoke `§ Lead role` (role-grid cases + `effectiveRole` return
+ requireAgencyScope rejects + post-login redirect lands lead on BOS).

**G** — Chapter `04-lead-role.md` + MASTER row.

## NOT in scope

- HC→lead auto-signup (T2 R021 owns).
- BOS auth gate (T2 R022 owns).
- Lead-to-agency-owner upgrade flow (R+1 post-ship).

## When done
DONE referencing `023-lead-role.md`.
