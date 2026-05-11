/loop

# T1 — Round 031: BOS auth-gate middleware integration

T2 R022 (chapter #137) shipped a pure decision engine
`evaluate(ctx, opts)` for the BOS auth gate. T2 explicitly flagged
foundation pending: middleware.ts must call this engine + translate
its decision into a `NextResponse`. This round closes that loop.

## Pre-read

- Chapter #137 (T2 R022 BOS auth gate) — §"foundation pending"
  spells out exact wire-up.
- `milesymedia-website/middleware.ts` (existing matcher).
- `@aqua/plugin-bos-auth-gate` exports — find `evaluate`,
  `matchesBosPath`, `isBosAsset`, `buildLoginRedirect`.

## Scope

**A** — Middleware matcher extension: `/business-os/:path*` and
`/api/portal/business-os/:path*` join existing `/embed/:slug/:variant`
matcher. Skip static assets via `isBosAsset`.

**B** — Per-request: `evaluate({ pathname, session, role })` with
`devBypass: process.env.NEXT_PUBLIC_DEV_BYPASS === "1"`. Translate:
- `outcome: "allow"` → `NextResponse.next()`
- `outcome: "redirect"` → `NextResponse.redirect(decision.redirect)`
- `outcome: "dev-bypass"` → `NextResponse.next()` + `Set-Cookie:
  bos_dev_banner=1` (BOS reads this and shows the dev-banner per
  T2's plugin contract)

**C** — Session resolution inside middleware: lightweight token
decode (not full DB hit). Reuse the existing `getSessionFromRequest`
or its middleware variant. Don't double-fetch.

**D** — Smoke `§ BOS middleware integration` (≥8 — anon →
redirect; signed lead → allow; signed agency-team → allow;
signed end-customer → redirect; static asset → allow without engine
call; dev-bypass cookie set; engine called once per request; BOS
path matcher excludes `/business-os-other` false-positive).

**E** — Chapter `04-bos-middleware-integration.md` + MASTER row.

## NOT in scope

- BOS data persistence migration (post-ship).
- Lead-to-customer upgrade UX (post-ship).

## When done
DONE referencing `031-bos-middleware-integration.md`.
