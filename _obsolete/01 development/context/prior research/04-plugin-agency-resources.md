# `@aqua/plugin-agency-resources` — internal team library (T2 R014)

Round-014 of the queue-based T2 worker. Operator-internal resource
library — team SOPs, training, brand guidelines, process docs,
policies, free-form notes. **Distinct from**:

- `@aqua/plugin-aqua-resources` (R013) — client-facing per-Aqua-phase
  shelf consumed by T4 Incubator.
- `@aqua/plugin-sops` (R002) — customer-facing SOP shelf with
  tag-family taxonomy.

This plugin is for the **agency's own staff** to share team-internal
docs.

## Shape

| Area | Decision |
| --- | --- |
| `id` | `agency-resources` |
| `scopePolicy` | `agency` |
| `core` | false |
| `requires` | (soft only — engine no-ops gracefully when sops absent) |
| Storage layout | `resources/index` · `resources/by-id/<id>` · `resources/by-slug/<slug>` (uniqueness reverse index) |
| API routes | `list / get / create / update / view / export / activity` (7) |
| Pages | LibraryPage (default) · EditorPage · ViewPage · RecentActivityPage |

## Domain

```
TeamResource { kind: sop|training|brand-guideline|process-doc|policy|note,
               title, slug, body (markdown), tags[],
               visibleToRoles: Role[], archived, viewCount,
               lastViewedAt?, createdBy?, createdAt, updatedAt,
               lastEditedBy?, lastEditedAt? }

RecentActivityEntry { resourceId, title, kind, ts,
                      type: edited|viewed, actor? }
```

## visibleToRoles ACL

`canSee(resource, role)`:
- **Owners + managers always see** (admin override — no ACL gates them).
- `visibleToRoles: []` (default) means "all four agency-side roles
  visible" — `agency-owner / agency-manager / agency-staff /
  freelancer`.
- Non-empty array narrows: e.g. `["agency-owner", "agency-manager"]`
  hides from staff + freelancers.

`list()` filters silently. `get()` and `tickView()` throw
`ResourceForbiddenError` (HTTP 403) so view counts can't be inflated
by users who shouldn't see the row.

## Slug uniqueness

`slugify(s)` lowercases + replaces non-alphanum with `-` + truncates
to 80 chars. `uniqueSlug(base)` walks `base`, `base-2`, `base-3`, …
checking the reverse index. Empty slug after slugify rejects.

Three resources titled "Brand voice" get slugs `brand-voice`,
`brand-voice-2`, `brand-voice-3` (test 5).

## View-tick + recent activity

`tickView(actor, id)` increments `viewCount` + writes `lastViewedAt`
+ emits `agency-resources.resource.viewed`. View **does not write to
the foundation activity log** — keeps low-noise; the plugin's own
`recentActivity()` reads `lastEditedAt + lastViewedAt` directly off
the resource rows so the audit feed stays self-contained and bounded
by total-row count, not total-event count.

`recentActivity(actor, limit=20)`:
- Walks all resource rows, includes both `edited` and `viewed`
  entries when `lastEditedAt` / `lastViewedAt` are set.
- ACL-filtered (test 10) — staff don't see entries from rows
  visible only to owners.
- Sorted newest-first; sliced to `limit`.

## Smoke (12/12)

`tsx --test src/__smoke__/agency-resources.test.ts`. Cases:

1. `slugify` lowercases + dashes + truncates to 80 chars.
2. `canSee` — admins always see; `visibleToRoles:[]` = all 4 agency
   roles visible by default; restricted scope narrows for staff +
   freelancers but owners bypass.
3. `create` stores resource + assigns slug + emits `resource.created`.
4. `create` rejects empty title; rejects invalid kind.
5. Slug uniqueness — duplicate title yields `-2`, `-3`, …
6. visibleToRoles ACL — staff sees `[]` resource; staff cannot see
   owners-only resource (`get` throws `ResourceForbiddenError`;
   `list` silently filters).
7. `tickView` increments `viewCount` + `lastViewedAt`; non-canSee
   actor throws `ResourceForbiddenError` and viewCount unchanged.
8. `update` — patch title/body/tags + `lastEditedBy/At` populated;
   emits `resource.updated`.
9. `update` — archived flip emits `resource.archived` (not
   `.updated`); list excludes archived by default; `includeArchived`
   surfaces.
10. `recentActivity` — returns interleaved edit + view entries
    newest-first; bounded by `limit`; **ACL-filtered** (staff
    excluded from owners-only entries).
11. `exportAll` returns all in-scope resources visible to the actor.
12. Activity log — created + archived under `category: "settings"`
    with `agency-resources.*` action prefix (viewed is event-only by
    design — low-noise).

## Files

```
04-the-final-portal/plugins/agency-resources/
├── index.ts                            (manifest)
├── package.json + tsconfig.json
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          (vendored)
    │   ├── tenancy.ts                  (vendored)
    │   ├── domain.ts                   (TeamResource, kinds, ALL_VISIBLE_ROLES, slugify, summarise, RecentActivityEntry)
    │   ├── ids.ts · time.ts
    ├── server/
    │   ├── ports.ts                    (StoragePort, ActivityLogPort, EventBusPort, AgencyResourcesEventName)
    │   ├── service.ts                  (AgencyResourcesService — list/get/getBySlug/create/update/tickView/recentActivity/exportAll + canSee predicate)
    │   ├── foundationAdapter.ts
    │   └── index.ts                    (barrel + container)
    ├── api/
    │   ├── handlers.ts                 (7 handlers — 403 on ACL deny)
    │   └── routes.ts
    ├── pages/
    │   ├── LibraryPage.tsx             (kind chips + search + table + JSON export link)
    │   ├── EditorPage.tsx              (form + visibleToRoles checkboxes + archive button)
    │   ├── ViewPage.tsx                (read view + Mark viewed button)
    │   └── RecentActivityPage.tsx      (50 newest entries, edit/view colour-coded)
    └── __smoke__/agency-resources.test.ts (12 cases)
```

## NOT in scope

- Wiki cross-linking (later round per prompt).
- Hosting attachments (operator points body refs at
  `@aqua/plugin-client-files` external refs).
- Touching milesymedia / business-os / compass-coaching.

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- Wiki-style cross-linking (`[[other-resource-slug]]` syntax) and
  backlinks panel.
- Reuse the `@aqua/plugin-sops` SopService backing where overlap
  exists (the prompt mentions; today they're separate stores —
  intentional for v1 to avoid migration ceremony).
- Markdown rendering on ViewPage (today `whiteSpace: pre-wrap`; an
  R+1 markdown library lift would be obvious).
- File attachments via `@aqua/plugin-client-files` external refs.
- Per-resource version history.
- Comments / inline review threads.
- Foundation `ActivityCategory` extension to add `team-resources`
  (currently rides on `settings`); coordinated R+1 diff with T1 /
  R007 / R009 / R010 / R011 / R012 / R013.
- Templates ("New SOP from template" / "New training from template").
- Bulk import from a folder of `.md` files (mirror SOPs seedDefaults
  pattern).
