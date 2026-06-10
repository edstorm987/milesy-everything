/loop

# T2 — Round 006: `@aqua/plugin-bookings`

Aqua's audience is therapists; therapists book appointments. This plugin
gives every Live-phase client a calendar-backed booking surface their
end-customers can use. Lift inventory revival list (chapter #58 Tier 1)
called this out as a high-value missing feature.

## HARD BOUNDARIES

- Standard.

## Mandatory pre-read

1. Chapter `04-lift-inventory.md` — reservations/bookings rows.
2. `02 felicias aqua portal work/` — search for any `booking`/`session`/
   `appointment` files, faithfully port if present.
3. Your most-recent T2 plugin chapter for shape mirror.

## Scope

**Goal A — `@aqua/plugin-bookings`**
- `scopePolicy: "client"`, `core: false`. Pairs with `client-crm`
  (optional — when present, completed bookings auto-create CRM
  contacts).
- Domain: `Service { id, label, durationMin, priceCents, capacity?,
  bufferMin?, color?, active }`, `Availability { weekdayPattern: per-
  weekday windows, exceptions: Date[] }`, `Booking { id, serviceId,
  startAt, endAt, status: "tentative"|"confirmed"|"cancelled"|
  "completed"|"no-show", endCustomerEmail, endCustomerName, notes }`.

**Goal B — Storefront block + admin**
- `booking-form` storefront block (gets registered with website-editor
  via existing cross-plugin renderer pattern from R5). End-customer
  picks service → picks day → picks slot → submits with email + name.
- Admin: `BookingsCalendarPage` (week view + day view), `ServicesPage`
  (CRUD), `AvailabilityPage` (weekly schedule editor), `SettingsPage`.

**Goal C — Email confirmation**
- Optional integration with email-sender — when present, sends
  confirmation email + ICS calendar attachment to end-customer +
  optionally agency-side Slack/email via notification channels (T2 005).

**Goal D — Smoke + chapter**
- Smoke: service CRUD, slot generation respects buffer + capacity,
  booking creation idempotent on `(serviceId, startAt, email)`,
  cancellation flow, status transitions, cross-plugin email enqueue
  when email-sender installed. ≥10 cases.
- Chapter `04-plugin-bookings.md`. MASTER row.

## NOT in scope

- Stripe-integrated paid bookings (deferred — operator can add prices
  but payment flow comes later via existing ecommerce port).
- Two-way calendar sync (Google Cal / iCloud) — port shape only.
- Group sessions beyond `capacity`.
- Touching milesymedia / business-os.

## When done

DONE referencing `006-bookings-plugin.md`.
