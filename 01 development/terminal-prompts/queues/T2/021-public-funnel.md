/loop

# T2 — Round 021: `@aqua/plugin-public-funnel` (WS-B R021)

Wires the Health Check completion (and future Resources tools) to a
real `lead` user creation + auto-signin + drop into Business OS. The
critical link in the public funnel.

Plan reference: chapter #124 `04-ship-plan-v1.md` WS-B.

## Mandatory pre-read

- Chapter #121 unified vision (`lead` role table + funnel diagram).
- Chapter #123 §"Multi-agency vision" (note: leads are agency-less,
  global tenant scope).
- T1 R023 `lead` role (must ship before this — coordinate with
  commander if T1 R023 not yet DONE).
- HC source at `public/health-check/` (don't edit — read for
  completion-event shape).

## Scope

**A** — Manifest: `id: "@aqua/plugin-public-funnel"`,
`scopePolicy: "global"` (NEW value — works because leads are
agency-less; if scope helpers reject, use `"agency"` and gate via the
master "Milesy Media" agencyId for now). Mark `core: true` so it auto-
installs on bootstrap.

**B** — Domain `LeadCapture`: `{ id, source: "hc"|"tool"|"signup-card",
sourceMeta: object, email, capturedAt, leadUserId, hcSlot?: object }`.
Source-meta carries the HC slot snapshot or tool input.

**C** — API:
- `POST /api/portal/public-funnel/hc-complete` — body `{ email,
  slot: HCSlot }`. Idempotent on email. Creates a `lead` user via
  T1 R023's path (no agency), captures the HC slot, issues session
  cookie, returns `{ redirect: "/business-os" }`. HC's existing
  completion handler in `public/health-check/` calls this endpoint
  via `fetch`.
- `POST /api/portal/public-funnel/tool-complete` — same shape but
  source `"tool"` for Resources tools (R023 next sprint).
- `GET /api/portal/public-funnel/me-context` — for BOS to read the
  current lead's HC slot + tool history (BOS personalisation).

**D** — Cross-plugin events:
- Emits `public-funnel.lead.captured` for activity-inbox.
- Emits `public-funnel.hc.completed` carrying score buckets.

**E** — HC integration (no changes to HC source; the HC already POSTs
to a configurable endpoint — point it at this plugin's endpoint).
Document the HC config tweak in the chapter.

**F** — Smoke 12+: idempotent on email; creates lead user; issues
session cookie; HC slot captured; me-context returns slot; events emit;
duplicate completion returns existing lead session.

**G** — Chapter `04-plugin-public-funnel.md` + MASTER row.

## NOT in scope

- BOS auth gate (R022 next).
- rank-my-website tool (R023 / Sprint 2).
- Lead-to-paying-customer upgrade flow (post-ship).

## When done
DONE referencing `021-public-funnel.md`.
