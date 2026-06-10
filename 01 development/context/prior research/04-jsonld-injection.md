# JSON-LD injection into page `<head>` (T3 R045)

## What

R037 shipped pure JSON-LD generators (`buildJsonLd`,
`validateJsonLd`, `serializeJsonLd`). R045 wires them into
the storefront `<head>` so every published page emits
`<script type="application/ld+json">` automatically. Sources
Organization data from the agency + site context (brand kit
logo, social handles), and exposes a diagnostics helper the
editor SEO panel can render.

## Files

- `src/lib/jsonLdInjection.ts` (NEW)
  - `deriveOrganization(src)` — builds R037's
    `OrganizationInput` from `{agencyName, baseUrl?,
    brandKit?, site?}`. Logo precedence: `site.logoUrl` >
    `brandKit.logoUrl` (site overrides agency since it's the
    tenant). `sameAs[]` collected from `site.socialHandles`
    (instagram / twitter / tiktok) — bare handles expanded
    to full URLs (`wave_co` → `https://instagram.com/wave_co`),
    `https://…` values preserved as-is. Returns `undefined`
    when `agencyName` is blank (extreme-defence; agencies
    always have a name in practice).
  - `buildPageJsonLd(page, opts)` — runs R037's `buildJsonLd`
    over `page.blocks`. When no Organization could be
    derived, runs a probe with a sentinel and strips the
    Organization entry from the result so block-derived
    schemas still emit alone. Returns `[]` when both the
    tree carries zero matchable schemas AND no Organization
    can be built — empty array signals the renderer to emit
    no `<script>` tags.
  - `buildJsonLdScriptBodies(arr)` — returns one escape-safe
    JSON string per JsonLdObject. Each body is a single JSON
    *object* (not a one-element array), achieved by calling
    R037's `serializeJsonLd([obj])` and slicing off the outer
    `[`/`]`. Slicing is safe because R037's escape never
    rewrites the array brackets.
  - `describeJsonLdEmission(arr)` → `JsonLdEmissionDescriptor[]`
    `{type, summary}` for the editor diagnostics drawer.
    Per-type summaries:
    - `Article — <headline>`
    - `Product — <name>`
    - `FAQPage — N questions` (singular when N=1)
    - `BreadcrumbList — N items` (singular when N=1)
    - `Organization — <name>`
- `src/components/storefront/SiteHead.tsx` — extended to map
  `buildJsonLdScriptBodies` output into
  `<script type="application/ld+json" data-aqua-jsonld>`
  elements via `dangerouslySetInnerHTML`. Falls back to
  `agencyName: site.name` when caller doesn't pass a separate
  `agencyName` prop, so existing render call sites get
  Organization emission without a prop change. Skips emission
  cleanly when the lib returns `[]`.
- `src/__smoke__/r045-jsonld-injection.test.ts` (NEW) — 23
  assertions: Article + Organization emit (1) / Product (1) /
  FAQ aggregation 2 (1) / multi-schema 3 + script-bodies +
  per-body JSON.parse round-trip (3) / Organization always
  emitted with agencyName (1) / no-org + empty tree → 0 (2) /
  no-org + Article → just Article (1) / CSP-safe escape
  preserves no-raw-`</script>` + presence of escaped
  `<\/script>` (2) / `deriveOrganization` agency name +
  site.logoUrl wins + baseUrl + instagram expanded + twitter
  preserved + blank-name → undefined (6) / diagnostics 5
  cases (Article headline, FAQ count, Breadcrumb count,
  Organization name, descriptor length matches arr).
- `package.json` test chain extended.

## Organization sourcing

Operators stamp the agency display name once (R024 founder
seed) and the site logo + socials inside the editor. R045
threads those into Organization without any new fields:

| Field | Source |
|-------|--------|
| `name` | `agencyName` (caller — usually agency.name) |
| `url`  | `baseUrl` (caller — site's absolute URL) |
| `logo` | `site.logoUrl` ?? `brandKit.logoUrl` |
| `sameAs` | `site.socialHandles.{instagram,twitter,tiktok}` expanded to full URLs |

Bare handles win on the dropdown UX side (operators paste
`@handle`); the helper strips a leading `@` and prefixes the
canonical domain. Operators who paste a full URL keep it as-is
(useful for niche socials that don't fit the three-platform
allowlist — the operator just pastes the URL into instagram
slot as a workaround until R+1 expands the social list).

## CSP-safe escape

R037's `serializeJsonLd` already neutralises `</script>`
close, U+2028/U+2029, and HTML comment markers. R045's
script bodies inherit that — operators can paste hostile
input into block props and the embedded `<script>` will not
break out. The smoke verifies `</script>` round-trips through
the escape (`<\/script` in the body) without corrupting the
rest of the JSON.

## Diagnostics drawer integration (out of scope this round)

The editor SEO panel should call `describeJsonLdEmission`
on the live tree and render the descriptors as a list:

```
Will emit:
- Article — How Aqua works
- FAQPage — 3 questions
- Organization — Milesy Media
```

Wiring this into the editor admin page is plugin work; R045
ships the helper so the panel can be a one-liner. Until then,
operators can sanity-check by curl-ing the rendered page and
inspecting `<head>`.

## Q-ASSUMED

- Site logo overrides agency brand-kit logo. Sites are
  agency tenants; per-tenant branding is the right precedence
  for storefront output.
- Bare social handles default to instagram/twitter/tiktok
  domains. Other platforms (YouTube, LinkedIn, Mastodon) are
  R+1 — until then operators paste full URLs into one of the
  three handle slots as a workaround.
- `buildPageJsonLd` returns `[]` when there's nothing to
  emit; the renderer skips the `<script>` map entirely. Empty
  `<script>` tags would be wasted bytes + a CSP smell.
- Default `agencyName` falls back to `site.name` when the
  caller omits the prop. R+1 wires the actual agency record
  through `PluginCtx`; today the SiteHead caller (storefront
  route) doesn't have it, so `site.name` is the working
  proxy that keeps Organization populated.

## NOT in scope (R+1)

- Recipe / Event / LocalBusiness schemas (R+1 — needs new
  builders in R037).
- Auto-inferring schema from non-typed blocks (heading +
  text + image patterns → Article).
- Per-locale JSON-LD variants (depends on R032 i18n).
- Editor diagnostics drawer wiring (component skeleton work).
- Threading actual agency record (name, sameAs[]) through
  `PluginCtx` so SiteHead doesn't depend on `site.name`.
- Validation surface integration — `validateJsonLd` issues
  could surface in the diagnostics drawer alongside the
  descriptor list.
