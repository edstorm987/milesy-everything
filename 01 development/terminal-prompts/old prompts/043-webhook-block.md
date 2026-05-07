/loop

# T3 — Round 043: Webhook block (form submissions → external webhook)

A `webhook-target` block descriptor that any form block can link to
as its submission handler. Lets operators wire forms to Zapier / Make /
custom endpoints without code.

## Pre-read

- Existing forms plugin (form-submission flow).
- T2 R016 integrations plugin (webhook log shape — reuse).

## Scope

**A** — `webhook-target` block kind. Props: `{ url, method, headers?, signingSecret? }`.

**B** — Form block extension: `submitTo: { kind: "internal" | "webhook", id?: string }`. When `kind === "webhook"`, points at a `webhook-target` block id elsewhere on the same page (or a global registry).

**C** — Server: form submission handler reads target → POSTs payload
with optional HMAC signature header. Response logged to webhook log
ringbuffer (R016 plugin).

**D** — Editor UI: form-block "Submit to" dropdown lists internal +
any webhook-target blocks on the page.

**E** — Smoke `§ Webhook block` (≥10 — submission posts to URL;
signing header set; response logged; failure handled gracefully).

**F** — Chapter `04-webhook-block.md` + MASTER row.

## NOT in scope
- Inbound webhooks (post-ship — separate plugin).
- Field mapping / transformation (post-ship).

## When done
DONE referencing `043-webhook-block.md`.
