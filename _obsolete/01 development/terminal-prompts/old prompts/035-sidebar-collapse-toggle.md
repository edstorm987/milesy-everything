/loop

# T1 — Round 035: Sidebar minimise/maximise toggle + sticky open state

Ed flagged: the sidebar collapses every time he clicks into a
sub-page, which is annoying. He wants a real **minimise/maximise
toggle** (user-controlled, persisted to localStorage), not a
collapse-on-navigation behaviour.

## Pre-read

- `src/components/chrome/Sidebar.tsx` (current behaviour).
- `src/components/chrome/AgencyToolsBallpark.tsx` (where
  More-tools is collapsible — that one stays as is).

## Scope

**A** — Identify the auto-collapse trigger. Either a route-change
effect or a CSS rule that hides the sidebar on small viewports.
Document in chapter what was happening + the fix.

**B** — NEW client component `<SidebarCollapseToggle>` — small
chevron button at the top of the sidebar. Click toggles a
`data-collapsed` attribute on the `<aside>`. State persists in
`localStorage["mm-sidebar-collapsed"] = "1" | "0"`. Hydrates from
localStorage on mount with no flash (use a synchronous script in
the layout `<head>` that sets the attr before paint).

**C** — Collapsed state: sidebar shrinks to ~56px (icon-only),
panel headings hide, More-tools icons remain accessible. Tooltips
on hover so the icon-only mode stays usable.

**D** — Expanded state: full sidebar as today.

**E** — Critical: clicking a sidebar nav item does NOT change the
collapse state. Only the toggle button does.

**F** — Smoke `§ Sidebar collapse toggle` (≥6 — toggle flips attr
+ persists + nav-click no-op + hydrate-no-flash + mobile responsive
unchanged).

**G** — Chapter `04-sidebar-collapse-toggle.md` + MASTER row.

## NOT in scope

- Multiple side panels / drag-resize sidebar (post-ship).
- Per-tenant sidebar customisation (post-ship).

## When done
DONE referencing `035-sidebar-collapse-toggle.md`.
