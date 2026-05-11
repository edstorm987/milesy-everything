/loop

# T2 — Round 9: Forms plugin (`@aqua/plugin-forms`)

Round 8 you shipped `@aqua/plugin-client-crm` — eight plugins shipped
end-to-end. Round 9 ships a **cross-cutting form builder** that every
other plugin can use: `@aqua/plugin-forms`. Build form templates +
submissions store; let other plugins (CRM, affiliates, memberships)
consume submissions via cross-plugin reads — same port pattern you've
been using.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-2/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-2/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-architecture.md`
3. `01 development/context/prior research/04-plugin-client-crm.md` (your R8 — `crm-contact-form` block id is the canonical consumer)
4. `01 development/context/prior research/04-plugin-affiliates.md` (your R5b — affiliate signup is a form)
5. `01 development/context/prior research/04-plugin-memberships.md` (your R4 — `membership-signup` is a form)
6. `01 development/context/prior research/04-plugin-fulfillment.md` (your R1 — checklist tasks are conceptually mini-forms)

## Scope

`04-the-final-portal/plugins/forms/` — `@aqua/plugin-forms`,
self-contained package, mirror your most recent plugin shape (client-crm).

Manifest:
- `id: "forms"`
- `category: "growth"`
- `scopePolicy: "either"` — works at both agency and client scope (forms can be agency-internal lead-capture or client-side end-customer surveys)
- `requires: []` — no hard deps; soft-integrates with client-crm (submissions become Contacts) + affiliates (form-driven enrollment) + memberships (plan-pick wizard)
- `core: false` — opt-in
- ~5 navItems: Forms · Submissions · Templates · Settings (panel `growth`)
- ~5 admin pages
- ~12 API routes at `/api/portal/forms/*`
- 1 storefront block id: `form-render` (renders a form by id; T3 owns rendering)
- `onInstall` seeds 3 default templates (Contact / Newsletter Signup / Lead Capture)

### Domain model

```ts
type FormDefinition = {
  id, agencyId, clientId?,                  // null clientId = agency-scoped form
  name, description?,
  fields: FormField[],
  submitAction: SubmitAction,               // what happens after submit
  status: "draft"|"published"|"archived",
  publishedAt?,
  submissionCount,                          // running counter
  createdAt, updatedAt,
};

type FormField = {
  id, kind: "text"|"email"|"phone"|"textarea"|"select"|"multiselect"|"radio"|"checkbox"|"number"|"date"|"hidden",
  label, placeholder?, helpText?,
  required: boolean,
  defaultValue?: string,
  options?: { value: string; label: string }[],   // for select / radio / multiselect
  validation?: { minLength?: number; maxLength?: number; pattern?: string },
  attributeKey?: string,                    // maps to CRM Contact.attributes when integrated
};

type SubmitAction = {
  kind: "store-only" | "redirect" | "thank-you" | "external-webhook",
  redirectUrl?: string,
  thankYouMessage?: string,
  webhookUrl?: string,
  notifyEmails?: string[],                  // staff emails to email on submission
};

type Submission = {
  id, agencyId, clientId?,
  formId,
  values: Record<string, string | string[]>,
  meta: {
    ip?: string,
    userAgent?: string,
    referer?: string,
    submittedAt,
  },
  status: "pending"|"reviewed"|"converted"|"spam"|"deleted",
  endCustomerUserId?,                       // populated if submitted while logged in as end-customer
  createdAt,
};
```

### Services

- **FormService** — CRUD on FormDefinition + status transitions +
  `publish(id)` flips `draft` → `published` and sets `publishedAt`.
  `getPublishedForm(id)` for the public render path (storefront block).
- **SubmissionService** — `record(formId, values, meta?)` is the public
  entry point (called by the storefront block + by any client signup
  surface). Validates against the form's field definitions. Idempotent
  on a hash of `(formId, email-or-id, normalised-values)` so double-submit
  produces one row. Emits `forms.submission.created` event.
- **NotificationService** — when a submission lands and the form's
  `submitAction.kind === "external-webhook"` or has `notifyEmails`,
  posts the webhook + queues email notifications. Email actually-sending
  remains agency-marketing's territory; this just enqueues.
- **TemplateService** — CRUD + idempotent seedDefaults (Contact /
  Newsletter / Lead-Capture).

### Ports needed from foundation

- `StoragePort`, `TenantPort`, `UserPort`, `ActivityLogPort`,
  `EventBusPort`, `PluginInstallStorePort` (mirror prior plugins)
- `EmailQueuePort` — optional, returns null when agency-marketing not
  installed for the agency. Called for submission notifications.
- ActivityCategory union extension: `"forms"`. Note for cross-team.

### API routes (~12)

Admin:
- `GET /forms` · `POST /forms` · `PATCH /forms/:id` · `DELETE /forms/:id` · `POST /forms/:id/publish`
- `GET /forms/:id/submissions` · `PATCH /submissions/:id` (status updates) · `DELETE /submissions/:id`
- `GET /templates` · `POST /templates` · `POST /forms/from-template/:templateId`

Public-facing (no auth — submission entry point):
- `POST /public/submit/:formId` (rate-limited per IP, body validated)
- `GET /public/form/:formId` (returns form definition for storefront render)

### Admin pages (~5)

`FormsListPage`, `FormBuilderPage` (drag-drop field editor + preview),
`SubmissionsPage` (filterable list + bulk actions), `TemplatesPage`,
`SettingsPage` (per-agency defaults: spam protection toggles, max
submissions/IP/min, default notify-emails).

### Storefront block contributions

`form-render` (block id only — T3 registers renderer in their next
round). Block accepts `formId` prop, fetches via `GET /public/form/:formId`,
posts to `POST /public/submit/:formId`.

## Cross-plugin integration (port shape, not source edits)

- **client-crm**: when `forms.submission.created` fires, CRM's
  `ActivityService` records an activity record on the matching Contact
  (matched by submission email). If no Contact exists, optionally
  create one in the "All" segment. This wiring lives in T1's foundation
  router (R6) — your job in this plugin is just to emit a clean event
  payload with `{ formId, email, values }`.
- **affiliates**: a form with `submitAction.kind === "external-webhook"`
  pointing at `/api/portal/affiliates/me/enroll` becomes the affiliate
  signup form. No source coupling — Webhook URL config is admin-set.
- **memberships**: same pattern; a form can post to `/api/portal/memberships/me/subscribe`.

## Foundation integration

Same pattern as client-crm + agency-marketing. Document Foundation
pending list in chapter:
- Workspace dep + transpilePackages + side-effect-import file +
  `_registry.ts` append + ActivityCategory += `"forms"` + cross-plugin
  event subscription (forms.submission.created → CRM ActivityService).

## NOT in scope

- Don't build the form-render React component — that's T3's renderer
  job, contributed via `form-render` block id.
- Don't build a visual form-builder UI with drag-drop — keep
  `FormBuilderPage` as a structured editor (table of fields, inline
  add/edit/remove, reorder via up/down arrows). Drag-drop is a polish
  pass for a future round.
- Don't build email-sending integration — emit
  `forms.notification.requested` events; agency-marketing or a future
  email-sender plugin actually delivers.
- Don't build conditional logic / multi-page forms — single-page only
  for v1.
- Don't touch other plugin source.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end.

## When done

1. `tsc --noEmit` clean inside `04-the-final-portal/plugins/forms/`.
2. Smoke (`src/__smoke__/forms.test.ts`) — node:test cases:
   - `seedDefaultTemplates` idempotent.
   - Form CRUD + status transitions.
   - Submission record via public endpoint with field validation.
   - Idempotent double-submission collapse.
   - Event bus emit on submission + on validation failure.
   - Optional EmailQueuePort absent: graceful no-op.
3. Chapter `04-plugin-forms.md` documenting domain, services, API
   surface, cross-plugin event payload shape, Foundation pending list,
   cross-team integration TODOs (T3 renderer for `form-render` block;
   T1 router subscribes CRM ActivityService).
4. MASTER row.
5. `tasks.md` row done.
6. Final `DONE` + `COMMIT`.
