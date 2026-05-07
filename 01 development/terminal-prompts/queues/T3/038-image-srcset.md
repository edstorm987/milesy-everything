/loop

# T3 — Round 038: Responsive image srcset + lazy-loading helper

Per-image-block helper that, given a source URL + an intent (hero / card
/ thumb / full-width), emits the right `srcset`, `sizes`, `loading`,
and `decoding` attributes. Pure helper; renderer integration is a host
one-liner.

## Mandatory pre-read

1. Existing `image` block schema.
2. R030 animations (loading="lazy" must NOT block above-the-fold
   intersection observer logic).
3. Honesty contract: don't fabricate widths the host can't actually
   produce — emit srcset breakpoints assuming a generic CDN with a
   `?w=` resize param; host wires the actual resize layer in T6.

## Scope

**A** — `lib/responsiveImage.ts`:
- `buildImageAttrs(src, intent, opts?)` → `{ src, srcset, sizes,
  loading, decoding, fetchpriority? }`. Intent presets:
  - `hero`: 5 widths (640/960/1280/1600/2400), sizes `100vw`,
    loading `eager`, fetchpriority `high`.
  - `card`: 3 widths (320/480/640), sizes
    `(max-width: 640px) 100vw, 33vw`, loading `lazy`.
  - `thumb`: 2 widths (160/240), sizes `120px`, loading `lazy`.
  - `full-width`: 4 widths (960/1280/1600/2000), sizes `100vw`,
    loading `lazy`.
- `withCdnResize(src, w)` — appends `?w=W` (or replaces existing).
  Configurable param name via `opts.resizeParam`.
- `auditImage(block)` — returns issues: missing alt, missing width,
  missing height (CLS risk), absolute-URL-without-domain-allowlist.

**B** — Smoke `§ Responsive images` (≥15 cases — every intent's srcset
shape + sizes + loading + fetchpriority + auditImage issue codes +
CDN param injection idempotence).

**C** — Chapter `04-responsive-images.md` + MASTER row + tasks row.

## NOT in scope

- AVIF/WebP negotiation (R+1 — needs server-side `<picture>` build).
- Real CDN integration (T6).

## When done
DONE referencing `038-image-srcset.md`.
