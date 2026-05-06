# Forms plugin (T2 R9)

`@aqua/plugin-forms` — cross-cutting form builder + submissions store.
`scopePolicy: "either"` (works at agency or client scope), `core: false`,
no hard deps. Soft-integrates with client-CRM / affiliates / memberships
via cross-plugin event payloads + admin-configurable webhook URLs —
zero source coupling between plugins.

> Built by T2 on 2026-05-05 as Round 9. tsc-clean standalone; 8/8
> smoke pass. Storefront block id `form-render` is the canonical
> consumer of public/form/:formId + public/submit/:formId.

## 1. Package shape

```
04-the-final-portal/plugins/forms/
├── index.ts                          default-exports the AquaPlugin manifest
├── package.json                      @aqua/plugin-forms@0.1.0
├── tsconfig.json
├── src/
│   ├── lib/
│   │   ├── aquaPluginTypes.ts        vendored AquaPlugin contract
│   │   ├── domain.ts                 FormDefinition · FormField · SubmitAction · Submission · FormTemplate · cross-plugin event payloads
│   │   ├── tenancy.ts                Mirror types (+ "forms" added to ActivityCategory)
│   │   ├── ids.ts                    makeId + fnv1a (cheap idempotency hash)
│   │   └── time.ts                   stubable clock
│   ├── server/
│   │   ├── ports.ts                  Storage · Tenant · User · ActivityLog · EventBus · PluginInstallStore (+ optional EmailQueuePort)
│   │   ├── forms.ts                  FormService (CRUD + state machine + publish + per-form submissionCount)
│   │   ├── submissions.ts            SubmissionService (record with validation + idempotent collapse + secondary indexes by-form/idem)
│   │   ├── notifications.ts          NotificationService (dispatch on submit; emits forms.notification.requested + enqueues via optional port)
│   │   ├── templates.ts              TemplateService (3 seeded defaults + form-from-template helper at handler level)
│   │   ├── foundationAdapter.ts      registerFormsFoundation + containerFor + containerWithDeps + _containerFromCtx
│   │   └── index.ts                  buildFormsContainer + barrel
│   ├── api/
│   │   ├── handlers.ts               13 handlers (admin + 2 public)
│   │   └── routes.ts                 ROUTES (per-route visibleToRoles; public:true on the 2 public routes)
│   ├── pages/
│   │   ├── FormsListPage.tsx         mounted at "" + "forms"
│   │   ├── FormBuilderPage.tsx       "forms/:id" — structured field editor (no drag-drop in v1)
│   │   ├── SubmissionsPage.tsx
│   │   ├── TemplatesPage.tsx
│   │   └── SettingsPage.tsx
│   └── __smoke__/
│       └── forms.test.ts             8 node:test cases via tsx --test
└── package-lock.json
```

19 source files, ~3700 LOC, zero runtime deps.

## 2. Manifest (key fields)

```ts
{
  id: "forms",
  category: "growth",
  status: "alpha",
  core: false,
  scopePolicy: "either",               // installs at agency OR client scope
  requires: [],                         // no HARD deps
  navItems: [Forms · Submissions · Templates · Settings],   // 4 admin items
  pages: 6 entries (FormsList ×2 + FormBuilder + Submissions + Templates + Settings),
  api: ROUTES,                         // 13 routes
  storefront.blocks: ["form-render"],   // T3 registers renderer
  features: [form-builder, templates, webhook-action, email-notify, spam-protection],
  settings.groups: [
    general (defaultNotifyEmails, maxSubmissionsPerIpPerHour),
    spam (minSecondsBetweenSubmits),
  ],
  onInstall: seeds 3 default templates (Contact / Newsletter / Lead Capture),
  healthcheck: published-form count + submission count + template count,
}
```

## 3. Domain model (v1)

```ts
type FormDefinition = {
  id, agencyId, clientId?,
  name, description?,
  fields: FormField[],                 // 11 supported field kinds
  submitAction: SubmitAction,          // kind + redirectUrl/thankYouMessage/webhookUrl/notifyEmails
  status: "draft"|"published"|"archived",
  publishedAt?,
  submissionCount,                     // running counter
  spamProtection?: { enabled, minSecondsBetweenSubmits? },
  createdAt, updatedAt,
};

type FormField = {
  id, kind: "text"|"email"|"phone"|"textarea"|"select"|"multiselect"|"radio"|"checkbox"|"number"|"date"|"hidden",
  label, placeholder?, helpText?,
  required: boolean,
  defaultValue?,
  options?: { value, label }[],
  validation?: { minLength?, maxLength?, pattern?, min?, max? },
  attributeKey?,                       // hint for client-CRM ingestion
};

type SubmitAction = {
  kind: "store-only"|"redirect"|"thank-you"|"external-webhook",
  redirectUrl?, thankYouMessage?, webhookUrl?, notifyEmails?,
};

type Submission = {
  id, agencyId, clientId?,
  formId,
  values: Record<string, string | string[]>,
  meta: { ip?, userAgent?, referer?, submittedAt },
  status: "pending"|"reviewed"|"converted"|"spam"|"deleted",
  endCustomerUserId?,
  idempotencyKey,                      // fnv1a(formId + identifier + sortedValuesHash)
  createdAt,
};

type FormTemplate = {
  id, agencyId, clientId?,
  name, description?,
  category: "contact"|"newsletter"|"lead"|"survey"|"other",
  fields, submitAction,
  isDefault, status, createdAt, updatedAt,
};
```

