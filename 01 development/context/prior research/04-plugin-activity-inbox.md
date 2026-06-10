# `@aqua/plugin-activity-inbox` — unified activity inbox (T2 R003)

Round-003 of the queue-based T2 worker. Closes the chapter #59 §3
`InboxView` + `LogsView` v1 gap: foundation already records every
action via the `activityFeed` ports — the data was there; this plugin
is the UI.

## Why now

T1's R8 lock-in chip activity emit (and every other plugin since)
already pushes `ActivityEntry` records into `getState().activity`.
Until R003 there was no in-portal viewer — operators had to scrape the
log via API calls. Inbox makes the firehose legible.

## Shape

| Area | Decision |
| --- | --- |
| `id` | `activity-inbox` |
| `scopePolicy` | `agency` |
| `core` | false |
| `requires` | (none — read-only against foundation activity) |
| Storage layout | `inbox/read/<actorUserId>` (ActorReadState) · `inbox/filters/<actorUserId>` (last-used InboxFilter) |
| Activity emit | **none** — plugin only reads; never writes new events |
| API routes | `list` · `unread` · `read` · `mark-read` · `filters` · `filters/save` |
| Pages | `InboxPage` (split view: timeline left, detail right) |
| Chrome | `<NotificationBell>` server component renders into agency layout's `Sidebar.extra` slot — null-rendering when the plugin isn't installed |

Mirrors the most recent plugin shape (`@aqua/plugin-sops` → R002): same
file layout, same `containerFor` / `_containerFromCtx` adapter pattern,
same vendored `aquaPluginTypes` / `tenancy` so it tsc-cleans standalone.

## Read state model

Per-actor `lastReadTs` (epoch ms) — not a per-event id set. Keeps the
payload bounded regardless of activity volume; matches the foundation
log's monotonic ts ordering. `markAllRead` sets `lastReadTs = now()`;
`list()` derives `read = e.ts <= lastReadTs` per item; `unreadCount`
counts `e.ts > lastReadTs` over the same scan.

`unreadOnly` filter hides read items but does **not** mutate
`unreadCount` semantics — the count always reflects the full unread
slice, so the bell badge stays consistent regardless of which list
filter is currently applied.

## Filters (chapter §3 ask)

- **Categories** — chip row over the foundation `ActivityCategory`
  union (19 values: auth · tenant · plugin · phase · fulfillment ·
  ecommerce · settings · system · hr · memberships · affiliates ·
  finance · marketing · crm · forms · email · export · kanban · sops).
- **Clients** — multi-select via repeated `clientId` query params;
  agency-level entries (no `clientId`) are surfaced when no
  client-filter narrows the result.
- **Date range** — `today` / `week` / `month` / `all` / `custom`
  presets; `resolveRange()` returns `[start, end)` UTC windows.
- **Read/unread** — `unread=1` query param.
- **Free text** — `q=` searches `message + action`
  case-insensitively.

## Grouping

`InboxListResult.groups` buckets items by `(day, clientId)`. Newest
day first; within a day, agency-level rows render before client rows
(`clientId` undefined sorts first). Empty selection yields zero groups
+ "No activity matches these filters." copy.

## Notification bell

`portal/src/components/chrome/NotificationBell.tsx` — server component
mounted from the agency layout via the existing `Sidebar.extra` slot
(R1 of the agency-shell chapter introduced that slot for exactly this
class of cross-cutting chrome). Behaviour:

1. `getInstall({ agencyId }, "activity-inbox")` — null + disabled
   instances render nothing (so the bell is safe to wire
   unconditionally).
2. `makePluginStorage(install.id)` reads `inbox/read/<actor>` directly
   — bypasses the plugin runtime so we don't pay an HTTP hop.
3. `listActivity({ agencyId, limit: 500 })` from foundation gives the
   recency window; unread = `e.ts > lastReadTs`.
4. Renders a labelled `<Link>` → `/portal/agency/activity-inbox?unread=1`
   with a `99+` cap on the badge.

Server-render every request; no client polling for v1 (the manifest
exposes `bellPollSeconds` for an R+1 client component).

## Smoke (12/12)

`tsx --test src/__smoke__/inbox.test.ts`. Cases:

1. `ALL_CATEGORIES` exposes the foundation union (19 values, no dupes).
2. `dayKey` + `resolveRange` produce stable UTC windows for
   today/week/month/all.
3. `list` returns events filtered by agency only (other-agency events
   suppressed even when scan returns them).
4. Category filter narrows; clientId filter narrows; both together
   intersect.
5. `range=today` excludes older entries; `range=week` widens.
6. `query` filter searches `message + action` case-insensitively.
7. `markAllRead` sets `lastReadTs`; subsequent `list` marks items
   read; `unreadCount = 0`.
8. `unreadOnly` filter hides read items but doesn't change
   `unreadCount` semantics (count still reflects full unread slice).
9. Read state is per-actor (Alice's mark doesn't affect Bob's).
10. Groups bucket by day + clientId; agency-level rows precede client
    rows within a day.
11. `setFilters` / `getFilters` round-trip per-actor; other actors see
    `null`.
12. `unreadCount` matches `list().unreadCount` for the same actor.

Mock activity port uses our `now()` clock helper (not `Date.now()`)
so `setClock` propagates into seeded entries — same fix shape needed
for any future plugin smoke that depends on time-windowed reads.

## Files

```
04-the-final-portal/plugins/activity-inbox/
├── index.ts                            (manifest)
├── package.json + tsconfig.json
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          (vendored)
    │   ├── tenancy.ts                  (vendored)
    │   ├── domain.ts                   (InboxFilter, dayKey, resolveRange, ALL_CATEGORIES, CATEGORY_LABELS)
    │   ├── ids.ts · time.ts
    ├── server/
    │   ├── ports.ts                    (StoragePort, ActivityLogPort, …)
    │   ├── inbox.ts                    (InboxService — list/unreadCount/markAllRead/filters)
    │   ├── foundationAdapter.ts        (register / containerFor / _containerFromCtx)
    │   └── index.ts                    (barrel)
    ├── api/
    │   ├── handlers.ts                 (list / unread / read / mark-read / filters / filters/save)
    │   └── routes.ts
    ├── pages/
    │   └── InboxPage.tsx               (split view)
    └── __smoke__/inbox.test.ts         (12 cases)
04-the-final-portal/portal/src/components/chrome/NotificationBell.tsx (NEW — server component)
04-the-final-portal/portal/src/app/portal/agency/layout.tsx           (patched — extra slot wraps Bell + Tools)
```

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## Mesh hazard log

- Cycle 38 commander commit `9819720` absorbed 13 of my 16 newly-added
  plugin files; T3's `9951a3f` absorbed the remaining 3 (index.ts,
  smoke test, InboxPage). Verified `git ls-tree -r HEAD` lists all 16
  source files; smoke ran 12/12 green from working tree pre-absorption.
  Treated as DONE per the standard mesh pattern Ed has called out
  before (shared `.git/index`).

## R+1 candidates

- Real-time bell (manifest already exposes `bellPollSeconds`): client
  component polls `/unread` and updates the badge without a full
  navigation.
- Per-actor read-state retention policy (today: unbounded
  `lastReadTs`; trivial — the field is a single number).
- Email/SMS notification via R10's email-sender — let an actor
  subscribe to specific category × client pairs.
- Activity write side: a `logFromPlugin()` helper plugins can import
  rather than each re-vending the foundation port.
- Saved-view named filters (today: only "last-used" is persisted).
- Surface the bell in the **client-shell** (Felicia's per-client
  workspace) — today only the agency layout wires it in.
