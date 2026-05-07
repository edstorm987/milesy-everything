/loop

# T2 — Round 003: Activity inbox plugin

Foundation already records every action via `activityFeed` ports — we
have the data; we don't have the UI. Ship a lightweight
`@aqua/plugin-activity-inbox` plugin so Ed has a unified Inbox view
of "what's happened across all my clients today" (per chapter §3 old-portal
inventory's `InboxView` + `LogsView`).

## HARD BOUNDARIES

- `04-the-final-portal/milesymedia website/` (T4).
- `04-the-final-portal/business-os/` (T4).
- `02` + `03` read-only.

## Mandatory pre-read

1. Chapter `04-architecture.md` — the activity feed contract.
2. Foundation's existing activity APIs (`listActivity`, `category`
   union, etc.) — find where T1 R8 added `Lock-in chip` activity for
   reference.
3. Chapter #59 §3 — `InboxView` + `LogsView` rows and v1 status.

## Scope

**Goal A — Plugin shell `@aqua/plugin-activity-inbox`**
- `scopePolicy: "agency"`, `core: false`, no required deps.
- Reads existing foundation activity events; does NOT write new ones.
- Per-install storage for filters + read/unread state per actor.

**Goal B — InboxPage**
- Split view: left list (timeline of events grouped by client + day),
  right detail panel (full event payload + jump-to-source link).
- Filters: category (chip row of activity categories), client
  (multi-select), date range (today / this week / this month / custom),
  read/unread.
- "Mark read" action; per-actor read state.

**Goal C — Notification bell in chrome**
- Foundation chrome (sidebar / topbar) gets a small bell badge with
  unread count. Click → opens InboxPage with `unread` filter active.
- Chrome change goes through whatever pattern the agency-shell sidebar
  uses (it has an `extra?:` slot per agency-shell R1 — use it or extend).

**Goal D — Smoke + chapter**
- Smoke: list endpoint returns activities, filters narrow correctly,
  read/unread persists, bell count matches.
- Chapter `04-plugin-activity-inbox.md`. MASTER row.

## NOT in scope

- Writing new activity events (foundation owns that).
- Real-time push (poll on a fast cadence is fine).
- Notifications email/SMS (would route via T2 R10 email-sender; could
  be R+1 candidate).
- Touching milesymedia / business-os.

## When done

DONE referencing `003-activity-inbox.md`.
