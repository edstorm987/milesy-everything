# Chapter 136 — Durable HMAC nonce store (T1 R028, WS-E)

Magic-link, email-verify, and CSRF nonces lived in per-module
in-memory `Map<string, number>` until R028. Multi-instance deploys
break the security contract — a magic-link nonce consumed on instance
A could be replayed against instance B since neither saw the other's
write. R028 ships a single durable store with two adapters and wires
the hot routes to use atomic single-call consume (also closes the
check-then-mark race within a single instance).

## Goal A — Schema

Lazy `CREATE TABLE IF NOT EXISTS nonces` on first call from the
Postgres adapter:

```sql
nonces (
  token text PRIMARY KEY,
  kind text NOT NULL,          -- 'magic-link' | 'email-verify' | 'csrf'
  expires_at bigint NOT NULL   -- epoch ms, GC reads this
);
CREATE INDEX IF NOT EXISTS nonces_expires_at_idx ON nonces (expires_at);
```

`token` is the HMAC nonce (16 random bytes base64url). `kind`
discriminates surfaces for analytics. `expires_at` is epoch ms
matching the signed token's `exp` so GC can prune past entries.

## Goal B — `consumeNonce` atomic single-use

```ts
async consumeNonce(token, kind, ttlMs): Promise<boolean>
```

**Postgres adapter**:

```sql
INSERT INTO nonces (token, kind, expires_at)
VALUES ($1, $2, $3)
ON CONFLICT (token) DO NOTHING
RETURNING token
```

`rowCount === 1` iff this was the first consumption — second call
returns no row + we report `false` ("already used"). The `RETURNING`
clause + Postgres's atomic INSERT-or-fail-via-CONFLICT closes the
check-then-mark race the prior shape implicitly tolerated.

**Memory adapter**: same semantics over `Map<token, {kind, expiresAt}>`
— rejects when the token is already in the map (even if its expiry
has passed; chapter contract says "row existing OR expires_at < now").
GC clears expired entries so re-use becomes possible after
`gcExpiredNonces` runs.

`ttlMs <= 0` is rejected (caller error — token already expired).

## Goal C — `gcExpiredNonces` + sweep wire-up

Both adapters expose `gcExpiredNonces(now?)` returning the deleted
count. Postgres: `DELETE FROM nonces WHERE expires_at < $1`. Memory:
`Map.delete` per expired entry.

`rateLimit.ts sweepExpired()` (R021's diagnostic — Founder-gated
`/api/internal/sweep`) now `await`s a nonce GC pass and reports
`nonces: { deleted }` in `SweepStats`:

```ts
export interface SweepStats {
  rateLimitBuckets: { before; after };
  loginFails: { before; after };
  nonces: { deleted: number };       // R028
  ranAt: number;
}
```

`sweepExpired` is now `async`; the only caller (`/api/internal/sweep`
route handler) `await`s it. Lazy-imports the nonce store so rateLimit
stays small + tsx --test smokes that don't touch nonces aren't forced
to load the adapter.

GC failure is non-fatal — surfaces via the warn channel so the sweep
endpoint still returns the rest of the stats.

## Goal D — Adapter switch + fallback

```ts
const wantsPostgres = explicit === "postgres" || (!explicit && !!process.env.DATABASE_URL);
cached = wantsPostgres ? createPostgresAdapter() : createMemoryAdapter();
```

Same resolution logic as storage backend (R027) — production sets
`DATABASE_URL` and gets Postgres automatically. Local dev / tests
without `DATABASE_URL` keep the memory adapter; behaviour is
identical for single-process scenarios.

## Goal D' — Hot-route wire-up

`/api/auth/magic/verify` route:

```ts
// Was: if (isUsed(nonce)) return err; markUsed(nonce, exp);
const consumed = await consumeMagicNonce(nonce, exp);
if (!consumed) return err(req, "already_used");
```

`/api/auth/verify-email` route:

```ts
const consumed = await consumeVerifyNonce(result.payload.nonce, result.payload.exp);
if (!consumed) return NextResponse.json({ ok: false, error: "already_used" }, { status: 400 });
```

