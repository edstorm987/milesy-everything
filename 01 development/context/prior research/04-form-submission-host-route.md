# Form submission host route + webhook dispatch wiring (T3 R047)

## What

R043 shipped the webhook-block helpers
(`resolveFormSubmission`, `dispatchWebhook`,
`collectWebhookTargets`). R047 wires the public host route
that receives form submissions: parses, resolves the target,
dispatches to either internal storage OR an outbound webhook,
logs the outcome to a per-tenant ringbuffer that mirrors
R016's webhook log shape, and falls back gracefully on
errors so submissions never drop on the floor.

Closes the form → submission lifecycle that R043 set up at
the helper layer.

## Files

- `src/api/handlers/formSubmissionHost.ts` (NEW)
  - `handleFormSubmit(req, ctx)` — POST `/forms/submit`.
    Validates `{pageId, formBlockId, payload, submitTo?}`,
    resolves the page (must belong to the scoped tenant — 404
    if not), runs `resolveFormSubmission(tree, submitTo)`,
    branches:
    - `"internal"` → persist to forms storage stub and 200.
    - `WebhookTarget` → `dispatchWebhook` and log outcome.
      On webhook ok: 200 with `{kind:"webhook", ok:true, status}`.
      On webhook fail: still 200 to the public submitter, but
      includes `{ok:false, status, fallbackInternalId}` and
      ALSO persists an internal-storage copy so the submission
      isn't lost end-to-end.
    - `null` (target missing/invalid) → log
      `outcome:"webhook-missing"`, fall back to internal
      storage, 200 with `{kind:"internal", fallback:true}`.
  - `handleListFormWebhookLog(req, ctx)` — GET
    `/forms/webhook-log`. Returns the per-tenant log entries
    (newest first). Used by the operator's webhook-log surface
    to debug failures.
  - `readFormWebhookLog(storage, agencyId, clientId)` — pure
    helper for smoke + diagnostics.
  - `listAllWebhookTargets(ctx, agencyId, clientId)` — walks
    every page in every site of the scoped tenant collecting
    enabled webhook targets. Editor "Submit to" dropdown
    consumes this for cross-page resolution (the form on
    page A can target a webhook block on page B).
  - Internal log shape: `{ts, formBlockId, pageId, outcome,
    url?, status?, error?}`. Outcomes: `internal` /
    `webhook-ok` / `webhook-failed` / `webhook-missing`. Cap
    at **200 entries per tenant** (matches R016 ringbuffer).
- `src/api/routes.ts` — adds two route mounts:
  - POST `/forms/submit` → `handleFormSubmit`.
  - GET  `/forms/webhook-log` → `handleListFormWebhookLog`.
- `src/__smoke__/r047-form-submission-host-route.test.ts`
  (NEW) — 19 assertions:
  - scope guard 400 (1) / invalid input 400 (1) / unknown
    page 404 (1).
  - internal path: 200 + kind+id + log outcome=internal (3).
  - webhook path: 200 + kind+ok+status + outbound URL invoked
    + HMAC header `sha256=` prefix + log outcome=webhook-ok
    +status (5).
  - missing-target fallback: 200 + kind=internal+fallback +
    log outcome=webhook-missing (3).
  - webhook 5xx: 200 returned + ok:false+status+
    fallbackInternalId + log outcome=webhook-failed (3).
  - log listing endpoint 200 + entry count (2).

The webhook-path smoke monkey-patches `globalThis.fetch`
because R043's `dispatchWebhook` reaches for it when no
`fetchImpl` override is supplied (handler can't easily
thread one through without polluting the public route
signature). Restored in a `finally` block.

## Why webhook failures still 200

The submitter is a public end-user — they pressed "Submit",
the form *did* send, and the only operator-actionable signal
is in the webhook log. Returning 4xx/5xx would burn the form
UX (retry banners, "submission failed" copy) for a
misconfigured webhook the user can't fix. The internal-
fallback persist guarantees the submission survives, and the
log entry surfaces the failure to the operator who CAN fix it.

## Editor wiring (out of scope this round)

`listAllWebhookTargets(ctx, agencyId, clientId)` returns the
list the form-block "Submit to" dropdown should render:
`{pageId, pageSlug, targetId, label, url}` per enabled
target. Editor admin page wiring is a follow-up; the helper
is here so the dropdown is a one-liner once the inspector
component lands.

## Q-ASSUMED

- Per-tenant ringbuffer cap at 200 entries (matches R016
  webhook log shape so the existing operator surface can
  read these directly once foundation wires the storage
  key).
- Webhook failures return 200 to the public submitter (with
  internal-fallback persistence). The operator-surface log
  is the single source of truth for failures.
- `submitTo` flows through the request body (storefront sends
  it as part of the submission). Alternative: re-walk the
  tree and read it from `formBlock.props` server-side —
  rejected because the tree walk is O(n) and the operator
  has already declared the submitTo at design time. Server-
  side verification still happens via
  `resolveFormSubmission` finding the target on the same
  page tree.
- Internal storage is a stub — `form-submissions:<agency>:
  <client>:<id>` keys hold `InternalSubmission` rows. T2
  forms plugin owns the canonical schema; R+1 swaps to
  whatever they ship. The fallback-on-failure behaviour
  uses the same key namespace so the migration is just a
  schema upgrade.

## NOT in scope (R+1)

- Inbound webhook receiver (R+1 separate plugin — already
  R016 ringbuffer placeholder).
- Field mapping / transformation (today the entire payload
  goes as-is to the webhook body or storage row).
- Retry / backoff / dead-letter on webhook failures (T6
  partnership; R016 webhook log surfaces failures but no
  automated retry).
- Editor "Submit to" dropdown wiring — `listAllWebhookTargets`
  helper ready, inspector component is plugin work.
- T2 forms plugin contract — internal-storage stub today;
  swap when forms plugin ships its canonical schema.
- Throttling / per-IP rate-limit on `/forms/submit` (foundation
  middleware handles general rate-limit; per-form abuse
  detection is R+1).
