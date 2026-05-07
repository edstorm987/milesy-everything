/loop

# T2 — Round 017: `@aqua/plugin-support-desk`

Per-client support tickets. End-customers raise tickets via storefront
form; agency-side inbox triages. Lightweight Helpdesk shape.

## Mandatory pre-read

1. T2 forms plugin chapter (form submission as ticket entry).
2. T2 activity-inbox chapter (UX shape mirror).

## Scope

**A** — Manifest (`scopePolicy: "client"`). ActivityCategory `"support"`.

**B** — Domain `Ticket`: id, clientId, customerEmail, subject, body,
status (new / in-progress / waiting-customer / resolved / closed),
priority, tags[], messages[].

**C** — `TicketMessage`: id, ticketId, fromKind (customer / agent),
body, sentAt, attachments[].

**D** — Services: TicketService (CRUD + status transitions +
auto-assign by tag).

**E** — 4 admin pages: Inbox · Ticket detail (thread view + reply
form) · Filters · Settings (auto-reply templates).

**F** — Storefront block `support-form` (subject + body + email +
honeypot) → POST creates Ticket.

**G** — Cross-plugin: emits `support.opened` / `.replied` activity
events; subscribes to ecommerce `order.shipped` to optionally auto-
follow up.

**H** — Smoke + chapter `04-plugin-support-desk.md` + MASTER row.

## NOT in scope

- SLA timers.
- Ticket-merge / duplicate detection (R+1).

## When done
DONE referencing `017-support-desk.md`.
