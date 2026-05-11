# `@aqua/plugin-bookings` — calendar-backed appointments (T2 R006)

Round-006 of the queue-based T2 worker. Lifts the high-value
"reservations / bookings" feature from chapter #58 Tier-1 lift-
inventory revival list. Aqua's audience is therapists; therapists book
appointments — every Live-phase client now gets a booking surface
their end-customers can use.

## Shape

| Area | Decision |
| --- | --- |
| `id` | `bookings` |
| `scopePolicy` | `client` |
| `core` | false |
| `requires` | (soft only — engine no-ops gracefully when `email-sender` / `client-crm` aren't installed) |
| Storage layout | `services/index` · `services/by-id/<id>` · `availability` (single agency-client doc) · `bookings/index` · `bookings/by-id/<id>` |
| API routes | services CRUD (4) + availability GET/PATCH (2) + slots GET (public) + bookings list/create/transition (3 — create is public for the storefront block) |
| Pages | `BookingsCalendarPage` (week view) · `ServicesPage` (list + create form) · `AvailabilityPage` (read-only weekly grid; rich editor R+1) |
| Storefront block | `booking-form` — picks service → day → slot → submit (registered with website-editor via R5 cross-plugin renderer pattern) |

## Domain

```
Service { id, label, durationMin, priceCents?, capacity≥1 (default 1),
          bufferMin≥0 (default 0), color?, active }
Availability { weekdayPattern: { 0..6 → AvailabilityWindow[] },
               exceptions: ["YYYY-MM-DD"] }
Booking { id, serviceId, startAt, endAt, status: tentative|confirmed|
          cancelled|completed|no-show, endCustomerEmail, endCustomerName,
          notes? }
```

`STATUS_TRANSITIONS` enforces the lifecycle:
- `tentative → confirmed | cancelled`
- `confirmed → completed | cancelled | no-show`
- `cancelled / completed` are terminal
- `no-show → confirmed` (operator markup if customer turned up late)

## Slot generation

`generateSlots(serviceId, [from, to))` walks day-by-day across the
window:

1. Skip days in `exceptions`.
2. For each `weekdayPattern[weekday]` window, stride `max(1m,
   durationMin)` slots.
3. For each candidate slot, check existing **occupying** bookings
   (status ∈ {tentative, confirmed}):
   - **capacity 1**: any time-overlap (extended by `bufferMin` on both
     sides) blocks the slot.
   - **capacity > 1**: same-start overlaps consume one seat;
     non-aligned overlaps block the slot entirely.
4. Returns `{ startAt, endAt, remainingCapacity }`.

Buffer is honoured **on both sides** — a 60-min booking at 10:00 with
30m buffer carves out [09:30, 11:30), so 09:00 (overlaps end) and
11:00 (overlaps start) are also blocked. Test 5 nails this: 8 hourly
windows minus the 10:00, 09:00, 11:00 trio = 5 free.

## Booking creation

`createBooking(input)` is **idempotent** on `(serviceId, startAt,
endCustomerEmail)`:

- Email is normalised (`trim().toLowerCase()`) before comparison so
  `Me@Example.COM` collides with `me@example.com` (test 7).
- A non-terminal duplicate returns `{ booking, deduped: true }` rather
  than a fresh row → idempotency-safe to retry network-flaky storefront
  submits.
- Otherwise we do a full overlap+capacity check (matches the slot
  generator's logic) and throw `BookingConflictError` (mapped to HTTP
  409) when the slot is taken / full / overlaps non-aligned.

After persisting, the engine fan-outs activity + event +
**maybeSendConfirmation** (next section).

## Email + ICS confirmation

`maybeSendConfirmation(booking, svc)`:

1. Returns immediately when the foundation didn't supply an
   `EmailSenderPort` (graceful no-op).
2. Builds an RFC-5545 ICS calendar attachment via `buildICS()` —
   minimal VEVENT, folds at 75 octets, escapes `;,\n`, no
   recurrence/method=REQUEST in v1.
3. Calls `emailSender.send({ to: customer, subject, body, attachments:
   [invite.ics] })`.
4. Failures are swallowed: a downstream email fault must not
   roll back the booking. The notifications plugin (R005) picks up
   retry semantics if wired.

## CRM merge on completion

`transition(actor, id, "completed")` calls `crm.mergeFromBooking({
agencyId, clientId, email, name, bookingId })` when the optional
`CrmPort` is registered. Test 10 verifies the call shape.

## Smoke (12/12)

`tsx --test src/__smoke__/bookings.test.ts`. Cases:

1. Service CRUD round-trip — create + list + update + archive (active
   filter excludes archived, `includeInactive=true` surfaces them).
2. `createService` rejects empty label / non-positive duration.
3. `setAvailability` rejects malformed HH:MM windows.
4. Slot generation respects weekly windows + exceptions; weekend
   yields nothing; `exceptions: ["YYYY-MM-DD"]` zeroes that day.
5. Slot generation respects buffer — booking at 10:00 with 30m buffer
   blocks 09:30..11:30 (so 09:00, 10:00, 11:00 slots all gone → 5 free
   from the original 8 hourly).
6. Capacity > 1 — group session shares the same start; slot reports
   `remainingCapacity`; full slot rejects with `slot full`.
7. `createBooking` is idempotent on `(serviceId, startAt, email)` —
   repeat returns `deduped: true` and the same booking id; only one
   row in storage. Email normalisation catches case-only diffs.
8. `createBooking` rejects taken slot (capacity 1) with
   `BookingConflictError` (HTTP 409 in handler).
9. Status transitions follow `STATUS_TRANSITIONS` — happy-path
   tentative→confirmed→completed; invalid `completed→cancelled`
   throws.
10. Completed transition calls `crm.mergeFromBooking` with email,
    name, bookingId when port present.
11. `createBooking` enqueues confirmation email with ICS attachment
    when `emailSender` installed; verifies attachment filename
    `invite.ics` + body `BEGIN:VCALENDAR`. With `emailSender: null`
    the engine does NOT throw.
12. ICS builder — folds long lines, escapes `;,\\\n`, includes
    minimum RFC-5545 fields (`BEGIN:VCALENDAR`, `UID`, `SUMMARY`,
    `END:VCALENDAR`).

## Files

```
04-the-final-portal/plugins/bookings/
├── index.ts                            (manifest + booking-form storefront block)
├── package.json + tsconfig.json
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          (vendored)
    │   ├── tenancy.ts                  (vendored)
    │   ├── domain.ts                   (Service, Availability, Booking, SlotProposal, STATUS_TRANSITIONS, dayKeyUTC, parseHHMM)
    │   ├── ids.ts · time.ts
    ├── server/
    │   ├── ports.ts                    (StoragePort, ActivityLogPort, EventBusPort, EmailSenderPort, CrmPort, UserPort, TenantPort)
    │   ├── ics.ts                      (buildICS — 75-octet folding, `;,\n` escape, minimal VEVENT)
    │   ├── bookings.ts                 (BookingsService — services + availability + slot gen + booking lifecycle + email/CRM hooks)
    │   ├── foundationAdapter.ts        (register / containerFor)
    │   └── index.ts                    (barrel)
    ├── api/
    │   ├── handlers.ts                 (10 handlers — slots + bookings/create are public for the storefront block)
    │   └── routes.ts
    ├── pages/
    │   ├── BookingsCalendarPage.tsx    (7-column week grid w/ prev/next nav)
    │   ├── ServicesPage.tsx            (table + new-service form)
    │   └── AvailabilityPage.tsx        (read-only weekly grid; PATCH JSON for now)
    └── __smoke__/bookings.test.ts      (12 cases)
```

## NOT in scope

- Stripe-integrated paid bookings — operator can set `priceCents` but
  payment flow is deferred (R+1 via existing ecommerce port).
- Two-way calendar sync (Google Cal / iCloud / CalDAV) — port shape
  only; full sync R+1.
- Group sessions beyond simple `capacity` (no waitlist, no per-seat
  pricing).
- Touching milesymedia / business-os / compass-coaching.

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- Real timezone support — v1 treats HH:MM in a single operating tz
  documented per agency in the operator runbook.
- Rich availability editor — today the AvailabilityPage is read-only;
  weekly schedule editor (drag windows, copy week, exception calendar)
  is the obvious next step.
- Stripe paid bookings via ecommerce port (priceCents already wired).
- Two-way Google Cal / iCloud sync (port shape there, no driver).
- Reschedule flow — today only cancel + new-booking; a true
  reschedule would carry over notes + email customer.
- Waitlists / cancellation auto-fill from a queue.
- Custom intake-form fields per Service (currently only notes).
- Public booking page route — operator-shareable
  `/book/<agency>/<client>` outside the storefront block.
- Notification-channels integration — fire `bookings.booking.created`
  through R005 to the agency-side Slack/email rather than only to the
  end-customer.
