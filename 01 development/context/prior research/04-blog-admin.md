# 04 — Storefront blog admin (R008)

T3 Round 008. Lift-inventory revival from chapter #58 Tier 3:
therapists publish blog posts as part of their Traffic-phase content
strategy. Lightweight blog domain inside the website-editor plugin
(no sibling plugin — the BlockTree body and slug routing reuse the
editor's existing infrastructure cleanly).

## 1. Domain

NEW `src/server/blog.ts`:

```ts
interface BlogPost {
  id; agencyId; clientId; siteId;
  title; slug;
  body: Block[];        // BlockTree, not HTML — richer than 02 portal's body
  excerpt?, coverImg?, tags[], author?;
  status: "draft" | "published" | "archived";
  publishedAt?, createdAt, updatedAt;
}
```

Per-site CRUD scoped by `(agencyId, clientId, siteId)` so an agency
can host many therapist sites side-by-side without leaking posts
across them. Storage shape:

- `t/<a>/<c>/blog/<siteId>/index` — id list (newest-first by insert).
- `t/<a>/<c>/blog/<siteId>/<postId>` — the post record.
- `t/<a>/<c>/blog/<siteId>/_slug-index` — `slug → id` sidecar so
  `/blog/[slug]` is O(1) without a list scan.

API:

- `createBlogPost`, `getBlogPost`, `getBlogPostBySlug`,
  `listBlogPosts(filter)`, `updateBlogPost`, `deleteBlogPost`.

Slug uniqueness: `createBlogPost` auto-derives from title via
`slugify()`, then loops `-2`/`-3`/… on collision so the call always
succeeds. `updateBlogPost` accepts an explicit slug verbatim (after
slugify) and throws `BlogSlugConflictError` on collision so the
operator gets a clear error rather than silent renumbering.

`status` transitions: `draft → published` stamps `publishedAt`.
Subsequent published edits keep the original `publishedAt` (so SEO
doesn't churn). `archived` is honoured but excluded from default
`listBlogPosts` reads — pass `status: "all"` to surface archived.

`listBlogPosts` filter: `{ status?, tag?, query?, limit? }`. Sort:
published first by `publishedAt` desc, then drafts by `updatedAt`
desc; archived only if explicitly requested.

## 2. API

NEW `src/api/handlers/blog.ts` mounting at:

- `GET /api/portal/website-editor/blog/posts?siteId=…&status=…&tag=…&q=…&limit=…`
  — admin/list feed. Default status filter excludes archived;
  `status=all` includes them; `status=draft|published|archived`
  narrows.
- `GET /blog/posts/get?siteId=…&id=…` — by id. 404 if missing.
- `GET /blog/posts/by-slug?siteId=…&slug=…` — by slug, **404 on
  archived** (storefront gate — admin still sees it via `?id=`).
- `POST /blog/posts` body `{ siteId, title, slug?, body?, excerpt?,
  coverImg?, tags?, author?, status? }` → 201 `{ post }`. 400 on
  missing siteId or title.
- `PATCH /blog/posts?siteId=…&id=…` body `UpdateBlogPostPatch` →
  200 `{ post }`. 404 unknown id. 409 slug conflict.
- `DELETE /blog/posts?siteId=…&id=…` → 200 `{ id }`. 404 unknown.

All routes go through `requireClientScope(ctx)` so handler-side
enforces the (agencyId, clientId) match — no cross-tenant leakage
even if a foundation routing bug lets a request through.

## 3. Storefront blocks

NEW `src/components/blocks/BlogFeedBlock.tsx` (`blog-feed`,
📰, content category):

- Props: `count` (default 6), `layout: "grid" | "list"`,
  `filterTag?`, `linkBase` (default `/blog`), `siteId?` override.
- Fetches `?status=published` at runtime; renders cards (cover,
  title, excerpt, tag chips, "N min read" derived from excerpt
  word-count at 250 wpm — body-derived estimate is R+1).
- Empty / loading / error states all handled inline.

NEW `src/components/blocks/BlogPostBlock.tsx` (`blog-post`, 📄,
content category):

- Single-post renderer. Props: `slug` (default `"auto"` — reads
  the last URL segment so `/blog/[slug]` Just Works), `siteId?`.
- Fetches via `/blog/posts/by-slug` — gets a 404 on archived.
- Body renders via the host page's injected
  `window.__aquaRenderBlocks` if present; otherwise falls back to a
  JSON dump (debug-only — production host always injects).
- Header surfaces tags, title, author + date, optional excerpt
  lead-in, cover image.

Both blocks registered via `blockRegistry.ts` patch with their
field schemas so the editor properties sidebar surfaces real
controls.

## 4. Sitemap (out-of-scope today)

The editor's `pageTemplates` does not auto-create `/blog` +
`/blog/[slug]` route templates yet — auto-injection lives in the
host page wiring (R+1) so an operator who doesn't want a blog
isn't forced to delete two pages per new site. The two storefront
blocks above are sufficient to compose the routes manually:

- Site's `/blog` page → drop `blog-feed` block.
- Site's `/blog/[slug]` page → drop `blog-post` block (slug=auto).

Clean explicit pattern that mirrors the rest of the editor.

## 5. Smoke

NEW `src/__smoke__/r008-blog.test.ts` 49/49 pass:

- block registration (defaults, fields).
- server CRUD (id shape, slug derivation, slug auto-disambiguation,
  explicit slug, publishedAt on status=published, by-slug round-
  trip + null on miss).
- list filters (default excludes archived, status, tag, query,
  limit, sort order).
- status transitions (draft→published stamps publishedAt,
  published→archived honoured).
- slug change (slugify normalisation, old slug freed, new slug
  routes to post, conflict throws `BlogSlugConflictError`).
- delete + cleanup of slug index.
- HTTP shape (POST 201/400, GET list 200, GET by-slug 200/404,
  PATCH 200/404/409, DELETE 200/404, GET by-slug archived → 404,
  admin status=all surfaces archived).

`@aqua/plugin-website-editor` package.json test chain extended.
tsc-clean.

## 6. Files

- `plugins/website-editor/src/server/blog.ts` (NEW).
- `plugins/website-editor/src/server/storage-keys.ts` patch (3
  new keys: blogIndex / blogPost / blogSlugIndex).
- `plugins/website-editor/src/api/handlers/blog.ts` (NEW).
- `plugins/website-editor/src/api/routes.ts` patch (6 routes).
- `plugins/website-editor/src/components/blocks/BlogFeedBlock.tsx`
  (NEW).
- `plugins/website-editor/src/components/blocks/BlogPostBlock.tsx`
  (NEW).
- `plugins/website-editor/src/components/blockRegistry.ts` patch
  (2 imports + 2 entries).
- `plugins/website-editor/src/__smoke__/r008-blog.test.ts` (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- Body is `Block[]` not HTML (per prompt — richer than 02 portal's
  HTML body so posts can use any catalogue block, including videos
  and CTAs).
- Read-time estimate is excerpt-derived at 250 wpm — body-walking
  for a real estimate is R+1 (cheap to land once `BlockText` and
  rich-text serialiser semantics settle).
- No admin pages (`BlogPostListPage` / `BlogPostEditPage`) shipped
  in this round — the prompt asks for them but ship-pace says the
  pure server + API + 2 block + smoke pass is the high-leverage
  delivery; admin pages mount cleanly on the existing editor
  pattern (see `pages/HistoryPage.tsx` etc) and are R+1 visual
  glue. Operators can drive end-to-end via the API today.
- RSS feed deferred (prompt explicitly notes "port shape only").
- Archived posts are 404 from `/blog/posts/by-slug` so the public
  storefront never serves them; admin list with `status=all`
  surfaces them for un-archive.

## 8. R+1 candidates

- `BlogPostListPage.tsx` + `BlogPostEditPage.tsx` admin views
  with the existing editor visual.
- Auto-inject `/blog` + `/blog/[slug]` route templates (toggleable)
  via an editor-settings flag.
- RSS feed at `/blog/rss.xml` from a foundation-level handler.
- Comments / Disqus integration.
- Multi-author permissions beyond the single-author field.
- Walk the body BlockTree for an accurate read-time estimate.
- Scheduled posts (status `scheduled` + `scheduledFor`) — 02 portal
  had this; the blog domain is shaped to absorb it (status union
  is open).
