/loop

# T3 — Round 006: Portal template marketplace browser

T3 R002 shipped the Aqua Incubator template. T3 R004 ships brand-page
presets. This round wires both into a **Portal Template Marketplace**
inside the editor — operators pick from a gallery of starter templates
when creating a new client portal or page.

## HARD BOUNDARIES

- Standard.

## Mandatory pre-read

1. `04-incubator-template.md` (T3 002).
2. `04-brand-page-templates.md` (T3 004).
3. T2 R11 portal-export plugin — the materialise contract.

## Scope

**Goal A — TemplateGallery component**
- Editor's "+ New page" / "+ New site" CTA opens a gallery modal.
- Cards: cover image + title + tags ("Aqua Incubator" / "Brand Pack" /
  "Membership Site" / "Affiliate Site" / "Service Portal" / "Skincare
  Brand" — pull tag list from existing presets).
- Search + tag filter + preview-on-hover.

**Goal B — Preview pane**
- Click card → right-pane shows a screenshot/mock of the template
  (use existing rendered output if available; fall back to a
  `BlockTree` preview render).
- "Use this template" → instantiates as a new page or full site.

**Goal C — Operator-uploaded templates**
- "Save as template" action on any existing page — captures current
  BlockTree + cover screenshot into a per-agency template registry.
- Operator-uploaded templates appear in the gallery alongside builtins,
  scoped to the agency.

**Goal D — Smoke + chapter**
- Smoke: gallery lists builtins + operator-saved, filter narrows
  correctly, "Use this" creates a new page from selected, "Save as
  template" round-trips.
- Chapter `04-template-marketplace.md`. MASTER row.

## NOT in scope

- Cross-agency template sharing.
- Paid templates / monetisation.
- Touching milesymedia / business-os.

## When done

DONE referencing `006-portal-template-marketplace.md`.
