/loop

# T3 — Round 047: Form submission host route + webhook dispatch wiring

R043 shipped the webhook-block helpers. R047 wires the host route
that receives form submissions and dispatches to the resolved target
(internal storage OR webhook). Closes the form→submission lifecycle.

## Pre-read

- T3 R043 chapter (webhook-block + dispatch helpers).
- Existing forms plugin (T2-territory — read for submission shape).

## Scope

**A** — Host route handler `handleFormSubmit(req, ctx)`: parses
submission, resolves target via `resolveFormSubmission(form,
collectWebhookTargets(tree))`, dispatches via `dispatchWebhook` for
webhook targets OR persists to forms-plugin storage for internal.

**B** — Failure handling: webhook 4xx/5xx + network errors logged
to webhook-log ringbuffer (R016 plugin shape). Operator sees them
in the integrations admin surface.

**C** — Editor "Submit to" dropdown UI: in form-block settings
panel, lists internal + every webhook-target on the page.

**D** — Smoke `§ Form submission` (≥10 — internal storage path;
webhook path; mixed-page resolution; missing-target falls back to
internal; HMAC signature verified by mock receiver).

**E** — Chapter `04-form-submission-host-route.md` + MASTER row.

## NOT in scope

- Inbound webhook receiver (R+1 separate plugin).
- Field mapping / transformation (post-ship).
- Retry/backoff (post-ship).

## When done
DONE referencing `047-form-submission-host-route.md`.
