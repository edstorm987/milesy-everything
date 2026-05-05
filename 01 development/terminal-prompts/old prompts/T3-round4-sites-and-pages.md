/loop

# T3 — Round 4: SitesPage + PageDetailPage + customPages backend

Round 3 you shipped CustomisePage (898-LOC) + cross-plugin block
renderer registry + ThemeDetailPage (1063-LOC) + PagesPage re-pointed
at the EditorPage list. Round 4 closes the last two big admin lifts
deferred from R2/R3: **SitesPage** (3264 lines — the biggest single
admin page in the editor) and **PageDetailPage** + the underlying
**customPages backend** (a separate localStorage block system distinct
from EditorPage). After R4 the website-editor plugin's admin surface
is parity-with-`02`.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. After each commit: `git pull --rebase --autostash && git push`.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-3/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-3/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-plugin-website-editor.md` — your R1 chapter
3. `01 development/context/prior research/04-plugin-website-editor-round2.md` — R2 chapter (deferred list)
4. `01 development/context/prior research/04-plugin-website-editor-round3.md` (or wherever your R3 chapter lives) — most recent
5. Source: `02 felicias aqua portal work/src/app/admin/sites/page.tsx` (3264 lines)
6. Source: `02 felicias aqua portal work/src/app/admin/pages/[id]/page.tsx` + `src/lib/admin/customPages.ts` + everything customPages imports

## Scope — three goals (size-ordered)

### Goal A: Lift `SitesPage` (3264 lines)

The biggest single admin page in the editor. From `02/src/app/admin/sites/page.tsx`,
faithfully port into `04 the final portal/plugins/website-editor/src/pages/SitesPage.tsx`.

What it covers (per `aqua-visual-editor.md` chapter):
- Site list with create/edit/delete/duplicate
- Per-site settings: domains, primaryDomain, logoUrl, customHead,
  customBody, smoothScroll, customCursor, GitHub repo link, etc.
- Multi-domain management UI
- Per-site theme assignment
- Per-site portal-variant overrides
- Per-site embed config (when this site is the iframe target)

Dependencies you may need to lift / shim:
- 02 imports `@/lib/admin/sites` — your `lib/sites.ts` already exists
  from R2; extend it to mirror 02's full API surface (loadSites /
  saveSite / deleteSite / duplicateSite / domain CRUD / etc.).
- 02 imports `@/components/admin/AdminTabs` — you already have this
  from R2 Phase D.
- 02 imports `@/lib/admin/domainAttachment` (Vercel domain auto-attach)
  — port as a `lib/domains.ts` shim. Real Vercel API call is a future
  round; the shim returns mock-success for now and logs a
  `Q-ASSUMED` for foundation wiring.

Commit per major section if the lift is too long for one commit (e.g.
list + settings panel + domain manager + theme picker + variants
override + embed config = 5-6 commits).

### Goal B: Lift the customPages backend

`02 felicias aqua portal work/src/lib/admin/customPages.ts` is a
separate localStorage block system distinct from EditorPage. EditorPage
manages site-level pages with versioning + publish flow + portal
variants; customPages is a simpler "ad-hoc page" system used for
miscellaneous content pages. Both exist in `02`.

Port `02/src/lib/admin/customPages.ts` to your plugin as
`04 the final portal/plugins/website-editor/src/lib/customPages.ts`.
Keep the localStorage backing for now (matches R3 Goal A's customise
storage decision). Foundation server-side wiring is a future round —
log a Round-5 TODO in your chapter.

Public API surface to mirror:
- `loadCustomPages()` / `getCustomPage(id)` / `saveCustomPage(page)` /
  `deleteCustomPage(id)` / `duplicateCustomPage(id)` /
  `onCustomPagesChange(handler)`.

### Goal C: Lift `PageDetailPage`

Replace your R1 stub at `src/pages/PageDetailPage.tsx` with a faithful
port of `02/src/app/admin/pages/[id]/page.tsx`. Per-page settings
(slug, title, SEO meta, custom head/body, status, portal variant
assignment, theme override, password protection toggle, etc.).

This page consumes `lib/customPages.ts` (Goal B) + `lib/sites.ts`
(extended in Goal A). `PluginPageProps`-shaped wrapper.

## NOT in scope

- Don't touch foundation (T1 owns).
- Don't touch fulfillment / ecommerce / agency-* / memberships /
  affiliates / client-crm / forms plugin source.
- Don't build real Vercel domain-attach API integration — shim only.
- Don't build a real-time-collaboration layer (Yjs / CRDT) — that's a
  future round + parked in architecture §13.
- Don't add new manifest features — your manifest is correct, just
  back the existing IDs with real implementations.

## Loop discipline

Each cycle: pull → read inbox + outbox → continue → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end. SitesPage is the biggest lift you've done — pace yourself with
multiple commits.

## When done

For each goal independently:

A. SitesPage faithful port + lib/sites.ts extended + lib/domains.ts
   shim + tsc clean + smoke unaffected.

B. lib/customPages.ts port + tsc clean.

C. PageDetailPage faithful port + tsc clean + smoke unaffected (or
   higher if you add tests).

All three →
- Chapter `04-plugin-website-editor-round4.md` documenting what landed,
  the customPages backend foundation TODO, the Vercel domain shim
  TODO, smoke results.
- MASTER row.
- `tasks.md` row done.
- Final `DONE` + `COMMIT`.

If SitesPage alone takes the whole loop, partial DONE is fine — commit
per major section (list + settings + domains + theme picker + variants
override + embed config). Goals B + C can ship in a follow-up R5.