### Form state machine

```
draft     → published | archived
published → archived
archived  → (terminal)
```

`publish()` flips draft → published and stamps `publishedAt`. Idempotent
on already-published. Re-publish from archived is forbidden (create a
new draft).

### Submission validation

Per-field validation runs at record time:
- `email` kind: must match basic RFC pattern.
- `number` kind: must parse + min/max bounds.
- `select` / `radio`: value must be in `options`.
- `multiselect`: every value must be in `options`.
- `validation.minLength` / `maxLength` / `pattern`: enforced on string-typed values.
- `required` fields: empty/null/empty-array fails.

Failures emit `forms.submission.validation_failed` event so spam-detection
or ops-alerting can react without polling.

### Idempotency

```
idempotencyKey = fnv1a(formId + ":" + (endCustomerUserId ?? email ?? "anon") + ":" + sortedValuesHash)
```

Re-submitting the same `(form, identifier, values)` collapses onto the
prior submission row (`{ ok: true, duplicate: true, submission }`); the
form's `submissionCount` does NOT bump on collapsed re-submits. Different
values → fresh row + bump.

## 4. Storage layout

```
forms/by-id/<id>                → FormDefinition
forms/index                     → string[] of form ids

submissions/by-id/<id>          → Submission
submissions/by-form/<formId>    → string[] of submission ids
submissions/idem/<key>          → submissionId  (idempotency lookup)
submissions/index               → string[] of all submission ids

templates/by-id/<id>            → FormTemplate
templates/index                 → string[] of template ids
```

Per-install slice — agency-scoped install and client-scoped install
have completely separate stores. No cross-install reads.

## 5. API surface (13 routes)

Mounted at `/api/portal/forms/...`. Two routes carry `public: true`
so the foundation's catch-all dispatcher skips the session check
(form submission has to work for anonymous storefront visitors).

| Method · Path | Handler | Roles |
|--------------|---------|-------|
| GET `forms` | listFormsHandler | admin viewers |
| POST `forms` | createFormHandler | admin roles |
| PATCH `forms` | updateFormHandler | admin roles |
| DELETE `forms?id=…` | deleteFormHandler | admin roles |
| POST `forms/publish` | publishFormHandler | admin roles |
| GET `submissions` | listSubmissionsHandler | admin viewers |
| PATCH `submissions` | updateSubmissionHandler | admin roles |
| DELETE `submissions?id=…` | deleteSubmissionHandler | admin roles |
| GET `templates` | listTemplatesHandler | admin viewers |
| POST `templates` | createTemplateHandler | admin roles |
| POST `forms/from-template` | formFromTemplateHandler | admin roles |
| **POST `public/submit/:formId`** | publicSubmitHandler | **public** |
| **GET `public/form/:formId`** | publicFormHandler | **public** |

Roles: `admin viewers` = agency-* + client-*; `admin roles` = agency-owner / agency-manager / client-*.

## 6. Cross-plugin event payloads

All payloads stable so downstream consumers can pin against them.

```ts
"forms.submission.created"  →  {
  formId, formName, submissionId,
  email?,                              // best-guess from values[email-field]
  endCustomerUserId?,
  values: Record<string, string | string[]>,
  occurredAt,
}

"forms.submission.validation_failed"  →  {
  formId, errors: { fieldId, reason }[],
}

"forms.submission.status_changed"  →  {
  submissionId, status,
}

"forms.notification.requested"  →  {
  submissionId, formId, formName,
  webhookUrl?,                         // when external-webhook action
  notifyEmails?,                       // staff recipients
  payload: { formId, formName, values, meta },
  occurredAt,
}
```

`forms.notification.requested` is the gateway for two follow-ups:
1. Foundation event router POSTs the webhook URL when present.
2. Email-queue consumer (agency-marketing in a future round) picks
   up the event and actually delivers.

## 7. Cross-plugin integration patterns

### → client-CRM
`forms.submission.created` → CRM's `/events/ingest` route already
accepts a generic ingest payload. Payload shape includes `email` +
`values` so CRM can either match an existing Contact by email or
auto-create one. `attributeKey` hints on FormField map to CRM
Contact.attributes when the foundation router fans the event.

### → affiliates
Form's `submitAction.kind === "external-webhook"` with
`webhookUrl: "/api/portal/affiliates/me/enroll"` makes that form an
affiliate signup form. No source coupling — the Webhook URL is
admin-set on FormBuilderPage.

