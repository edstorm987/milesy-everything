# 04 — Iframe-embed customer surface (T3 R013)

T3 Round 013. Per requirements §3, end-customers log in via an
iframe embedded on the client's own website — same engine, branded
as the client's. R013 ships the editor-side primitives: postMessage
bridge protocol, per-client embed allow-list registry, snippet
builder UI, and a CSP `frame-ancestors` helper. The foundation
route `/embed/[clientSlug]/[variant]` itself is T1 territory
(documented as Q-FOLLOWUP).

## 1. State on entry

Foundation already ships an embed surface for the login variant:
`portal/src/app/embed/login/page.tsx` (T1 R009 OAuth chapter).
Cookies scoped to the portal origin so the same session works
inside + outside the iframe. R013 generalises the contract to
every variant + ships the bridging primitives clients need to
embed safely.

## 2. PostMessage bridge protocol

NEW `lib/embedBridge.ts` ships the contract both parent (client's
host page) and child (Aqua embed iframe) consume:

```ts
type EmbedEvent =
  | { type: "aqua:ready", clientSlug?, variant? }
  | { type: "aqua:auth-ok", user, redirect? }
  | { type: "aqua:height-changed", height: number }
  | { type: "aqua:navigate", url: string }
  | { type: "aqua:error", message: string };
```

Helpers:

- `dispatchToParent(event, targetOrigin?)` — child-side helper
  with safe defaults; swallows postMessage errors so a non-
  cloneable payload doesn't crash the iframe.
- `subscribeToBridge(onEvent, { allowedOrigins })` — parent-side
  listener that filters by exact-origin allow-list and runs
  the type guard before forwarding. Returns
  `{ unsubscribe }` for cleanup. SSR-safe — no-op when `window`
  is undefined.
- `measureContentHeight()` — `Math.max` over body/document
  scroll/offset heights so the child can fire
  `aqua:height-changed` whenever its content grows. SSR-safe
  (returns 0).
- `isEmbedEvent(value)` — type guard with strict union
  enforcement.
- `buildFrameAncestorsHeader(origins)` — emits the
  `frame-ancestors 'self' …` CSP directive used by foundation
  middleware (always includes `'self'`; blank entries stripped;
  empty list still emits `frame-ancestors 'self'` so internal
  previews keep working).

## 3. Embed allow-list registry

NEW `server/embedAllow.ts` persists a per-client list of origins
permitted to iframe the customer surface — same source-of-truth
the foundation middleware reads when emitting CSP headers.

Storage: `t/<agencyId>/<clientId>/website-editor/embed-allow`.

```ts
interface EmbedAllowList {
  origins: string[];
  updatedBy: string;
  updatedAt: string;  // ISO timestamp
}
```

API:

- `GET /api/portal/website-editor/embed/allowed-origins` —
  returns the current list (or empty when unset).
- `POST /api/portal/website-editor/embed/allowed-origins` —
  body `{ origins: string[] }`. Set-and-tell pattern: persists
  the cleaned (deduped, trimmed, validated) list AND surfaces
  invalid entries via a separate `invalid: string[]` array so
  the UI can flag mistakes without 400-ing the whole batch.
  Missing origins array → 400.

`isValidOrigin` regex (`^https?://[a-z0-9.-]+(:\d{2,5})?$`)
rejects trailing slashes, paths, and non-string inputs. Trailing
whitespace stripped before validation.

## 4. Snippet builder UI

NEW `components/editor/EmbedSnippetBuilder.tsx`. Operator picks
variant + width + initial height + auto-resize toggle; component
renders paste-ready HTML the operator emails to the client:

```html
<iframe id="aqua-embed" src="…/embed/<slug>/<variant>"
  style="width:100%;border:0;height:640px"
  loading="lazy"
  allow="payment; clipboard-write"></iframe>
<script>
(function(){
  var allowed = "https://app.aqua.io";
  window.addEventListener("message", function(e){
    if (e.origin !== allowed) return;
    if (!e.data || typeof e.data !== "object") return;
    if (e.data.type === "aqua:height-changed" && typeof e.data.height === "number") {
      var f = document.getElementById("aqua-embed");
      if (f) f.style.height = e.data.height + "px";
    }
  });
})();
</script>
```

