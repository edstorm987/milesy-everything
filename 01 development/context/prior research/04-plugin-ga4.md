# `@aqua/plugin-ga4` — T2 R026 (WS-D)

Read-only GA4 connector. Calls Google Analytics Data API v1beta
`runReport` for sessions + conversions over a configurable lookback
window (default 7 days). Powers the founder dashboard's
"touchpoints/7d" tile (chapter #93 placeholder retired). Per-tenant
15-minute cache + 30-second concurrency guard for rate-limit safety.
Service-account JSON resolved via `VaultPort` — never lives in the
install row.

Plan: chapter #124 ship-plan-v1 WS-D R026.

## Manifest

- `id: "ga4"`, `version: "0.1.0"`, `status: "alpha"`,
  `category: "ops"`.
- `core: false`, `scopePolicy: "agency"`,
  `requires: ["credentials-vault"]`.
- ActivityCategory `"ga4"` (vendored union appends).
- One nav item under agency-tools panel; one settings page.
- Three settings: `propertyId`, `defaultDays` (7), `cacheTtlMs`
  (900000 = 15 min).
- Two feature flags: `touchpoints-endpoint`, `fallback-provisional`.

## Honesty contract (chapter #68)

- When GA4 isn't configured the plugin returns
  `{ provisional: true, rows: [], total: { sessions: 0, conversions: 0 }, error }`
  — the founder dashboard reads `provisional` and renders
  "Connect GA4" rather than fabricating numbers (smoke #4 + #5).
- Fetch errors (rate limit / auth / quota / network):
  - Prior cache present → return cache with `error` field set so the
    UI can flag staleness (smoke #10).
  - No prior cache → provisional report (smoke #11).
- The plugin NEVER fabricates rows when GA4 says no.

## Domain

```ts
Ga4Config { agencyId, propertyId?, serviceAccountPresent: boolean,
            defaultDays, cacheTtlMs, updatedAt,
            lastTestedAt?, lastFetchedAt?, lastError? }

DailyRow { date /* "YYYYMMDD" */, sessions, conversions }

TouchpointsReport {
  agencyId, propertyId, days,
  rows: DailyRow[], total: { sessions, conversions },
  fetchedAt, fromCache: boolean,
  provisional?, error?
}

CacheEntry { fetchedAt, report }     // stored under cache/touchpoints/<days>
ServiceAccountJson { client_email, private_key, project_id?, ... }
```

`parseServiceAccountJson(raw)` validates JSON-shape + the
`client_email` + `private_key` fields. Smoke #1.

## Constants

- `DEFAULT_DAYS = 7`
- `DEFAULT_CACHE_TTL_MS = 900_000` (15 min)
- `MIN_FETCH_GAP_MS = 30_000` (concurrency guard — applied even when
  `cacheTtlMs` is misconfigured to 0 — smoke #9)

## Service surface

`Ga4Service`:

- `getConfig()` — reads persisted row OR synthesises an empty default
  scoped to the container's agencyId; checks `vault.getServiceAccountJson`
  for `serviceAccountPresent` flag.
- `updateConfig({ propertyId?, defaultDays?, cacheTtlMs? }, actor)` —
  strips `properties/` prefix from propertyId (operators paste
  either form), persists, emits `ga4.config.updated`.
- `setServiceAccountJson(jsonString, actor)` — validates JSON,
  forwards to `vault.setServiceAccountJson`. Plugin doesn't store
  the raw JSON in install storage.
- `getTouchpoints(days?)` — main read. Pipeline:
  1. Resolve config + days.
  2. If no `propertyId` → provisional `not_configured`.
  3. Fetch SA JSON via vault → if missing → provisional
     `missing_service_account`.
  4. Cache lookup with `max(MIN_FETCH_GAP_MS, cacheTtlMs)` TTL.
  5. Cache hit → `fromCache: true` + emit `cached_hit`.
  6. Cache miss → `ga4.runReport(...)`. On success: persist row,
     persist cache, log activity, emit `report.fetched`. On error:
     persist `lastError`, emit `report.fetch_error`, return prior
     cache (if any) with `error`, else provisional `fetch_error`.
- `testConnection(actor)` — calls `runReport` with `days: 1`. Stamps
  `lastTestedAt` + emits `connection.tested`. NOT cached (operator
  expects a fresh dial when they hit the button).

## Foundation ports

Beyond standard `ActivityLog` + `EventBus` + `Storage`:

- **NEW** `Ga4Port.runReport({ propertyId, serviceAccount, days })`
  → `{ rows, total }` or throws `Ga4ApiError(kind, message)` where
  `kind ∈ {auth, quota, rate_limit, network, permission, other}`.
  Production wires the Google Analytics Data API v1beta
  (Service Account JWT → access token → POST runReport); the
  plugin treats it as a swappable function.
- **NEW** `VaultPort.getServiceAccountJson({ agencyId })` →
  `string | null`; optional `setServiceAccountJson` for the
  settings handler. Foundation injects via `credentials-vault`.

## API surface

4 routes mounted at `/api/portal/ga4/`:

| Path | Methods | Roles |
|---|---|---|
| `touchpoints` | GET | agency staff+ — `?days=<1..365>` |
| `config` | GET, PATCH | agency staff+ |
| `service-account` | POST | agency staff+ — body `{ json }` |
| `test-connection` | POST | agency staff+ |

`days` is range-clamped 1–365 server-side; out-of-range → 400.

## Page

`Ga4SettingsPage` — server-rendered. Shows config dl (property,
service-account presence, default lookback, cache TTL, last fetch,
last error); update form (`data-ga4-config-form`); SA-JSON form
(`data-ga4-sa-form`); test button (`data-ga4-test-form`). Foundation
script wires submissions to the routes.

## Founder dashboard wire-up (foundation pending)

Round prompt §D: when GA4 plugin enabled + configured for the active
agency, the founder dashboard's "Touchpoints/7d" tile reads
`/api/portal/ga4/touchpoints?days=7` instead of marketing leads
count. Falls back to old metric (or "Connect GA4" subtext) when the
report is `provisional`.

The dashboard wire-up itself is foundation territory — the plugin
exposes the contract; T1 wires the tile in a future round.

## Smoke

`src/__smoke__/ga4.test.ts` — 15/15 pass via `tsx --test`.

1. `parseServiceAccountJson` accepts well-formed; rejects
   malformed / missing fields.
2. `updateConfig` strips `properties/` prefix + persists + emits
   `ga4.config.updated`.
3. `setServiceAccountJson` writes to vault + flips
   `serviceAccountPresent`; rejects malformed JSON.
4. `getTouchpoints` w/o propertyId → provisional, no GA4 dial.
5. `getTouchpoints` w/o service account → provisional, no GA4 dial.
6. Happy path dials once, persists cache, emits `report.fetched`.
7. Second call within TTL serves cache (no re-dial),
   `fromCache: true`, emits `cached_hit`.
8. After TTL expires → re-dial, `fromCache: false`.
9. Concurrent guard — TTL=0 still gets `MIN_FETCH_GAP_MS` (30s)
   floor, second call within 5s served from cache.
10. Fetch error WITH prior cache → return cache + `error` field
    (no fabrication, dashboard sees stale data flag).
11. Fetch error WITHOUT prior cache → provisional report.
12. `testConnection` ok path stamps `lastTestedAt` + emits
    `connection.tested`.
13. `testConnection` w/o property → `ok: false`, no GA4 dial.
14. Activity entries use category `"ga4"` with `ga4.*` prefix.
15. `getConfig` with no row returns empty default scoped to the
    container's `agencyId`.

`tsc --noEmit` clean.

## Foundation pending

1. Workspace dep `@aqua/plugin-ga4`.
2. `transpilePackages` += `@aqua/plugin-ga4`.
3. Side-effect import calling `registerGa4Foundation`.
4. `_registry.ts` append.
5. `ActivityCategory` += `"ga4"`.
6. **NEW** `Ga4Port` adapter wrapping `google-auth-library` +
   `googleapis` (or raw fetch with a JWT signer) — Service Account
   JWT → access token → POST `/v1beta/properties/<id>:runReport`.
   Map response codes to `Ga4ApiError(kind)`: 401/403 → `auth` /
   `permission`, 429 → `rate_limit`, 5xx → `quota` / `other`,
   network → `network`. Adapter MUST honour the `days` arg as a
   `dateRanges: [{ startDate: "Ndays_ago", endDate: "today" }]`
   request and `metrics: [sessions, conversions]` +
   `dimensions: [date]`.
7. **NEW** `VaultPort` adapter wrapping `credentials-vault` to
   resolve / store the install's service-account JSON.
8. Founder dashboard wire-up — read `/api/portal/ga4/touchpoints?days=7`
   when the plugin is enabled + `provisional !== true`; else fall
   back to the marketing leads count metric (chapter #93's
   placeholder).

## NOT in scope (post-ship)

- Search Console / GMB connectors (post-ship per round prompt).
- Custom GA4 dimensions / multi-property (post-ship).
- Sending events TO GA4 (post-ship).
- Per-client tile (v1 is agency-scope only — the founder dashboard
  is also agency-scope).
- Real OAuth flow (operator brings their own service-account JSON
  in v1 — chapter #124 ship gate).

## R1 commit

T2 R026 single commit. After R026 T2 has shipped 22 plugins.
**This is the last queue file in T2's queue** — Sprint 2 plugin work
is complete pending archive. Founder dashboard tile foundation
wire-up is the next dependency for the touchpoints data to actually
appear in the UI.
