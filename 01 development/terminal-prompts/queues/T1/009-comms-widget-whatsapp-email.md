/loop

# T1 — Round 009: Per-client comms widget (WhatsApp + email)

Per chapter §7 Communication SOP: every client has a WhatsApp group +
email thread. Surface a one-click "Open WhatsApp group" link + the
per-client email address on every per-client overview header.

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §7 Communication SOP.
2. Client metadata schema (R2 Aqua reskin added `metadata.whatsapp`,
   `metadata.email`).
3. `04-agency-shell.md` per-client header layout.

## Scope

**A** — `_CommsRow.tsx` server component pinned in per-client header
(below name, above phase chip). Renders WhatsApp button (green chip
with logo) + Mailto button + Last-contact timestamp.

**B** — Inline edit affordance — operator can paste / update the
WhatsApp group invite URL + per-client email address; saves to client
metadata. Quick-action dropdown also offers "Mark as last contacted"
(stamps `metadata.lastContactedAt`).

**C** — On agency home grid: surface a tiny "💬 last contact 3d ago"
chip on each client tile; flag amber if `> 7d` since last contact
(matches Communication SOP loop-closure spirit).

**D** — Smoke + chapter `04-comms-widget.md` + MASTER row.

## NOT in scope

- Real WhatsApp integration (operator-pasted URL only).
- Email send-from-portal (defer; opens user's mail client via mailto).
- T4 territory.

## When done
DONE referencing `009-comms-widget-whatsapp-email.md`.
