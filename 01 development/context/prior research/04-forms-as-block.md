# 04 — Forms-as-block (T3 R015)

T3 Round 015. Wires `@aqua/plugin-forms` (T2 deliverable) into the
website-editor: every published form becomes droppable into any
page via a `form-embed` block. Operator picks the form by id (or
via the `FormPickerModal`); the block fetches the schema at runtime,
renders the field set, and submits to the forms plugin's public
endpoint.

## 1. State on entry

The forms plugin already exposes the public surface this round
needs (per `plugins/forms/src/api/routes.ts`):

- `GET /api/portal/forms/public/form/:formId` — published-only
  schema (server-only metadata stripped).
- `POST /api/portal/forms/public/submit/:formId` — submission
  endpoint with per-IP rate-limiting + spam-protection.
- `GET /api/portal/forms/forms` — admin list (used by the picker).

`FormDefinition` carries `fields: FormField[]` covering text /
email / phone / textarea / select / multiselect / radio /
checkbox / number / date / hidden, plus a `submitAction` of
`store-only / redirect / thank-you / external-webhook`.

## 2. FormEmbedBlock

NEW `src/components/blocks/FormEmbedBlock.tsx` (block id
`form-embed`, 📋, content category):

Props:

```ts
{ formId, fallbackTitle?, inlineThankYou? }
```

- `useEffect` fetches `GET /forms/public/form/<formId>` on mount.
- Renders a real form against the schema — full field-kind
  coverage (text / email / phone / textarea / select /
  multiselect / radio / checkbox / number / date / hidden).
  Required-marker (`*`), `helpText`, `placeholder`, and
  `defaultValue` honoured.
- Honeypot field `_h` is screen-reader-and-tab hidden via
  absolute positioning. Submission silently no-ops if filled
  (returns the success state to mask the rejection from bots).
- POSTs `{ values: <field-id keyed object> }` to
  `/forms/public/submit/<formId>`. Multiselect → array;
  checkbox → boolean; everything else → string.
- Post-submit:
  - `redirect` action → `window.location.href = redirectUrl`.
  - `thank-you` action → renders `submitAction.thankYouMessage`.
  - `store-only` / `external-webhook` → renders the block's
    `inlineThankYou` prop (default: "Thanks — we got it.").
- Error / loading / submitted states all use brand-kit CSS vars
  (`--brand-text / --brand-text-muted / --brand-bg-elevated /
  --brand-border / --brand-radius-md`) so the form blends into
  whatever per-tenant brand-kit is bound at the layout root.

Spam protection (`spamProtection.minSecondsBetweenSubmits`) is
enforced by the forms plugin itself per-IP; the block doesn't
need to mirror it client-side.

## 3. FormPickerModal

NEW `src/components/editor/FormPickerModal.tsx`. Operator-facing
picker: lists every form via `GET /forms/forms`, filters by
status (default Published, Drafts, All) + free-text search,
sorts most-recent first. Each row shows name, description (if
any), field count, submission count, and a status pill (green
published / slate draft / red archived). Click → fires
`onPick(formId)` so the host page (typically the editor's
properties sidebar for the `form-embed` block) wires the id
into the block's props.

"+ Create new form ↗" anchor links to the forms-plugin admin
route (default `/portal/agency/forms`; host page can override
via the `createFormHref` prop). External-target so the
operator's editor session isn't lost.

`fetchImpl` override accepted for test/SSR injection.

## 4. Submission confirmation

The block honours the form's `submitAction` first. The
`inlineThankYou` prop is only used for `store-only` and
`external-webhook` actions (where neither a redirect nor a
plugin-supplied thank-you message is set). Operator can override
the message per-block, and per-form via the forms-plugin
`thank-you` action — both wired through the same
`submitAction.thankYouMessage` field on the schema response.

## 5. Smoke

NEW `__smoke__/r015-forms-as-block.test.ts` 14/14:

- block-registry surface (registered, defaults, `formId` +
  `inlineThankYou` fields, category=content, isContainer=false).
- SSR rendering: no formId surfaces the `fallbackTitle` (effect
  hasn't run); with formId, renders the loading-state text +
  `data-block-type="form-embed"` + brand-kit CSS-var token.
- Endpoint URL contract: matches `/api/portal/forms/public/form/
  <id>` + `/api/portal/forms/public/submit/<id>` per forms-plugin
  routes (compile-time guard).

`@aqua/plugin-website-editor` package.json test chain extended.
tsc-clean.

`react-dom/server` types unavailable in plugin-scope devDeps;
the smoke uses a typed wildcard import + `@ts-expect-error`
directive (mirrors R009's pattern).

## 6. Files

- `plugins/website-editor/src/components/blocks/FormEmbedBlock.tsx`
  (NEW).
- `plugins/website-editor/src/components/editor/FormPickerModal.tsx`
  (NEW).
- `plugins/website-editor/src/components/blockRegistry.ts` patch
  (import + `form-embed` entry).
- `plugins/website-editor/src/__smoke__/r015-forms-as-block.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- `formId` is operator-typed today; integrating the
  `FormPickerModal` directly into the properties sidebar
  (an "open picker" button next to the `formId` field) is host-
  page wiring R+1.
- The block fetches the published schema at runtime (no
  pre-rendering / SSR hydrate) because per-tenant form schemas
  vary by install and the editor canvas needs to react to
  schema edits without a redeploy. Real-world latency on the
  fetch is mitigated by the `fallbackTitle` prop + browser
  cache.
- Honeypot is the `_h` text field (bots tend to fill it). Real
  rate-limit + spam-protection is the forms plugin's
  responsibility (per-IP `minSecondsBetweenSubmits`).
- Multiselect serialises as a string array; checkbox as a
  boolean; everything else as a string. Form plugin's submission
  validator should accept this shape — confirmed against
  `plugins/forms/src/server/submissions.ts` contract.
- `external-webhook` `submitAction.kind` returns the inline
  thank-you on success. The plugin posts to the webhook
  server-side; the block doesn't see the webhook response.

## 8. R+1 candidates

- Properties-sidebar integration: an "Open form picker" button
  next to the `formId` input launches `FormPickerModal` and
  patches the prop on pick.
- Server-side schema cache: the foundation can pre-resolve
  the form schema and inline it into the page HTML so the
  block renders synchronously (eliminates the loading flash).
- Field-level conditional logic ("show field B only if A == X")
  — forms plugin domain extension first, block UI follows.
- Rich submission analytics surface (live submission count,
  conversion-rate vs. impressions) inline in the picker.
- Per-form A/B variants surfaced as picker rows so operators
  can drop the variant directly.
- Multi-step form rendering — pages segmenting via a `step`
  prop / pagination CSS.
