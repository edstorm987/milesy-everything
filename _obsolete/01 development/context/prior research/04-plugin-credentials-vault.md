# `@aqua/plugin-credentials-vault` — Passwords & Access (T2 R004)

Round-004 of the queue-based T2 worker. Closes the chapter §2
canonical sidebar slot "Passwords & Access" — per-client login info,
API keys, 2FA recovery codes, and access notes.

## Shape

| Area | Decision |
| --- | --- |
| `id` | `credentials-vault` |
| `scopePolicy` | `either` — installs at agency-wide OR per-client |
| `core` | false |
| `requires` | (none) |
| Storage layout | `vault/index` (id list) · `vault/by-id/<id>` (Credential row, password = `EncryptedField` blob) · `vault/views/<actorUserId>` (rolling reveal-timestamps for rate limit) |
| Encryption | inline AES-256-GCM via `node:crypto`; format `v1:<iv-b64>:<tag-b64>:<ciphertext-b64>` — versioned for rotation. Key resolution priority: constructor-injected (test/foundation port) → `process.env.AQUA_VAULT_KEY` (base64 32 bytes) → ephemeral (dev only). Foundation-lift candidate: a portal-side `cryptoPort` with KMS-backed rotation. |
| API routes | `list / get / view / create / update / archive` — list+get+view = viewers; create/update/archive = admins |
| Pages | `CredentialListPage` (table + type filter) · `CredentialDetailPage` (form + reveal button) |
| Activity | `credential.created · credential.updated · credential.archived · credential.viewed` under category `settings` (no foundation enum extension to avoid mesh-collision; chapter R+1 candidate) |
| Events | matching `credentials.credential.*` event-bus emissions including `rate_limited` |

## Rate-limited reveals

`viewPassword(actor, id)` is gated by a sliding window:

- 10 reveals per actor per 60s (constants `RATE_LIMIT_REVEALS` /
  `RATE_WINDOW_MS`).
- Storage layout: `vault/views/<actorUserId>` holds an array of
  recent timestamps; on each call we filter to entries within
  `RATE_WINDOW_MS`, count them, then push the new timestamp.
- Exceeding throws `VaultRateLimitError` (carries `retryAfterMs`); the
  HTTP handler maps to `429` with a `retry-after` header.
- The throw also emits `credentials.credential.rate_limited` so the
  inbox + ops dashboards can surface abuse patterns.

Sliding (not fixed) so a burst right at minute boundaries doesn't
double the effective rate.

## sharedWith ACL

Each `Credential` carries `sharedWith: UserId[]`. Resolution:

- Admins (`agency-owner` / `agency-manager`) bypass the ACL — they see
  and reveal everything in scope.
- Non-admins only see/reveal credentials whose `sharedWith` includes
  their userId.
- `list()` filters out hidden rows (no error); `get()` and
  `viewPassword()` throw `VaultAccessError` so the API can return 403.

The handler resolves admin status from `ctx.install.config.role` —
v1 lift; the runtime currently passes the role hint through here. R+1
once foundation exposes `ctx.role` directly we drop that path.

## Encryption — what we don't do

- No password manager integration (1Password / Bitwarden) — deferred.
- No browser extension for auto-fill — deferred.
- No TOTP generation — we store recovery codes only; users still need
  their authenticator app to generate codes.
- Keys are NOT KMS-backed in v1; production deployment requires
  `AQUA_VAULT_KEY` env var (32 bytes, base64). Operator runbook
  candidate.

## Smoke (10/10)

`tsx --test src/__smoke__/vault.test.ts`. Cases:

1. Encryption round-trip — encrypt → decrypt yields the same
   plaintext; one-bit flip in the ciphertext throws (AES-GCM auth tag).
2. `create` stores ciphertext (NOT plaintext) and emits
   `credential.created` activity + event.
3. `viewPassword` decrypts, logs `credential.viewed` activity,
   emits matching event.
4. sharedWith ACL — non-admin actors not in `sharedWith` cannot
   `list / get / view` (list filters; get + view throw
   `VaultAccessError`).
5. sharedWith ACL — actor IN sharedWith CAN view as non-admin.
6. Rate limit — `RATE_LIMIT_REVEALS` reveals succeed; the next throws
   `VaultRateLimitError` and emits `rate_limited` event.
7. Rate limit window slides — after `RATE_WINDOW_MS`, reveals work
   again.
8. `update` with new password rotates `lastRotated`; empty string
   clears the secret.
9. `archive` flips the archived flag; archived rows hidden by
   default; `includeArchived` surfaces them.
10. Client-scoped container hides agency-wide and other-client
    credentials.

Mock activity port uses our `now()` clock helper (not `Date.now()`)
so `setClock` propagates — same shape as the activity-inbox smoke.

## Files

```
04-the-final-portal/plugins/credentials-vault/
├── index.ts                            (manifest)
├── package.json + tsconfig.json
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          (vendored)
    │   ├── tenancy.ts                  (vendored)
    │   ├── domain.ts                   (Credential, CredentialFilter, CREDENTIAL_TYPES, summarise)
    │   ├── ids.ts · time.ts
    ├── server/
    │   ├── crypto.ts                   (AES-256-GCM encrypt/decrypt, generateKey, loadKeyFromEnv)
    │   ├── ports.ts                    (StoragePort, ActivityLogPort, EventBusPort)
    │   ├── vault.ts                    (VaultService — list/get/create/update/archive/viewPassword)
    │   ├── foundationAdapter.ts        (register / containerFor / _containerFromCtx)
    │   └── index.ts                    (barrel)
    ├── api/
    │   ├── handlers.ts                 (6 handlers + 429/403/404 mapping)
    │   └── routes.ts
    ├── pages/
    │   ├── CredentialListPage.tsx      (table + type filter chip row)
    │   └── CredentialDetailPage.tsx    (form + reveal-password button)
    └── __smoke__/vault.test.ts         (10 cases)
```

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- Foundation `cryptoPort` with KMS-backed key + rotation; drop the
  env-var path.
- Extend foundation `ActivityCategory` union with `credentials`
  (currently riding on `settings`) — needs coordinated diff with T1.
- Hook the inbox bell to highlight `credential.viewed` events (audit
  trail at-a-glance).
- Add a "Generate password" helper button on the detail page.
- Per-credential expiry chip (computed from `lastRotated +
  rotateAfterDays` setting); auto-archive past 2× window.
- Real password manager integration (1Password / Bitwarden) as
  optional `requires`.
- Bulk export (admin-only, audit-logged) for offboarding.
