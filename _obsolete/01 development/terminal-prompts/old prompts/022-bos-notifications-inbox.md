/loop

# T4 — Round 022: BOS notifications inbox

In-app notifications inbox for BOS users. Sources: phase advances,
lessons available, marketplace deals, founder messages. Self-contained.

## Mandatory pre-read

1. T4 R013 activity timeline.
2. T4 R007 Aqua AI scripted (companion sidebar).

## Scope

**A** — `business-os app/inbox.html` new page + bell icon in BOS
topbar with unread-count badge.

**B** — Notification shape: `{id, ts, kind, title, body, ctaHref?,
read}`. Stored in `bos.notifications[]` (capped 100).

**C** — Auto-emitters: phase-advance writes one ("You completed
Blueprint! 2 new lessons unlocked"). Marketplace add-on click sometimes
emits a follow-up tip. Founder can broadcast via admin.

**D** — Mark-read on click; mark-all-read button; filter by
read/unread/kind.

**E** — Chapter R022 + MASTER delta.

## NOT in scope

- Push notifications / desktop notifications.
- Real email digest.

## When done
DONE referencing `022-bos-notifications-inbox.md`.
