# `04` Client portal — Compass Coaching (second target shape)

> Authored 2026-05-06 by T5 R2. Second per-client portal under
> `04 the final portal/clients/compass-coaching/`. Built to **validate
> the multi-client materialization pattern** by deliberately diverging
> from Luv & Ker (chapter 43) along three axes: industry, brand kit,
> and plugin set. Gives T2 R11's "Export to repo" generator a second
> concrete target shape to reverse-engineer — if the generator can
> produce both shapes from the shared portal, the contract is
> sound.
>
> Extends `04-architecture.md` (locked v1) and
> `04-architecture-extension-per-client-portals.md` (chapter 19b).
> Reads alongside chapter 43 (`04-client-portal-luv-and-ker.md`) — this
> chapter only documents what differs.

## 1 · What this client is

| Field | Value |
| --- | --- |
| Slug | `compass-coaching` |
| Name | Compass Coaching |
| Industry | Coaching / membership business |
| Tagline | "Find your true direction" |
| Domain (hypothetical) | compasscoaching.com |
| Persona | Plausible second-client Ed could pitch after Felicia |

Placeholder copy throughout — no real coach's content was lifted. The
brand exists solely as a generator-validation fixture.

## 2 · Folder shape — diff from Luv & Ker

```
clients/
├── luv-and-ker/                        ← chapter 43 reference
│   └── …
└── compass-coaching/                   ← THIS chapter
    ├── package.json                    ← 4 plugin deps (vs 6)
    ├── next.config.ts                  ← transpilePackages: 4 (vs 6)
    ├── portal-config.json              ← slim installedPlugins + 3 variants (vs 4)
    ├── tailwind.config.ts              ← identical
    ├── tsconfig.json                   ← identical
    ├── postcss.config.mjs              ← identical
    ├── .npmrc                          ← identical (install-links=true)
    ├── .gitignore / .env.example       ← identical pattern
    ├── public/
    │   ├── compass-wordmark.svg        ← brand mark (was luv-and-ker-wordmark.svg)
    │   └── favicon.svg
    └── src/
        ├── app/
        │   ├── layout.tsx              ← DM_Serif_Display + Inter (was Playfair + Inter)
        │   ├── page.tsx                ← Hero + PricingTiers + Newsletter (was Hero + Featured + BrandStory + Newsletter)
        │   ├── globals.css             ← brand tokens swapped + same a11y polish layer
        │   ├── login/                  ← unchanged
        │   ├── embed/login/            ← unchanged
        │   ├── account/                ← memberships + contact cards (no orders / affiliates)
        │   ├── members/                ← NEW: gated members library (was /shop in Luv & Ker)
        │   ├── contact/                ← NEW: forms-plugin contact form (no analogue in Luv & Ker)
        │   └── api/[...path]/          ← identical proxy
        ├── components/
        │   ├── chrome/{Header,Footer,MemberDrawer}.tsx  ← brand-rewritten copy, same shape
        │   ├── storefront/
        │   │   ├── Hero.tsx            ← compass mark visual (was orange/cream heritage hero)
        │   │   ├── PricingTiers.tsx    ← NEW (memberships block reference)
        │   │   └── Newsletter.tsx      ← unchanged
        │   └── ui/{SkipToContent,EmptyState,ErrorBoundary}.tsx  ← identical
        ├── lib/
        │   ├── portalConfig.ts         ← extended: PricingTier[] + getPricingTiers()
        │   ├── brandKit.ts             ← identical
        │   ├── apiClient.ts            ← identical
        │   ├── sessionUser.ts          ← identical
        │   └── a11y/contrastValidator.ts ← identical
        └── server/pluginDispatch.ts    ← manifestImports: 4 (vs 6)
```

**No ecommerce surfaces ship.** No `/shop`, no `/cart`, no
`/checkout`, no `/order-success`, no `/orders`, no `/affiliates`.

## 3 · Brand kit — diff

```
                  Luv & Ker            Compass Coaching
primaryColor      #F97316 (orange-500) #3B6EAE (steel blue)
secondaryColor    #FFF7ED (cream)      #F4F7FB (mist)
accentColor       #7C3AED (purple)     #1B3D6F (navy)
fontHeading       Playfair Display     DM Serif Display
fontBody          ui-sans-serif        Inter
borderRadius      8px                  0.25rem (≈4px)
```

WCAG AA pairs all clear in dev (no `[Compass Coaching brand kit]
WCAG AA contrast warnings: …` warning fired during smoke). Same
contrastValidator as Luv & Ker, different palette → independent proof
the validator runs per-client at boot.

## 4 · Plugin set — diff (load-bearing for the generator)

