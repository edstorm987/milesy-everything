/loop

# T1 — Round 10: Per-install secret encryption + Postgres RLS hardening

R7 shipped Postgres backend (single-blob row, RLS deferred). R9 just shipped
Google OAuth + magic-link. R10 closes two production-readiness gaps that have
been parked for several rounds: encrypting per-install secrets at rest
(Stripe keys from T2 R5/R12, Anthropic key from T3 R7, OpenAI key from T3 R9
when it lands) and turning on row-level scoping defense for Postgres.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/context/MASTER.md`
3. `01 development/context/prior research/04-architecture.md` §6 + §13
4. `01 development/context/prior research/04-foundation-round7-postgres.md`
5. `01 development/context/prior research/04-plugin-ai-builder.md` (R7 — anthropic key)
6. `01 development/context/prior research/04-plugin-affiliates.md` if exists, else search for Stripe in T2 chapters
7. `01 development/messages/terminal-1/from-orchestrator.md`

## Scope

**Goal A — Per-install secret encryption**
- New `portal/src/server/secrets.ts` exposing `encryptSecret(plaintext)`
  + `decryptSecret(blob)`. AES-256-GCM keyed off `PORTAL_SECRET_KEY`
  env var (32 bytes hex; refuses to start without it in production,
  warns + uses derived dev key when `NODE_ENV !== 'production'`).
- Wire into the existing pluginInstalls API: writes to known-sensitive
  config keys (allow-list per plugin manifest entry
  `install.config.<key>.encrypted: true`) pass through `encryptSecret`;
  reads through `decryptSecret`. Backward-compatible: rows without the
  envelope marker are read as plaintext + lazily re-encrypted on next write.
- Update each affected plugin's manifest: ai-builder.anthropicApiKey,
  affiliates.stripeSecretKey + stripeWebhookSecret, ecommerce.stripe* etc.
  (T2 has the inventory — read their R5 + R12 chapters.)

**Goal B — Postgres row-level scope defense**
- Switch the single-blob storage model to per-tenant rows when
  `STORAGE_BACKEND=postgres` (file backend untouched). Schema: existing
  `portal_kv` gains `agency_id`, `client_id` columns + composite primary
  key `(agency_id, client_id, key)`.
- One-shot migration `scripts/migrate-blob-to-rls.mjs` that fans the
  single `__portal_state__` blob out into per-tenant rows.
- Add a Postgres `SET LOCAL aqua.agency_id = '<id>'` per-request via
  `withTenantScope`. RLS policy on `portal_kv` enforces
  `agency_id = current_setting('aqua.agency_id')::text`.

**Goal C — Smoke + chapter**
- Extend `scripts/smoke-postgres.mjs` to assert: cross-tenant read
  returns no rows; encrypted secrets round-trip; legacy plaintext
  rows lazy-re-encrypt; missing PORTAL_SECRET_KEY in prod fails fast.
- Chapter `04-foundation-round10-encryption-and-rls.md`. MASTER row.

## NOT in scope

- KMS / vault integration (R11 candidate).
- Postgres replication / backup beyond what T6 R3 already shipped.
- Per-key Postgres layout for editor live-state (still v2).

## Loop discipline

Standard. Goal A is independent of Goal B — partial DONE acceptable if
one ships clean and the other reveals scope. 3 empty wakes → end loop.

## When done

DONE + COMMIT in outbox; chapter; MASTER row; tasks row.
