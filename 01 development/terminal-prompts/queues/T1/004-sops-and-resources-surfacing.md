/loop

# T1 — Round 004: Surface SOPs + Resources in agency sidebar

T2's `@aqua/plugin-sops` shipped as part of T2/002. T1 wires it into the
agency-shell sidebar (chapter §2 row "SOPs, Docs & Templates") + adds the
Employee-HQ permission gates so staff see filtered SOPs by tag family.

## HARD BOUNDARIES

- `04-the-final-portal/milesymedia website/` (T4).
- `04-the-final-portal/business-os/` (T4).
- `02` + `03` read-only.

## Mandatory pre-read

1. T2's `@aqua/plugin-sops` chapter once it lands (look up via MASTER).
2. Your own `04-employee-hq.md` (T1 002) — the permission keys.
3. `04-aqua-internals-reference.md` §2 + §9c.

## Scope

**Goal A — Sidebar wiring**
- The `AgencyToolsBallpark` "SOPs, Docs & Templates" row currently links
  to a placeholder. Point it at the SOPs plugin's `SopListPage`
  (`/portal/agency/sops`).
- Add a small recent-edits indicator (e.g. "3 updated this week") next
  to the row label.

**Goal B — Per-client overview integration**
- Add a "SOPs" sub-tab inside the per-client overview (or fold into
  Tools tab) showing SOPs tagged for the current phase/plan tier (e.g.
  Sales family for clients in Pre-Sales phases). Read-only view for
  non-Founder roles.

**Goal C — Permission gates**
- `requireRole("sops.view")` on `/portal/agency/sops` listing.
- `requireRole("sops.tag.<family>")` per family detail route.
- Falls back gracefully for legacy users without role assignments
  (treats Founder as default).

**Goal D — Smoke + chapter**
- Smoke: sidebar row resolves; per-client SOPs tab renders correct
  filtered list; permission denial returns 403.
- Append "Round 004 — SOPs surfacing" to `04-agency-shell.md` or new
  chapter. MASTER row.

## NOT in scope

- The SOPs plugin itself (T2 owns).
- New permission keys (added in T1 002).
- Touching milesymedia / business-os.

## When done

DONE referencing `004-sops-and-resources-surfacing.md`.
