# 04 — Custom CSS / head injection per variant (T3 R029)

T3 Round 029. Operator pastes custom CSS at variant level (brand-
specific overrides, font-loading rules) + an arbitrary `<head>`
fragment for `<link>` / `<meta>` / `<style>` markup. Storefront
SSR injects between brand-kit vars and block styles so operator
overrides take precedence.

## 1. Schema

`EditorPage` already carries `customCss?: string` and
`customHead?: string` from earlier rounds. R029 adds:

- Server-side validator with size cap + script gate.
- Two endpoints (GET preload + POST set with validation).
- Render helper that composes brand-kit vars + custom CSS + head
  fragment into the foundation layout's head injection.

Variants are pages with `portalRole`, so per-variant custom code
is per-page — the schema is already in the right place.

## 2. Validation library

NEW `lib/customCode.ts` (pure):

```ts
CUSTOM_CSS_MAX_BYTES = 8192
CUSTOM_HEAD_MAX_BYTES = 4096

validateCustomCode(value, kind: "css" | "head") → ValidationResult
buildCustomCodeHead({ brandCss?, customCss?, customHead? }) → string
```

`validateCustomCode` checks:

- **Size cap** — `TextEncoder.encode(value).byteLength` (UTF-8
  bytes, not character count, so multibyte runes count
  correctly). Returns `{ ok: false, reason: "too-large" }` when
  over.
- **Script gate** (both kinds) — `<\s*script\b/i` matches
  `<script>` in any case + whitespace. Returns
  `{ ok: false, reason: "script-detected" }`.
- **Head-only gates** — iframe HTML element (`<iframe>`) and
  `javascript:` URI scheme on common attributes (`href / src /
  action / formaction / onload / onerror / onclick / onfocus`).
  CSS allows `iframe { … }` selectors — only the HTML element
  is gated.

`buildCustomCodeHead` emits:

```html
<style data-aqua="custom-code">
  :root { --brand-* … }   /* brand-kit vars first */

  …operator CSS…
</style>
<!-- aqua: custom head -->
…operator head fragment…
```

Single `<style>` tag for CSS so cascade order is deterministic
(operator wins on conflicting selectors). Head fragment as a
separate trailing block with a comment marker for grep-ability.
Empty input → empty string (no useless empty `<style>`).

## 3. API endpoints

`api/handlers/customCode.ts` mounts 2 routes at
`/api/portal/website-editor/`:

- `GET /pages/custom-code?siteId=…&id=…` →
  `{ customCss, customHead, caps: { css, head } }`. Surfaces
  caps so the editor textarea can show a "X / 8192 bytes"
  counter. 400 missing args, 404 unknown page.
- `POST /pages/custom-code?siteId=…&id=…` body
  `{ customCss?, customHead? }` — accepts either / both.
  Validates each through `validateCustomCode` before patching;
  any failure → 400 with the validation reason embedded. 400 on
  empty body, 404 unknown page.

`requireClientScope`-gated.

## 4. Storefront wire-up (host-side)

Foundation per-tenant layout composes:

```ts
const css = buildCustomCodeHead({
  brandCss: extendedBrandToStyleString(client.brand),  // R011
  customCss: page.customCss,
  customHead: page.customHead,
});
return <head dangerouslySetInnerHTML={{ __html: css }} />;
```

The brand-kit vars come first so operator selectors override
them via natural CSS cascade. R029's pure render helper is
cascade-aware — host doesn't need to manually order strings.

## 5. Smoke

NEW `__smoke__/r029-custom-css.test.ts` 32/32 pass:

- Caps: CSS 8 KiB / head 4 KiB.
- CSS validator: valid passes; too-large fails with reason
  `too-large`; `<script>` rejected with `script-detected`;
  `iframe { … }` selector passes (only HTML element gated);
  multi-byte counting (em-dash × 2000 ≈ 6 KiB → fits).
- Head validator: `<link>` valid passes; too-large rejected;
  `<script>` / `<iframe>` / `javascript:` URI all rejected
  with their canonical reasons; sneaky variants caught
  (`onclick="javascript:…"`, uppercase `<SCRIPT>`).
- `buildCustomCodeHead`: brand-only emits single `<style>`;
  brand + custom interleaved with brand first; single `<style>`
  block; head fragment with comment marker; empty input → empty
  string.
- HTTP shape: GET 200 with empty + caps; POST CSS-only / head-
  only / both; 400 too-large; 400 `<script>`; 400 empty body;
  400 iframe-in-head; GET 404 unknown; POST 404 unknown; GET
  400 missing siteId.

`@aqua/plugin-website-editor` package.json test chain extended.
website-editor tsc-clean.

## 6. Files

- `plugins/website-editor/src/lib/customCode.ts` (NEW —
  validator + render helper + caps).
- `plugins/website-editor/src/api/handlers/customCode.ts` (NEW —
  GET + POST handlers).
- `plugins/website-editor/src/api/routes.ts` patch (2 new routes).
- `plugins/website-editor/src/__smoke__/r029-custom-css.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- Validator is regex-based not full-parser. CSS doesn't actually
  reject `<script>` — but operators won't paste it intentionally
  in CSS, and for head fragment the regex catches the obvious
  attack vectors. R+1 candidate: full HTML parser for head
  fragment that tolerates escaped angle-brackets in legitimate
  CSS values.
- Per-block custom CSS explicitly out of scope per prompt
  (operator can target blocks via class selectors in the
  variant-level CSS today).
- JavaScript injection is rejected outright per prompt — no
  opt-in, no sandboxed iframe, no `<script async>` allowance.
- "JavaScript URI" gate covers the common attribute-pattern
  vectors but doesn't catch every CSS-import-of-data-URI
  exploit. CSS-side defense relies on the foundation CSP
  blocking `javascript:` URIs in stylesheet `url()` (browser-
  level — modern browsers refuse).
- Editor "Custom code" tab is host-page composition — the
  endpoints + validator are the structural prereq. Host wires
  textarea + paste-format hint + size-counter + confirm-on-save
  on its own (mirrors R011 Brand-kit Settings R+1 pattern).
- Render helper assumes brand-kit vars come from R011's
  `extendedBrandToStyleString` (already shipped).
- Cookie / localStorage cache invalidation on customCss change
  is not relevant — server-rendered every request.

## 8. R+1 candidates

- Full HTML parser for head fragment validation (catches
  edge cases the regex misses; tolerates legitimate escape
  sequences).
- Editor "Custom code" tab UI (textarea + size counter +
  paste-format hint + confirm-on-suspicious-pattern modal).
- CSS linter integration (operator-friendly errors on syntax
  failures before they break the storefront).
- Per-block custom CSS — extends BlockStyles with a
  `customSelector?: string` + scoped CSS payload; keeps the
  global-CSS blast radius bounded.
- Auto-format / minify on save so persisted bytes ≤ caps even
  when operator pastes verbose CSS.
- Cache-bust hook so a customCss change invalidates the
  storefront's CDN edge cache for that page.