| Plugin | Luv & Ker | Compass Coaching |
| --- | :---: | :---: |
| website-editor | ✅ | ✅ |
| memberships | ✅ | ✅ |
| client-crm | ✅ | ✅ |
| forms | ✅ | ✅ |
| ecommerce | ✅ | ❌ |
| affiliates | ✅ | ❌ |

**Why this matters**: the slim 4-plugin set is a real market shape
(coaching / membership business — no shop). The generator (T2 R11)
must NOT bake the 6-plugin assumption; it must read
`installedPlugins` from the shared-portal install record and
materialize exactly what's there. Affected files where the count
leaks today:

- `package.json` → `dependencies` (4 vs 6)
- `next.config.ts` → `transpilePackages` (must match deps)
- `src/server/pluginDispatch.ts` → `manifestImports` map keys (must match deps)
- Pages that should NOT render → `/shop`, `/cart`, `/checkout`,
  `/order-success`, `/orders`, `/affiliates`. The generator emits
  these only when the corresponding plugin is installed.
- `src/app/account/page.tsx` → conditional `hasPlugin("ecommerce")` /
  `hasPlugin("affiliates")` blocks already gate at runtime, but the
  generator should still drop those JSX branches from the emitted
  template when the plugins are absent (zero unused code in the
  emitted client repo).

## 5 · portalVariants — diff

```
                Luv & Ker                              Compass Coaching
login           felicia-login-v1                       compass-login-v1
account         felicia-account-v1                     compass-account-v1
orders          felicia-orders-v1                      —
affiliates      felicia-affiliates-v1                  —
members         —                                      compass-members-v1
```

Variant IDs are placeholders until the website-editor publishes block
trees. The keyspace differs by plugin set: `orders` / `affiliates`
keys absent here; `members` key absent in Luv & Ker. The generator
must derive the variant keyspace from the installed-plugin set, not
hard-code it.

## 6 · Pages — diff

| Page | Luv & Ker | Compass Coaching | Notes |
| --- | --- | --- | --- |
| `/` | Hero + Featured + BrandStory + Newsletter | Hero + PricingTiers + Newsletter | Hero retained; ecommerce-flavoured "Featured products" replaced with memberships' `pricing-tier-grid`; BrandStory dropped (lighter shape) |
| `/login` | branded login | branded login | identical |
| `/embed/login` | iframe-able login | iframe-able login | identical |
| `/account` | memberships + ecommerce + affiliates cards | memberships + contact cards | conditional renders; generator emits only the installed branches |
| `/members` | — | gated members library (lock icons, free previews) | new; reads `/api/portal/memberships/me` for active tier |
| `/contact` | — | forms+CRM contact form | new; POSTs `/api/portal/forms/submit` `formId: "contact"`; cross-plugin event router fans into client-CRM contact + email-sender notification |
| `/shop`, `/cart`, `/checkout`, `/order-success` | ✅ | ❌ | absent |
| `/orders`, `/affiliates` | ✅ | ❌ | absent |

`/members` is the **memberships-flavour storefront block** (paywall
content). The generator should treat `members-page` as an installable
plugin storefront route that materializes only when memberships
installed AND no ecommerce/shop routes claim "/members" already.

## 7 · Smoke results

`npm install --legacy-peer-deps` clean (52 packages; legacy-peer-deps
needed because `@aqua/plugin-client-crm` peer is `next@^16.0.0` and
file-linked workspace deps don't satisfy the peer match without it —
same workaround applies to luv-and-ker on a fresh install).
`npx tsc --noEmit` clean. Dev boot:

```
▲ Next.js 16.2.4 (Turbopack)
- Local:        http://localhost:4041
✓ Ready in 876ms
```

| Path | Status | Notes |
| --- | --- | --- |
| `/` | 200 | brand markers present: `--brand-primary: #3B6EAE`, "DM Serif", "Compass Coaching", "Find your true direction", "Map the work", "Pick your altitude", all 3 tier names |
| `/login` | 200 | branded |
| `/embed/login` | 200 | CSP `frame-ancestors 'self' https:` — iframe-friendly to milesymedia.com |
| `/account` | 307 → /login | auth redirect |
| `/members` | 200 | preview articles render; gating logic active |
| `/contact` | 200 | form renders |
| `/api/auth/me` | 502 | structured `{error: "portal-upstream-unreachable", upstream, detail}` — proxy works (shared portal not running locally during smoke) |
| ecommerce/affiliates surface leak count on `/` | **0** | no `shop\|cart\|checkout\|orders\|affiliates` substrings in homepage HTML |

No contrast warnings logged at boot. No tsc errors. No render errors
in the dev log.

