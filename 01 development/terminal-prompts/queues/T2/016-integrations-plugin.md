/loop

# T2 — Round 016: `@aqua/plugin-integrations`

Per-client integrations registry. Operator records connection intent
to Stripe / Mailchimp / Google / Meta / Slack / Zapier — credentials
encrypted at rest (reuse credentials-vault encryption). T6 wires
real OAuth flows.

## Mandatory pre-read

1. T2 R004 credentials-vault chapter (AES-256-GCM patterns).
2. T2 R007 agency-finance chapter — Stripe references.

## Scope

**A** — Manifest (`scopePolicy: "either"`,
`requires: ["credentials-vault"]`). ActivityCategory `"integrations"`.

**B** — Domain `Integration`: id, kind (stripe / mailchimp / google /
meta / slack / zapier / custom-webhook), label, status (intended /
configured / verified / failed), credentialsRef (vault entry id),
lastVerifiedAt, lastError.

**C** — 6 admin pages: Browse (catalog of supported kinds) ·
Connections (current per-client) · Configure (kind-specific form) ·
Verify (manual ping for v1) · Webhooks (incoming) · Outgoing log.

**D** — 7 API routes (CRUD + verify + ping).

**E** — Each kind ships with a config-shape stub but no real OAuth
flow — T6 wires real connection.

**F** — Smoke + chapter `04-plugin-integrations.md` + MASTER row.

## NOT in scope

- Real OAuth (T6).
- Actual webhook receivers (placeholder log only).

## When done
DONE referencing `016-integrations-plugin.md`.
