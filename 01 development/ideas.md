# Ideas

Parking lot for things surfaced during build but **not on the active
sprint plan**. Not a backlog — that's `tasks.md`. This is loose
thinking we want to remember.

Reset 2026-05-07 after Sprint 2 closed and the manager-with-subagent
workflow landed (chapter #158). Most of the original "ideas" from
2026-05-04 either shipped (chief commander pattern · iframe-embed
login · demo button · phase preset picker) or matured into chapters
(unified vision · architecture · multi-agency). Keeping the parking
lot fresh from here.

## Forward platform shape

- **Lead role + BOS auth gate** is shipped (T1 R023 + T2 R022). Next
  step that fills out the funnel: a real "graduate to client" upgrade
  flow when a lead's BOS engagement crosses a threshold. UX prompt
  inside BOS · email nudge · operator review queue.
- **Multi-agency satellites** (T7 queue ready) — `aquaoasis-web.com`
  resolves to a different agency on the same backend. Phase 12 R3+.
  Could ship in Sprint 4 once Felicia is live and Ed wants to test
  the satellite story.
- **Resources tools beyond `rank-my-website`** — `rank-my-google-business`,
  `audit-my-funnel`, `score-my-newsletter`. Each is a small
  Resource-Finder catalog entry + a public-funnel hand-off. T2 lane.

## UX surface ideas

- **Dashboard widgets marketplace** — every plugin can register a
  widget that appears in the Founder dashboard's "tile bar". Ed
  drags-and-drops to compose his own home view.
- **Quick-actions palette** (Cmd-K) — chapter #99 shipped editor-side;
  same pattern across the agency portal would be good.
- **Inline notifications** for cross-plugin events (e.g. Stripe
  payment failed → notification in the Topbar bell). Notifications
  plugin already exists (#84); need event-bus subscriptions wired
  from each major plugin.

## Plugin ideas

- **`@aqua/plugin-content-calendar`** — visual calendar across
  blog/social/email schedules per client. Bridges T2 marketing
  plugins.
- **`@aqua/plugin-feedback-quiz`** — embeddable quiz blocks for
  client portals (NPS-style mid-engagement check-ins, distinct from
  T2 R020 feedback-loops which is end-of-engagement).
- **`@aqua/plugin-affiliate-tracker`** — tracks affiliate referrals
  from public-funnel sources, attribution windows, payouts. Builds on
  existing `affiliates` plugin shape.

## Operational

- **Per-tenant Postgres isolation** — currently pool model (chapter
  #19); for white-label customers who want strict isolation, a
  per-tenant DB is the upgrade path. `OrgRecord.database` exists in
  the legacy `02` portal but routing layer never picked at request
  time. R+1 once we have a customer asking for it.
- **Real-time collaboration in the editor** — CRDT/Yjs. Out of v1
  scope per `eds requirments.md` but a natural Phase 13 if multiple
  team members start editing the same site concurrently.
- **AI page builder** — "describe a page, get a block tree". Bridges
  T3 (block engine) with an LLM call. Hold until v1 ships.

## Things to research / confirm

- **Email deliverability** — chapter #144 shipped SMTP via Postmark;
  need to set up SPF/DKIM on `mail.milesymedia.com` subdomain to
  protect main domain reputation when campaign volume picks up.
  T6/operator action.
- **Stripe Connect for affiliate payouts** — flagged in original
  ideas (still TODO). Needs Stripe account verification + KYC; T6
  partnership work.
- **Search Console / GMB / GA4 OAuth flows** — T6 prod-gate work
  beyond what GA4 read-only (chapter #149) shipped. Real OAuth, not
  Service-Account JSON paste.

## Workflow ideas

- **Subagents-of-subagents** — when a round is heavy (R034 pipelines
  was), the round-subagent could itself spawn sub-subagents per
  goal. Untested; chapter #158 is the v1 manager→subagent shape.
- **Per-tenant feature flags** — instead of one global `core: true`
  flag per plugin manifest, flip features per agency via the install
  config. Useful when Milesy wants a feature AquaOasis doesn't.
- **"Operator dry-run" mode** — a session cookie variant that lets
  Ed walk every plugin's surface without writing data. Chapter #93
  founder dashboard hint.

— Park new ideas here freely; promote to `tasks.md` when ready to
ship. Last refreshed 2026-05-07T19:15Z.
