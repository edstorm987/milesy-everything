# 04 — Print / export PDF (T4 R018)

Browser print-to-PDF stylesheet shared across HC results + Incubator
root + admin Reports tab. No server-side generation; everything goes
through `window.print()` and the OS Save-as-PDF dialog. Per chapter
#68 honesty contract, every printed surface includes an explicit
watermark naming what kind of snapshot it is.

> Per prompt: server-side PDF and multi-page reports are out of scope.
> iOS Safari Save-to-PDF works via the Share menu → Print preview →
> pinch-out — `window.print()` triggers it without special branching.

## Files

- NEW `04-the-final-portal/milesymedia website/incubator app/print.css`
  (~120L, single canonical file, loaded `media="print"`).
- `lead magnet app/index.html` — link + print button + print header +
  watermark + handler + `data-print-expand` on transparency `<details>`.
- `incubator app/index.html` — link + print button + print header +
  watermark + handler.
- `business-os app/admin.html` — link + print button + print header +
  watermark on Reports pane + handler that auto-switches to Reports
  tab before printing.

## `print.css` what it does

Wrapped entirely in `@media print`. Highlights:

- `@page { size: A4; margin: 18mm 16mm 22mm 16mm; }`.
- Forces white background + readable 11pt body.
- Hides chrome the user wouldn't want printed: nav, sticky bars,
  sidebar, AI launcher + panel, dev bar, Incubator back-strip, trial
  banner, cart icon, business switcher, confetti, modals, progress
  meta. Every hide-target is keyed via class or `[data-*]` attr.
- Forces dark gradient surfaces flat (`.bos-bg-glow`, `.inc-cover`,
  `.mm-hero-cover-bg` all `display:none`).
- Heading sizes + page-break hints (`page-break-after: avoid` on
  headings; `page-break-inside: avoid` on cards / leak cards / KPI
  tiles / Incubator phase blocks).
- Auto-expand pattern: `details[data-print-expand] > * { display:
  block !important }` + summary forced bold. (CSS alone can't open a
  closed `<details>` in all browsers; the `beforeprint` JS opens
  them in addition for Safari/iOS reliability.)
- `.print-header` brand bar (Playfair brand mark + right-aligned
  "Printed <date>" meta).
- `.print-watermark` honest footer: dashed gold top border, gold-
  toned label + grey body, name of the snapshot kind, date, URL.
- Buttons + links flatten to neutral.

`[data-print-only]` is `display:none` by default in regular CSS (set
inline `style="display:none"` per surface to keep the on-screen view
clean) and `display:block !important` under `@media print`. That
pattern keeps the print blocks invisible at runtime and visible only
in the print view.

## Print buttons

Each surface has a screen-only `[data-print-trigger]` block (which
the print stylesheet hides) wrapping a single button:

- **HC results**: top-right `🖨 Print this page` (`data-hc-print`).
- **Incubator root**: top-right `🖨 Print this page` (`data-inc-print`).
- **Admin**: in Reports tab head (`data-admin-print`) — auto-clicks
  the Reports tab first so the printed view always shows reports
  regardless of where the user was.

All call `window.print()` after `paintMeta()` (renders date / URL
into the print-only blocks).

## `beforeprint` / `afterprint` listeners

Each surface registers:

```js
beforeprint → paint meta + open all [data-print-expand] details (saving prior open state)
afterprint  → restore prior open state
```

Belt-and-braces with the CSS rules so:
- Triggering print via Cmd+P / browser menu (not the button) still
  fills the meta fields + auto-expands the transparency block.
- Closing the print preview restores the user's original view (the
  expanded details revert to their prior state).

## Watermarks (honesty contract)

| Surface           | Watermark text                                    |
| ----------------- | ------------------------------------------------- |
| HC results        | "Self-reported snapshot — printed <date>. Honesty contract: only topics you answered are surfaced; nothing fabricated." |
| Incubator root    | "Onboarding snapshot — printed <date>. Honesty contract: only ticked checklist items count toward phase advance; recommendations only surface when HC topics are answered." |
| Admin Reports     | "Founder-admin snapshot — printed <date>. Local-storage view; small-n flagged where applicable." |

URL appended to each so the recipient can find the original surface.

## Smoke (verified 2026-05-07)

- `print.css`, HC, Incubator root, admin all return 200.
- Manual Cmd+P (Chrome desktop) on HC results: print preview shows
  brand header + leak strip + transparency block expanded + watermark
  with today's date + URL; nav / sticky bar / Aqua AI launcher all
  hidden.
- Same on Incubator root: print header + welcome + property strip +
  Phase Path + recommendations + checklist + activity + watermark.
- Admin print button switches to Reports tab + prints with the
  weekly-snapshot table visible + watermark.
- After closing print preview, the originally-collapsed `<details>`
  on HC results returns to its prior state (verified via
  `afterprint` listener).

## Q-ASSUMED + R018 follow-ups

- **Server-side PDF** out per prompt. If we want consistent output
  across browsers (esp. iOS Safari quirks), R+1 could pre-render via
  a Vercel edge function once T6 ships any backend.
- **Multi-page reports** out per prompt. The current admin print is
  one Reports tab; printing a different tab (Overview / Leads /
  Editor) prints whatever's visible — Reports is the curated print
  surface.
- **Per-niche branding** (e.g. skincare-themed brand mark on HC
  print) deferred. R+1 can read `bos.brand.niche` and swap brand
  text accordingly.
- **Activity timeline print** not in scope — `activity.html` doesn't
  yet load `print.css` (could be added trivially later).

## Cross-refs

- Chapter #68 honesty contract — every print watermark cites it.
- Chapter #66 ecosystem schema — surfaces use the same dataset that
  feeds the print views.
- R009 (#85) admin Reports tab — gains the print path here.
- R013 (#89) Activity widget — currently print-renders fine on
  Incubator root via the shared CSS but doesn't have its own
  dedicated print page.
- R017 (#93) HC progress nudge — modal hidden on print so a user
  printing mid-flow doesn't see the save banner.
