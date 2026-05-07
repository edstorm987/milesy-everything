# 04 — BOS notifications inbox (T4 R022)

In-app notifications inbox. Push-only model — `bos.notifications[]`
written by various surfaces (phase advance, marketplace add, admin
broadcast), read at `business-os app/inbox.html`. Bell icon top-right
across BOS pages with unread badge. Self-contained — no push or email
in this round (T6 plumbs both).

> Per prompt: push notifications / desktop notifications + real email
> digest are out of scope.

## Storage — `bos.notifications[]`

```js
{ id, ts:ISO, kind, title, body, ctaHref?, from?, read }
```

Cap 100 entries (oldest dropped via `slice(-100)` on every write).
`Notify.write()` mirrors via `BOSStorage.set()` when R012 loaded so
multi-business inboxes stay isolated.

## `Notify` API — `incubator app/lib/notify.js`

```js
window.Notify = {
  KINDS,                                       // 5-kind registry (icon + label)
  push(kind, title, body, opts?) → entry,      // opts: {ctaHref, from}
  list(filter?) → entries,                     // filter: {kind, unreadOnly}; newest first
  markRead(id),
  markAllRead(),
  unreadCount() → number,
  metaFor(kind) → {icon, label}
}
```

Two CustomEvents emitted:
- `notify:new` (after push)
- `notify:read` (after markRead / markAllRead, with `{id}` or `{all:true}`)

Both let the inbox + bell repaint without polling.

## KINDS registry (5)

| Kind          | Icon | Label        | Where it fires today                                         |
| ------------- | ---- | ------------ | ------------------------------------------------------------ |
| `phase`       | 🎉   | Phase        | R006 phase-advance markComplete (when next phase exists)     |
| `lesson`      | 📚   | Lesson       | (registered; no surface fires yet — R+1 hook in lesson done) |
| `marketplace` | 🛒   | Marketplace  | R016 add-to-cart click handler (per-detail-page)             |
| `founder`     | ✨   | Founder      | NEW admin Overview "Founder broadcast" form                  |
| `system`      | 🛠   | System       | (registered; reserved for system-wide push e.g. trial expiry) |

Unknown kinds fall back to `{ icon:'◆', label:kind }`.

## Surfaces

### `business-os app/inbox.html` (NEW, ~140L)

Header w/ "Mark all read" button + filter chips (All / 🎉 / 📚 / 🛒
/ ✨ / 🛠 + "Unread only" toggle on the right). Each row: large kind
icon + title (with unread dot) + body + meta line (kind label + relative
time + "from <strong>{from}</strong>") + optional "Open →" CTA pill.
Click anywhere on a row marks it read. Empty state honest.

Auto-repaints on `notify:new` + `notify:read`.

### Bell icon — `mountBellIcon()` in bos.js

Lazy-mounted alongside cart icon. Reads `Notify.unreadCount()`;
renders only when > 0. Floating gold-bordered black pill top-right,
positioned 130px when cart icon is present (stacks left of cart),
18px otherwise. Path-aware href (`../inbox.html` from
`marketplace/<slug>.html`, `inbox.html` elsewhere). Hidden on
`inbox.html` itself (would be redundant). Re-paints on `notify:new` +
`notify:read` events.

### Phase-advance push (R006)

`lib/phase-advance.js markComplete()` fires:
```js
Notify.push('phase',
  'You completed <Phase>!',
  next ? 'Onwards to <Next>. Check the new lessons available for this phase.'
       : 'All phases done. Onwards.',
  { ctaHref: next ? '../incubator app/phase-N-<slug>.html' : '../incubator app/index.html' });
```

### Marketplace add-to-cart push (R016)

Each of the 9 detail pages' Add-to-plan handler fires:
```js
Notify.push('marketplace',
  'Tip on <addon name>',
  'Added £<price>/mo to your plan. Continue to checkout when ready.',
  { ctaHref: '../cart.html' });
```

Detail pages got `<script src="../../incubator app/lib/notify.js">`
added explicitly so the call resolves synchronously on first interaction.

### Founder broadcast — admin Overview pane (NEW)

Inline form: title (required) + body (textarea) + optional URL +
"Push to inbox" submit. Pushes `kind:'founder'`, `from:'Founder'`.
Success status confirms then auto-clears in 3.5s. Form resets after
success. Comment in code calls out R+1: once email-sender plugin
ships, this also fans out server-side.

### print.css

`[data-bos-bell]` added to the hide-list so printed pages don't show
the bell.

## CSS — `.bos-inbox-*` block (~50L appended to bos styles.css)

- Filter chips reuse the `.bos-chip` class from R013 activity timeline.
- Each row: 32px / 1fr / auto grid (icon · body · CTA).
- 3px left border per kind: phase=green, lesson=blue, marketplace=gold,
  founder=violet, system=grey. Unread rows get gold-tint background +
  small gold dot next to title.
- Hover: gold border.
- Empty state: italic muted.

## Smoke (verified 2026-05-07)

- `inbox.html`, `lib/notify.js`, admin, marketplace inbox detail all 200.
- Manual flow:
  1. Empty `bos.notifications` → inbox shows "Nothing here yet."
  2. Click "Add to my plan" on any marketplace detail → notification
     appears in inbox with marketplace kind + Open CTA → cart.html.
  3. Bell icon top-right shows "🔔 1 unread →".
  4. Open inbox → click row → row marks read + dot disappears + bell
     drops/disappears (when count → 0).
  5. Mark Blueprint phase complete on R006 → phase notification appears.
  6. Admin Overview "Founder broadcast" form → submit → notification
     appears with ✨ icon, "from Founder" meta + CTA if URL provided.
  7. "Mark all read" wipes unread state across all rows.
  8. Filter chips narrow correctly; "Unread only" toggle hides reads.

## Q-ASSUMED + R022 follow-ups

- **Lesson-done push** kind registered but not yet fired from
  `module.html`. R+1 trivial: in the mark-done handler push
  `Notify.push('lesson', ...)` when going from undone → done.
- **System push** also registered + reserved for things like trial-
  expiry warnings (R011 currently uses a banner; could push to inbox
  too). R+1.
- **Server-side fan-out** (real broadcast): R+1 once email-sender
  plugin ships. Today's admin form is per-device only.
- **Per-business inbox** via R012 BOSStorage mirror — works when
  storage.js is loaded; admin / inbox / detail-pages all load it
  explicitly. Switching business via the R012 switcher snapshots prev
  inbox + mirrors new business's inbox.
- **Push notifications / desktop notifications** + **real email
  digest** explicitly out per prompt.
- **CTA path correctness**: bell icon path-aware (`../` from
  marketplace/), phase CTAs use `../incubator app/`, marketplace CTA
  uses `../cart.html`. R+1 audit: any other future surface needs
  similar care.

## Cross-refs

- R006 (#82) phase-advance — emits `phase` kind on advance.
- R007 (#83) Aqua AI — companion sidebar; bell sits in same top-right
  zone, both visible together OK.
- R009 (#85) admin — Founder broadcast form lives in Overview pane.
- R011 (#87) entitlement — system kind reserved for trial expiry
  pushes (R+1).
- R012 (#88) BOSStorage — Notify.write mirrors via set when present
  so multi-business inboxes stay isolated.
- R013 (#89) Activity — distinct surface (Activity = log of what
  happened; Inbox = unread-tracked messages to act on); they may
  overlap but Activity is the audit trail, Inbox is the to-do.
- R016 (#92) marketplace — detail pages emit `marketplace` kind on
  add-to-cart.
- R018 (#94) print.css — `[data-bos-bell]` added to hide list.
