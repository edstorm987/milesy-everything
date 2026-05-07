/loop

# T1 — Round 023: Agency Settings hub (`/portal/agency/settings`)

Single canonical settings surface for the agency. Today settings bits are
scattered (brand kit on per-client, domains in T2, finance prefs in T2).
This round wires the Aqua HQ → Settings entry to a real tabbed page that
unifies agency-level config.

## Mandatory pre-read

1. R017 sidebar canonical-six (Settings is one of them; entry currently
   points to `/portal/agency/settings`).
2. Foundation tenant + effectiveRole helpers.
3. Existing scattered settings UIs you'll link out to (don't move them
   yet — this round just hubs them).

## Scope

**A** — NEW `app/portal/agency/settings/page.tsx` server component.
Tabs strip across the top: Profile · Team · Branding · Billing ·
Integrations · Danger Zone. Each tab renders a section card. Empty
sections show "Coming soon" muted card per chapter #68 honesty contract
(don't fabricate features).

**B** — Profile tab: agency name, logo (via existing brand-kit upload
helper if present, else "Connect brand-kit to upload"), primary contact
email, support email. Save via NEW `POST /api/tenants/agency-profile`.

**C** — Team tab: lists current agency members from foundation roles
storage; "Invite teammate" button opens modal (deferred to R024 — wire
the button to a placeholder modal that says "Wired in R024").

**D** — Branding tab: shows current brand kit summary; deep-link to
existing brand-kit editor if present.

**E** — Billing / Integrations / Danger Zone: section stubs with copy
explaining what each will hold (T6-flagged for real wiring).

**F** — Permission gate: requires `clients.edit` (matches sidebar
filter); Founder bypasses.

**G** — Smoke `§ Agency settings hub` (page 200 + 6 tab labels visible
+ profile-save POST 200 happy path) + chapter `04-agency-settings-hub.md`
+ MASTER row + tasks row.

## NOT in scope

- Real Stripe / domain / integration wiring (T6).
- Team invite modal (R024).
- Moving existing scattered settings into this hub (incremental — links
  out for now).

## When done
DONE referencing `023-agency-settings-hub.md`.
