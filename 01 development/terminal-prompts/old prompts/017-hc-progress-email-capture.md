/loop

# T4 — Round 017: HC progress save / email-capture nudge

Per chapter #71 open follow-up: HC progress save via email capture.
Currently when a user mid-flights HC and refreshes, progress is in
localStorage — but if they're on a different device, they lose it.
Build email-capture nudge after Q5 + a "resume by email" link
generator (no real send — surfaces a copyable demo link).

## Mandatory pre-read

1. T4 chapter #71 open follow-ups — HC progress email.
2. T4 chapter #68 honesty contract.

## Scope

**A** — Post-Q5 nudge modal (already exists from cycle 30 work):
extend with email field + "Email me my progress link" button. On
submit, generates a `?resume=<token>` link — token is base64 of
`{email, savedAt, hcState}`. Mocks an email send (just shows the link
in a "demo: copy this URL to resume on another device" panel).

**B** — `?resume=<token>` URL on HC: decodes token, restores hcState
into localStorage, redirects to current question. Token has 7d expiry.

**C** — Stored captured emails to `bos.leads[]` as
`{email, capturedAt, source: "hc-progress-nudge"}` per existing
chapter #66 schema.

**D** — Honest: modal copy says "Demo mode — email isn't sent yet, you
can copy the link". Production wiring → T6.

**E** — Chapter R017 + MASTER delta.

## NOT in scope

- Real email send (T6).
- Multi-device session sync beyond resume-link.

## When done
DONE referencing `017-hc-progress-email-capture.md`.
