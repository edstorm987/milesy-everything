/loop

# T3 — Editor deep-link + per-client entrypoint

T1 is building Ed's agency shell with per-client overview tabs (Website /
Portal / Kanban / etc.). When Ed clicks "Edit website" on a client tile, the
editor needs to open at the right context — right client, right portal
variant, right starting page. This round wires that contract end-to-end and
adds a minimal page-picker toolbar so the editor feels like a website
manager, not just a single-page editor.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.

## HARD BOUNDARIES — do NOT touch

- `04-the-final-portal/milesymedia website/` — Ed owns this.
- `04-the-final-portal/business-os/` — Ed owns this.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/context/MASTER.md`
3. `01 development/context/prior research/04-plugin-website-editor-round2.md`
   (the editor's existing shape) + R8 chapter (live preview iframe).
4. The Agency Shell prompt (`01 development/terminal-prompts/T1-agency-shell.md`)
   — read it so your URL contract aligns with T1's "Edit website" CTA.
5. `01 development/messages/terminal-3/from-orchestrator.md`

## Scope

**Goal A — Deep-link contract**
- URL surface: `/portal/clients/[clientId]/edit-website?page=<pageId>&variant=<variantKey>`.
  - `clientId` required.
  - `page` optional → default to the client's home page (first page in
    the client's pageOrder; create one if none exist).
  - `variant` optional → default to "default" portalVariant.
- EditorPage reads the search params on mount, hydrates state, renders.
  Bookmarkable + shareable.
- "Edit website" deep-link from T1's per-client overview lands here
  cleanly. (T1 owns the link; you own the landing.)

**Goal B — Page picker toolbar**
- New `PagePickerToolbar` above the canvas: dropdown of all pages for
  this client + portalVariant (label + slug + last-updated), "+ New page"
  inline at the bottom of the dropdown, current selection highlighted.
- Switching pages updates the URL (`router.replace` so back-button works)
  and reloads the editor state. Save state guarded with confirm-dialog
  if there are unsaved changes.
- "+ New page" prompts for title, slug auto-derived, creates blank
  page, switches to it.

**Goal C — Variant switcher (compact)**
- Right of the page picker: small variant switcher (default / customer /
  any others present). Switching variant reloads with the chosen
  variant's pages list. Most clients only have "default" — when the
  list is length-1, hide the switcher entirely.

**Goal D — Smoke + chapter update**
- Extend website-editor smoke: deep-link with explicit page+variant
  loads the right state, page-picker switch updates URL, "+ New page"
  creates + switches. ≥6 new cases.
- Update existing R2 chapter with a "Round X — deep-link + page picker"
  appended section (new chapter file unnecessary; this is incremental).
  MASTER row note in the existing R2 row's pointer.

## NOT in scope

- Touching milesymedia / business-os (HARD BOUNDARY).
- Reworking the canvas, blocks, or save pipeline.
- Real-time multi-user (still parked).
- New plugins.

## Loop discipline

Standard. Single-deliverable round; aim for one clean commit per goal.

## When done

DONE + COMMIT in outbox; chapter section appended; tasks row added.
