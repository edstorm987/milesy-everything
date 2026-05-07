/loop

# T1 — Round 028: Durable HMAC nonce store (WS-E R028)

Magic-link, email-verify, and CSRF nonces today are in-memory single-
process. Multi-instance deploys would lose security guarantees. Move
to Postgres-backed (no Redis dependency yet).

Plan: chapter #124 WS-E R028. Ship-gate item.

## Pre-read

- R009 magic-link + R020 email-verify + R021 CSRF.
- T1 R027 (just shipped) Postgres backend.
- Existing `_nonces` in-memory Set/Map shape.

## Scope

**A** — `nonces` table: `(token text primary key, kind text, expires_at
bigint)`. `kind` enum: `magic-link`, `email-verify`, `csrf`.

**B** — `consumeNonce(token, kind, ttlMs)` — atomic INSERT-or-fail.
First call returns true; second returns false. Rejection on row
existing OR expires_at < now.

**C** — `gcExpiredNonces()` — DELETE WHERE expires_at < now. Called
from existing `sweepExpired()` (R021); reports count in SweepStats.

**D** — Fallback: when `PORTAL_BACKEND !== "postgres"`, keep the
in-memory store (dev mode + tests). Single code path with adapter
switch.

**E** — Smoke `§ Durable nonces` (≥10 — happy path single-use; reject
re-use; expired rejected; multi-process simulated via two adapter
instances; sweep counts; in-memory fallback unchanged).

**F** — Chapter `04-durable-nonce-store.md` + MASTER row.

## NOT in scope
- Redis adapter (post-ship; Postgres covers v1 ship gate).
- Cross-region replication (post-ship).

## When done
DONE referencing `028-durable-nonce-store.md`.
