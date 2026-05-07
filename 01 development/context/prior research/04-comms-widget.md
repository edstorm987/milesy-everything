# `04` Per-client comms widget — WhatsApp + email (T1 R9)

> Authored 2026-05-07. Surfaces chapter §7 Communication SOP — the
> WhatsApp group + email thread that every Aqua client gets — directly
> on the per-client overview header + the agency home grid.

## Files touched

- `portal/src/app/portal/clients/[clientId]/_CommsRow.tsx` (NEW)
  - Client component pinned beneath the client name, above the
    phase-chip row. Surfaces:
    - Emerald **WhatsApp** pill (anchor → `metadata.whatsappLink`)
      or a dashed `+ WhatsApp` placeholder when unset.
    - Blue **mailto** pill (`mailto:metadata.clientEmail`) or a
      dashed `+ Email` placeholder when unset.
    - 🕘 last-contact relative time (`never`/`Nm ago`/`Nh ago`/`Nd
      ago`/full date) — amber palette when delta > 7d.
    - **Mark contacted** button → POSTs `lastContactedAt:"now"`.
    - **Edit** toggle → inline form with WhatsApp + email inputs +
      Save button. Save POSTs the new values + closes the form.
- `portal/src/app/api/tenants/client-comms/route.ts` (NEW)
  - `POST {clientId, patch:{whatsappLink?, clientEmail?,
    lastContactedAt?:"now"|number|null}}` — gated by
    `requireRoleForClient(AGENCY_ROLES)`; persists via
    `updateClient(metadata: {...})`. Light URL/email sanitisation.
    `lastContactedAt:"now"` resolves to `Date.now()`; `null` resets
    to `0` (since `updateClient` shallow-merges metadata, "" is the
    canonical "cleared" sentinel — readers treat both 0 and "" as
    absent).
- `portal/src/app/portal/clients/[clientId]/page.tsx`
  - Imports `CommsRow`. Header now renders `<CommsRow clientId
    initial={...}>` immediately after the client-name `<h1>`. Meta
    type extended with `clientEmail` + `lastContactedAt` keys.
- `portal/src/app/portal/agency/page.tsx`
  - Each client tile in the agency-home grid now carries a 💬 chip
    next to the existing "Last activity Xd ago" line:
    - `💬 never` muted when `metadata.lastContactedAt` is unset.
    - `💬 last contact Xd ago` emerald palette when fresh
      (`Date.now() - lastContactedAt <= 7d`).
    - Same chip but amber palette when stale (> 7d) — matches the
      Communication SOP loop-closure spirit.
- `portal/scripts/smoke.mjs`
  - NEW `§ Comms widget` block: client-overview shows
    `client-comms-row` testid; POST persists the trio; empty body
    → 400; saved WhatsApp link surfaces in the rendered header;
    agency home tile carries the 💬 chip (regex matches both
    `💬 never` and `💬 last contact …`).

## Storage shape

```ts
client.metadata = {
  // Pre-existing keys kept verbatim.
  planTier: ..., whatsappLink: string | undefined,
  stripeLink: ..., lockInPaid: boolean | undefined,
  therapistName: ..., practiceName: ...,
  // R9 additions:
  clientEmail: string | undefined,    // comms-thread email (NOT the portal-account email)
  lastContactedAt: number | undefined // ms epoch; 0/undefined = never
}
```

## Q-ASSUMED log

1. **`whatsappLink` reused as-is** from R2 Aqua reskin. New keys
   `clientEmail` (distinct from the portal-account email
   `client.ownerEmail` in the core schema) and `lastContactedAt`
   added alongside it.
2. **No real WhatsApp integration** — operator-pasted invite URL
   only. Explicit per prompt's NOT-in-scope.
3. **Mailto over send-from-portal** — opens the operator's mail
   client. Send-from-portal is deferred to T2 R009 wiring per the
   prompt's `Goal C` deferral note.
4. **Empty-string sentinel for cleared values.** `updateClient`
   shallow-merges metadata, so we can't truly delete a key.
   Setting to `""` (string fields) or `0` (numeric `lastContactedAt`)
   is the canonical "cleared" marker; readers in `_CommsRow.tsx`
   and the agency tile chip treat both falsy variants as absent.
5. **Agency home chip uses `metadata.lastContactedAt` directly**,
   not a fresh fetch — the value lives on the client row already
   loaded by `listClients(agency.id)`. No extra round-trip.

## NOT in scope

- Real WhatsApp Business / Cloud API integration.
- Send email from portal (deferred T2 R009).
- Communication-log timeline (would belong on a future "Comms"
  per-client tab).
- Touching milesymedia / business-os.

## Smoke results

`§ Comms widget` block adds 5 checks. tsc clean. HARD BOUNDARY
honoured.