Both routes go from a check-then-mark pair to a single atomic call.
Closes:

- The check-then-mark race within a single instance (concurrent
  same-token verify).
- The cross-instance replay (multi-deploy + same token hitting two
  instances).

The legacy `isUsed`/`markUsed` + `isVerifyNonceUsed`/`markVerifyNonceUsed`
pairs remain exported as back-compat shims (in-process maps; not
wired into the durable store) for any caller that hasn't migrated.
The route handlers no longer call them.

## Goal E — Smoke

NEW `scripts/smoke-durable-nonce-store.test.ts` (run via
`npm run smoke:durable-nonce-store`, 15/15 pass, ~1.5s).

Six suites, mix of pure-runtime + source-marker:

- **Memory adapter** (5 runtime tests) — first consume returns true;
  second returns false; ttl<=0 rejected; different tokens
  independent; expired entry still rejected pre-GC.
- **gcExpiredNonces** (2) — reports prune count + leaves live
  rows; idempotent (second sweep returns 0).
- **Multi-process simulation** (1) — two memory adapters do NOT
  share state. Demonstrates exactly why production needs the
  Postgres adapter (token consumed in adapter A succeeds again in
  adapter B). The chapter contract is closed only by the Postgres
  adapter's row-level uniqueness.
- **Postgres adapter source-marker** (3) — `CREATE TABLE IF NOT
  EXISTS nonces` + token/kind/expires_at columns; INSERT…ON
  CONFLICT DO NOTHING RETURNING; adapter switches on PORTAL_BACKEND
  / DATABASE_URL; DELETE…WHERE expires_at < now.
- **sweepExpired wiring** (2) — calls getNonceStore().gcExpiredNonces;
  SweepStats shape extended; non-fatal warn channel.
- **Hot-route wiring** (2) — magic/verify uses consumeMagicNonce;
  verify-email uses consumeVerifyNonce; legacy check-then-mark gone.

Also touched: `smoke-session-security.test.ts` — updated source-marker
for `export async function sweepExpired` (R028 made the helper async).
13/13 still pass.

## NOT in scope

- Redis adapter (post-ship; Postgres covers v1 ship gate).
- Cross-region replication (post-ship; Postgres handles single-region
  multi-instance).
- CSRF token nonce storage. Existing CSRF tokens are stateless HMAC
  with their own 60min TTL — they don't need single-use. The `kind:
  "csrf"` enum value is reserved for if/when we wire one-time CSRF
  tokens for high-value writes (R+1).

## Q-ASSUMED

- **Lazy `CREATE TABLE IF NOT EXISTS` over migration step**: nonces
  is a single-table standalone schema with no dependencies. Migration
  files would force a new tooling layer (none today). Lazy DDL is
  idempotent + Postgres is fast on `IF NOT EXISTS`.
- **Token as primary key**: prevents token reuse globally. Postgres's
  UNIQUE on PK gives the atomic INSERT-or-fail semantics for free.
- **Memory adapter rejects expired-but-still-in-map entries**: the
  prompt's contract is "row existing OR expires_at < now". GC bridges
  this — once GC runs, the entry's gone and the token is available.
- **`async sweepExpired`**: nonce GC is async at the storage layer.
  Single caller (`/api/internal/sweep`) needed one `await`. No
  external API change beyond that.
- **GC failure non-fatal**: sweep is operator diagnostic. A failing
  Postgres GC shouldn't 500 the rest of the diagnostic; warn channel
  surfaces the failure, sweep continues.
- **Atomic consume replaces check-then-mark on routes**: legacy
  shims preserved but route handlers migrated. Leaving the shims
  exported keeps any third-party code (today: zero) compiling.
- **No retry on Postgres failure during consume**: caller's HTTP
  handler returns `already_used` on `false`. A real DB outage during
  `INSERT … ON CONFLICT` throws, which Next.js surfaces as 500 —
  correct behaviour (the auth surface should fail visibly, not
  silently skip a security check).
- **CSRF kind reserved but unused**: stateless HMAC tokens stay as
  R021. Future one-time CSRF for sensitive writes wires through this
  store with `kind: "csrf"`.
