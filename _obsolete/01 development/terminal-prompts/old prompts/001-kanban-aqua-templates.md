/loop

# T2 — Kanban Aqua templates + founder-todos

T2 R-prev shipped `@aqua/plugin-kanban` with placeholder template column
labels. Light follow-up round: swap the templates' column lists for Ed's
**actual** Aqua operating columns from chapter
**`01 development/context/prior research/04-aqua-internals-reference.md`**
(MASTER #59), and add a fifth Founder-only template (`founder-todos`).

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.

## HARD BOUNDARIES — do NOT touch

- `04-the-final-portal/milesymedia website/` — Ed owns this.
- `04-the-final-portal/business-os/` — Ed owns this.

## Mandatory pre-read

1. **`04-aqua-internals-reference.md`** (MASTER #59) — §6 (templates) +
   §11 (founder-todos).
2. Your previous chapter `04-plugin-kanban.md` (MASTER #60).

## Scope

**Goal A — Swap templates to Aqua-real columns** (chapter §6)
- `lead-pipeline`: replace generic with `Pre-Sales · Discovery Call
  Booked · Discovery Call Done · Invoice Sent · Aqua Incubator Active ·
  Shock & Awe Sent · System Build · Onboarded`.
- `client-tasks`: replace generic with `Backlog · This Week · Doing ·
  Waiting On Client · Review · Done`.
- `fulfillment-mirror`: replace placeholder (Discovery/Development/
  Onboarding/Live) with the six Aqua phases — `Epic Intro · Blueprint
  Setup · Diagnostics · Brand Builder · Traffic · Mastery`.
- `blank`: unchanged (single "To do" column).

Existing boards are template-id-tagged so swapping the registry's column
lists won't mutate existing-board state — confirm by checking the smoke
isolation.

**Goal B — New `founder-todos` template** (chapter §11)
- Columns: `Today · This Week · Backlog · Done`.
- `scopePolicy: "agency"` (agency-scope only).
- Visible only when the operator's role includes Founder. Add a
  `requiresRole?: string` field to the `TemplateDefinition` shape — when
  set, the template is filtered out of the BoardListPage's "+ New board"
  picker for non-matching roles.
- Two sample cards seeded: "Review week's pipeline" + "Plan next round
  of social posts".

**Goal C — Smoke + chapter update**
- Extend smoke: each updated template seeds the new column count, the
  `requiresRole` filter is honoured, founder-todos creatable end-to-end
  by a Founder user, rejected for non-Founder.
- Append a "Round 2 — Aqua templates" section to `04-plugin-kanban.md`
  (or write a fresh `04-plugin-kanban-aqua-templates.md` if you prefer).
  MASTER row updated/added.

## NOT in scope

- Touching milesymedia / business-os (HARD BOUNDARY).
- Replacing fulfillment's phase-board (kanban stays additive).
- Multi-user, recurring cards, dependencies, Gantt.
- New plugins.

## Loop discipline

Standard. Single-deliverable round; aim for one clean commit.

## When done

DONE + COMMIT in outbox; chapter; MASTER row; tasks row.
