# Webhook block + form-submission dispatcher (T3 R043)

## What

`webhook-target` is a non-rendering block descriptor whose
props describe an outbound webhook endpoint. Form blocks
reference it by id via `submitTo: { kind: "webhook", id }`;
the form-submission handler resolves the target and POSTs the
payload (optionally signed via HMAC). Lets operators wire
forms to Zapier / Make / Slack incoming-webhooks / custom
endpoints without code.

## Files

- `src/lib/webhookBlock.ts` (NEW)
  - `WEBHOOK_TARGET_TYPE = "webhook-target"` — block kind constant.
  - `WebhookTargetProps` — `{url, method?, headers?,
    signingSecret?, label?}`. Method defaults POST. Operator
    pastes the signing secret into the editor; storage
    encryption-at-rest is R+1 (today plain string in
    `block.props`).
  - `FormSubmitTo` — discriminated union `{kind:"internal"} |
    {kind:"webhook", id}`. `isValidSubmitTo(s)` shape guard.
  - `collectWebhookTargets(tree)` — walks the tree, returns
    every `webhook-target` block with a non-empty URL and
    `disabled !== true`. The form-block "Submit to" dropdown
    surfaces this list.
  - `findWebhookTarget(tree, id)` — convenience lookup.
  - `resolveFormSubmission(tree, submitTo)` — returns
    `WebhookTarget | "internal" | null`. Falsy/missing
    submitTo → `"internal"` (legacy behaviour). Invalid shape
    or pointing-at-missing-target → `null`. Form-submission
    route should fall through to legacy internal handler when
    `null` is returned.
  - `dispatchWebhook({target, payload, fetchImpl?, now?})` —
    JSON-encodes payload, sets `content-type: application/json`
    + `x-aqua-timestamp: <epoch ms>`, merges custom headers,
    optionally signs with HMAC-SHA256 over `<timestamp>.<body>`
    and adds `x-aqua-signature: sha256=<hex>`. Returns
    `DispatchResult {ok, status, bodyPreview?, error?, request}`.
    Captures first 1KB of response body (matches R016 webhook
    log shape). Failure modes: missing fetch impl
    (`error: "no fetch implementation available"`), network
    error (`error: <thrown msg>`), non-2xx (`ok: false` but
    `status` preserved).
  - Constants exported: `SIGNATURE_HEADER`, `TIMESTAMP_HEADER`.
- `src/__smoke__/r043-webhook-block.test.ts` (NEW) — 26
  assertions: collectWebhookTargets filters disabled + blank-
  URL + walks nested children + findWebhookTarget hit/miss
  (5) / `isValidSubmitTo` 5 cases / `resolveFormSubmission` 5
  (undefined→internal, internal pass-through, webhook hit,
  webhook miss, invalid shape) / dispatchWebhook happy path
  with signing (8: ok 200, body preview, custom header,
  signature `sha256=` prefix, timestamp header, JSON body,
  default POST) / no signing when no secret / network error /
  500 status preserved / no-fetch-impl shape ok.
- `package.json` test chain extended.

## Signature scheme

`HMAC-SHA256(secret, "<epoch_ms>.<body>")` → hex →
`x-aqua-signature: sha256=<hex>`. The receiver verifies by
recomputing — mirrors Stripe's webhook style (timestamped
prefix to defeat replay; receivers should reject signatures
older than ~5 min). The implementation uses WebCrypto when
available, falling back to a deterministic hash for non-
WebCrypto runtimes (smoke). The fallback is NOT secure — a
prod deploy on Node 18+ / modern browsers always hits the
WebCrypto path.

## Form integration

The forms plugin's submission handler imports
`resolveFormSubmission(tree, formBlock.props.submitTo)` and
branches:

- `"internal"` — store via foundation form-submission table
  (legacy path).
- `WebhookTarget` — call `dispatchWebhook` and log the result
  to the integrations plugin's webhook log ringbuffer (R016).
- `null` — error: pointed-at target was deleted; surface to
  end-user as a form error and fall back to internal storage
  so submissions don't drop on the floor.

Form-side wiring is plugin work (out of scope for R043;
prompt's section C). This module is the helper layer.

## Q-ASSUMED

- Signing secret lives in `block.props.signingSecret` as a
  plain string. R+1 swaps to a `credentialsRef` pointing into
  the credentials-vault plugin so the secret never enters the
  block tree at rest. Deferring because that needs cross-plugin
  contract work and the round prompt asks for the
  "operator-paste" UX up front.
- Headers default `content-type: application/json`; operators
  can override per-target. Custom headers merge over defaults.
- 1KB response-body cap matches R016's webhook log shape so
  the integrations plugin can log directly.
- `disabled: true` on a target hides it from the dropdown
  without removing the block — useful when an operator wants
  to pause a webhook temporarily.

## NOT in scope (R+1)

- Inbound webhooks (separate plugin — R016 already has
  receivers placeholder).
- Field mapping / transformation (e.g. `{ formField: "name",
  webhookKey: "user_name" }`). Today the entire form payload
  goes as-is.
- Per-target retry / backoff / dead-letter queue (T6
  partnership; R016 webhook log surfaces failures but no
  automated retry).
- Integration with credentials-vault for at-rest encryption
  of `signingSecret`.
- Editor UI: "Submit to" dropdown component on form-block
  inspector, plus a `webhook-target` block type registration
  in `components/blockRegistry.ts` so the operator can drop
  targets into pages.
- Form-submission route handler wiring on foundation side.
