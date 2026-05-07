/loop

# T2 — Round 022: `@aqua/plugin-bos-auth-gate` (WS-B R022)

Gates `/business-os/*` on a real session. Reads user state from
foundation storage so leads see their own personalised BOS, not pure
localStorage data. Today BOS is open — anyone hitting :3030/business-os
gets in.

Plan reference: chapter #124 `04-ship-plan-v1.md` WS-B.

## Mandatory pre-read

- Chapter #121 unified vision (lead → BOS landing).
- T1 R023 `lead` role + R022 redirect (must ship before this).
- T2 R021 public-funnel (this plugin reads the lead's hcSlot via
  `/api/portal/public-funnel/me-context`).
- BOS source at `public/business-os/` (read-only — don't edit; this
  plugin gates at the rewrite layer).

## Scope

**A** — Manifest: `id: "@aqua/plugin-bos-auth-gate"`,
`scopePolicy: "global"` (or `"agency"` gated to Milesy Media if global
scope unsupported), `core: true`.

**B** — Middleware integration: extend
`milesymedia-website/middleware.ts` (or add a new middleware via the
plugin manifest if foundation supports it) to match `/business-os/:path*`
and `/api/portal/business-os/:path*`. On unauthenticated request →
redirect to `/login?from=bos&next=<original-path>`. On authenticated
request → pass through.

**C** — Lead user state surface: NEW
`GET /api/portal/business-os/me` — returns
`{ user: {id,email,name?}, hcSlot?: object, capturedAt: number,
  agencyless: true }`. BOS calls this on load; falls back to its
existing localStorage shape for offline. The plugin owns this endpoint;
it's a thin wrapper around the public-funnel `me-context`.

**D** — BOS doesn't need to be edited — its existing `bos.js` is
augmented via a small loader script the plugin injects via
`next.config.ts`'s rewrite headers, OR by appending to a known
mount point in `public/business-os/index.html`. Pick the lighter
path; document in chapter.

**E** — Soft-gate (don't break dev): when `NEXT_PUBLIC_DEV_BYPASS=1`,
unauthenticated BOS access is allowed (with a banner: "DEV MODE — not
gated"). Production has gate active.

**F** — Smoke 10+: middleware matches BOS paths; redirect issued for
anon; pass-through for lead session; me endpoint returns lead context;
DEV_BYPASS soft-gates.

**G** — Chapter `04-plugin-bos-auth-gate.md` + MASTER row.

## NOT in scope

- BOS data persistence migration (localStorage → Postgres) — leave
  for post-ship.
- Lead-to-customer upgrade UX inside BOS — post-ship.

## When done
DONE referencing `022-bos-auth-gate.md`.
