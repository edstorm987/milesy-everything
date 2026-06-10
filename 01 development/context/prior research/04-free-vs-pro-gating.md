# 04 · Free vs Pro gating contract

Author: T4
Status: shipped 2026-05-07.
Triggering prompt (Ed): *"i only want to give actually relevant stuff im not going to give them everything on a free … rather like the plugins for portal im selecting and choosing if this makes sense and is also more personal and is going to be based off the health check."*

## The two modes

`localStorage['bos.mode']` ∈ `{ 'free' (default) | 'customer' }`. Mode toggle lives on the dev bar (only visible with `?dev=1`).

In production this becomes a real entitlement check (`tenant.tier`) when the BOS extracts to a portal plugin.

## Sidebar — what each mode sees

`bos.js mountAutoSidebar()` renders the sidebar from one source per page, filling the `<nav data-bos-auto-nav data-bos-active="...">` slot.

### Free (default)

```
My business    Home · About my business
Learn          Lessons · Health check
Tools slot     (data-bos-tools-slot — empty for free)
Get help       Need help? · Ask Aqua AI · Book a free call · Request a feature
More (tiny)    Custom roadmap (Pro) · Aqua agency portal (locked 🔒)
```

Six total functional links. Curated.

### Customer

```
My business    Home · About my business · My customers · My numbers · My to-dos · My files
Learn          Lessons · Health check
Tools slot     (filled with all 9 add-ons as installed sidebar items, each w/ "Installed" pip)
Get help       Need help? · Ask Aqua AI · Book a free call · Request a feature
More (tiny)    Custom roadmap (active) · Aqua agency portal (active ▣)
```

Plus: tier pill in topbar swaps from "Free tier · upgrade →" (orange dot) to "Pro · all add-ons active" (green dot). The slim upgrade-foot-link disappears.

## Pro-only page guard

If a free user hits `leads.html` / `trackers.html` / `tasks.html` / `docs.html` directly (e.g. from a stale link), `bos.js maybeProLock()` replaces `<main>` with a clean lockup card:

```
👥 Pro feature
My customers
A full sales pipeline — every lead, every stage, every quid in flight.
This isn't in your free tier yet — but if you'd find it useful, we can switch
it on for you. Most requests we already have built.
[ Request access → ]   [ See all add-ons ]
```

The real page content never renders for free users — no leak.

## Slim upgrade-foot-link

Every page (free only) ends with `bos.js mountTierUI()` appending:

```
<div class="bos-upgrade-foot">
  You're on the free tier — <a href="marketplace.html">see what you can add →</a>
</div>
```

Replaced an earlier loud "🌟 You're on the free tier of Business OS… [Browse add-ons]" band that was too marketing-y. Hidden in customer mode.

## Page intros

Notion-style "👋 Introduction — please open me!" expandable callouts (collapsed by default) on the major pages. Free-tier pages mention what's free and what Pro unlocks for that surface specifically. Examples:

- Trackers: *"Free tier ships with manual entry plus the time-tracker. Pro adds QuickBooks / Stripe / live data feeds."*
- Documents: *"Free tier ships with the four templates at the bottom. Pro unlocks the SOP Hub — six categories of done-for-you operating procedures."*

## Request-a-feature (the alt-axis)

`/request.html` — instead of upgrading via marketplace, a free user can ask for something specific. Form composes a structured mailto with name / business / niche / urgency / category / body. Three explainer cards underneath: *Already have it · Will build it · Won't build but here's the workaround*. This is Ed's "personal curation" lever — half of the requests are things we've already built and just hadn't switched on.

## What we DON'T gate (deliberate)

The five fully-written **lessons** are free. Pro shows the rest of the library. The Aqua AI launcher is on every page (5 free messages/day), regardless of mode. The Health Check is fully free (it's the lead magnet).

## Files

- `bos.js` — `mountAutoSidebar()` mode branch · `applyMode()` tools-slot fill · `maybeProLock()` · `mountTierUI()` slim foot-link.
- `app.html` — adaptive "Your next move" + 3 friendly cards.
- `request.html` — request-a-feature form.
- `marketplace.html` — 9 add-on tiles.
- `styles.css` — tier pill, upgrade foot, Pro lockup, page-intro callout.