### → memberships
Same pattern: `webhookUrl: "/api/portal/memberships/me/subscribe"`
with `body` derived from form values turns the form into a
membership signup wizard.

### → agency-marketing (future)
The optional `EmailQueuePort.enqueue` is what agency-marketing's
send-time integration will satisfy. Until then, notifications fire
the `forms.notification.requested` event but no email actually
delivers.

## 8. Smoke test (8 cases)

`src/__smoke__/forms.test.ts` — `node:test` via `tsx --test`. Builds
an in-memory foundation with optional EmailQueuePort mocked, walks:

| Step | Asserts |
|------|---------|
| 0 | `seedDefaults` ×2: first seeds 3 templates (Contact / Newsletter / Lead Capture), second is no-op; isDefault flag set |
| 1 | Form CRUD + state machine: draft → published → archived; idempotent re-publish; can't delete published forms; can't transition archived → published |
| 2 | Submission validation: missing required email rejected; bad email format rejected; bad select option rejected; happy path records pending submission; submissionCount bumps; validation failures emit `forms.submission.validation_failed` events |
| 3 | Idempotent double-submission: same values → `duplicate: true` + submissionCount NOT bumped; different values → fresh row + bump |
| 4 | Notification dispatch with EmailQueuePort wired: webhookFired=true (action.kind === "external-webhook"), emailsQueued=1 (notifyEmails.length === 1), `forms.notification.requested` event emitted |
| 5 | Optional EmailQueuePort absent: notifications still emit events, but emailsQueued=0; webhook still fires (not gated on email port); no port-call when port omitted |
| 6 | Instantiate a Form from a Template — fields + submitAction copied to the new draft Form |
| 7 | Activity log + event bus carry all expected forms.* verbs (template.created / form.created / form.published / form.archived / submission.created / notification.requested) |

```
▶ forms smoke
  ✔ step 0–7 (8/8 pass)
ℹ tests 8   ℹ pass 8   ℹ fail 0
```

`npm run smoke` from `04-the-final-portal/plugins/forms/`.

## 9. Foundation pending (orchestrator brokerage)

| # | Task | File / Surface |
|---|------|---------------|
| 1 | Workspace dep + transpilePackages | `portal/package.json` + `portal/next.config.ts` |
| 2 | Side-effect-import file at `portal/src/plugins/foundation-adapters/formsFoundation.ts` calling `registerFormsFoundation({ tenant, user, activity, events, pluginInstalls, emailQueue? })` | new file |
| 3 | `_registry.ts` append (`formsManifest as unknown as AquaPlugin`) | `portal/src/plugins/_registry.ts` |
| 4 | `ActivityCategory` union += `"forms"` | `portal/src/server/types.ts` |
| 5 | Catch-all `public: true` flag honouring on the API dispatcher (already on the foundation-pending list since memberships R4 — `public/submit/:formId` + `public/form/:formId` need it) | `portal/src/app/api/portal/[plugin]/[...rest]/route.ts` |
| 6 | **Cross-plugin event router** — same item shared with client-CRM. Foundation subscribes to `forms.submission.created` and fans out to the consumers configured per-form (CRM ingest by default; webhook POST when `submitAction.webhookUrl` is set; email enqueue when `notifyEmails` is set). | foundation event-bus adapter |
| 7 | **EmailQueuePort wiring** — read agency-marketing's container at boot (when installed) and project an `enqueue` method. Until agency-marketing's send-time integration ships in a future round, the port can be a no-op that returns `{ ok: true, queued: false }`. | new adapter file |

## 10. Cross-team integration TODOs

- **T3 storefront block renderer** for `form-render` — fetches via
  `GET /public/form/:formId`, renders fields via T3's existing input
  components, posts to `POST /public/submit/:formId`. Block descriptor
  lives in this plugin's manifest; renderer in T3 (R4 or later).
- **T2 client-CRM follow-up**: `/events/ingest` already accepts a
  generic ingest shape. The foundation router translates
  `forms.submission.created` → CRM's `/events/ingest` (no source edit
  needed in either plugin once the router lands).
- **T2 agency-marketing follow-up**: when send-time integration lands
  in a future round, project `EmailQueuePort.enqueue` from the
  marketing container so forms notifications actually deliver.

## 11. NOT in scope (per the prompt)

- Don't build the form-render React component — that's T3's
  renderer job (storefront block id only contributed here).
- No drag-drop UI in FormBuilderPage — structured editor only
  (table of fields with inline edit). Drag-drop is polish.
- No email-sending integration — emit events; agency-marketing or
  a future send-mailer plugin actually delivers.
- No conditional logic / multi-page forms — single-page only.
- No source edits to other plugins.

## 12. Verification commands

```bash
cd "04-the-final-portal/plugins/forms"

# tsc clean
npx tsc --noEmit

# 8/8 smoke pass
npm run smoke
```
