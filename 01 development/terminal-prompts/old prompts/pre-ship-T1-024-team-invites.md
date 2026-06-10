/loop

# T1 — Round 024: Team invites + role assignment

Invite teammates to an agency by email; on accept they get a role
(Founder / Manager / Specialist / Viewer) and join the agency's roster.

## Mandatory pre-read

1. R007 effectiveRole + role grid.
2. R023 settings hub Team tab placeholder.
3. Foundation auth/session shape.

## Scope

**A** — Domain `Invite`: id, agencyId, email, role, token, status
(pending / accepted / expired / revoked), invitedBy, invitedAt,
acceptedAt?, expiresAt (default 7d).

**B** — Service `InviteService`: create / list / revoke / resolveByToken
/ accept(token, session). Tokens are random URL-safe 32-byte hex.

**C** — Routes: `POST /api/tenants/invites` (create), `GET .../invites`
(list pending), `POST .../invites/revoke`, `GET /invite/[token]` (public
landing page — shows agency name + role + Accept button if signed in,
else Sign-up flow), `POST /api/tenants/invite-accept`.

**D** — Settings hub Team tab: replaces R023 placeholder with real
modal — email + role dropdown + Send. Lists pending invites with revoke
button + active members with role chip.

**E** — Email "send" stub: log to outbox console + write to a NEW
`mockOutbox[]` in foundation storage so smoke can assert. Real email
wiring is T6.

**F** — Smoke + chapter `04-team-invites.md` + MASTER row.

## NOT in scope

- Real email transport (T6).
- SSO / SCIM (R+1).
- Per-resource ACLs beyond the existing role grid.

## When done
DONE referencing `024-team-invites.md`.
