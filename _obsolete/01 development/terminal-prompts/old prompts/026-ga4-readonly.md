/loop

# T2 — Round 026: GA4 read-only connector (WS-D R026)

Founder dashboard's "touchpoints/7d" tile reads real GA4 data when
configured. Today it counts marketing leads.contactedAt — chapter #93
notes this is a placeholder.

Plan: chapter #124 WS-D R026.

## Pre-read

- T1 R018 founder dashboard (where this lands).
- Architecture §"Per-install plugin config".
- Google Analytics Data API v1beta docs (Service Account JSON auth).

## Scope

**A** — `@aqua/plugin-ga4` (NEW). Manifest: `scopePolicy: "agency"`,
soft-pairs `credentials-vault`.

**B** — Install config: `{ propertyId: string, serviceAccountJson:
string }`. Vault stores the SA JSON; plugin reads via vault.

**C** — Server endpoint:
`GET /api/portal/ga4/touchpoints?days=7` — calls GA4
`runReport({metrics:[sessions,conversions], dimensions:[date]})` for
the configured property. Returns last-N-day series + total. Cached
per-tenant for 15min (rate-limit safety).

**D** — Founder dashboard wire-up: when GA4 plugin enabled + configured
for the active agency, "Touchpoints/7d" tile reads `/api/portal/ga4/...`
instead of marketing leads count. Falls back to old metric when GA4
not configured (chapter #68 honesty: tile shows "Connect GA4" subtext
when missing).

**E** — Diagnostic: admin page shows last-fetch time + last error;
"Test connection" button hits `runReport` with date-range=today.

**F** — Smoke `§ GA4 connector` (≥10 — config validation; vault read;
endpoint returns shape; cache hit; not-configured fallback; service-
account-error handling).

**G** — Chapter `04-plugin-ga4.md` + MASTER row.

## NOT in scope
- Search Console / GMB connectors — post-ship.
- Custom GA4 dimensions / multi-property — post-ship.
- Sending events TO GA4 — post-ship.

## When done
DONE referencing `026-ga4-readonly.md`.
