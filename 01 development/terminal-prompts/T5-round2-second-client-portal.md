/loop

# T5 — Round 2: Second client portal — validate the multi-client pattern

R1 you shipped Felicia's `clients/luv-and-ker/` end-to-end — Phase
A+B scaffold + C+D pages+proxy + E smoke + chapter #43. Round 2:
**build a second per-client portal** to validate the multi-client
pattern + give T2 R11's generator a second target shape to
reverse-engineer.

Pick a non-skincare industry to stress-test the brand kit + plugin
choice + variant selection. Recommended: **a coaching / membership
business** (someone Ed could realistically pitch after Felicia).
Domain: `<placeholder-coach>.com`. Brand: cool blues + sans-serif.
Plugin set: website-editor + memberships + client-crm + forms (no
ecommerce, no affiliates — different from Felicia, validates the
multi-shape).

Suggested name: **Compass Coaching** (or any plausible second client
brand — feel free to pick something better; log Q-ASSUMED).

## Working environment

- Repo / local / branch — same as R1.

## Messaging

- **Outbox**: `01 development/messages/terminal-5/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-5/from-orchestrator.md`

## Mandatory pre-read

1. Your R1 chapter `04-client-portal-luv-and-ker.md`
2. `04-architecture-extension-per-client-portals.md` (chapter 19b)
3. The Felicia portal at `04 the final portal/clients/luv-and-ker/` — your reference
4. T2 R11's `04-plugin-portal-export.md` (when it lands) — the
   generator's expected shape

## Scope — three phases

### Phase A: Scaffold `clients/<slug>/`

Mirror Luv & Ker structure but slimmer. Plugins: website-editor +
memberships + client-crm + forms only.

`portal-config.json`:
```json
{
  "client": { "id": "<slug>", "name": "Compass Coaching", "agencyId": "milesy" },
  "brand": {
    "primaryColor": "#3B6EAE",
    "secondaryColor": "#F4F7FB",
    "accentColor": "#1B3D6F",
    "fontHeading": "DM Serif Display",
    "fontBody": "Inter",
    "borderRadius": "0.25rem"
  },
  "installedPlugins": ["website-editor", "memberships", "client-crm", "forms"],
  "portalVariants": { "login": "...", "account": "...", "members": "..." }
}
```

### Phase B: Pages + content

- `/` — coaching-services hero + pricing-tier-grid (membership block) +
  newsletter signup (forms block).
- `/login` — branded login.
- `/members` — gated members area (membership-paywall block).
- `/account` — `MyMembershipPage`.
- `/contact` — form-render block submitting to client-crm.

No ecommerce surfaces.

### Phase C: Smoke + chapter

1. `npm run dev -p 4041` (different port from luv-and-ker's 4040).
2. Brand kit applies (DM Serif headings, blue accents).
3. Plugin set is the slim 4 — no ecommerce / affiliates surfaces leak
   in.
4. iframe-login same-origin to milesymedia.com works.
5. Chapter `04-client-portal-second.md` documenting:
   - Folder structure (compare to Luv & Ker).
   - Differences in plugin set + variant selection.
   - What the generator (T2 R11) needs to handle to materialize
     either shape.
   - Open Q: do we want a "preset" inferred from this differences
     pattern? T2 R11's `service-portal` preset is closest.

## NOT in scope

- Don't make this a real production deploy — it's a reference build.
- Don't touch shared portal source.
- Don't lift business content from any real coach — placeholder copy
  only.

## Loop discipline

Standard. `<<autonomous-loop-dynamic>>`.

## When done

1. `clients/<slug>/` boots clean.
2. Differs structurally from Luv & Ker (plugin set + variants +
   brand) — proves the generator must handle variation.
3. Chapter + MASTER row + tasks done.
4. DONE + COMMIT.
