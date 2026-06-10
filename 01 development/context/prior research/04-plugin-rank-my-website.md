# `@aqua/plugin-rank-my-website` — T2 R023 (WS-B)

First Resources tool: a public-facing diagnostic over a URL with
honest A-F bands per check (no fabricated numeric scores —
chapter #68 honesty contract). Email capture hands off to
`@aqua/plugin-public-funnel`'s `tool-complete` so the lead lives in
one store, not duplicated here.

Plan: chapter #124 ship-plan-v1 WS-B R023.

## Manifest

- `id: "rank-my-website"`, `version: "0.1.0"`, `status: "alpha"`,
  `category: "growth"`.
- `core: false`, `scopePolicy: "agency"` gated to Milesy master
  (mirrors public-funnel's scope assumption — round prompt suggested
  `"global"` but that scope-policy value isn't in the foundation
  contract yet).
- ActivityCategory `"rank-my-website"` (vendored union appends).
- One nav item under `panelId: "resources"` pointing at
  `/resources/rank-my-website` — replaces the chapter #123 stub.
- Two settings: `timeoutMs` (default 5000) + `maxBodyBytes`
  (default 3MB).
- Two feature flags: `public-tool` + `funnel-handoff`.

## Honesty contract (chapter #68)

- A-F bands ONLY. No "score out of 100", no "78% optimised". The
  bands are derived from the pure check functions; the UI surfaces
  the band + the actual finding ("3 of 12 images missing alt").
- Overall band is the WORST band across checks, not an average.
  An A site with one F is NOT a B site (smoke #9 pins this).
- On fetch error (timeout / network / 4xx / 5xx / oversize / blocked
  private IP): the report SHIPS WITH `overallBand: "F"` + `checks: []`
  + `fetchError: { kind, message, status? }`. No fake bands. The UI
  surfaces "we couldn't reach your site" honestly (smoke #13).

## Domain

```ts
Band = "A" | "B" | "C" | "D" | "F"

CheckId =
  | "title" | "meta-description" | "h1" | "image-alts"
  | "og-tags" | "canonical" | "robots-txt" | "sitemap-xml"
  | "https" | "hsts"

CheckResult { id, label, band, finding, data? }

DiagnosticReport {
  url, fetchedAt, overallBand, checks: CheckResult[],
  fetchError?: { kind: "timeout"|"network"|"http"|"too-large"|"blocked-private",
                 message, status? }
}

bandToOrdinal / ordinalToBand — A=4 ... F=0
```

## URL safety

`checkUrlSafety(raw)` rejects:
- malformed URL
- non-http/https protocol (ftp, file, javascript:)
- localhost / `*.localhost`
- IPv4 loopback `127.0.0.0/8`, private `10/8`, `172.16-31/12`,
  `192.168/16`, link-local `169.254/16`, reserved `0/8`
- IPv6 loopback `::1`, link-local `fe80:`

This is best-effort string-level. Foundation's HttpFetchPort SHOULD
DNS-resolve and re-check at fetch time too — server-side SSRF
defence-in-depth (R+1 hardening).

## Pure checks (analyzer.ts — composable, smoke-friendly)

| Check | A | F |
|---|---|---|
| Title | 50-60 chars | absent |
| Meta description | 120-160 chars | absent |
| H1 | exactly 1 | 0 |
| Image alts | 100% coverage | <50% |
| Open Graph | all 4 (title/description/image/url) | all missing |
| Canonical | present | absent → D (not F — soft signal) |
| robots.txt | reachable | unreachable → C |
| sitemap.xml | reachable | unreachable → C |
| HTTPS | true | false |
| HSTS | header present (HTTPS) | no HTTPS → F · HTTPS no header → C |

`runAllChecks(html, ctx)` composes them in stable order; UI ordering
matches.

## Service surface

`RmwService`:

- `runDiagnostic({ url, timeoutMs?, maxBodyBytes? })` — validates
  URL safety, fetches the page via `HttpFetchPort` (5s default
  timeout, 3MB default cap), probes `robots.txt` + `sitemap.xml`
  in parallel (soft-fail to false), composes 10 checks + worst-band
  overall. Logs activity + emits `diagnostic.run` (or
  `diagnostic.failed` on fetch error).
- `capture({ email, url, report })` — hands off to
  `FunnelCapturePort.captureToolCompletion` with
  `toolId: "rank-my-website"` + `sourceMeta: { tool, url, scoreBands,
  overallBand }`. Returns the funnel's `{ leadUserId, created,
  session? }` OR `{ handedOff: false, reason: "public_funnel_plugin_not_installed" }`
  when the optional port is absent (smoke #15 — soft-fail with
  guidance, no silent drop).

`isHandoff(result)` type-guard for handlers.

## Foundation ports

- Standard: `ActivityLogPort`, `EventBusPort`.
- **NEW** `HttpFetchPort`:
  - `fetchPage(url, { timeoutMs, maxBodyBytes }) → FetchPageResult`
    or throws `HttpFetchError(kind, message, status?)` where `kind ∈
    {timeout, network, http, too-large, blocked-private}`.
  - `reachable(url, { timeoutMs }) → boolean` — for robots/sitemap
    probes.
- **NEW** `FunnelCapturePort` (OPTIONAL): `captureToolCompletion`
  matching the funnel plugin's input shape. Foundation injects when
  `@aqua/plugin-public-funnel` is registered.

## API surface

2 routes mounted at `/api/portal/rank-my-website/`, both PUBLIC:

| Path | Method | Auth |
|---|---|---|
| `run` | POST | public — body `{ url, timeoutMs?, maxBodyBytes? }`, returns `{ ok, report }` |
| `capture` | POST | public — body `{ email, url, report }`, returns `{ ok, redirect: "/business-os", leadUserId, created }` + `Set-Cookie` if SessionPort wired |

Capture sets the same `aqua_session` cookie shape as public-funnel's
hc-complete handler so the visitor lands signed-in on `/business-os`.
When the funnel port is absent, returns `503` with reason.

## Page

`RmwToolPage` (path `""`) — server-rendered shell with a URL form
(`data-rmw-form="run"`) + a `data-rmw-results` aria-live region.
Foundation script (out of scope — T3 enhancement layer) wires the
form submission to `POST /api/portal/rank-my-website/run`, renders
the report, then a second form posts `/capture`.

## Smoke

`src/__smoke__/rmw.test.ts` — 16/16 pass via `tsx --test`. Splits
into URL safety (1), pure checks (2-9), service runDiagnostic
(10-13), capture handoff (14-15), and activity grammar (16).

1. URL safety rejects malformed / non-http / loopback / private
   IPv4 (10/8, 172.16-31/12, 192.168/16) / link-local / localhost.
2. checkTitle bands by length (sweet 50-60 → A; very short → F).
3. checkMetaDescription bands.
4. checkH1 — 1 → A, 0 → F, 2 → C, 3+ → D.
5. checkImageAlts — full coverage A; 3/4 missing → F (smoke pins
   the finding string `"3 of 4 images missing alt"`).
6. checkOgTags — all 4 → A, missing 2 → C, missing 4 → F.
7. checkCanonical — present A, absent D.
8. checkHttps + checkHsts respect response context.
9. worstBand returns the WORST not an average (A site + one F → F).
10. runDiagnostic happy path produces 10 checks + overall band;
    emits `diagnostic.run`.
11. runDiagnostic on a bad page → overallBand reflects worst (F
    when http (no HTTPS) — pinned).
12. runDiagnostic rejects unsafe URLs with `RmwInputError` (private
    IP, non-http).
13. runDiagnostic on fetch timeout ships report with `overallBand:F`
    + `fetchError.kind: "timeout"` + `checks: []` — no fabrication
    (chapter #68); emits `diagnostic.failed`.
14. capture hands off to public-funnel + emits `capture.handed-off`.
15. capture without funnel port returns `{ handedOff: false,
    reason: "public_funnel_plugin_not_installed" }` — soft-fail
    with guidance, no silent drop.
16. Activity entries use category `"rank-my-website"` with
    `rank-my-website.*` prefix.

`tsc --noEmit` clean.

## Foundation pending (standard 5-step + extras)

1. Workspace dep `@aqua/plugin-rank-my-website`.
2. `transpilePackages` += `@aqua/plugin-rank-my-website`.
3. Side-effect import calling `registerRmwFoundation` at boot.
4. `_registry.ts` append.
5. `ActivityCategory` += `"rank-my-website"` in foundation.
6. **NEW** `HttpFetchPort` adapter wrapping Node's `fetch` with the
   timeout + max-bytes guardrails enforced INSIDE the adapter (the
   service trusts the port; the port enforces). Adapter MUST also
   DNS-resolve and re-check the resolved IP against the same
   private-IP block-list — defence-in-depth SSRF mitigation. R+1
   could swap to `undici` for finer cancellation control.
7. **NEW** `FunnelCapturePort` adapter wrapping the public-funnel
   plugin's `captureToolCompletion(input)`. Inject only when the
   funnel plugin is registered.
8. Catch-all dispatcher honours `public: true` for the two rmw
   routes (shared item with public-funnel's hc-complete + tool-
   complete + memberships R4 webhook).
9. T3 enhancement layer: progressive-enhance the form on
   `RmwToolPage` to call the run + capture routes client-side.

## NOT in scope (R+1)

- Real Lighthouse / PSI integration — heavy dep, defer post-ship.
- Per-user history (post-ship; no persistence in v1).
- Image weight / TBT / CLS / LCP measurements (require headless
  browser; out of v1).
- Auto-suggested fixes (post-ship).

## R1 commit

T2 R023 single commit. After R023 T2 has shipped 19 plugins.
