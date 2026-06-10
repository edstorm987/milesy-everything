/loop

# T4 — Round 1: UX + accessibility polish across the entire surface

You are **terminal 4**, joining the mesh fresh. T1/T2/T3 have shipped
the foundation, 9 plugins, the editor + 58 blocks, and most admin
pages. The surface works but the polish is uneven — loading states
inconsistent, empty states missing, focus rings absent, color contrast
unaudited, error boundaries patchy. Your round 1 mandate: a
**comprehensive UX + accessibility pass** across the entire portal +
plugins, leaving every admin page and every storefront block at a
v1-ship-ready quality bar.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-4/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-4/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/messages/README.md` (mesh protocol)
3. `01 development/context/MASTER.md` (chapter index — start here)
4. `01 development/context/prior research/04-architecture.md` — locked design
5. `01 development/context/prior research/04-architecture-extension-per-client-portals.md` — chapter 19b
6. `01 development/eds requirments.md` — see "Aesthetic & UX commitments"
7. `01 development/context/prior research/04-foundation.md`, `04-foundation-round2.md`, `04-foundation-round3.md`, `04-foundation-round6.md` — what shipped where
8. `01 development/context/prior research/04-plugin-website-editor.md`, `04-plugin-website-editor-round2.md`, `04-plugin-website-editor-round3.md` (chapter #34) — for the editor admin + 58 block components

## Scope — five phases

### Phase A: Audit + plan (commit 1)

1. Walk every admin page across the portal + every plugin. Record a
   table of what's missing per page: loading state, empty state,
   error boundary, focus ring, ARIA labels, keyboard navigation, color
   contrast, mobile viewport. (T2 has shipped 9 plugins each with
   3-13 pages — that's ~50 admin pages to inspect.)
2. Walk the 58 storefront block components + the 18 cross-plugin
   block renderers (T3 R5). Same audit.
3. Write `01 development/context/prior research/04-ux-audit.md` —
   the punch list, prioritised by user impact.
4. Commit the audit doc; it's your work plan.

### Phase B: Loading + empty + error states (commit 2-4)

For every admin list page and every storefront block:
- **Loading state**: skeleton placeholder using
  `animate-pulse bg-black/5` (matches Felicia's storefront pattern).
- **Empty state**: short headline + helpful illustration / icon +
  single primary CTA (e.g. "No products yet. Add one →").
- **Error boundary**: React `<ErrorBoundary>` wrapper that captures
  render errors and shows a friendly fallback with a "Retry" button.

Build these as shared components in
`04-the-final-portal/portal/src/components/ui/{LoadingSkeleton,EmptyState,ErrorBoundary}.tsx`
and adopt across plugin pages. Each plugin should import from there
(via path mapping or workspace dep — log `Q-ASSUMED` on the import
shape).

### Phase C: Accessibility (commit 5-7)

1. **Focus rings**: every interactive element gets a visible
   `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent,_currentColor)]`
   utility. Add to a global CSS layer so plugin code inherits.
2. **Keyboard navigation**: every modal must trap focus. Every list
   row should be navigable via arrow keys when focus is on the table.
   Lift a `useFocusTrap` hook + a `useArrowNav` hook into
   `portal/src/lib/a11y/`.
3. **ARIA**: every button without visible text gets `aria-label`.
   Every modal gets `role="dialog" aria-modal="true"`. Every alert
   gets `role="alert"`. Audit each of the 50 admin pages.
4. **Color contrast**: audit brand-kit-driven colors against AA
   contrast standards. Add a brand-kit validator that warns when a
   client uploads a palette that fails contrast.
5. **Screen reader**: test the demo flow + agency dashboard with VoiceOver
   (you can `say` test announcements at minimum). Document specific
   issues + fixes in your chapter.

### Phase D: Mobile + responsive (commit 8-9)

The portal currently is desktop-first. Make sure:
- Sidebar collapses on narrow viewports (<768px) into a hamburger menu.
- Topbar stacks gracefully on mobile.
- Storefront blocks render correctly at 375px width.
- Modals adapt to fullscreen on mobile.
- Forms have touch-target-friendly inputs (min 44px).

Lift a `useViewport` hook into `portal/src/lib/a11y/`. Use it in chrome
components.

### Phase E: Smoke + chapter (commit 10)

1. Add a visual regression smoke (storybook-style or a small
   Playwright script) that loads ~10 representative pages and asserts
   no console errors + no obvious layout failures at 3 viewports
   (375 / 768 / 1280).
2. Chapter `04-ux-accessibility-pass.md` documenting:
   - Phase A audit table summary.
   - Shared components added (LoadingSkeleton, EmptyState,
     ErrorBoundary, useFocusTrap, useArrowNav, useViewport, contrast
     validator).
   - The accessibility patterns adopted.
   - Mobile breakpoints.
   - Smoke harness shape.
   - Items deferred to round 2 (with rationale).
3. MASTER row.
4. `tasks.md` row done.
5. Final `DONE` + `COMMIT`.

## Authority + scope discipline

You CAN edit:
- `04-the-final-portal/portal/src/components/ui/*` (new shared UI primitives)
- `04-the-final-portal/portal/src/lib/a11y/*` (new accessibility hooks)
- `04-the-final-portal/portal/src/app/**/*` (admin pages, layouts) — but ONLY for state/error/focus/aria adornments; NO logic changes
- `04-the-final-portal/plugins/*/src/components/*` and `pages/*` for the same kind of polish
- `globals.css` / Tailwind theme tweaks for focus rings + skeleton utility classes

You must NOT:
- Change plugin business logic (services, ports, container builders) — those belong to T2.
- Change foundation server modules — those belong to T1.
- Change block fetch logic — that's T3 R5's territory.
- Change the locked architecture in `04-architecture.md`.
- Touch `02 felicias aqua portal work/` or `03 old portal/`.
- Commit to other terminals' folders (`terminal-1/`, etc).

If your polish pass surfaces a logic bug, log a `WARN` to the
appropriate terminal's inbox describing the bug — don't fix it
yourself.

## Cross-team coordination

- Coordinate with T1 on chrome (Sidebar / Topbar / DemoBanner) — they
  own the layout shape; you adorn.
- Coordinate with T2 on plugin admin pages — they own the structure;
  you adorn.
- Coordinate with T3 on block renderers + editor surfaces — same.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end. Phases A+E are smaller (commit per phase); Phases B/C/D each
expect 2-3 commits.

## When done

1. Audit doc + 6+ commits across phases B/C/D + smoke harness.
2. Chapter `04-ux-accessibility-pass.md` written.
3. MASTER row.
4. `tasks.md` row done.
5. `tsc --noEmit` clean.
6. Final `DONE` + `COMMIT` to outbox.

If the full pass takes more than one loop iteration, partial DONE is
fine — commit per phase. Round 2 picks up whatever's deferred.