## 8 · What the generator (T2 R11) must handle to materialize either shape

Reading both this chapter and chapter 43, the generator's emit
contract distils to:

1. **Read `installedPlugins` from the shared-portal install record**
   and materialize:
   - `package.json` deps + `next.config.ts` transpilePackages +
     `pluginDispatch.ts` manifestImports — three lists that must
     stay in sync.
   - Per-plugin pages (e.g. ecommerce → `/shop`, `/cart`,
     `/checkout`, `/order-success`, `/orders`; affiliates →
     `/affiliates`; memberships → `/members` + `/account`
     memberships block; forms → `/contact`).
   - Account-page conditional branches → emit only the
     `hasPlugin("…")` branches whose plugin is installed (zero
     dead branches in the emitted repo).
2. **Read brand kit + content from the install record** and emit:
   - `portal-config.json` with `client / brand / auth /
     installedPlugins / portalVariants / content` shape.
   - `globals.css` `:root { --brand-* }` block matched to the kit
     (a build-time fallback; runtime injection in `layout.tsx`
     overrides via `<style>`).
   - `layout.tsx` font imports — must map fontHeading + fontBody
     strings to next/font/google import calls (DM_Serif_Display vs
     Playfair_Display vs ...). A small font-name → import-name lookup
     table is enough.
3. **Derive `portalVariants` keyspace from installed plugins**, not
   from a fixed list. Login + account always; `orders` /
   `affiliates` only with their plugins; `members` only with
   memberships.
4. **Pick a port** that doesn't collide. Luv & Ker = 4040; Compass =
   4041. The generator should allocate from a pool (4040–4099) and
   record the choice in the install record so the same client always
   boots on the same port across regenerations.
5. **Stable shared scaffolding** — these files are byte-for-byte (or
   near-) identical across both clients and should be drop-in
   templates: `tailwind.config.ts`, `tsconfig.json`,
   `postcss.config.mjs`, `.npmrc`, `.gitignore`, `.env.example`,
   `src/app/api/[...path]/route.ts`, `src/lib/brandKit.ts`,
   `src/lib/apiClient.ts`, `src/lib/sessionUser.ts`,
   `src/lib/a11y/contrastValidator.ts`, `src/components/ui/*`,
   `src/components/chrome/MemberDrawer.tsx` (chrome wordmarks
   parameterised by content keys).
6. **Plugin-flavoured storefront sections** — the homepage shape
   varies by primary plugin (ecommerce → Featured products; memberships
   → PricingTiers). The generator should read a "storefront-shape"
   hint per plugin manifest (or fall back to website-editor variants
   when published) rather than hard-coding the section list.

## 9 · Open question — should "preset" be promoted?

The differences pattern between Luv & Ker (ecommerce-led skincare)
and Compass Coaching (membership-led coaching) is exactly what T2
R11's `04-plugin-portal-export.md` calls a "preset". The
`service-portal` preset in that chapter is the closest match for
Compass; an `ecommerce-portal` preset matches Luv & Ker.

**Recommendation**: keep presets as **install-time scaffolding hints**
(picks a default plugin set + page list) but never as **runtime
identity**. The runtime contract stays
`installedPlugins`-driven so an operator can add ecommerce to a
service-preset client later without re-emitting from a different
preset. Q-LOGGED for orchestrator routing.

## 10 · Cross-team handoffs

- **T2 R11 (export-to-repo generator)** — this chapter is a second
  concrete target shape. Items §8.1–§8.6 above are the contract.
  Compass + Luv & Ker together cover: 6→4 plugin variation, 4→3
  variant-keyspace variation, ecommerce-led vs memberships-led
  homepage shape variation, presence/absence of `/contact`
  (forms-plugin route), font-pair variation (Playfair vs DM Serif).
- **T6 R1 (deployment)** — second client gets its own Vercel project
  using the per-client deploy template at
  `scripts/templates/client-vercel.json`. Domain
  `compasscoaching.com` is hypothetical; T6 won't actually attach
  unless Ed signs the client.
- **T1 (cookie-domain config)** — same Q-ASSUMED carries over from
  Luv & Ker: production iframe of compasscoaching.com against
  milesymedia.com cookies needs Domain=.milesymedia.com on
  `lk_session_v1` OR a milesymedia subdomain. No source change here;
  flagging that the second client now also depends on it.

## 11 · NOT in scope

- No production deploy of compasscoaching.com.
- No edit to shared portal source.
- No real coaching-business content — placeholder only.
- No second-client-flavoured plugin (e.g. a hypothetical
  course-builder plugin); the slim 4-plugin set is the validation
  surface.
