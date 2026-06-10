/loop

# T1 — Round 025: Foundation audit log

Append-only log of sensitive foundation events: role changes, invite
sends/accepts, plugin install/uninstall, client create/archive, login
success/fail. Surfaced read-only at `/portal/agency/settings` Danger
Zone tab.

## Mandatory pre-read

1. R023 settings hub (Danger Zone tab is currently a stub).
2. R024 invites (emit events from accept/revoke).
3. Existing foundation event-emitting hot spots.

## Scope

**A** — Domain `AuditEvent`: id, agencyId, ts, actor (sessionUserId
+ email + role-at-time), action (enum: `role.changed`, `invite.sent`,
`invite.accepted`, `invite.revoked`, `plugin.installed`,
`plugin.uninstalled`, `client.created`, `client.archived`,
`login.success`, `login.failure`), targetKind, targetId, metadata
(small JSON).

**B** — Service `AuditService.append(event)` + `list(agencyId, filter)`.
Storage append-only; no update/delete API.

**C** — Wire emit calls into existing foundation flows: role assignment,
invite create/accept/revoke, plugin install/uninstall hooks, client
create/archive, login handler. Use try/catch around emit so audit
failures never block the underlying action.

**D** — Settings → Danger Zone tab: render scrollable feed (ts · actor
· action chip · target). Filters: action enum + date range. CSV export
button (`GET /api/tenants/audit/export`).

**E** — Permission: `clients.edit` view; Founder-only export.

**F** — Smoke + chapter `04-audit-log.md` + MASTER row.

## NOT in scope

- Tamper-proof signing (R+1).
- Long-term archival to S3 (T6).

## When done
DONE referencing `025-audit-log.md`.
