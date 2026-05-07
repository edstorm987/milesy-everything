# `@aqua/plugin-support-desk` — per-client support tickets

T2 R017 · `scopePolicy: "client"` · alpha · `core: false`

## Why

End-customers need a way to report problems against a specific
client's storefront — order issues, product questions, account
trouble. R017 ships a lightweight helpdesk: a public, honeypot-
protected `support-form` block on the storefront feeds into a
per-client ticket inbox the agency-side staff triage. No SLA timers
yet (R+1), no merge/duplicate detection (R+1) — those are the next
turn of the screw.

## Shape

```
id:           "support-desk"
scopePolicy:  "client"
core:         false
status:       alpha
category:     "support"
```

`scopePolicy: "client"` — every ticket belongs to one client. Smoke
test 10 verifies that two clients of the same agency cannot see each
other's tickets even though they share an `agencyId`.

## Domain

### `TicketStatus` state machine

```
new ──┬─→ in-progress ──┬─→ waiting-customer ──┬─→ resolved ──→ closed
      │                 │                       │                 │
      ├─→ resolved      ├─→ resolved            └─→ in-progress   └─→ in-progress  (re-open paths)
      └─→ closed        ├─→ closed
                        └─→ new
```

Captured in `STATUS_TRANSITIONS` as a per-source list of allowed
targets. `update({status})` rejects out-of-graph transitions with
`InvalidStatusTransitionError` → 409. Re-open is intentional
(resolved / closed → in-progress) so a customer's "actually it's
back" doesn't force a new ticket. Smoke 4 + 9 verify.

`new → resolved` is allowed (a one-shot fix doesn't have to pass
through `in-progress`). `resolved → new` is NOT allowed — re-open is
explicit via `→ in-progress`.

### Auto-flips on reply

- **Agent reply on `new`** → `in-progress` (operator picked it up).
- **Customer reply on `waiting-customer`** → `in-progress` (the wait
  is over).
- All other replies hold status. Smoke 6 verifies.

### `Ticket`

```
{ id, agencyId, clientId,
  ref: "T-0042",            // monotonic per install (`support/seq`)
  subject, body,            // body kept on row + as messages[0]
  customerEmail, customerName?,
  status, priority,         // low | normal | high | urgent
  tags: string[],
  assignedTo?: UserId,
  messages: TicketMessage[],
  createdAt, updatedAt,
  resolvedAt?, closedAt? }
```

Threads live as a flat array on the row — no per-message storage key.
Trade-off: a single read covers the whole thread (good for the detail
page) at the cost of write amplification on long threads. With the
ring-buffer-free shape, this is fine for v1; if a chatty customer
case grows past ~50 messages we'll split the array out (R+1).

### `TicketMessage`

```
{ id, fromKind: "customer"|"agent", authorId?, authorEmail?,
  body, sentAt, attachments: TicketMessageAttachment[] }
```

Attachments hold a `fileRef` into client-files (R010) external-ref
storage — this plugin does NOT inline bytes.

### Auto-assign rules

```
[{ tag: "billing", userId: "user_billing" },
 { tag: "tech",    userId: "user_tech"    }]
```

Rules iterate in declaration order; first matching tag wires
`assignedTo` at create-time. Smoke 7 verifies — a ticket tagged
both `tech` AND `billing` lands with the billing assignee because
that rule comes first in config (the rule order is what matters,
not the tag-array order on the ticket).

### Honeypot

```
HONEYPOT_FIELD = "website_url"
looksLikeBot({ website_url: " " })  // false (whitespace tolerated)
looksLikeBot({ website_url: "http://spam.test" })  // true
```

Storefront form must include a hidden `website_url` input;
non-empty value rejects the submission as bot-spam. The public
create handler **silent-200s** on bot detection — it returns
`{ ok: true, ticket: { ref: "T-0000" } }` without creating the row,
so scrapers can't tell their submission was filtered.

## Services

| Service        | Operations |
|----------------|------------|
| `TicketService` | `create(input)` — auto-assigns + emits `ticket.opened` · `get(id)` · `list(filter)` · `update(actor,id,patch)` — guarded transition + assignee no-op detection · `reply({fromKind,userId?,email?},id,body,attachments?)` — auto-flips status · `onOrderShipped(email,ref)` — subscriber for ecommerce |

### Cross-plugin subscriber — `ecommerce.order.shipped`

When the foundation event bus exposes `on(name, handler)`, the
container wires a subscriber on construction:

```ts
events.on("ecommerce.order.shipped", async (scope, payload) => {
  if (scope.agencyId !== this.agencyId || scope.clientId !== this.clientId) return;
  if (!payload.customerEmail || !payload.ref) return;
  await tickets.onOrderShipped(payload.customerEmail, payload.ref);
});
```

`onOrderShipped(email, ref)` posts a low-noise agent-side follow-up
("Heads-up: order ORD-123 just shipped — closing the loop") on
every OPEN ticket from that email. `resolved` and `closed` tickets
are skipped (the loop is already closed). Smoke 11 verifies.

If the foundation event bus doesn't expose `on` (older shape), the
subscriber simply doesn't wire — graceful degradation, no error.

## API (6 routes)

```
POST   submit       body=form/json (storefront)            PUBLIC + honeypot
GET    honeypot                                            PUBLIC (returns field name)
GET    list         ?status=&priority=&tag=&assignedTo=&q=&unassigned=1   VIEWERS
GET    get          ?id=                                   VIEWERS
PATCH  update       ?id= body=Patch                        ADMINS  (409 on invalid transition)
POST   reply        ?id= body={body, fromKind?}            VIEWERS
```

