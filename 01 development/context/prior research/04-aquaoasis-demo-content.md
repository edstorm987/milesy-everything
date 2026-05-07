# AquaOasis Demo content pack (T4 R004, Sprint 2)

T1 R026 (chapter #133) seeded the AquaOasis Demo agency record + brand
kit + 3 plugin installs (`client-crm` / `bookings` /
`agency-marketing`). When Ed flips the Topbar agency switcher to
AquaOasis today, those plugin pages render empty — there's no demo
data to inspect. R004 ships the content layer so the multi-agency
master/satellite vision (chapter #123) is end-to-end provable.

## What shipped

`src/app/(seeds)/aquaOasisDemoContent.ts` — pure-data + idempotent
port-driven runner. Placed under the `(seeds)` Next.js route group
(non-routing folder) because `src/lib/server/` is T1 territory per
this terminal's HARD BOUNDARY.

### Data tables (all marked `demo: true` + `DEMO-*` slugs)

- **DEMO_BRAND_KITS** — 3 distinct flavours (heritage cream / coastal
  teal / studio pastel) with full primary/secondary/accent + heading
  + body fonts + border radius. Each tied to one of the demo
  clients.
- **DEMO_CLIENTS** — 3 entries: Marin Osteopathy (heritage), Tidewater
  Therapy (coastal), Soft Light Studio (studio-pastel). Slugs prefixed
  `DEMO-` so the data is unambiguously synthetic.
- **DEMO_CONTACTS** — 5 per client = 15 total. Names rotated through
  small first/last pools; emails `<first>.<last>@example.test` (RFC
  6761 reserved TLD — guaranteed never to be a real address). Stages
  `new`/`warm`/`active`/`active`/`dormant` per client.
- **DEMO_BOOKINGS** — 10 per client = 30 total. Spread deterministically
  across the next 30 days from a fixed reference date
  `2026-05-08T00:00:00Z` (so the data renders identically across
  boots — no `Date.now()` drift). Status `completed` for the first
  3 days, `confirmed` next 4, `pending` rest. Titles rotated through
  10 realistic clinic-session names.
- **DEMO_LEADS** — 3 per client = 9 total. Sources rotated across
  facebook-ads / google-organic / referral / instagram.
- **DEMO_AGENCY_CAMPAIGNS** — 4 agency-level: Spring rebook (live email),
  Coastal launch (scheduled social), Referral bring-a-friend (live
  referral), Google evergreen (draft paid).

### Idempotent runner

`seedAquaOasisDemoContent(ports: SeedPorts) → Promise<SeedResult>`.

`SeedPorts` is a soft contract: `markerStore.has/set` (any KV the
caller has — install metadata bag, agency settings, anything),
`clientStore.upsert`, `contactStore.create`, `bookingStore.create`,
`leadStore.create`, `campaignStore.upsert`. All methods are
`Promise-or-direct` so sync + async storage adapters both compose.

Idempotency: caller checks `markerStore.has(slug,
"aquaoasis-demo-content/seeded")`. Runner stamps the marker on
success. Re-runs no-op cleanly.

`SeedResult` returns `{seeded, counts: {clients, contacts, bookings,
leads, campaigns}}` so the caller can log or report what landed.

### Feature flag

`seedAquaOasisContent: boolean` — exported, defaults to
`process.env.NODE_ENV !== "production"`. Production tenant flips
won't spawn fake data unless the operator overrides this.

## Honesty contract (chapter #68)

Every record carries `demo: true` + a `DEMO-*` slug + emails on
`example.test` (reserved TLD). Downstream code can filter on either
the flag or the prefix to keep demo data out of any real client
report. No fabricated numbers — these aren't presented as benchmarks,
they're labelled fixtures.

## Wire-up — Q-ASSUMED

This terminal cannot edit `src/lib/server/aquaOasisSeed.ts` or the
founder-seed runner (T1 territory per HARD BOUNDARY). Q-ASSUMED that
T1 will pick up `seedAquaOasisDemoContent` from
`@/app/(seeds)/aquaOasisDemoContent` and call it from `seedAquaOasisDemo`
AFTER the agency record + plugin installs land. T1 maps the soft
ports to whatever storage adapters the agency-marketing /
client-crm / bookings plugins expose for seeding.

The module's design makes this a one-line wire-up on T1's side:

```ts
import {
  seedAquaOasisDemoContent,
  seedAquaOasisContent,
} from "@/app/(seeds)/aquaOasisDemoContent";

if (seedAquaOasisContent) {
  await seedAquaOasisDemoContent({ markerStore, clientStore, ... });
}
```

If T1 prefers a different module location they can re-export — the
data tables stand alone.

## Smoke

Type-check expected to pass on Ed's :3030 dev server (no smoke harness
in T4 territory; T1 will smoke the integrated runner). Manual smoke
once T1 wires it: flip Topbar to AquaOasis → /portal/agency clients
grid shows 3 DEMO clients → tile click → CRM/Bookings/Marketing tabs
populated.

## Out of scope

- Editing T1's `aquaOasisSeed.ts` or founder-seed runner.
- Real client data (this is demo only — explicitly marked).
- AquaOasis marketing front (Phase 12 R3 — domain-aware marketing,
  post-ship).
- Per-agency lead-magnet pack (Phase 12 R4, post-ship).
- Fixture rotation / multiple personas — single deterministic set is
  enough for v1.
