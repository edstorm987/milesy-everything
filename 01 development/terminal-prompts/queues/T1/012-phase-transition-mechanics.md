/loop

# T1 — Round 012: Phase transition mechanics

Per chapter §5a, advancing a client's Aqua phase auto-installs new
plugins + disables old phase's plugins. Build the operator-facing
controls + the under-the-hood orchestration.

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §5 + §5a (phase progression + plugin
   map per phase).
2. Fulfillment plugin phase-preset machinery (existing).
3. Marketplace install / disable / enable / uninstall endpoints.

## Scope

**A** — `_PhaseTransitionButton.tsx` on per-client overview header
right of phase chip: "Advance to {nextPhase} →" + small dropdown for
"Regress" / "Skip to..." (Founder-only via R007 permissionGuard).

**B** — Confirm modal lists side-effects: plugins to install / disable
/ uninstall (computed from phase delta in §5a). One-click confirm
fires the transitions sequentially; activity log entry per change.

**C** — Disable preserves plugin install config (reversible) — restore
on regress. Configs live in `pluginInstall.archivedConfig`.

**D** — Activity feed entry "Phase advanced from Blueprint Setup →
Diagnostics" with diff of plugins changed.

**E** — Auto-create kanban boards / SOP defaults for new phase if
their seed-on-phase machinery exists.

**F** — Smoke + chapter `04-phase-transitions.md` + MASTER row.

## NOT in scope

- Auto-emailing client on phase change (defer to T2 R009 channels).
- Live custom-portal materialisation (T1 R003 owns Live).
- T4 territory.

## When done
DONE referencing `012-phase-transition-mechanics.md`.
