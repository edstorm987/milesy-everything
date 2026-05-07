/loop

# T2 — Round 011: `@aqua/plugin-agency-domains` (skeleton)

Skeleton plugin tracking per-client custom domain attach. Real DNS
provisioning + verification deferred to T6 prod gate. Surface a
working "Domain attach" UX that records intent + status; T6 wires
real verification later.

## Mandatory pre-read

1. `02 felicias aqua portal work/` `aqua-domains` plugin (reference).
2. T1 R003 Live phase chapter — bridge from Live custom portal to
   custom domain.
3. `01 development/eds requirments.md` §6 (custom-domain provisioning
   listed as future).

## Scope

**A** — Manifest (`scopePolicy: "client"`). ActivityCategory `"domains"`.

**B** — Domain: `DomainAttach` (clientId / hostname / status:
`pending|verifying|active|failed` / nsRecords[] / verifiedAt? / lastError?).

**C** — `DomainService` (operator records intent → status starts
`pending`; future T6 hook flips status). Status transitions guarded.

**D** — 1 admin page: Domain attach form + table of current attaches +
"Verification instructions" panel showing the NS records the client
needs to set on their registrar.

**E** — 4 API routes (CRUD + GET status). Verification endpoint stubbed
to return `pending` for now; flagged TODO for T6.

**F** — Smoke + chapter `04-plugin-agency-domains.md` (mark Section
"Production wiring deferred to T6"). MASTER row.

## NOT in scope

- Real DNS verification (T6).
- TLS cert issuance.

## When done
DONE referencing `011-agency-domains-skeleton.md`.
