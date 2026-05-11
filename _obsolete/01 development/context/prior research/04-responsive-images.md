# Responsive image attrs helper (T3 R038)

## What

Pure builder that, given a source URL + an intent (hero / card /
thumb / full-width), emits the `<img>` attributes a renderer
should stamp: `src`, `srcset`, `sizes`, `loading`, `decoding`,
and `fetchpriority` (when relevant). Plus a CDN-aware width
helper and a per-block CLS-risk auditor.

R030 animations honour: `loading="lazy"` does not disable the
intersection-observer animation logic — the observer triggers
on `IntersectionObserverEntry` regardless of how the browser
chose to defer the network request. Hero intent stays `eager`
so the LCP frame isn't held back.

## Files

- `src/lib/responsiveImage.ts` (NEW)
  - `buildImageAttrs(src, intent, opts?)` → `ImageAttrs`. Per
    intent presets:
    - `hero`     → widths [640, 960, 1280, 1600, 2400], sizes
      `100vw`, loading `eager`, fetchpriority `high`.
    - `card`     → widths [320, 480, 640], sizes
      `(max-width: 640px) 100vw, 33vw`, loading `lazy`.
    - `thumb`    → widths [160, 240], sizes `120px`, loading
      `lazy`.
    - `full-width` → widths [960, 1280, 1600, 2000], sizes
      `100vw`, loading `lazy`.
    `decoding` always `async`. `src` carries the largest variant
    (UAs without srcset support fall back to it). `opts.loading`
    and `opts.fetchpriority` override the preset (above-the-fold
    cards can opt into `eager`/`high` per page).
  - `withCdnResize(src, w, opts?)` — appends `?w=<W>` to the URL
    (configurable param via `opts.resizeParam`). **Idempotent**:
    if the URL already has the param, replace rather than
    duplicate. Preserves existing query (`?fmt=webp&w=320`) and
    fragment (`#anchor`).
  - `auditImage(block, opts?)` — returns `ImageAuditIssue[]`.
    Codes: `missing-src`, `missing-alt` (checks both
    `props.alt` and `block.a11y.alt`), `missing-width` /
    `missing-height` (CLS risk), `absolute-url-not-allowed`
    (absolute URL whose host isn't in `opts.domainAllowlist`).
- `src/__smoke__/r038-image-srcset.test.ts` (NEW) — 34
  assertions: every intent's srcset shape + sizes + loading +
  fetchpriority + decoding (15) / opts overrides (2) / CDN
  param injection: bare URL, existing query, idempotence,
  fragment preservation, custom param, absolute URL (6) /
  srcset uses configured resizeParam + preserves existing query
  (2) / auditImage all 5 codes + a11y.alt satisfies + allowlist
  pass + allowlist mismatch (9).
- `package.json` test chain extended.

## Honesty contract

We do NOT promise the URL endpoints actually resolve. The helper
appends `?w=<W>` assuming a generic CDN resize layer; the host
wires the real resize service in T6 (Cloudflare Images, Imgix,
or self-hosted). On a static URL with no resize backend, the
srcset becomes identical-content URLs differing only by query
string — harmless (browser still picks one based on viewport)
but wasted bandwidth until T6 lands.

## CLS-risk auditor

`auditImage` returns issues, not warnings — a renderer can
surface them in editor diagnostics or fail the publish gate.
The four CLS-relevant checks:

- `missing-src`     — block has no source.
- `missing-alt`     — neither `props.alt` nor `block.a11y.alt`.
- `missing-width`   — width unset (UA must wait for image bytes
  to compute layout box).
- `missing-height`  — height unset (same).

`absolute-url-not-allowed` is a separate concern: external
images can be tracking pixels or break the static-export
contract. The host passes a `domainAllowlist` of approved CDN
hosts; bare-string absolute URLs whose host is outside the list
flag.

## Q-ASSUMED

- Resize-param defaults to `?w=<W>`. Common across Cloudflare
  Images, Vercel `/_next/image`, Imgix (which uses `w` too).
  Operators on Bunny / Cloudinary pass `opts.resizeParam`.
- `decoding` is unconditionally `async`. Sync decoding is rare
  outside reduced-motion-style flows; renderer can override at
  the JSX layer if needed.
- `auditImage` doesn't enforce a maximum file size. Blob-byte
  caps belong in the upload pipeline (R024 asset-manager).

## NOT in scope (R+1)

- AVIF / WebP negotiation (needs server-side `<picture>` build
  with type-safe source selection).
- Real CDN integration (T6 wires the resize service).
- LQIP / blur-up placeholders.
- Auto-deriving `width` / `height` from intrinsic image dims
  (asset-manager R024 does this on upload; helper accepts the
  resolved values).