Auto-resize honours the bridge protocol and is exact-origin-
checked so a malicious page can't spoof height events. Copy-to-
clipboard with a 1.5s success flash; falls back gracefully when
`navigator.clipboard` is unavailable. CSS-var driven (reads
`--brand-bg-elevated / --brand-border / --brand-radius-md /
--brand-text` from R011).

## 5. Foundation route (Q-FOLLOWUP)

The actual route `/embed/[clientSlug]/[variant]` is T1 territory.
Contract for T1's middleware:

```ts
// foundation middleware on /embed/[clientSlug]/[variant]
import { getEmbedAllowList } from "@aqua/plugin-website-editor/server/embedAllow";
import { buildFrameAncestorsHeader } from "@aqua/plugin-website-editor/lib/embedBridge";

const list = await getEmbedAllowList(storage, agencyId, clientId);
res.headers.set("Content-Security-Policy",
  buildFrameAncestorsHeader(list?.origins ?? []));
res.headers.delete("X-Frame-Options"); // CSP supersedes
```

The page itself loads the chosen variant tree via existing
`getActivePortalVariant` (R012), strips chrome (`data-embed="true"`
already used by login embed), and dispatches `aqua:ready` on mount
+ `aqua:height-changed` on `ResizeObserver` trigger.

## 6. Smoke

NEW `__smoke__/r013-iframe-embed-surface.test.ts` 37/37:

- `isEmbedEvent` accepts all 5 event types, rejects null /
  unknown / strings.
- `buildFrameAncestorsHeader` always includes `'self'`, supplies
  origins, strips blanks, empty list → `frame-ancestors 'self'`.
- `measureContentHeight` returns 0 in node context (SSR-safe).
- `subscribeToBridge` returns a no-op unsubscribe in node context.
- `isValidOrigin` accepts http/https + ports + case-insensitive,
  rejects trailing slash / path / empty / non-string.
- Registry round-trip: dedup + trim + invalid-strip + null on
  unset + cross-agency isolation.
- HTTP shape: GET empty + POST 200 surfacing saved + invalid +
  POST without origins → 400 + GET after save reflects state.

`@aqua/plugin-website-editor` package.json test chain extended.
tsc-clean.

## 7. Files

- `plugins/website-editor/src/lib/embedBridge.ts` (NEW).
- `plugins/website-editor/src/server/embedAllow.ts` (NEW).
- `plugins/website-editor/src/api/handlers/embedAllow.ts` (NEW).
- `plugins/website-editor/src/api/routes.ts` patch (2 routes).
- `plugins/website-editor/src/components/editor/EmbedSnippetBuilder.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/r013-iframe-embed-surface.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 8. Q-ASSUMED / deviations

- Foundation route `/embed/[clientSlug]/[variant]` deferred to
  T1 (cross-team). R013 ships the registry + bridge + helper +
  snippet UI all foundation needs to land the route cleanly;
  contract documented in §5.
- Set-and-tell pattern on the POST: invalid origins are reported
  separately rather than 400-ing the whole batch — operator
  experience beats batch atomicity for an admin-only endpoint
  with a small payload.
- Snippet builder defaults the auto-resize listener to exact-
  origin match (`e.origin !== allowed`). If a client embeds
  across multiple subdomains they paste multiple snippets —
  cleaner than a wildcard listener.
- `isValidOrigin` rejects URLs with paths to keep the allow-list
  semantically about *origins* not *URLs* — the foundation
  middleware operates on origin matching too.
- Embed `auth-ok` event includes a suggested redirect URL but
  the host page enforces the allow-list before navigating —
  child suggests, host enforces (Decisions log on iframe trust).
- `EmbedAutoResize.tsx` (child-side script wrapper) deferred —
  the snippet's inline JS is the canonical wire today; a React
  component for editor preview rendering is R+1.

## 9. R+1 candidates

- Foundation `/embed/[clientSlug]/[variant]` route + middleware
  honouring the CSP allow-list (T1).
- `EmbedAutoResize.tsx` React component for editor preview /
  storefront rendering (calls `dispatchToParent` on
  `ResizeObserver` trigger).
- Custom-domain provisioning (T6 territory, explicit out-of-
  scope per prompt).
- Per-variant scoped allow-list (today the list is per-client
  not per-variant — fine for v1, refine when a client wants
  different origins per surface).
- Telemetry: log `aqua:auth-ok` events to the activity feed for
  audit trail.
- Built-in support for `aqua:locale-changed` event so the parent
  page can sync language without a full reload.
