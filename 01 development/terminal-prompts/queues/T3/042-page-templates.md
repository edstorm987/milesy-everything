/loop

# T3 — Round 042: Page-type templates (landing / blog / product)

Operators creating new pages today start from blank. Add a template
picker: Landing page · Blog post · Product · About · Contact · FAQ.
Each template seeds a starting block tree.

## Pre-read

- Existing page creation flow.
- T3 R028 block-group reuse (templates are block trees, similar shape).

## Scope

**A** — `lib/pageTemplates.ts` exports `pageTemplates: Template[]` —
each `{ id, name, description, defaultSlug, blocks: BlockTree, seoDefaults }`.

**B** — 6 seed templates: Landing (hero + features + CTA + testimonials + footer-cta), Blog post (heading + image + body + author), Product (gallery + title + price + description + CTA), About (hero + story + team + CTA), Contact (heading + form + map + hours), FAQ (heading + accordion list).

**C** — Editor UI: "Create page" → modal with template grid + blank
option. Pick → creates page + redirects to editor with starting tree.

**D** — Smoke `§ Page templates` (each template renders, slug
uniqueness handled, SEO defaults applied).

**E** — Chapter `04-page-templates.md` + MASTER row.

## NOT in scope
- AI-generated templates (post-ship).
- Per-tenant custom templates (post-ship — could add `templates` plugin later).

## When done
DONE referencing `042-page-templates.md`.