VIEWERS = owner / manager / staff. Update is admin-only because
status/priority/assignee are triage decisions; staff can read + reply
but not change the shape. `submit` and `honeypot` are PUBLIC so the
storefront form works for unauthenticated end-customers.

## Pages (4)

1. **`InboxPage`** (default) — table of tickets with status chips
   (new=blue, in-progress=amber, waiting-customer=grey,
   resolved=green, closed=neutral) and per-status filter row.
   Empty-state when no tickets.
2. **`TicketDetailPage`** — header (ref + subject + status + priority
   + assignee + tags) + thread list, customer messages tinted blue,
   agent messages tinted green. Reply via API (no inline form yet —
   T4 polish).
3. **`FiltersPage`** — counts by status + priority + tag.
4. **`SettingsPage`** — auto-assign rules viewer + auto-reply
   template viewer.

## Storefront block

```
{ id: "support-form", category: "support",
  defaultProps: { heading, submitLabel, successMessage } }
```

Renders the public submission form; T3 website-editor consumes the
descriptor, T4 polishes the markup. The form must wire a hidden
`<input name="website_url">` (the honeypot field).

## Cross-plugin events

```
support.ticket.opened          {id,ref,customerEmail,tags}
support.ticket.replied         {id,fromKind,messageId}
support.ticket.assigned        {id,assignedTo,auto: true|false}
support.ticket.status-changed  {id,from,to}
support.ticket.resolved        {id}
support.ticket.closed          {id}
support.ticket.reopened        {id}     (resolved|closed → in-progress|new)
```

`auto: true` on the assigned event distinguishes auto-assign-at-
create from manual triage. Useful for an analytics-side metric
("what % of tickets land on the right person without human
triage?").

## Activity log

All entries land under category **`settings`** with the
`support.*` action prefix:

```
support.ticket.opened
support.ticket.replied
support.ticket.assigned         (logged on real change; no-op skipped)
support.ticket.status-changed
```

`status-changed` is logged once per real transition; the kind-
specific `resolved`/`closed`/`reopened` events are event-only
(low-noise — already covered by the status-changed line). Foundation
`ActivityCategory` doesn't yet include `"support"` — flagged **R+1**.

## Smoke 12/12

1. `nextRef` zero-pads (`T-0042`, `T-10000`); `looksLikeBot` tolerates
   missing/empty/whitespace honeypot; rejects non-empty.
2. `create` stores ticket with monotonic ref + initial customer
   message + emits `ticket.opened`; rejects empty subject / body /
   email.
3. `list` filters by `status` + `priority` + `tag` + `unassigned`
   + `query` independently and in combination.
4. `update` — invalid status transition throws
   `InvalidStatusTransitionError`; valid transitions emit
   `status-changed` + the kind-specific
   `resolved`/`closed`/`reopened` events.
5. `resolvedAt` / `closedAt` stamped on first transition; sticky.
6. **`reply` auto-flips status** — agent reply on `new` →
   `in-progress`; customer reply on `waiting-customer` →
   `in-progress`.
7. **Auto-assign by tag** — first matching rule wires `assignedTo`
   at create-time; ticket tagged `["tech","billing"]` lands with
   the billing assignee because `billing` rule comes first.
   Emits `assigned` with `auto: true`.
8. `update({assignedTo})` emits `assigned` with `auto: false`;
   `null` clears; no-op assignment doesn't re-emit.
9. `STATUS_TRANSITIONS` graph — every status has ≥1 outgoing
   transition; no self-loops.
10. **`scopePolicy: "client"` isolation** — two clients of the
    same agency cannot see each other's tickets.
11. **`ecommerce.order.shipped` subscriber** — posts follow-up
    agent message on every OPEN ticket from same email
    (case-insensitive); skips `resolved` / `closed`; skips
    other-email tickets.
12. Activity entries land under category `"settings"` with
    `support.*` action prefix.

## NOT in scope

- **SLA timers** (R+1).
- **Ticket-merge / duplicate detection** (R+1; explicitly flagged
  in the prompt).
- Inline reply form on `TicketDetailPage` — uses the API for now;
  T4 polish.
- Auto-reply email send (settings exposes the template; no email
  dispatch wired).
- Touching `milesymedia website/`, `business-os/`,
  `clients/compass-coaching/` (HARD BOUNDARIES).

## R+1 candidates

- Foundation `ActivityCategory` extension `"support"` so the
  activity feed renders a support-specific chip; ride on
  `"settings"` until then.
- SLA timers — per-priority response-time + breach events.
- Ticket-merge / duplicate detection on subject + email match.
- Auto-reply email send via `@aqua/plugin-email-sender`.
- Inline reply composer on TicketDetailPage (T4 polish).
- Per-message attachments via client-files external-ref upload UX.
- Customer-side ticket viewer (`/portal/customer/support/<ref>`)
  — today the customer only gets the email confirmation; a
  self-service thread viewer would close the loop.
- Tag taxonomy management surface (today: free-form).
- Bulk operations (multi-select inbox → assign / close / re-tag).
- Splitting `messages[]` to a per-message storage key once a
  thread grows past ~50 messages (write amplification).
- Subscribing to `forms.submission.created` to ingest specific
  forms as tickets (alternate path beyond the storefront block).

## HARD BOUNDARIES honoured

Zero touches to `milesymedia website/`, `business-os/`,
`clients/compass-coaching/`. No edits in T1/T3/T4/T5/T6 scopes.
