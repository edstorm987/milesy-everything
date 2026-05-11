/loop

# T3 — Round 008: Storefront blog admin

Lift inventory revival list (chapter #58, Tier 3): blog admin. Therapists
publish blog posts as part of their Traffic-phase content strategy.
Lightweight blog plugin slotting into website-editor.

## HARD BOUNDARIES — standard

## Mandatory pre-read

1. Chapter `04-lift-inventory.md` — blog admin row.
2. `02 felicias aqua portal work/` — find any `blog`/`post`/`article`
   files; faithfully port if present.
3. `04-plugin-website-editor-round2.md` for shape mirror.

## Scope

**Goal A — Blog domain (in website-editor or new sibling plugin)**
- `BlogPost { id, title, slug, body: BlockTree, excerpt?, coverImg?,
  tags[], author?, publishedAt?, status: "draft"|"published"|"archived",
  createdAt, updatedAt }`. Body is a BlockTree so posts can use any
  block from the catalogue (richer than markdown).
- Slug uniqueness within site, auto-derive from title.

**Goal B — Admin UI**
- `BlogPostListPage` — table + status filter + search. "+ New post" CTA.
- `BlogPostEditPage` — opens the existing visual editor with the post
  body BlockTree; topbar shows publish controls + tags + cover.

**Goal C — Storefront blocks**
- `blog-feed` — renders N most recent posts as cards (cover + title +
  excerpt + tag chips + read time). Props: `{ count, layout: "grid"|
  "list", filterTag? }`.
- `blog-post` — renders a single post by slug (used inside `/blog/[slug]`).

**Goal D — Sitemap**
- Auto-create `/blog` (index) + `/blog/[slug]` route templates when the
  blog feature is enabled in editor settings.

**Goal E — Smoke + chapter**
- Smoke: post CRUD, slug uniqueness, status transitions, blog-feed
  block renders correct ordering, filterTag narrows, archived posts
  hidden.
- Chapter `04-blog-admin.md`. MASTER row.

## NOT in scope

- Comments / disqus integration.
- RSS feed (port shape only — implementation in R+1).
- Multi-author permissions beyond single-author field.
- Touching milesymedia / business-os.

## When done

DONE referencing `008-storefront-blog-admin.md`.
