# `@aqua/plugin-agency-domains` — custom-domain attach skeleton (T2 R011)

Round-011 of the queue-based T2 worker. Skeleton plugin recording the
**intent** of a custom-domain attach + the NS records the client needs
to set on their registrar. Real DNS verification + TLS issuance is
deferred to T6 and lives in the **production-wired sibling**
`@aqua/plugin-domains` (chapter #50).

## Why two plugins

`@aqua/plugin-domains` (chapter #50, T6 R2) ships the production
Vercel client — `attachDomain / verifyDomain / removeDomain` against
the live registrar API. `@aqua/plugin-agency-domains` is the
**control-plane** companion:

- Records intent (operator says "Felicia wants `felicia.example.com`")
- Surfaces NS records (the client copies them onto their registrar)
- Tracks status as a guarded state machine (manual flip in v1)
- Stubs verification (T6 webhook flips status; we don't poll DNS in
  v1)

In the chapter §50 production stack the two are separate concerns —
this plugin is the agency-side discipline tooling; `domains` is the
infrastructure-side automation. Operators can install either or
both; the skeleton is intentionally narrower.

## Shape

| Area | Decision |
| --- | --- |
| `id` | `agency-domains` |
| `scopePolicy` | `client` |
| `core` | false |
| `requires` | (none) |
| Storage layout | `attaches/index` · `attaches/by-id/<id>` · `attaches/by-host/<host>` (case-folded reverse index) |
| API routes | `list / create / delete / transition / status / verify` (6) |
| Pages | `DomainsPage` (default landing) — table + per-row expand → NS records + status-flip buttons + new-attach form |

## Domain

```
DomainAttach { id, agencyId, clientId, hostname (normalised),
               status: pending|verifying|active|failed,
               nsRecords: NsRecord[],
               verifiedAt?, lastError?,
               createdBy?, createdAt, updatedAt }

NsRecord     { name, type: CNAME|TXT|A|NS, value, ttl?, notes? }
```

`STATUS_TRANSITIONS`:
- `pending → verifying | failed`
- `verifying → active | failed`
- `failed → verifying | pending`
- `active → failed`

`pending → active` is rejected (test 7) — operator must move through
`verifying` first so the audit trail records the intent-to-verify.

`active` clears `lastError`; `failed` records (or preserves) it.

## defaultNsRecords (operator-facing copy)

`defaultNsRecords(host)` ships 3 records by default:

- `A @ → 76.76.21.21` ("Apex A record — points to Aqua's edge proxy.")
- `CNAME www → <host>.aqua.app` ("Optional but recommended.")
- `TXT _aqua-verify → aqua-verify=<host>` ("Required to flip status
  pending→verifying.")

`create(input.nsRecords)` accepts an override for tenants on custom
infrastructure. Production wiring (provider-driven defaults) is a T6
hook.

## Hostname normalisation

`normaliseHostname(input)`:

- Trims + lowercases
- Strips `https?://` scheme
- Strips trailing `/path`

`isValidHostname(host)` enforces RFC-1123-ish labels (alphanum +
hyphen, no leading/trailing hyphen per label, total ≤253 chars).
`Felicia.Example.com` and `https://Felicia.Example.com/welcome`
both normalise to `felicia.example.com` (test 1).

## Reverse index for hostname uniqueness

`attaches/by-host/<host>` stores the attach id keyed by the
normalised hostname so:

- `create()` can reject duplicates with `DomainAttachConflictError`
  → HTTP 409 (case-insensitive collision check, test 5).
- `update({ hostname })` rotates the index entry — old key removed,
  new key set. Conflict on rename rejects (test 9).
- `delete()` removes both the metadata key and the reverse index.

## Stub `verify()` — T6 hook

`verify(id)` returns `{ stub: true, message: "T6: real DNS
verification not yet wired. Operator flips status manually for v1." }`
and **does not change status** (test 11). The `POST /verify` API
route returns the stub payload + the current status so the UI can
render a "checking…" state without lying about the result.

## Smoke (12/12)

`tsx --test src/__smoke__/agency-domains.test.ts`. Cases:

1. `normaliseHostname` strips scheme, lowercases, drops trailing
   path.
2. `isValidHostname` accepts FQDNs, rejects junk (no underscore,
   leading/trailing hyphen, empty).
3. `defaultNsRecords` returns 3 records (A + CNAME + TXT) with a TXT
   carrying the hostname.
4. `create` stores attach starting in `pending`; default NS records
   populated; emits `agency-domains.attach.created`.
5. `create` rejects duplicate hostname (case-insensitive) with
   `DomainAttachConflictError`.
6. `create` rejects invalid hostname.
7. Transition follows `STATUS_TRANSITIONS` — pending→verifying→active
   sets `verifiedAt`; pending→active rejects with
   `InvalidStatusTransitionError`.
8. Transition to `failed` records `lastError`; retry path
   `failed → verifying` carries error through; `verifying → active`
   clears `lastError`.
9. `update({ hostname })` rotates the by-host reverse index;
   conflicting update rejects.
10. `delete` removes attach + reverse index; emits deleted; second
    delete fires NotFound.
11. `verify()` is a stub — returns `{ stub: true }` and does **not**
    change status.
12. Activity events — created / transitioned / deleted log under
    `category: "settings"` with action prefix `agency-domains.*`.

## Files

```
04-the-final-portal/plugins/agency-domains/
├── index.ts                            (manifest)
├── package.json + tsconfig.json
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          (vendored)
    │   ├── tenancy.ts                  (vendored)
    │   ├── domain.ts                   (DomainAttach, NsRecord, STATUS_TRANSITIONS, defaultNsRecords, normaliseHostname, isValidHostname)
    │   ├── ids.ts · time.ts
    ├── server/
    │   ├── ports.ts                    (StoragePort, ActivityLogPort, EventBusPort)
    │   ├── service.ts                  (DomainAttachService — list/get/getByHost/create/update/transition/delete + verify stub)
    │   ├── foundationAdapter.ts        (register / containerFor / _containerFromCtx)
    │   └── index.ts                    (barrel + container)
    ├── api/
    │   ├── handlers.ts                 (6 handlers — 409 on hostname conflict)
    │   └── routes.ts
    ├── pages/
    │   └── DomainsPage.tsx             (table + per-row expand for NS records + status-flip buttons + new-attach form)
    └── __smoke__/agency-domains.test.ts (12 cases)
```

## NOT in scope

- Real DNS verification (T6 — production wiring lives in
  `@aqua/plugin-domains` chapter #50).
- TLS cert issuance.
- Touching milesymedia / business-os / compass-coaching.

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- **Production wiring deferred to T6**: replace the `verify()` stub
  with real DNS+TXT lookup. The `@aqua/plugin-domains` chapter #50
  has the Vercel client; lift its `verifyDomain()` helper.
- Polling client component (mirror chapter #50's `DomainStatusBadge`
  — 30s interval up to 10 polls).
- Auto-transition `pending → verifying` when the verify TXT lookup
  succeeds (today: operator manually flips).
- Provider-specific NS record templates (Cloudflare / Route 53 /
  registrar-direct) selected from a dropdown.
- Cross-link to `@aqua/plugin-portal-export` (chapter #44) so a Live
  client's exported portal automatically gets a domain attach row.
- Foundation `ActivityCategory` extension to add `domains` (currently
  rides on `settings`); coordinated R+1 diff with T1 / R007 / R009 /
  R010.
- TLS cert issuance via Let's Encrypt / ACME or Vercel automatic.
- Wildcard subdomain support.
