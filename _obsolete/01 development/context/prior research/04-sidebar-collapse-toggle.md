# 04 — Sidebar collapse toggle (T1 R035)

Ed flagged that the sidebar appeared to "collapse on every nav click".
Audit found **no actual auto-collapse code** in `Sidebar.tsx` — it's a
server component with no `useEffect`/`usePathname` route hook and no
viewport-driven `display:none` rule that would interpret as "collapse".
What Ed was perceiving was simply the absence of any persisted user
intent: the sidebar always rendered the same default width on every
navigation. R035 ships an explicit user-controlled minimise/maximise
toggle so Ed has a real lever, and explicitly forbids any nav-click
side-effect on the collapsed attribute.

## Files

- **NEW** `src/components/chrome/SidebarCollapseToggle.tsx` — client
  component exporting `<SidebarCollapseToggle />` (chevron button, top
  of sidebar) and `<SidebarCollapseHydrationScript />` (synchronous
  `<head>` script that reads `localStorage["mm-sidebar-collapsed"]`
  and stamps `data-collapsed` on `<aside aria-label="Primary
  navigation">` before paint — no flash on reload).
- **EDIT** `src/components/chrome/Sidebar.tsx` — wires the toggle on
  desktop only (mobile slide-over opts out via
  `data-sidebar-mobile="true"` so the chevron doesn't render twice
  inside `<MobileNav>`). `<aside>` ships `data-collapsed="false"` as
  the default attribute. Each nav `<Link>` now carries `title=` for
  hover tooltip + a hidden `mm-sidebar-link-initial` first-letter
  pill that swaps in under the collapsed selector. Critical: nothing
  in the link path mutates the attribute — only the toggle button
  does.
- **EDIT** `src/app/layout.tsx` — adds `<head>` block that mounts
  `<SidebarCollapseHydrationScript />` ahead of `<body>` so the
  attribute is set before paint.
- **EDIT** `src/app/globals.css` — collapsed-mode CSS gated by
  `aside[aria-label="Primary navigation"][data-collapsed="true"]:not([data-sidebar-mobile="true"])`.
  Width 240→56px with 140ms transition; `mm-sidebar-tenant`,
  `mm-sidebar-heading`, `mm-sidebar-link-label`, `mm-sidebar-link-badge`,
  `mm-sidebar-extra` hide; `mm-sidebar-link-initial` shows; link rows
  centre.
- **NEW** `scripts/smoke-sidebar-collapse-toggle.test.ts` + npm script
  `smoke:sidebar-collapse-toggle`.

## Storage contract

- Key: `localStorage["mm-sidebar-collapsed"]`
- Values: `"1"` (collapsed) | `"0"` (expanded) | absent (treat as
  expanded).
- Hydration: synchronous `<head>` script reads the key and calls
  `setAttribute("data-collapsed", String(collapsed))` either
  immediately (if DOM ready) or on `DOMContentLoaded`. Wrapped in
  try/catch so blocked storage degrades to default expanded, never
  throws.
- Mutation: only `<SidebarCollapseToggle>`'s click handler writes
  the key + the attribute. Nav `<Link>` clicks never touch either.

## A11y

- Button has `aria-label` that flips between "Expand sidebar" /
  "Collapse sidebar" with state, plus `aria-pressed` and matching
  native `title=` tooltip. Chevron rotates 180° to reinforce
  direction.
- Collapsed link rows still expose the full label via `title=` for
  hover tooltip; screen readers see the link text (not the
  first-letter pill, which is `aria-hidden="true"`).
- Mobile slide-over (`<MobileNav>`) is excluded from collapsed mode
  via `data-sidebar-mobile="true"`. The drawer is already a discrete
  open/close UX; collapsing it would be redundant.

## Boundaries respected

- `plugins/**`, `public/**`, `clients/**` untouched.
- `AgencyToolsBallpark.tsx` (More-tools expand/collapse) untouched —
  it's a separate concern (per-panel disclosure inside the sidebar's
  `extra` slot, not sidebar-wide collapse).

## Smoke (10/10 — five suites)

- SidebarCollapseToggle component: file exists + client; persists
  "1"/"0"; toggles `data-collapsed`; exports synchronous hydration
  script.
- Sidebar wires the toggle: imports + renders on desktop only +
  default attr; nav links carry `title=` + first-letter fallback
  with NO `setAttribute("data-collapsed"…)` or `mm-sidebar-collapsed`
  reference; collapsible class + hide-target classnames present.
- Root layout hydration: script mounted inside `<head>` ahead of
  `<body>`.
- Collapsed CSS contract: 56px + label/heading hide selectors +
  mobile exclusion present.
- No auto-collapse on route change: `Sidebar.tsx` is server-rendered
  with no `useEffect`/`usePathname`.

## NOT in scope (post-ship)

- Multiple side panels / drag-resize sidebar.
- Per-tenant sidebar customisation.
- Animating More-tools alongside the chrome (kept separate by design).

## Q-ASSUMED

- **Q-ASSUMED**: Mobile `<MobileNav>` slide-over keeps the toggle
  button hidden and renders the drawer at full width regardless of
  the localStorage flag — collapsing a slide-over drawer is
  redundant. If Ed wants a hamburger-only icon-rail on mobile we'd
  ship that as a follow-up.
- **Q-ASSUMED**: First-letter pill (`item.label.charAt(0)`) is the
  collapsed-row marker rather than per-item icons, since `NavItem`
  doesn't carry an icon field today. Adding icons to the schema is
  out of scope.
- **Q-ASSUMED**: 56px (3.5rem) is the icon-rail width; close enough
  to standard agency-portal collapsed rails (Notion 56, Linear 56).
