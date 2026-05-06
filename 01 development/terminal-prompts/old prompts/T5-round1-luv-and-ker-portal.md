/loop

# T5 — Round 1: Build Luv & Ker — Felicia's first real per-client portal

You are **terminal 5**, joining the mesh fresh. Per the architecture
extension chapter 19b
(`04-architecture-extension-per-client-portals.md`), each Live client
gets `clients/<slug>/` materialized as their own Next.js app — and
T2 R11 (queued) will build the generator. Your round 1 mandate:
**manually build Felicia's actual Luv & Ker portal at
`clients/luv-and-ker/`** as the canonical reference target. This
gives T2 a concrete structure to reverse-engineer when they ship the
"Export to repo" generator.

This is the first real client portal for Milesy Media. Treat it as a
production deliverable, not a prototype.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-5/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-5/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/messages/README.md` (mesh protocol)
3. `01 development/context/MASTER.md` (chapter index)
4. `01 development/context/prior research/04-architecture.md` — locked v1
5. `01 development/context/prior research/04-architecture-extension-per-client-portals.md` — chapter 19b (your operating spec)
6. `01 development/eds requirments.md` — Felicia's brand context
7. `01 development/context/prior research/aqua-storefront.md` — Felicia's storefront patterns from `02`
8. `01 development/context/prior research/aqua-portal-variants.md` — variant subsystem
9. `01 development/context/prior research/04-plugin-website-editor*.md` — block library + variant flow + 6 starter trees
10. **`04-the-final-portal/clients/felicias perfect portal/`** — the existing reference prototype Ed built; this IS the starting point. Read it carefully before scaffolding.
11. The 9 plugin chapters (`04-plugin-fulfillment.md`, `04-plugin-ecommerce.md`, `04-plugin-memberships.md`, `04-plugin-affiliates.md`, `04-plugin-client-crm.md`, `04-plugin-website-editor.md`, etc.) — for the manifest contract that this portal consumes

## Brand context

- **Client**: Felicia (Felicia Brako) — founder of **Luv & Ker**
  / **Odo by Felicia**, Ghanaian-heritage skincare.
- **Domain (planned)**: `luvandker.com`
- **Brand kit**: orange + cream + Playfair Display heading font
  (matches the demo seed). Confirm exact tokens with
  `04-the-final-portal/portal/src/lib/server/demoSeed.ts` →
  Felicia mirror.
- **End-customer surfaces**: shoppers (storefront), members (gated
  content), affiliates (referral dashboard).

## Scope — five phases

### Phase A: Scaffold `clients/luv-and-ker/`

Create the Next.js project structure mirroring `04-the-final-portal/portal/`'s
shape but slimmed for a single-client deployment:

```
clients/luv-and-ker/
├── package.json                  ← Next 16 + React 19 + tailwind 4 + plugin workspace deps
├── next.config.ts                ← transpilePackages includes only the plugins this client uses
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example                  ← DATABASE_URL placeholder, brand-kit overrides, etc.
├── portal-config.json            ← canonical config: brand kit + installedPlugins + variants per role + content
├── public/                       ← logo, OG image, favicon
└── src/
    ├── app/
    │   ├── layout.tsx            ← brand-kit injector (CSS vars from portal-config.json)
    │   ├── page.tsx              ← public storefront landing
    │   ├── login/page.tsx
    │   ├── account/...           ← member account view (memberships block)
    │   ├── orders/...            ← order history (ecommerce block)
    │   ├── affiliates/...        ← affiliate dashboard (affiliates block)
    │   ├── api/                  ← thin proxy to milesymedia.com/api/portal/*
    │   └── (storefront)/         ← shop, cart, checkout, success
    ├── components/
    │   ├── chrome/Header.tsx     ← Luv & Ker branded
    │   ├── chrome/Footer.tsx
    │   └── chrome/MemberDrawer.tsx
    ├── lib/
    │   ├── brandKit.ts           ← CSS-var injection
    │   └── apiClient.ts          ← shared origin to milesymedia.com for auth + API
    └── server/
        └── pluginDispatch.ts     ← request → plugin manifest dispatch (lift from portal/_routeResolver)
```

Plugins to wire as workspace deps (`requires` chain from chapter #30
+ #31 + #34 + Felicia's actual feature set):
- `@aqua/plugin-website-editor`
- `@aqua/plugin-ecommerce`
- `@aqua/plugin-memberships`
- `@aqua/plugin-affiliates`
- `@aqua/plugin-client-crm`
- `@aqua/plugin-forms`

NOT needed for Luv & Ker: fulfillment (that's agency-side),
agency-HR / agency-finance / agency-marketing / email-sender (also
agency-side; email-sender lives in the shared portal and the per-client
portal calls it via API).

### Phase B: Wire brand kit + chrome

`portal-config.json` sketch:
```json
{
  "client": { "id": "luv-and-ker", "name": "Luv & Ker", "agencyId": "milesy" },
  "brand": {
    "logoUrl": "/luv-and-ker-wordmark.svg",
    "primaryColor": "#E89B5C",
    "secondaryColor": "#F5E6D3",
    "accentColor": "#3D2817",
    "fontHeading": "Playfair Display",
    "fontBody": "Inter",
    "borderRadius": "0.5rem",
    "customCSS": ""
  },
  "installedPlugins": [...],
  "portalVariants": {
    "login": "felicia-login-v1",
    "account": "felicia-account-v1",
    "orders": "felicia-orders-v1",
    "affiliates": "felicia-affiliates-v1"
  }
}
```

`layout.tsx` reads this at request time (server-component) and injects
CSS vars into a `<style>:root{...}</style>` tag. Header / Footer
read the brand object directly.

### Phase C: Pages + variants

Use the website-editor's `getActivePortalVariant()` helper for each
PortalRole. Where a variant doesn't exist yet, render a faithful
hand-coded version Felicia would actually use:

- **`/`** (public storefront landing) — hero block + featured products
  (ecommerce `product-grid`) + brand-story copy + newsletter signup
  (forms `form-render`).
- **`/login`** — branded login (calls milesymedia.com/api/auth/login;
  same-origin via apiClient).
- **`/account`** — `MyMembershipPage` (memberships block) +
  `MyAffiliatePage` (affiliates block).
- **`/orders`** — order history (ecommerce blocks).
- **`/shop`, `/cart`, `/checkout`, `/order-success`** — full storefront.
- **`/embed/login?return=...`** — iframe-able branded login.

### Phase D: API proxy + auth

The per-client portal doesn't run its own auth — it round-trips to
milesymedia.com. `apiClient.ts` builds requests with `credentials:
"include"` so the same `lk_session_v1` cookie works (assuming the
client's portal sits on `luvandker.com` and the cookie is set with
`SameSite=Lax` on milesymedia.com — log a `Q-ASSUMED` if cookie config
needs an update).

`src/app/api/[...path]/route.ts` — a thin proxy that forwards
requests to `https://milesymedia.com/api/portal/...` (or the dev
fallback `http://localhost:3030`). This keeps secrets + storage
centralised on the shared portal; the per-client portal is
brand + content shell only.

### Phase E: Smoke + chapter

1. `npm run dev` (or whatever this client's script is) brings up
   `localhost:4040` showing the Luv & Ker storefront with brand kit
   applied.
2. Sign-in iframes to milesymedia.com/embed/login.
3. Brand kit applies cleanly (Playfair headings, orange accent).
4. Chapter `04-client-portal-luv-and-ker.md` documenting:
   - Folder structure (canonical for T2 R11's generator to reverse).
   - portal-config.json shape.
   - API-proxy pattern.
   - Brand-kit injection.
   - Plugin workspace-dep set.
   - Variants used + which pages render them.
   - Cross-team handoffs (T2 R11 generator should produce this exact
     shape; T6 should attach the custom domain at deploy time).
5. MASTER row.
6. `tasks.md` row done.
7. Final `DONE` + `COMMIT`.

## Authority + scope discipline

You CAN:
- Create + edit anything under `04-the-final-portal/clients/luv-and-ker/`.
- Read every plugin's chapter + the architecture chapter.
- Append to your own outbox.

You must NOT:
- Edit the shared portal source (`portal/`).
- Edit other plugins' source (`plugins/*`). If you find a plugin
  needs an exported helper your portal can't reach, log a `WARN` in
  the right plugin terminal's inbox.
- Touch `04-the-final-portal/clients/felicias perfect portal/` — that
  prototype stays as-is for now (T2 R11 may eventually migrate it
  into the new format).
- Edit foundation files.
- Push images / large binaries unrelated to the portal.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end. Phase A is the bulk; B-E lighter.

## When done

1. `clients/luv-and-ker/` boots cleanly + renders the Luv & Ker
   storefront.
2. Sign-in works (iframe to milesymedia auth).
3. Brand kit applies + at least the storefront landing + login
   render correctly.
4. `tsc --noEmit` clean inside the client folder.
5. Chapter `04-client-portal-luv-and-ker.md` written.
6. MASTER row.
7. `tasks.md` row done.
8. Final `DONE` + `COMMIT`.

If the full build takes more than one loop iteration, partial DONE
is fine — commit per phase.
